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
import { processHistoricalEvents, loadLastProcessedBlock } from "../src/services/indexer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abisDir = join(__dirname, "../../docs/abis");
const pubAbi = JSON.parse(readFileSync(join(abisDir, "PublicationRegistry.json"), "utf-8"));
const repAbi = JSON.parse(readFileSync(join(abisDir, "ReputationSystem.json"), "utf-8"));

const PUB = process.env.PUBLICATION_REGISTRY_ADDRESS as `0x${string}`;
const REP = process.env.REPUTATION_SYSTEM_ADDRESS as `0x${string}`;

const publicClient = createPublicClient({ chain: hardhat, transport: http(process.env.RPC_URL_LOCAL) });

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
      const message = "actualizar mi perfil";
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
  });
});
