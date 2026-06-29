/**
 * Tests E2E integrados — los tres contratos desplegados juntos en Hardhat Network.
 * No usan Ignition: despliegan directamente con ethers para velocidad.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type {
  PublicationRegistry,
  ReputationSystem,
  ValidationRegistry,
} from "../../typechain-types";

// ── Parámetros ────────────────────────────────────────────────────────────────
const QUORUM         = 3n;
const SUPER_MAJ      = 6667n;
const REOPEN_THRESH  = 3n;
const INIT_REP       = 10n;
const REWARD         = 5n;
const PENALTY        = 3n;

// VoteType
const TRUE_V  = 0;
const FALSE_V = 1;

// ConsensusState
const PENDING    = 0n;
const DEFINITIVE = 1n;

const h = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

// ── Deploy helper ─────────────────────────────────────────────────────────────

async function deployAll(): Promise<{
  pub:  PublicationRegistry;
  rep:  ReputationSystem;
  val:  ValidationRegistry;
  admin: HardhatEthersSigner;
  signers: HardhatEthersSigner[];
}> {
  const signers = await ethers.getSigners();
  const admin   = signers[0];

  const PubF = await ethers.getContractFactory("PublicationRegistry");
  const pub  = await PubF.deploy();
  await pub.waitForDeployment();

  const RepF = await ethers.getContractFactory("ReputationSystem");
  const rep  = await RepF.deploy();
  await rep.waitForDeployment();

  const ValF = await ethers.getContractFactory("ValidationRegistry");
  const val  = await ValF.deploy(await rep.getAddress(), QUORUM, SUPER_MAJ, REOPEN_THRESH);
  await val.waitForDeployment();

  // Configurar roles (replica lo que hace el módulo Ignition)
  const VALIDATOR_ROLE = await rep.VALIDATOR_ROLE();
  await rep.grantRole(VALIDATOR_ROLE, await val.getAddress());

  return { pub, rep, val, admin, signers };
}

// ── E2E-1: Flujo básico publicar → votar → DEFINITIVE ────────────────────────

describe("E2E-1: Flujo básico publicar → votar → consenso DEFINITIVE", () => {
  let pub:   PublicationRegistry;
  let rep:   ReputationSystem;
  let val:   ValidationRegistry;
  let admin: HardhatEthersSigner;
  let v:     HardhatEthersSigner[];

  const HASH = h("e2e-flujo-basico");

  before(async () => {
    ({ pub, rep, val, admin, signers: [admin, ...v] } = await deployAll());
    // Registrar 5 validadores con reputación 10
    for (let i = 0; i < 5; i++) {
      await rep.registerValidator(v[i].address, INIT_REP);
    }
  });

  it("registra la publicación en PublicationRegistry", async () => {
    await expect(pub.connect(v[0]).registerPublication(HASH))
      .to.emit(pub, "PublicationRegistered")
      .withArgs(HASH, v[0].address, anyValue);

    const data = await pub.getPublication(HASH);
    expect(data.author).to.equal(v[0].address);
    expect(data.exists).to.be.true;
  });

  it("estado inicial es PENDING", async () => {
    expect(await val.consensusState(HASH)).to.equal(PENDING);
  });

  it("4 votos TRUE + 1 FALSE → DEFINITIVE TRUE con efectos reputacionales", async () => {
    await val.connect(v[0]).submitValidation(HASH, TRUE_V);
    await val.connect(v[1]).submitValidation(HASH, TRUE_V);
    await val.connect(v[2]).submitValidation(HASH, TRUE_V);
    // Al alcanzar quórum=3 → DEFINITIVE (3/3 = 100%)
    expect(await val.consensusState(HASH)).to.equal(DEFINITIVE);

    // Verificar reputación de los 3 que votaron TRUE: +5
    expect(await rep.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
    expect(await rep.getReputation(v[1].address)).to.equal(INIT_REP + REWARD);
    expect(await rep.getReputation(v[2].address)).to.equal(INIT_REP + REWARD);
  });

  it("intento de voto tras DEFINITIVE revierte con VotingNotOpen", async () => {
    await expect(val.connect(v[3]).submitValidation(HASH, TRUE_V))
      .to.be.revertedWithCustomError(val, "VotingNotOpen")
      .withArgs(HASH);
  });
});

// ── E2E-2: Flujo multironda con claimRetroactiveReputation ────────────────────

describe("E2E-2: Flujo multironda con claimRetroactiveReputation", () => {
  let rep:   ReputationSystem;
  let val:   ValidationRegistry;
  let admin: HardhatEthersSigner;
  let v:     HardhatEthersSigner[];

  const HASH = h("e2e-multironda");

  before(async () => {
    ({ rep, val, admin, signers: [admin, ...v] } = await deployAll());
    // 9 validadores
    for (let i = 0; i < 9; i++) {
      await rep.registerValidator(v[i].address, INIT_REP);
    }
  });

  it("ronda 0: v0,v1,v2 votan TRUE → DEFINITIVE TRUE; v0 rep=15", async () => {
    await val.connect(v[0]).submitValidation(HASH, TRUE_V);
    await val.connect(v[1]).submitValidation(HASH, TRUE_V);
    await val.connect(v[2]).submitValidation(HASH, TRUE_V);

    expect(await val.consensusState(HASH)).to.equal(DEFINITIVE);
    expect((await val.rounds(HASH, 0)).result).to.equal(TRUE_V);
    expect(await rep.getReputation(v[0].address)).to.equal(INIT_REP + REWARD); // 15
  });

  it("v3,v4,v5 solicitan reopen → VotingReopened(round=1)", async () => {
    await val.connect(v[3]).requestReopen(HASH);
    await val.connect(v[4]).requestReopen(HASH);
    await expect(val.connect(v[5]).requestReopen(HASH))
      .to.emit(val, "VotingReopened")
      .withArgs(HASH, 1);

    expect(await val.currentRound(HASH)).to.equal(1n);
    expect(await val.consensusState(HASH)).to.equal(PENDING);
  });

  it("ronda 1: v3,v4,v5 votan FALSE → DEFINITIVE FALSE", async () => {
    await val.connect(v[3]).submitValidation(HASH, FALSE_V);
    await val.connect(v[4]).submitValidation(HASH, FALSE_V);
    await val.connect(v[5]).submitValidation(HASH, FALSE_V);

    expect(await val.consensusState(HASH)).to.equal(DEFINITIVE);
    expect((await val.rounds(HASH, 1)).result).to.equal(FALSE_V);
  });

  it("v0 reclama: ronda 1 contradice su ronda 0 → net=−1; rep=14", async () => {
    const repBefore = await rep.getReputation(v[0].address); // 15
    await expect(val.connect(v[0]).claimRetroactiveReputation(HASH))
      .to.emit(val, "RetroactiveClaimed")
      .withArgs(HASH, v[0].address, -1n);

    expect(await rep.getReputation(v[0].address)).to.equal(repBefore - 1n); // 14
  });

  it("v1 reclama: también wasCorrect=true, contradición → rep−1", async () => {
    const repBefore = await rep.getReputation(v[1].address); // 15
    await val.connect(v[1]).claimRetroactiveReputation(HASH);
    expect(await rep.getReputation(v[1].address)).to.equal(repBefore - 1n);
  });

  it("v3 reclama: no hay rondas posteriores a la suya → NothingToClaim", async () => {
    await expect(val.connect(v[3]).claimRetroactiveReputation(HASH))
      .to.be.revertedWithCustomError(val, "NothingToClaim")
      .withArgs(HASH, v[3].address);
  });
});

// ── E2E-3: Ataque Sybil ───────────────────────────────────────────────────────

describe("E2E-3: Resistencia Sybil — direcciones sin reputación no pueden validar", () => {
  let val: ValidationRegistry;
  let rep: ReputationSystem;
  let signers: HardhatEthersSigner[];

  const HASH = h("e2e-sybil");

  before(async () => {
    ({ val, rep, signers } = await deployAll());
    // Los signers NO están registrados → reputación 0 < MIN_REPUTATION_TO_VALIDATE (10)
  });

  it("5 direcciones sin reputación revierten con InsufficientReputation", async () => {
    for (let i = 1; i <= 5; i++) {
      await expect(val.connect(signers[i]).submitValidation(HASH, TRUE_V))
        .to.be.revertedWithCustomError(val, "InsufficientReputation")
        .withArgs(signers[i].address);
    }
    expect(await rep.getReputation(signers[1].address)).to.equal(0n);
  });
});

// ── E2E-4: Validador degradado pierde acceso ──────────────────────────────────

describe("E2E-4: Degradación — validador que pierde reputación no puede seguir validando", () => {
  let rep:   ReputationSystem;
  let val:   ValidationRegistry;
  let admin: HardhatEthersSigner;
  let v:     HardhatEthersSigner[];

  const HASH_A = h("e2e-degradacion-articulo-a");
  const HASH_B = h("e2e-degradacion-articulo-b");
  const HASH_C = h("e2e-degradacion-articulo-c");

  before(async () => {
    // quorum=3, superMajority=6667 → necesitamos un registry con quorum=3
    ({ rep, val, admin, signers: [admin, ...v] } = await deployAll());

    // v[0] es el objetivo. v[1], v[2] conforman la mayoría. v[3] es spare.
    // Reputaciones: v[0]=10, v[1..3]=10
    for (let i = 0; i < 4; i++) {
      await rep.registerValidator(v[i].address, INIT_REP);
    }
  });

  it("artículo A: v[0] vota FALSE (minoría), pierde −3 → rep=7", async () => {
    // v[1], v[2] votan TRUE → quórum en ronda 3
    // Pero con quorum=3 y superMaj=6667: necesitamos que los 3 voten para llegar a quórum
    // v[0]=FALSE, v[1]=TRUE, v[2]=TRUE → 2/3 = 66.66% < 66.67% → DISPUTED (sin penalización)
    // Para que haya penalización necesitamos 3/3 del mismo resultado.
    // Estrategia: v[1], v[2], v[3] votan TRUE → DEFINITIVE TRUE (3/3=100%); v[0] vota FALSE antes
    // Pero v[0] debe votar antes de que se alcance el quórum.

    // Usamos un registry con quorum=5 para tener más votos que controlar:
    const ValF = await ethers.getContractFactory("ValidationRegistry");
    const val5 = await ValF.deploy(await rep.getAddress(), 5n, SUPER_MAJ, REOPEN_THRESH);
    await val5.waitForDeployment();
    const VALIDATOR_ROLE = await rep.VALIDATOR_ROLE();
    await rep.grantRole(VALIDATOR_ROLE, await val5.getAddress());

    // 5 validadores con rep=10 (v[4]..v[8] aún no registrados, usar v[0..3] + extra)
    // v[0] es el objetivo (rep=10 ya registrado). Necesitamos v[1..4].
    for (let i = 1; i <= 4; i++) {
      if (!(await rep.isRegisteredValidator(v[i].address))) {
        await rep.registerValidator(v[i].address, INIT_REP);
      }
    }

    // v[0] vota FALSE; v[1..4] votan TRUE → 4 TRUE / 1 FALSE, 80% → DEFINITIVE TRUE
    await val5.connect(v[0]).submitValidation(HASH_A, FALSE_V);
    await val5.connect(v[1]).submitValidation(HASH_A, TRUE_V);
    await val5.connect(v[2]).submitValidation(HASH_A, TRUE_V);
    await val5.connect(v[3]).submitValidation(HASH_A, TRUE_V);
    await val5.connect(v[4]).submitValidation(HASH_A, TRUE_V);

    expect(await val5.consensusState(HASH_A)).to.equal(DEFINITIVE);
    // v[0] perdió −3: rep = 10 − 3 = 7
    expect(await rep.getReputation(v[0].address)).to.equal(INIT_REP - PENALTY); // 7

    // Segunda penalización en artículo B: v[0] ya no puede estar registrado por rep < 10?
    // No, canValidate usa MIN_REPUTATION_TO_VALIDATE=10; 7 < 10 → InsufficientReputation
    await expect(val5.connect(v[0]).submitValidation(HASH_B, FALSE_V))
      .to.be.revertedWithCustomError(val5, "InsufficientReputation")
      .withArgs(v[0].address);
  });
});
