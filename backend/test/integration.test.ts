/**
 * Tests de integración contra PostgreSQL real (Docker, ver `make postgres`)
 * y, para el indexador, contra el Hardhat Network de Docker con los
 * contratos NewsEra ya desplegados (`make hardhat && make deploy-local`).
 * No usan mocks — Definition of Done de Sprint 7.
 */
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { createWalletClient, createPublicClient, http, keccak256, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { processHistoricalEvents, loadLastProcessedBlock, processLogs } from "../src/services/indexer.js";
import { indexerStateRepository } from "../src/repositories/indexer-state.repository.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abisDir = join(__dirname, "../../docs/abis");
const pubAbi = JSON.parse(readFileSync(join(abisDir, "PublicationRegistry.json"), "utf-8"));
const repAbi = JSON.parse(readFileSync(join(abisDir, "ReputationSystem.json"), "utf-8"));
const valAbi = JSON.parse(readFileSync(join(abisDir, "ValidationRegistry.json"), "utf-8"));

const PUB = process.env.PUBLICATION_REGISTRY_ADDRESS as `0x${string}`;
const REP = process.env.REPUTATION_SYSTEM_ADDRESS as `0x${string}`;
const VAL = process.env.VALIDATION_REGISTRY_ADDRESS as `0x${string}`;

// cacheTime: 0 — evita que getBlockNumber() devuelva una altura obsoleta
// cuando varios tests encadenan transacciones rápido (ver fix en lib/viem.ts).
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(process.env.RPC_URL_LOCAL),
  cacheTime: 0,
});

function wallet(account: `0x${string}`) {
  return createWalletClient({ account, chain: hardhat, transport: http(process.env.RPC_URL_LOCAL) });
}

// El chain de Hardhat persiste entre ejecuciones de la suite (solo se trunca
// Postgres), así que un contentHash fijo colisionaría con
// PublicationAlreadyExists en la segunda ejecución — se añade un nonce único.
function uniqueBody(label: string): string {
  return `${label} — ${Date.now()}-${Math.random()}`;
}

async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE publications, rounds, validations, validators, reopen_requests, retroactive_claims, favorites, follows, notifications, user_profiles, indexer_state RESTART IDENTITY CASCADE;`,
  );
}

describe("backend de integración", () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  describe("publicaciones", () => {
    it("crea una publicación y la lista con filtros", async () => {
      const body = uniqueBody("cuerpo de test de integracion");
      const contentHash = keccak256(toBytes(body));

      // El endpoint verifica que el hash exista on-chain — lo registramos primero.
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const author = accounts[1] as `0x${string}`;
      const tx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const createRes = await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash, title: "Test", body, tags: ["a", "b"] }),
      });
      expect(createRes.status).toBe(201);

      const listRes = await app.request("/api/v1/publications?tags=a&state=PENDING");
      expect(listRes.status).toBe(200);
      const list = await listRes.json();
      expect(list.total).toBe(1);
      expect(list.items[0].contentHash).toBe(contentHash);
    });

    it("revierte con 409 si el contentHash ya está registrado", async () => {
      const body = uniqueBody("duplicado");
      const contentHash = keccak256(toBytes(body));
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const author = accounts[1] as `0x${string}`;
      const tx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const payload = JSON.stringify({ contentHash, title: "T", body, tags: [] });
      const first = await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(first.status).toBe(201);

      const second = await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(second.status).toBe(409);
    });

    it("revierte con 422 si el body no coincide con el contentHash", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const author = accounts[1] as `0x${string}`;
      const realHash = keccak256(toBytes(uniqueBody("contenido real")));
      const tx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [realHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const res = await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash: realHash, title: "T", body: "contenido distinto", tags: [] }),
      });
      expect(res.status).toBe(422);
    });

    it("GET /publications?result=TRUE solo devuelve artículos DEFINITIVE con ese veredicto", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const admin = accounts[0] as `0x${string}`;
      const author = accounts[1] as `0x${string}`;
      const voters = [
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
      ];
      for (const v of voters) {
        const regTx = await wallet(admin).writeContract({
          address: REP,
          abi: repAbi,
          functionName: "registerValidator",
          args: [v.address, 10n],
        });
        await publicClient.waitForTransactionReceipt({ hash: regTx });
      }

      const fromBlock = await publicClient.getBlockNumber();
      const body = uniqueBody("articulo resuelto TRUE para filtro de veredicto");
      const contentHash = keccak256(toBytes(body));
      const pubTx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: pubTx });
      await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash, title: "Resuelto TRUE", body, tags: [] }),
      });

      // TRUE_VOTE = 0; 3/3 alcanza quórum (3) y supermayoría (100% >= 66.67%) → DEFINITIVE.
      // submitValidation exige msg.sender == validador registrado; las cuentas
      // generadas con generatePrivateKey no tienen ETH para gas en Hardhat
      // local. Se financian con una transferencia mínima desde `admin` antes de votar.
      for (const v of voters) {
        const fundTx = await wallet(admin).sendTransaction({ to: v.address, value: 10n ** 16n });
        await publicClient.waitForTransactionReceipt({ hash: fundTx });
      }
      for (const v of voters) {
        const voteTx = await createWalletClient({
          account: v,
          chain: hardhat,
          transport: http(process.env.RPC_URL_LOCAL),
        }).writeContract({ address: VAL, abi: valAbi, functionName: "submitValidation", args: [contentHash, 0] });
        await publicClient.waitForTransactionReceipt({ hash: voteTx });
      }

      await processHistoricalEvents(fromBlock);

      const publication = await prisma.publication.findUnique({ where: { contentHash } });
      expect(publication?.consensusState).toBe("DEFINITIVE");
      expect(publication?.currentResult).toBe("TRUE");

      const resTrue = await app.request("/api/v1/publications?result=TRUE");
      const jsonTrue = await resTrue.json();
      expect(jsonTrue.items.some((p: { contentHash: string }) => p.contentHash === contentHash)).toBe(true);

      const resFalse = await app.request("/api/v1/publications?result=FALSE");
      const jsonFalse = await resFalse.json();
      expect(jsonFalse.items.some((p: { contentHash: string }) => p.contentHash === contentHash)).toBe(false);
    });
  });

  describe("usuarios (GET /api/v1/users)", () => {
    it("incluye autores puros (sin fila en validators) junto a validadores, y su perfil no da 404", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      // Autor puro: publica pero nunca vota ni recibe ReputationUpdated —
      // no debe existir fila en `validators` para esta dirección.
      const author = privateKeyToAccount(generatePrivateKey());

      const body = uniqueBody("articulo de autor puro sin reputacion");
      const contentHash = keccak256(toBytes(body));
      const pubTx = await wallet(accounts[1] as `0x${string}`).sendTransaction({
        to: author.address,
        value: 10n ** 16n,
      });
      await publicClient.waitForTransactionReceipt({ hash: pubTx });
      const registerTx = await createWalletClient({
        account: author,
        chain: hardhat,
        transport: http(process.env.RPC_URL_LOCAL),
      }).writeContract({ address: PUB, abi: pubAbi, functionName: "registerPublication", args: [contentHash] });
      await publicClient.waitForTransactionReceipt({ hash: registerTx });
      await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash, title: "Autor puro", body, tags: [] }),
      });

      const validatorRow = await prisma.validator.findUnique({ where: { address: author.address } });
      expect(validatorRow).toBeNull();

      const listRes = await app.request("/api/v1/users?limit=200");
      const listJson = await listRes.json();
      const entry = listJson.items.find(
        (u: { address: string }) => u.address.toLowerCase() === author.address.toLowerCase(),
      );
      expect(entry).toBeDefined();
      expect(entry.reputationScore).toBe(0);
      expect(entry.articleCount).toBe(1);

      const detailRes = await app.request(`/api/v1/users/${author.address}`);
      expect(detailRes.status).toBe(200);
      const detail = await detailRes.json();
      expect(detail.reputationScore).toBe(0);
      expect(detail.totalValidations).toBe(0);
      expect(detail.accuracy).toBeNull();
    });
  });

  describe("perfil enriquecido", () => {
    it("rechaza PUT /profile/:address con una firma que no corresponde a la dirección", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const address = accounts[2] as string;
      const message = "actualizar mi perfil";

      // Firma sintácticamente válida pero de OTRA cuenta distinta a `address`.
      const impostor = privateKeyToAccount(generatePrivateKey());
      const impostorWallet = createWalletClient({
        account: impostor,
        chain: hardhat,
        transport: http(process.env.RPC_URL_LOCAL),
      });
      const signature = await impostorWallet.signMessage({ message });

      const res = await app.request(`/api/v1/profile/${address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Impostor", message, signature }),
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("acepta PUT /profile/:address con una firma válida de la propia dirección", async () => {
      const pk = generatePrivateKey();
      const account = privateKeyToAccount(pk);
      const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http(process.env.RPC_URL_LOCAL),
      });
      const message = JSON.stringify({ displayName: "Jorge", avatarUrl: "", email: "", timestamp: Date.now() });
      const signature = await walletClient.signMessage({ message });

      const res = await app.request(`/api/v1/profile/${account.address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Jorge", message, signature }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.displayName).toBe("Jorge");
    });

    // Bug D6: la protección anti-replay solo era apariencia — el backend
    // nunca validaba el `timestamp` que el frontend ya incluía en el mensaje.
    describe("anti-replay del timestamp (D6)", () => {
      async function putProfile(account: ReturnType<typeof privateKeyToAccount>, timestamp: number) {
        const walletClient = createWalletClient({
          account,
          chain: hardhat,
          transport: http(process.env.RPC_URL_LOCAL),
        });
        const message = JSON.stringify({ displayName: "Jorge", avatarUrl: "", email: "", timestamp });
        const signature = await walletClient.signMessage({ message });
        const res = await app.request(`/api/v1/profile/${account.address}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Jorge", message, signature }),
        });
        return res;
      }

      it("rechaza con 403 una firma con timestamp de hace 10 minutos", async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const res = await putProfile(account, Date.now() - 10 * 60 * 1000);
        expect(res.status).toBe(403);
        expect((await res.json()).error.code).toBe("FORBIDDEN");
      });

      it("acepta una firma con timestamp de hace 2 minutos", async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const res = await putProfile(account, Date.now() - 2 * 60 * 1000);
        expect(res.status).toBe(200);
      });

      it("rechaza con 403 una firma con timestamp 2 minutos en el futuro", async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const res = await putProfile(account, Date.now() + 2 * 60 * 1000);
        expect(res.status).toBe(403);
      });

      it("acepta una firma con timestamp 30 segundos en el futuro (tolerancia de reloj)", async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const res = await putProfile(account, Date.now() + 30 * 1000);
        expect(res.status).toBe(200);
      });

      it("rechaza con 403 un mensaje sin timestamp o no parseable como JSON", async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const walletClient = createWalletClient({
          account,
          chain: hardhat,
          transport: http(process.env.RPC_URL_LOCAL),
        });
        const message = "actualizar mi perfil";
        const signature = await walletClient.signMessage({ message });
        const res = await app.request(`/api/v1/profile/${account.address}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Jorge", message, signature }),
        });
        expect(res.status).toBe(403);
      });

      it("rechaza el reenvío (replay) de una petición capturada hace más de 5 minutos (regresión del bug original)", async () => {
        // Simula un atacante que capturó una firma+mensaje válidos en su momento
        // (timestamp original) y los reenvía ahora, más de 5 minutos después.
        // Sin el fix, el backend solo comprobaba la firma y aceptaba esta
        // petición igual que la primera vez.
        const account = privateKeyToAccount(generatePrivateKey());
        const capturedTimestamp = Date.now() - 6 * 60 * 1000;
        const walletClient = createWalletClient({
          account,
          chain: hardhat,
          transport: http(process.env.RPC_URL_LOCAL),
        });
        const message = JSON.stringify({ displayName: "Jorge", avatarUrl: "", email: "", timestamp: capturedTimestamp });
        const signature = await walletClient.signMessage({ message });

        const replay = await app.request(`/api/v1/profile/${account.address}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "Jorge", message, signature }),
        });
        expect(replay.status).toBe(403);
      });
    });
  });

  describe("favoritos", () => {
    async function seedPublication(): Promise<string> {
      const body = uniqueBody("articulo para favoritos");
      const contentHash = keccak256(toBytes(body));
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const author = accounts[1] as `0x${string}`;
      const tx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await app.request("/api/v1/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash, title: "Fav", body, tags: [] }),
      });
      return contentHash;
    }

    it("crea, lista, rechaza duplicado (409) y elimina un favorito", async () => {
      const contentHash = await seedPublication();
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const user = accounts[3] as string;

      const create = await app.request(`/api/v1/favorites/${contentHash}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: user }),
      });
      expect(create.status).toBe(201);

      const list = await app.request(`/api/v1/profile/${user}/favorites`);
      const listJson = await list.json();
      expect(listJson.total).toBe(1);

      const duplicate = await app.request(`/api/v1/favorites/${contentHash}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: user }),
      });
      expect(duplicate.status).toBe(409);

      const remove = await app.request(`/api/v1/favorites/${contentHash}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: user }),
      });
      expect(remove.status).toBe(204);

      const listAfter = await app.request(`/api/v1/profile/${user}/favorites`);
      expect((await listAfter.json()).total).toBe(0);
    });
  });

  describe("notificaciones", () => {
    it("marca una notificación como leída", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const user = accounts[4] as string;
      const notification = await prisma.notification.create({
        data: { userAddress: user, contentHash: keccak256(toBytes(uniqueBody("n"))), type: "CONSENSUS_REACHED" },
      });

      const res = await app.request(`/api/v1/notifications/${notification.id}/read`, { method: "PATCH" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.read).toBe(true);
    });
  });

  describe("indexador", () => {
    it("procesa PublicationRegistered y ReputationUpdated y refleja el efecto en la base de datos", async () => {
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const admin = accounts[0] as `0x${string}`;
      const author = accounts[1] as `0x${string}`;
      // Dirección nueva generada al vuelo: registerValidator no requiere que
      // el propio validador firme, así que no necesita fondos ni ser una de
      // las cuentas fijas de Hardhat (que otros tests/ejecuciones ya usan).
      const validator = privateKeyToAccount(generatePrivateKey()).address;

      const fromBlock = await publicClient.getBlockNumber();

      // Registrar un validador (ReputationUpdated) y publicar un artículo
      // (PublicationRegistered) directamente on-chain, sin pasar por la API.
      const regTx = await wallet(admin).writeContract({
        address: REP,
        abi: repAbi,
        functionName: "registerValidator",
        args: [validator, 10n],
      });
      await publicClient.waitForTransactionReceipt({ hash: regTx });

      const body = uniqueBody("articulo indexado directamente");
      const contentHash = keccak256(toBytes(body));
      const pubTx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: pubTx });

      await processHistoricalEvents(fromBlock);

      const publication = await prisma.publication.findUnique({ where: { contentHash } });
      expect(publication).not.toBeNull();
      expect(publication?.authorAddress.toLowerCase()).toBe(author.toLowerCase());

      const validatorRow = await prisma.validator.findUnique({ where: { address: validator } });
      expect(validatorRow?.reputationScore).toBe(10);
    });

    it("reanuda desde el último bloque persistido sin reprocesar el historial completo", async () => {
      const persisted = await loadLastProcessedBlock();
      expect(typeof persisted).toBe("bigint");
    });

    // Bug D7: `processLogs` solo avanzaba `lastProcessedBlock` en memoria;
    // un lote procesado en vivo (watchContractEvent) nunca se persistía en
    // IndexerState hasta el siguiente catch-up histórico.
    describe("persistencia en vivo del indexador (D7)", () => {
      it("persiste el bloque de un evento procesado en vivo inmediatamente, sin esperar a un reinicio", async () => {
        // `lastProcessedBlock` es una variable en memoria del módulo indexer,
        // no se resetea entre tests (a diferencia de la fila de IndexerState,
        // truncada en cada beforeEach) — se usa la altura real de la cadena
        // para garantizar que el bloque simulado es siempre mayor.
        const chainBlock = await publicClient.getBlockNumber();
        const liveBlock = chainBlock + 100n;

        await processLogs([{ eventName: "FakeLiveEvent", blockNumber: liveBlock, logIndex: 0, args: {} }]);

        const persisted = await indexerStateRepository.getLastProcessedBlock();
        expect(persisted).toBe(liveBlock);
      });

      it("tras un catch-up histórico, un lote en vivo posterior deja lastProcessedBlock en el bloque más reciente", async () => {
        const fromBlock = await publicClient.getBlockNumber();
        await processHistoricalEvents(fromBlock);
        // No se compara contra el bloque real de la cadena: `lastProcessedBlock`
        // es una variable de módulo compartida entre tests (no se resetea con
        // resetDb), así que el catch-up puede no avanzarla si un test anterior
        // ya la dejó más alta con un bloque simulado.
        const afterCatchup = await indexerStateRepository.getLastProcessedBlock();

        const liveBlock = afterCatchup + 50n;
        await processLogs([{ eventName: "FakeLiveEvent", blockNumber: liveBlock, logIndex: 0, args: {} }]);

        const persisted = await indexerStateRepository.getLastProcessedBlock();
        expect(persisted).toBe(liveBlock);
        expect(persisted).not.toBe(afterCatchup);
      });
    });
  });
});
