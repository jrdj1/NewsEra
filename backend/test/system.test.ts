/**
 * Fase 3 — Pruebas de Sistema (End-to-End).
 *
 * Diferencia deliberada con `test/integration.test.ts` (Fase 2): aquella suite
 * importa la app de Hono en proceso y llama a `processHistoricalEvents(...)`
 * a mano para indexar; esta suite NO importa nada del código fuente del
 * backend. Habla por HTTP real contra el contenedor `newsera-backend` ya
 * levantado (con su propio indexador en vivo, `watchContractEvent`) y por
 * JSON-RPC real contra el nodo Hardhat de `newsera-hardhat` — las 3 capas
 * (blockchain + backend + indexador) son procesos reales e independientes,
 * exactamente como en producción. Por eso NO se para el contenedor del
 * backend (a diferencia de Fase 2): aquí es precisamente la pieza bajo
 * prueba, no un obstáculo para el aislamiento de los tests.
 *
 * Tampoco se importa Prisma ni se trunca ninguna tabla: cada ejecución usa
 * cuentas y contenido generados al vuelo (direcciones aleatorias, cuerpo con
 * nonce único), así que es seguro ejecutarse contra una base de datos y una
 * cadena que ya tienen datos de sesiones anteriores (`make fresh-start`,
 * otras suites, uso manual), sin interferir con ellos.
 *
 * Fuera de alcance de esta fase (ver docs/test/informe-diseno.md §5 y
 * docs/test/sistema/informe.md): no se automatiza un navegador real
 * (Playwright/Cypress). Esta suite verifica el flujo de negocio completo a
 * nivel de API/proceso (blockchain real + backend real), no la UI de
 * `frontend/`. Cubrir la UI con un navegador real queda documentado como
 * trabajo futuro si se necesita cobertura E2E de interfaz.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createWalletClient, createPublicClient, http, keccak256, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abisDir = join(__dirname, "../../docs/abis");

// Vitest no carga `backend/.env` automáticamente (a diferencia de Vite en modo
// app) — a diferencia de `test/integration.test.ts` (que asume ejecutarse en
// un entorno donde esas variables ya están exportadas en el shell), esta
// suite se quiere ejecutable de forma autónoma con un solo comando
// (`npm run test:system`), así que carga `backend/.env` a mano si las
// variables no están ya presentes en `process.env` (p. ej. inyectadas por CI).
function loadDotEnvIfMissing(path: string) {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    const value = trimmed.slice(eq + 1).trim();
    process.env[key] = value;
  }
}
loadDotEnvIfMissing(join(__dirname, "../.env"));

function loadAbi(name: string) {
  return JSON.parse(readFileSync(join(abisDir, `${name}.json`), "utf-8"));
}

const pubAbi = loadAbi("PublicationRegistry");
const repAbi = loadAbi("ReputationSystem");
const valAbi = loadAbi("ValidationRegistry");

// Por defecto apunta al Hardhat y al backend expuestos en el host por
// docker-compose.yml (8545 y 3001 respectivamente) — el mismo nodo/BD que
// usa el contenedor `newsera-backend` con su indexador en vivo.
const RPC_URL = process.env.SYSTEM_TEST_RPC_URL ?? process.env.RPC_URL_LOCAL ?? "http://localhost:8545";
const BACKEND_URL = process.env.SYSTEM_TEST_BACKEND_URL ?? "http://localhost:3001";

const PUB = process.env.PUBLICATION_REGISTRY_ADDRESS as `0x${string}`;
const REP = process.env.REPUTATION_SYSTEM_ADDRESS as `0x${string}`;
const VAL = process.env.VALIDATION_REGISTRY_ADDRESS as `0x${string}`;

const REPUTATION_REWARD = 5n;
const PUBLISH_REPUTATION_REWARD = 8n;
const VOTE_TRUE = 0;
const STATE_LABELS = ["PENDING", "DEFINITIVE", "DISPUTED", "PENDING_REOPEN"] as const;
const VOTE_LABELS = ["TRUE", "FALSE", "UNVERIFIABLE"] as const;

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(RPC_URL),
  cacheTime: 0,
});

function wallet(account: `0x${string}` | PrivateKeyAccount) {
  return createWalletClient({ account: account as never, chain: hardhat, transport: http(RPC_URL) });
}

function uniqueBody(label: string): string {
  return `${label} — sistema E2E — ${Date.now()}-${Math.random()}`;
}

async function apiGet(path: string): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BACKEND_URL}${path}`);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function apiPost(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

/**
 * Polling con timeout explícito (no `sleep` fijo): reintenta `fn` hasta que
 * devuelva un valor "aceptado" por `accept`, o hasta agotar `timeoutMs`. El
 * indexador en vivo (`watchContractEvent`) sondea la cadena periódicamente
 * (no es instantáneo), así que el backend puede tardar unos segundos en
 * reflejar una transacción ya confirmada on-chain.
 */
async function pollUntil<T>(
  fn: () => Promise<T>,
  accept: (value: T) => boolean,
  opts: { timeoutMs?: number; intervalMs?: number; label: string },
): Promise<T> {
  const { timeoutMs = 60_000, intervalMs = 1_000, label } = opts;
  const start = Date.now();
  let last: T;
  for (;;) {
    last = await fn();
    if (accept(last)) return last;
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timeout (${timeoutMs}ms) esperando "${label}". Último valor observado: ${JSON.stringify(last)}`,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe("sistema E2E — publicar → indexar → validar → consenso → reputación", () => {
  beforeAll(async () => {
    if (!PUB || !REP || !VAL) {
      throw new Error(
        "Faltan direcciones de contratos en las variables de entorno (PUBLICATION_REGISTRY_ADDRESS / " +
          "REPUTATION_SYSTEM_ADDRESS / VALIDATION_REGISTRY_ADDRESS). Este test asume backend/.env cargado " +
          "por Vitest y el stack Docker (`make fresh-start` o `make up`) ya levantado.",
      );
    }
    // Sanity check de infraestructura antes de gastar tiempo en el escenario:
    // nodo Hardhat vivo y backend real respondiendo.
    const blockNumber = await publicClient.getBlockNumber();
    expect(blockNumber).toBeGreaterThanOrEqual(0n);
    const health = await fetch(`${BACKEND_URL}/api/v1/publications?limit=1`);
    expect(health.status).toBe(200);
  });

  it(
    "escenario principal: publicación real → PENDING indexado → 3 votos reales → DEFINITIVE " +
      "(on-chain y backend coinciden) → reputación de votantes y autor actualizada → notificación generada",
    async () => {
      const t0 = Date.now();

      // ── 0. Cuentas de prueba ────────────────────────────────────────────
      // Se generan direcciones nuevas al vuelo (no se reutilizan cuentas del
      // mnemonic ya usadas por `make fresh-start`/otras suites) para no
      // depender de qué estado de reputación/votos previos tengan esas
      // direcciones — se registran aquí mismo con la reputación mínima
      // necesaria, igual que ya hace `backend/test/integration.test.ts`.
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const admin = accounts[0] as `0x${string}`; // deployer: DEFAULT_ADMIN_ROLE en ReputationSystem

      const author = privateKeyToAccount(generatePrivateKey());
      const voters = [
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
      ];

      for (const acc of [author, ...voters]) {
        const fundTx = await wallet(admin).sendTransaction({ to: acc.address, value: 5n * 10n ** 16n });
        await publicClient.waitForTransactionReceipt({ hash: fundTx });
      }

      // ── 1. Publicar (transacción real on-chain) ─────────────────────────
      const body = uniqueBody("articulo de prueba de sistema");
      const contentHash = keccak256(toBytes(body));

      const publishTx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      const publishReceipt = await publicClient.waitForTransactionReceipt({ hash: publishTx });
      expect(publishReceipt.status).toBe("success");

      // Registrar en el backend (paso 5 del flujo de publicación de CLAUDE.md §11).
      const createRes = await apiPost("/api/v1/publications", {
        contentHash,
        title: "Artículo de prueba de sistema",
        body,
        tags: ["sistema-e2e"],
      });
      expect(createRes.status).toBe(201);

      // ── 2. El indexador en vivo refleja PENDING ─────────────────────────
      const pendingPublication = await pollUntil(
        () => apiGet(`/api/v1/publications/${contentHash}`),
        (r) => r.status === 200 && r.json?.consensusState === "PENDING",
        { label: "backend refleja consensusState=PENDING tras registerPublication", timeoutMs: 30_000 },
      );
      expect(pendingPublication.json.contentHash).toBe(contentHash);
      expect(pendingPublication.json.authorAddress.toLowerCase()).toBe(author.address.toLowerCase());

      // Comparación on-chain vs backend, también en este paso intermedio:
      // ValidationRegistry.currentRound empieza en 0 para todo artículo.
      const onChainRoundBeforeVotes = (await publicClient.readContract({
        address: VAL,
        abi: valAbi,
        functionName: "currentRound",
        args: [contentHash],
      })) as bigint;
      expect(onChainRoundBeforeVotes).toBe(0n);
      expect(pendingPublication.json.currentRound).toBe(0);

      // ── 3. Registrar validadores con reputación suficiente y votar ──────
      // quorumThreshold=3, superMajorityBps=6667 (ignition/modules/NewsEra.ts):
      // 3 votos TRUE ⇒ 100% ≥ 66.67% ⇒ DEFINITIVE con cualquier configuración
      // de quorumThreshold ≤ 3 desplegada en local.
      for (const voter of voters) {
        const regTx = await wallet(admin).writeContract({
          address: REP,
          abi: repAbi,
          functionName: "registerValidator",
          args: [voter.address, 10n],
        });
        await publicClient.waitForTransactionReceipt({ hash: regTx });
      }

      for (const voter of voters) {
        const voteTx = await wallet(voter).writeContract({
          address: VAL,
          abi: valAbi,
          functionName: "submitValidation",
          args: [contentHash, VOTE_TRUE],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: voteTx });
        expect(receipt.status).toBe("success");
      }

      // ── 4. Verificación: on-chain vs backend, en cada aserción ──────────

      // 4.1 Consenso: ConsensusReached → DEFINITIVE / TRUE, en backend Y on-chain.
      const definitivePublication = await pollUntil(
        () => apiGet(`/api/v1/publications/${contentHash}`),
        (r) => r.status === 200 && r.json?.consensusState === "DEFINITIVE",
        { label: "backend refleja consensusState=DEFINITIVE tras 3 votos TRUE", timeoutMs: 60_000 },
      );
      expect(definitivePublication.json.currentResult).toBe("TRUE");

      const onChainRound = (await publicClient.readContract({
        address: VAL,
        abi: valAbi,
        functionName: "currentRound",
        args: [contentHash],
      })) as bigint;
      const onChainRoundInfo = (await publicClient.readContract({
        address: VAL,
        abi: valAbi,
        functionName: "rounds",
        args: [contentHash, onChainRound],
      })) as [number, number, boolean]; // [result, state, completed]

      expect(STATE_LABELS[onChainRoundInfo[1]]).toBe("DEFINITIVE");
      expect(VOTE_LABELS[onChainRoundInfo[0]]).toBe("TRUE");
      expect(onChainRoundInfo[2]).toBe(true);
      // El backend coincide con la lectura on-chain, no solo con "algún" DEFINITIVE.
      expect(definitivePublication.json.consensusState).toBe(STATE_LABELS[onChainRoundInfo[1]]);
      expect(definitivePublication.json.currentResult).toBe(VOTE_LABELS[onChainRoundInfo[0]]);

      // 4.2 Reputación de los votantes: +5 cada uno (opción ganadora), on-chain y backend.
      for (const voter of voters) {
        const onChainRep = (await publicClient.readContract({
          address: REP,
          abi: repAbi,
          functionName: "getReputation",
          args: [voter.address],
        })) as bigint;
        expect(onChainRep).toBe(10n + REPUTATION_REWARD); // 10 inicial + 5 de recompensa

        const backendValidator = await pollUntil(
          () => apiGet(`/api/v1/validators/${voter.address}`),
          (r) => r.status === 200 && r.json?.reputationScore === Number(10n + REPUTATION_REWARD),
          { label: `backend refleja reputación (+5) del votante ${voter.address}`, timeoutMs: 30_000 },
        );
        expect(backendValidator.json.reputationScore).toBe(Number(onChainRep));

        // Ledger de reputación: el motivo se clasifica a partir de la propia
        // transacción de voto (ver indexer.ts / classifyReputationEvent).
        const history = await apiGet(`/api/v1/validators/${voter.address}/reputation-history`);
        expect(history.status).toBe(200);
        const voteRewardEntry = history.json.items.find(
          (e: { contentHash: string | null; reason: string }) =>
            e.contentHash === contentHash && e.reason === "VOTE_REWARD",
        );
        expect(voteRewardEntry).toBeDefined();
        expect(voteRewardEntry.delta).toBe(5);
      }

      // 4.3 Reputación del autor por la publicación: veredicto TRUE ⇒ +8, on-chain y backend.
      const onChainAuthorRep = (await publicClient.readContract({
        address: REP,
        abi: repAbi,
        functionName: "getReputation",
        args: [author.address],
      })) as bigint;
      expect(onChainAuthorRep).toBe(PUBLISH_REPUTATION_REWARD);

      const backendAuthor = await pollUntil(
        () => apiGet(`/api/v1/validators/${author.address}`),
        (r) => r.status === 200 && r.json?.reputationScore === Number(PUBLISH_REPUTATION_REWARD),
        { label: "backend refleja reputación (+8) del autor por publicación TRUE", timeoutMs: 30_000 },
      );
      expect(backendAuthor.json.reputationScore).toBe(Number(onChainAuthorRep));

      const authorHistory = await apiGet(`/api/v1/validators/${author.address}/reputation-history`);
      const publishRewardEntry = authorHistory.json.items.find(
        (e: { contentHash: string | null; reason: string }) =>
          e.contentHash === contentHash && e.reason === "PUBLISH_REWARD",
      );
      expect(publishRewardEntry).toBeDefined();
      expect(publishRewardEntry.delta).toBe(8);

      // 4.4 Notificación: los votantes tienen una `Validation` sobre este
      // contentHash, así que `ConsensusReached` debe generarles una
      // Notification tipo CONSENSUS_REACHED (HU-7.3), sin necesidad de
      // seguir (`follow`) el artículo explícitamente.
      const notified = await pollUntil(
        () => apiGet(`/api/v1/profile/${voters[0].address}/notifications`),
        (r) =>
          r.status === 200 &&
          Array.isArray(r.json?.items) &&
          r.json.items.some(
            (n: { contentHash: string; type: string }) => n.contentHash === contentHash && n.type === "CONSENSUS_REACHED",
          ),
        { label: "notificación CONSENSUS_REACHED generada para un votante", timeoutMs: 30_000 },
      );
      const notification = notified.json.items.find(
        (n: { contentHash: string; type: string }) => n.contentHash === contentHash,
      );
      expect(notification.type).toBe("CONSENSUS_REACHED");

      const elapsedMs = Date.now() - t0;
      // eslint-disable-next-line no-console
      console.log(`[sistema E2E] escenario principal completado en ${elapsedMs}ms`);
    },
    180_000, // hasta 3 min: varias transacciones reales + polling del indexador en vivo (~4s/sondeo)
  );

  it(
    "escenario secundario: reapertura real (requestReopen × reopenThreshold) → ronda 2 con veredicto " +
      "contrario → claimRetroactiveReputation con delta correcto, on-chain y en el backend",
    async () => {
      const t0 = Date.now();
      const accounts = await publicClient.request({ method: "eth_accounts" });
      const admin = accounts[0] as `0x${string}`;

      const author = privateKeyToAccount(generatePrivateKey());
      // Ronda 0: votan TRUE y ganan (wasCorrect = true para la reclamación retroactiva).
      const round0Voters = [
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
      ];
      // Ronda 1 (tras reapertura): mismas 3 direcciones solicitan Y votan —
      // requestReopen solo exige no haber votado aún (_hasVoted es global por
      // artículo, no por ronda), así que quien reabre puede votar la ronda nueva.
      const reopeners = [
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
        privateKeyToAccount(generatePrivateKey()),
      ];

      for (const acc of [author, ...round0Voters, ...reopeners]) {
        const fundTx = await wallet(admin).sendTransaction({ to: acc.address, value: 5n * 10n ** 16n });
        await publicClient.waitForTransactionReceipt({ hash: fundTx });
      }
      for (const voter of [...round0Voters, ...reopeners]) {
        const regTx = await wallet(admin).writeContract({
          address: REP,
          abi: repAbi,
          functionName: "registerValidator",
          args: [voter.address, 10n],
        });
        await publicClient.waitForTransactionReceipt({ hash: regTx });
      }

      // ── Ronda 0: publicar y alcanzar DEFINITIVE/TRUE ────────────────────
      const body = uniqueBody("articulo de prueba de reapertura");
      const contentHash = keccak256(toBytes(body));
      const publishTx = await wallet(author).writeContract({
        address: PUB,
        abi: pubAbi,
        functionName: "registerPublication",
        args: [contentHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: publishTx });
      const createRes = await apiPost("/api/v1/publications", {
        contentHash,
        title: "Artículo de prueba de reapertura",
        body,
        tags: ["sistema-e2e-reopen"],
      });
      expect(createRes.status).toBe(201);

      for (const voter of round0Voters) {
        const voteTx = await wallet(voter).writeContract({
          address: VAL,
          abi: valAbi,
          functionName: "submitValidation",
          args: [contentHash, VOTE_TRUE],
        });
        await publicClient.waitForTransactionReceipt({ hash: voteTx });
      }

      await pollUntil(
        () => apiGet(`/api/v1/publications/${contentHash}`),
        (r) => r.status === 200 && r.json?.consensusState === "DEFINITIVE" && r.json?.currentResult === "TRUE",
        { label: "ronda 0 alcanza DEFINITIVE/TRUE en el backend", timeoutMs: 60_000 },
      );

      // ── Reapertura: reopenThreshold = 3 solicitudes ─────────────────────
      for (const reopener of reopeners) {
        const reopenTx = await wallet(reopener).writeContract({
          address: VAL,
          abi: valAbi,
          functionName: "requestReopen",
          args: [contentHash],
        });
        await publicClient.waitForTransactionReceipt({ hash: reopenTx });
      }

      const onChainRoundAfterReopen = (await publicClient.readContract({
        address: VAL,
        abi: valAbi,
        functionName: "currentRound",
        args: [contentHash],
      })) as bigint;
      expect(onChainRoundAfterReopen).toBe(1n);

      const reopenedPublication = await pollUntil(
        () => apiGet(`/api/v1/publications/${contentHash}`),
        (r) => r.status === 200 && r.json?.currentRound === 1,
        { label: "backend refleja VotingReopened (currentRound=1, consensusState=PENDING)", timeoutMs: 30_000 },
      );
      expect(reopenedPublication.json.consensusState).toBe("PENDING");

      // ── Ronda 1: los mismos 3 reaperturadores votan FALSE (veredicto contrario) ──
      for (const voter of reopeners) {
        const voteTx = await wallet(voter).writeContract({
          address: VAL,
          abi: valAbi,
          functionName: "submitValidation",
          args: [contentHash, 1 /* FALSE */],
        });
        await publicClient.waitForTransactionReceipt({ hash: voteTx });
      }

      const round1Definitive = await pollUntil(
        () => apiGet(`/api/v1/publications/${contentHash}`),
        (r) => r.status === 200 && r.json?.consensusState === "DEFINITIVE" && r.json?.currentResult === "FALSE",
        { label: "ronda 1 alcanza DEFINITIVE/FALSE en el backend", timeoutMs: 60_000 },
      );

      // Backend expone el historial completo de rondas: ronda 0 (TRUE) y
      // ronda 1 (FALSE), ambas completed.
      const roundsHistory = round1Definitive.json.rounds as Array<{
        round: number;
        result: string | null;
        state: string;
        completed: boolean;
      }>;
      const round0Info = roundsHistory.find((r) => r.round === 0);
      const round1Info = roundsHistory.find((r) => r.round === 1);
      expect(round0Info?.result).toBe("TRUE");
      expect(round0Info?.state).toBe("DEFINITIVE");
      expect(round1Info?.result).toBe("FALSE");
      expect(round1Info?.state).toBe("DEFINITIVE");

      const onChainRound1Info = (await publicClient.readContract({
        address: VAL,
        abi: valAbi,
        functionName: "rounds",
        args: [contentHash, 1n],
      })) as [number, number, boolean];
      expect(VOTE_LABELS[onChainRound1Info[0]]).toBe("FALSE");
      expect(STATE_LABELS[onChainRound1Info[1]]).toBe("DEFINITIVE");

      // ── claimRetroactiveReputation: los votantes de la ronda 0 (TRUE, ganadores) ──
      // ven una ronda posterior que CONTRADICE su resultado ⇒ eran "wasCorrect"
      // ⇒ −RETROACTIVE_DELTA (−1) neto. Reputación esperada: 15 (10+5) − 1 = 14.
      for (const voter of round0Voters) {
        const claimTx = await wallet(voter).writeContract({
          address: VAL,
          abi: valAbi,
          functionName: "claimRetroactiveReputation",
          args: [contentHash],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: claimTx });
        expect(receipt.status).toBe("success");

        const onChainRepAfterClaim = (await publicClient.readContract({
          address: REP,
          abi: repAbi,
          functionName: "getReputation",
          args: [voter.address],
        })) as bigint;
        expect(onChainRepAfterClaim).toBe(14n); // 10 inicial + 5 (ronda 0 ganadora) − 1 (retroactivo contradictorio)

        const backendValidatorAfterClaim = await pollUntil(
          () => apiGet(`/api/v1/validators/${voter.address}`),
          (r) => r.status === 200 && r.json?.reputationScore === 14,
          { label: `backend refleja reputación (14) tras retroactivo del votante ${voter.address}`, timeoutMs: 30_000 },
        );
        expect(backendValidatorAfterClaim.json.reputationScore).toBe(Number(onChainRepAfterClaim));

        // El indexador registra RetroactiveClaimed vía handleRetroactiveClaimed
        // (backend/src/services/indexer.ts) en retroactive_claims, expuesto en
        // /activity — se compara el netDelta on-chain (evento) contra el backend.
        const activity = await pollUntil(
          () => apiGet(`/api/v1/validators/${voter.address}/activity?limit=200`),
          (r) =>
            r.status === 200 &&
            r.json.items.some(
              (i: { type: string; contentHash: string }) => i.type === "RETROACTIVE_CLAIM" && i.contentHash === contentHash,
            ),
          { label: `backend refleja RETROACTIVE_CLAIM en /activity de ${voter.address}`, timeoutMs: 30_000 },
        );
        const claimEntry = activity.json.items.find(
          (i: { type: string; contentHash: string }) => i.type === "RETROACTIVE_CLAIM" && i.contentHash === contentHash,
        );
        expect(claimEntry.netDelta).toBe(-1);
      }

      const elapsedMs = Date.now() - t0;
      // eslint-disable-next-line no-console
      console.log(`[sistema E2E] escenario secundario (reapertura) completado en ${elapsedMs}ms`);
    },
    180_000,
  );
});
