/**
 * Script de seed para poblar un nodo Hardhat local YA desplegado con un
 * estado completo y realista de NewsEra (~20 artículos cubriendo todos los
 * escenarios de consensusState) mediante transacciones on-chain reales.
 *
 * Uso: npx hardhat run scripts/seed.ts --network localhost
 *
 * Requisito previo: los 3 contratos deben estar ya desplegados (Ignition)
 * en la red apuntada; las direcciones se leen de
 * ignition/deployments/chain-<chainId>/deployed_addresses.json.
 */
import { ethers, network } from "hardhat";
import { HDNodeWallet, Mnemonic } from "ethers";
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

// Mnemonic estándar de Hardhat (mismo usado por backend/scripts/seed-offchain.ts
// para derivar direcciones sin necesitar un signer real). El índice 20 queda
// libre de propósito porque hardhat.config.ts sube el conteo de cuentas a 25
// (por defecto solo genera 20, índices 0-19, todos ya repartidos entre
// admin/autores/validadores/predictores en docs/seed/articles.json).
const HARDHAT_MNEMONIC = "test test test test test test test test test test test junk";

function deriveHardhatWallet(index: number): HDNodeWallet {
  return HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(HARDHAT_MNEMONIC), `m/44'/60'/0'/0/${index}`);
}

type Scenario =
  | "PENDING_ZERO"
  | "PENDING_PARTIAL"
  | "DEFINITIVE_TRUE"
  | "DEFINITIVE_FALSE"
  | "DEFINITIVE_UNVERIFIABLE"
  | "DISPUTED"
  | "REOPEN_TO_FALSE";

interface SeedArticle {
  id: string;
  scenario: Scenario;
  authorIndex: number;
  title: string;
  body: string;
  tags: string[];
}

interface SeedAccounts {
  admin: number;
  authorPool: number[];
  validators: number[];
  predictors: number[];
  readyValidator: number;
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
  const validatorSigners = seed.accounts.validators.map((i) => signers[i]);
  const predictorSigners = seed.accounts.predictors.map((i) => signers[i]);

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
  console.log(`Artículos a sembrar: ${seed.articles.length}`);
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

    const authorSigner = signers[article.authorIndex];
    const tx = await pub.connect(authorSigner).registerPublication(contentHash);
    await tx.wait();
    console.log(
      `  [${article.id}] "${article.title}" -> ${contentHash} (autor ${authorSigner.address})`,
    );
  }
  const hashOf = (id: string) => contentHashByArticleId[id];

  // ── 3. Aplicar el escenario de cada artículo ─────────────────────────────
  console.log("\n--- 3. Aplicando escenarios (votos, reaperturas, retroactiva) ---");
  let retroactiveNetDelta: bigint | undefined;
  const reopenedArticleId = seed.articles.find((a) => a.scenario === "REOPEN_TO_FALSE")?.id;

  for (const article of seed.articles) {
    const hash = hashOf(article.id);
    console.log(`  [${article.id}] escenario ${article.scenario}`);

    switch (article.scenario) {
      case "PENDING_ZERO":
        // Sin votos.
        break;

      case "PENDING_PARTIAL": {
        const tx = await val.connect(validatorSigners[0]).submitValidation(hash, TRUE_V);
        await tx.wait();
        break;
      }

      case "DEFINITIVE_TRUE":
      case "DEFINITIVE_FALSE":
      case "DEFINITIVE_UNVERIFIABLE": {
        const vote =
          article.scenario === "DEFINITIVE_TRUE"
            ? TRUE_V
            : article.scenario === "DEFINITIVE_FALSE"
              ? FALSE_V
              : UNVERIFIABLE_V;
        for (let i = 0; i < 3; i++) {
          const tx = await val.connect(validatorSigners[i]).submitValidation(hash, vote);
          await tx.wait();
        }
        break;
      }

      case "DISPUTED": {
        let tx = await val.connect(validatorSigners[0]).submitValidation(hash, TRUE_V);
        await tx.wait();
        tx = await val.connect(validatorSigners[1]).submitValidation(hash, TRUE_V);
        await tx.wait();
        tx = await val.connect(validatorSigners[2]).submitValidation(hash, FALSE_V);
        await tx.wait();
        break;
      }

      case "REOPEN_TO_FALSE": {
        // Ronda 0: 2x TRUE + 1x FALSE -> DISPUTED.
        let tx = await val.connect(validatorSigners[0]).submitValidation(hash, TRUE_V);
        await tx.wait();
        tx = await val.connect(validatorSigners[1]).submitValidation(hash, TRUE_V);
        await tx.wait();
        tx = await val.connect(validatorSigners[2]).submitValidation(hash, FALSE_V);
        await tx.wait();

        // Reapertura: 3 validadores que no votaron en la ronda 0.
        for (let i = 3; i < 6; i++) {
          tx = await val.connect(validatorSigners[i]).requestReopen(hash);
          await tx.wait();
        }

        // Ronda 1: los mismos 3 reaperturadores votan FALSE -> DEFINITIVE/FALSE.
        for (let i = 3; i < 6; i++) {
          tx = await val.connect(validatorSigners[i]).submitValidation(hash, FALSE_V);
          await tx.wait();
        }

        // Reclamación retroactiva del validador que votó TRUE en la ronda 0.
        tx = await val.connect(validatorSigners[0]).claimRetroactiveReputation(hash);
        const receipt = await tx.wait();
        for (const log of receipt!.logs) {
          try {
            const parsed = val.interface.parseLog(log);
            if (parsed && parsed.name === "RetroactiveClaimed") {
              retroactiveNetDelta = parsed.args.netDelta as bigint;
            }
          } catch {
            // log de otro contrato, se ignora
          }
        }
        break;
      }
    }
  }

  // ── 4. Predicciones sobre un artículo ya DEFINITIVE (p3, DEFINITIVE/TRUE) ─
  console.log("\n--- 4. Predicciones sobre p3 (DEFINITIVE/TRUE) ---");
  const predictionTargetHash = hashOf("p3");
  const predictionVotes = [TRUE_V, FALSE_V, TRUE_V]; // acierta, falla, acierta
  for (let i = 0; i < predictorSigners.length; i++) {
    const tx = await val
      .connect(predictorSigners[i])
      .submitPrediction(predictionTargetHash, predictionVotes[i % predictionVotes.length]);
    await tx.wait();
    console.log(
      `  ${predictorSigners[i].address} predijo ${VOTE_NAMES[predictionVotes[i % predictionVotes.length]]}`,
    );
  }

  // ── 5. Cuenta "lista para validar": 10 predicciones acertadas reales ──────
  // Objetivo: reputación == MIN_REPUTATION_TO_VALIDATE (10) con solo
  // predicciones (PREDICTION_REWARD=1 c/u), para poder importarla en una
  // cartera y usarla ya mismo en /article/:hash o /validate como validador.
  console.log("\n--- 5. Preparando cuenta lista para validar (10 predicciones acertadas) ---");
  const readyValidatorSigner = signers[seed.accounts.readyValidator];
  const readyValidatorWallet = deriveHardhatWallet(seed.accounts.readyValidator);
  if (readyValidatorWallet.address.toLowerCase() !== readyValidatorSigner.address.toLowerCase()) {
    throw new Error(
      `Derivación de clave privada inconsistente: signer=${readyValidatorSigner.address} ` +
        `derivado=${readyValidatorWallet.address}. Revisa accounts.readyValidator/HARDHAT_MNEMONIC.`,
    );
  }

  let readyPredictions = 0;
  for (const article of seed.articles) {
    if (readyPredictions >= 10) break;
    const hash = hashOf(article.id);
    const state = await val.consensusState(hash);
    if (CONSENSUS_STATE_NAMES[Number(state)] !== "DEFINITIVE") continue;

    const currentRound = await val.currentRound(hash);
    const roundInfo = await val.rounds(hash, currentRound);
    const tx = await val.connect(readyValidatorSigner).submitPrediction(hash, roundInfo.result);
    await tx.wait();
    readyPredictions++;
    console.log(
      `  [${article.id}] predicción #${readyPredictions}/10 -> ${VOTE_NAMES[Number(roundInfo.result)]} (acierto)`,
    );
  }
  if (readyPredictions < 10) {
    console.warn(
      `  Aviso: solo se encontraron ${readyPredictions} artículos DEFINITIVE — añade más escenarios ` +
        `DEFINITIVE_* en docs/seed/articles.json para completar las 10 predicciones.`,
    );
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
        `      consensusState=${stateName} | currentRound=${currentRound}${resultLine}`,
    );
  }

  console.log("\nReputación final:");
  console.log("  Autores:");
  const uniqueAuthorIndices = [...new Set(seed.articles.map((a) => a.authorIndex))];
  for (const idx of uniqueAuthorIndices) {
    const address = signers[idx].address;
    const reputation = await rep.getReputation(address);
    console.log(`    signers[${idx}] (${address}): ${reputation}`);
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

  if (reopenedArticleId) {
    console.log(`\nnetDelta real de la reclamación retroactiva de ${reopenedArticleId}: ${retroactiveNetDelta}`);
  }

  const readyReputation = await rep.getReputation(readyValidatorSigner.address);
  const readyCanValidate = await rep.canValidate(readyValidatorSigner.address);
  console.log("\nCuenta lista para validar (importar en MetaMask para probar /validate o /article/:hash):");
  console.log(`  Dirección:    ${readyValidatorSigner.address}`);
  console.log(`  Clave privada: ${readyValidatorWallet.privateKey}`);
  console.log(`  Reputación:   ${readyReputation} | canValidate: ${readyCanValidate}`);
  console.log("  ⚠ Cuenta de prueba de Hardhat (mnemonic público, sin fondos reales) — solo para red local.");

  console.log("\n=== Seed completado ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
