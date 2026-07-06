/**
 * Script de seed para poblar un nodo Hardhat local YA desplegado con un
 * estado completo y realista de NewsEra (7 artículos cubriendo todos los
 * escenarios de consensusState) mediante transacciones on-chain reales.
 *
 * Uso: npx hardhat run scripts/seed.ts --network localhost
 *
 * Requisito previo: los 3 contratos deben estar ya desplegados (Ignition)
 * en la red apuntada; las direcciones se leen de
 * ignition/deployments/chain-<chainId>/deployed_addresses.json.
 */
import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";
import type {
  PublicationRegistry,
  ReputationSystem,
  ValidationRegistry,
} from "../typechain-types";

// ── VoteType / ConsensusState (mismos valores que el enum de Solidity) ───────
const TRUE_V = 0;
const FALSE_V = 1;
const UNVERIFIABLE_V = 2;

const CONSENSUS_STATE_NAMES = ["PENDING", "DEFINITIVE", "DISPUTED", "PENDING_REOPEN"];
const VOTE_NAMES = ["TRUE", "FALSE", "UNVERIFIABLE"];

const INITIAL_REPUTATION = 10n;

interface SeedArticle {
  id: string;
  scenario: string;
  title: string;
  body: string;
  tags: string[];
}

interface SeedAccounts {
  admin: number;
  authors: Record<string, number>;
  validators: number[];
  predictors: number[];
}

interface SeedData {
  accounts: SeedAccounts;
  articles: SeedArticle[];
}

function loadSeedData(): SeedData {
  const seedPath = path.join(__dirname, "../../docs/seed/articles.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  return JSON.parse(raw) as SeedData;
}

function loadDeployedAddresses(): {
  publicationRegistry: string;
  reputationSystem: string;
  validationRegistry: string;
} {
  const deploymentPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${network.config.chainId}/deployed_addresses.json`,
  );
  const raw = fs.readFileSync(deploymentPath, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, string>;

  const publicationRegistry = parsed["NewsEraModule#PublicationRegistry"];
  const reputationSystem = parsed["NewsEraModule#ReputationSystem"];
  const validationRegistry = parsed["NewsEraModule#ValidationRegistry"];

  if (!publicationRegistry || !reputationSystem || !validationRegistry) {
    throw new Error(
      `No se pudieron leer las direcciones desplegadas desde ${deploymentPath}. ` +
        `Contenido: ${JSON.stringify(parsed)}`,
    );
  }

  return { publicationRegistry, reputationSystem, validationRegistry };
}

async function main(): Promise<void> {
  const seed = loadSeedData();
  const { publicationRegistry, reputationSystem, validationRegistry } =
    loadDeployedAddresses();

  const signers = await ethers.getSigners();
  const admin = signers[seed.accounts.admin];
  const authorsByArticleId = seed.accounts.authors;
  const validatorIdx = seed.accounts.validators; // [8,9,10,11,12,13]
  const predictorIdx = seed.accounts.predictors; // [14,15]

  const validatorSigners = validatorIdx.map((i) => signers[i]);
  const predictorSigners = predictorIdx.map((i) => signers[i]);

  const pub = (await ethers.getContractAt(
    "PublicationRegistry",
    publicationRegistry,
  )) as unknown as PublicationRegistry;
  const rep = (await ethers.getContractAt(
    "ReputationSystem",
    reputationSystem,
  )) as unknown as ReputationSystem;
  const val = (await ethers.getContractAt(
    "ValidationRegistry",
    validationRegistry,
  )) as unknown as ValidationRegistry;

  console.log("=== NewsEra seed script ===");
  console.log(`Red: ${network.name} (chainId ${network.config.chainId})`);
  console.log(`PublicationRegistry: ${publicationRegistry}`);
  console.log(`ReputationSystem:    ${reputationSystem}`);
  console.log(`ValidationRegistry:  ${validationRegistry}`);
  console.log("");

  // ── 1. Registrar validadores con reputación inicial 10 ──────────────────
  console.log("--- 1. Registrando validadores ---");
  for (const validator of validatorSigners) {
    const already = await rep.isRegisteredValidator(validator.address);
    if (already) {
      console.log(`  ${validator.address} ya registrado, se omite.`);
      continue;
    }
    const tx = await rep
      .connect(admin)
      .registerValidator(validator.address, INITIAL_REPUTATION);
    await tx.wait();
    console.log(`  Registrado ${validator.address} con reputación ${INITIAL_REPUTATION}`);
  }

  // ── 2. Registrar cada publicación desde su autor ─────────────────────────
  console.log("\n--- 2. Registrando publicaciones ---");
  const contentHashByArticleId: Record<string, string> = {};
  for (const article of seed.articles) {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(article.body));
    contentHashByArticleId[article.id] = contentHash;

    const authorSigner = signers[authorsByArticleId[article.id]];
    const tx = await pub.connect(authorSigner).registerPublication(contentHash);
    await tx.wait();
    console.log(
      `  [${article.id}] "${article.title}" -> ${contentHash} (autor ${authorSigner.address})`,
    );
  }

  const hashOf = (id: string) => contentHashByArticleId[id];

  // ── 3. p1: PENDING, 0 votos ───────────────────────────────────────────────
  console.log("\n--- 3. p1: sin votos (PENDING) ---");
  console.log("  (no se emite ningún voto)");

  // ── 4. p2: 1 voto TRUE, PENDING ───────────────────────────────────────────
  console.log("\n--- 4. p2: 1 voto TRUE (PENDING, 1/3 quorum) ---");
  {
    const tx = await val.connect(validatorSigners[0]).submitValidation(hashOf("p2"), TRUE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[0].address} votó TRUE`);
  }

  // ── 5. p3: 3x TRUE -> DEFINITIVE/TRUE ─────────────────────────────────────
  console.log("\n--- 5. p3: 3x TRUE -> DEFINITIVE/TRUE ---");
  for (let i = 0; i < 3; i++) {
    const tx = await val.connect(validatorSigners[i]).submitValidation(hashOf("p3"), TRUE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[i].address} votó TRUE`);
  }

  // ── 6. p4: 3x FALSE -> DEFINITIVE/FALSE ───────────────────────────────────
  console.log("\n--- 6. p4: 3x FALSE -> DEFINITIVE/FALSE ---");
  for (let i = 0; i < 3; i++) {
    const tx = await val.connect(validatorSigners[i]).submitValidation(hashOf("p4"), FALSE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[i].address} votó FALSE`);
  }

  // ── 7. p5: 3x UNVERIFIABLE -> DEFINITIVE/UNVERIFIABLE ─────────────────────
  console.log("\n--- 7. p5: 3x UNVERIFIABLE -> DEFINITIVE/UNVERIFIABLE ---");
  for (let i = 0; i < 3; i++) {
    const tx = await val
      .connect(validatorSigners[i])
      .submitValidation(hashOf("p5"), UNVERIFIABLE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[i].address} votó UNVERIFIABLE`);
  }

  // ── 8. p6: 2x TRUE + 1x FALSE -> DISPUTED ─────────────────────────────────
  console.log("\n--- 8. p6: 2x TRUE + 1x FALSE -> DISPUTED ---");
  {
    let tx = await val.connect(validatorSigners[0]).submitValidation(hashOf("p6"), TRUE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[0].address} votó TRUE`);
    tx = await val.connect(validatorSigners[1]).submitValidation(hashOf("p6"), TRUE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[1].address} votó TRUE`);
    tx = await val.connect(validatorSigners[2]).submitValidation(hashOf("p6"), FALSE_V);
    await tx.wait();
    console.log(`  ${validatorSigners[2].address} votó FALSE`);
  }

  // ── 9. p7: ronda 0 DISPUTED -> reopen -> ronda 1 DEFINITIVE/FALSE -> claim ─
  console.log("\n--- 9. p7: ronda 0 DISPUTED -> reopen -> ronda 1 DEFINITIVE/FALSE ---");
  const p7Hash = hashOf("p7");

  {
    let tx = await val.connect(validatorSigners[0]).submitValidation(p7Hash, TRUE_V);
    await tx.wait();
    console.log(`  Ronda 0: ${validatorSigners[0].address} votó TRUE`);
    tx = await val.connect(validatorSigners[1]).submitValidation(p7Hash, TRUE_V);
    await tx.wait();
    console.log(`  Ronda 0: ${validatorSigners[1].address} votó TRUE`);
    tx = await val.connect(validatorSigners[2]).submitValidation(p7Hash, FALSE_V);
    await tx.wait();
    console.log(`  Ronda 0: ${validatorSigners[2].address} votó FALSE (-> DISPUTED)`);
  }

  console.log("  Solicitando reapertura (signers[11,12,13])...");
  for (let i = 3; i < 6; i++) {
    const tx = await val.connect(validatorSigners[i]).requestReopen(p7Hash);
    await tx.wait();
    console.log(`  ${validatorSigners[i].address} solicitó reopen`);
  }
  console.log(`  Ronda actual tras reopen: ${await val.currentRound(p7Hash)}`);

  {
    let tx = await val.connect(validatorSigners[3]).submitValidation(p7Hash, FALSE_V);
    await tx.wait();
    console.log(`  Ronda 1: ${validatorSigners[3].address} votó FALSE`);
    tx = await val.connect(validatorSigners[4]).submitValidation(p7Hash, FALSE_V);
    await tx.wait();
    console.log(`  Ronda 1: ${validatorSigners[4].address} votó FALSE`);
    tx = await val.connect(validatorSigners[5]).submitValidation(p7Hash, FALSE_V);
    await tx.wait();
    console.log(`  Ronda 1: ${validatorSigners[5].address} votó FALSE (-> DEFINITIVE/FALSE)`);
  }

  console.log("  Reclamando reputación retroactiva (signers[8], votó TRUE en ronda 0)...");
  let p7NetDelta: bigint | undefined;
  {
    const tx = await val.connect(validatorSigners[0]).claimRetroactiveReputation(p7Hash);
    const receipt = await tx.wait();
    const iface = val.interface;
    for (const log of receipt!.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "RetroactiveClaimed") {
          p7NetDelta = parsed.args.netDelta as bigint;
        }
      } catch {
        // log de otro contrato, se ignora
      }
    }
    console.log(`  netDelta emitido por RetroactiveClaimed: ${p7NetDelta}`);
  }

  // ── 10. Predicciones sobre p3 (ya DEFINITIVE/TRUE) ────────────────────────
  console.log("\n--- 10. Predicciones sobre p3 (DEFINITIVE/TRUE) ---");
  {
    let tx = await val.connect(predictorSigners[0]).submitPrediction(hashOf("p3"), TRUE_V);
    await tx.wait();
    console.log(`  ${predictorSigners[0].address} predijo TRUE (acierta, +1)`);
    tx = await val.connect(predictorSigners[1]).submitPrediction(hashOf("p3"), FALSE_V);
    await tx.wait();
    console.log(`  ${predictorSigners[1].address} predijo FALSE (falla, -1)`);
  }

  // ── Resumen final leído del estado real de la cadena ──────────────────────
  console.log("\n\n=========================================");
  console.log("=          RESUMEN FINAL (on-chain)      =");
  console.log("=========================================\n");

  console.log("Direcciones de los contratos:");
  console.log(`  PublicationRegistry: ${publicationRegistry}`);
  console.log(`  ReputationSystem:    ${reputationSystem}`);
  console.log(`  ValidationRegistry:  ${validationRegistry}`);

  console.log("\nArtículos:");
  for (const article of seed.articles) {
    const contentHash = hashOf(article.id);
    const state = await val.consensusState(contentHash);
    const currentRound = await val.currentRound(contentHash);
    const stateName = CONSENSUS_STATE_NAMES[Number(state)];

    let resultLine = "";
    if (stateName === "DEFINITIVE") {
      const roundInfo = await val.rounds(contentHash, currentRound);
      resultLine = ` | resultado: ${VOTE_NAMES[Number(roundInfo.result)]}`;
    }

    console.log(
      `  [${article.id}] "${article.title}"\n` +
        `      contentHash=${contentHash}\n` +
        `      consensusState=${stateName} | currentRound=${currentRound}${resultLine}`,
    );
  }

  console.log("\nReputación final:");
  console.log("  Autores:");
  for (const [articleId, idx] of Object.entries(authorsByArticleId)) {
    const address = signers[idx].address;
    const reputation = await rep.getReputation(address);
    console.log(`    ${articleId} (${address}): ${reputation}`);
  }
  console.log("  Validadores:");
  for (const validator of validatorSigners) {
    const reputation = await rep.getReputation(validator.address);
    console.log(`    ${validator.address}: ${reputation}`);
  }
  console.log("  Predictores:");
  for (const predictor of predictorSigners) {
    const reputation = await rep.getReputation(predictor.address);
    console.log(`    ${predictor.address}: ${reputation}`);
  }

  console.log(`\nnetDelta real de la reclamación retroactiva de p7: ${p7NetDelta}`);

  console.log("\nDirecciones por rol (índices de las cuentas por defecto de Hardhat):");
  console.log(`  admin (signers[${seed.accounts.admin}]): ${admin.address}`);
  console.log("  autores:");
  for (const [articleId, idx] of Object.entries(authorsByArticleId)) {
    console.log(`    ${articleId} (signers[${idx}]): ${signers[idx].address}`);
  }
  console.log("  validadores:");
  validatorIdx.forEach((idx, i) => {
    console.log(`    signers[${idx}]: ${validatorSigners[i].address}`);
  });
  console.log("  predictores:");
  predictorIdx.forEach((idx, i) => {
    console.log(`    signers[${idx}]: ${predictorSigners[i].address}`);
  });

  console.log("\n=== Seed completado ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
