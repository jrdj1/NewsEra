import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ReputationSystem, ValidationRegistry } from "../typechain-types";

// quorumThreshold=3, superMajorityBps=6667 (66.67%)
const QUORUM          = 3n;
const SUPER_MAJORITY  = 6667n;
const INIT_REP        = 10n;
const REWARD          = 5n;
const PENALTY         = 3n;

// Estados del enum ConsensusState
const PENDING    = 0n;
const DEFINITIVE = 1n;
const DISPUTED   = 2n;

// Tipos de voto
const TRUE_VOTE          = 0;
const FALSE_VOTE         = 1;
const UNVERIFIABLE_VOTE  = 2;

const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

const CONTENT_HASH  = hash("articulo sprint-3");
const CONTENT_HASH2 = hash("otro articulo");

async function deployRegistry(
  rep: ReputationSystem,
  quorum: bigint,
  superMaj: bigint,
): Promise<ValidationRegistry> {
  const Factory = await ethers.getContractFactory("ValidationRegistry");
  const reg = await Factory.deploy(await rep.getAddress(), quorum, superMaj);
  await reg.waitForDeployment();
  const VALIDATOR_ROLE = await rep.VALIDATOR_ROLE();
  await rep.grantRole(VALIDATOR_ROLE, await reg.getAddress());
  return reg;
}

describe("ValidationRegistry", () => {
  let reputation: ReputationSystem;
  let registry:   ValidationRegistry;
  let admin:      HardhatEthersSigner;
  let v:          HardhatEthersSigner[]; // validadores [0..7]

  beforeEach(async () => {
    [admin, ...v] = await ethers.getSigners();

    const RepFactory = await ethers.getContractFactory("ReputationSystem");
    reputation = await RepFactory.deploy();
    await reputation.waitForDeployment();

    const ValFactory = await ethers.getContractFactory("ValidationRegistry");
    registry = await ValFactory.deploy(
      await reputation.getAddress(),
      QUORUM,
      SUPER_MAJORITY,
    );
    await registry.waitForDeployment();

    const VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
    await reputation.grantRole(VALIDATOR_ROLE, await registry.getAddress());

    // 8 validadores con reputacion inicial 10
    for (let i = 0; i < 8; i++) {
      await reputation.registerValidator(v[i].address, INIT_REP);
    }
  });

  // ── submitValidation ────────────────────────────────────────────────────────

  describe("submitValidation", () => {
    it("registra el voto y emite ValidationSubmitted", async () => {
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.emit(registry, "ValidationSubmitted")
        .withArgs(CONTENT_HASH, v[0].address, TRUE_VOTE);
    });

    it("revierte AlreadyValidated si el mismo validador vota dos veces", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH, FALSE_VOTE))
        .to.be.revertedWithCustomError(registry, "AlreadyValidated")
        .withArgs(CONTENT_HASH, v[0].address);
    });

    it("revierte InsufficientReputation si canValidate es false", async () => {
      await expect(registry.connect(admin).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "InsufficientReputation")
        .withArgs(admin.address);
    });

    it("revierte ConsensusAlreadyReached si el consenso no esta PENDING", async () => {
      // 3 TRUE → DEFINITIVE
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, TRUE_VOTE);

      await expect(registry.connect(v[3]).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "ConsensusAlreadyReached")
        .withArgs(CONTENT_HASH);
    });

    it("tambien revierte ConsensusAlreadyReached si el estado es DISPUTED", async () => {
      // 2 TRUE + 1 FALSE → DISPUTED (66.6% < 66.67%)
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, FALSE_VOTE);

      await expect(registry.connect(v[3]).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "ConsensusAlreadyReached")
        .withArgs(CONTENT_HASH);
    });

    it("permite votar hashes distintos de forma independiente", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH2, FALSE_VOTE))
        .to.emit(registry, "ValidationSubmitted");
    });

    it("hasValidated devuelve true tras votar", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      expect(await registry.hasValidated(CONTENT_HASH, v[0].address)).to.be.true;
      expect(await registry.hasValidated(CONTENT_HASH, v[1].address)).to.be.false;
    });
  });

  // ── PENDING ──────────────────────────────────────────────────────────────────

  describe("PENDING", () => {
    it("con menos votos que el quorum, el estado es PENDING", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);

      expect(await registry.consensusState(CONTENT_HASH)).to.equal(PENDING);
    });

    it("se puede seguir votando mientras el estado es PENDING", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await expect(registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.emit(registry, "ValidationSubmitted");
    });
  });

  // ── DEFINITIVE ───────────────────────────────────────────────────────────────

  describe("DEFINITIVE — supermayoria alcanzada", () => {
    it("3 TRUE de 3 (100%) → DEFINITIVE result=TRUE, todos reciben +REWARD", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(CONTENT_HASH, TRUE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(CONTENT_HASH, TRUE_VOTE, DEFINITIVE);

      expect(await registry.consensusState(CONTENT_HASH)).to.equal(DEFINITIVE);
      expect(await registry.consensusResult(CONTENT_HASH)).to.equal(TRUE_VOTE);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP + REWARD);
    });

    it("4 TRUE + 1 FALSE de 5 (80%) → DEFINITIVE result=TRUE; FALSE voter -PENALTY", async () => {
      // quorum=5 para que los 5 votos sean necesarios antes de evaluar
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY);

      await reg5.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[2]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[3]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[4]).submitValidation(CONTENT_HASH, FALSE_VOTE);

      expect(await reg5.consensusState(CONTENT_HASH)).to.equal(DEFINITIVE);
      expect(await reg5.consensusResult(CONTENT_HASH)).to.equal(TRUE_VOTE);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[3].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });

    it("4 TRUE + 1 UNVERIFIABLE de 5 → DEFINITIVE; UNVERIFIABLE voter recibe -PENALTY", async () => {
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY);

      await reg5.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[2]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[3]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg5.connect(v[4]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);

      expect(await reg5.consensusState(CONTENT_HASH)).to.equal(DEFINITIVE);
      expect(await reg5.consensusResult(CONTENT_HASH)).to.equal(TRUE_VOTE);

      // TRUE voters +5
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      // UNVERIFIABLE voter −3 (no alineado con resultado)
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });

    it("3 UNVERIFIABLE de 3 (100%) → DEFINITIVE result=UNVERIFIABLE, todos +REWARD", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(CONTENT_HASH, UNVERIFIABLE_VOTE, DEFINITIVE);

      expect(await registry.consensusState(CONTENT_HASH)).to.equal(DEFINITIVE);
      expect(await registry.consensusResult(CONTENT_HASH)).to.equal(UNVERIFIABLE_VOTE);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP + REWARD);
    });

    it("4 UNVERIFIABLE + 1 TRUE → DEFINITIVE result=UNVERIFIABLE; TRUE voter -PENALTY", async () => {
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY);

      await reg5.connect(v[0]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await reg5.connect(v[1]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await reg5.connect(v[2]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await reg5.connect(v[3]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);
      await reg5.connect(v[4]).submitValidation(CONTENT_HASH, TRUE_VOTE);

      expect(await reg5.consensusState(CONTENT_HASH)).to.equal(DEFINITIVE);
      expect(await reg5.consensusResult(CONTENT_HASH)).to.equal(UNVERIFIABLE_VOTE);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });

    it("emite ConsensusReached con result=FALSE y state=DEFINITIVE en supermayoria FALSE", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, FALSE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, FALSE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(CONTENT_HASH, FALSE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(CONTENT_HASH, FALSE_VOTE, DEFINITIVE);
    });
  });

  // ── DISPUTED ─────────────────────────────────────────────────────────────────

  describe("DISPUTED — quorum sin supermayoria", () => {
    it("2 TRUE + 1 FALSE de 3 (66.6% < 66.67%) → DISPUTED, sin cambio de reputacion", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(CONTENT_HASH, FALSE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(CONTENT_HASH, TRUE_VOTE, DISPUTED);

      expect(await registry.consensusState(CONTENT_HASH)).to.equal(DISPUTED);

      // Nadie pierde ni gana reputacion
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP);
    });

    it("2 TRUE + 2 FALSE de 4 (50%) → DISPUTED, sin cambio de reputacion", async () => {
      // quorum=4 para que el 4º voto sea el que evalúa
      const reg4 = await deployRegistry(reputation, 4n, SUPER_MAJORITY);

      await reg4.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg4.connect(v[1]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await reg4.connect(v[2]).submitValidation(CONTENT_HASH, FALSE_VOTE);
      await reg4.connect(v[3]).submitValidation(CONTENT_HASH, FALSE_VOTE);

      expect(await reg4.consensusState(CONTENT_HASH)).to.equal(DISPUTED);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP);
    });

    it("1 TRUE + 1 FALSE + 1 UNVERIFIABLE de 3 (33.3%) → DISPUTED", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, FALSE_VOTE);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);

      expect(await registry.consensusState(CONTENT_HASH)).to.equal(DISPUTED);

      // Sin efectos reputacionales
      for (let i = 0; i < 3; i++) {
        expect(await reputation.getReputation(v[i].address)).to.equal(INIT_REP);
      }
    });
  });

  // ── getValidations ───────────────────────────────────────────────────────────

  describe("getValidations", () => {
    it("devuelve todas las validaciones con los datos correctos", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, FALSE_VOTE);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, UNVERIFIABLE_VOTE);

      const vals = await registry.getValidations(CONTENT_HASH);
      expect(vals).to.have.lengthOf(3);
      expect(vals[0].validator).to.equal(v[0].address);
      expect(vals[0].vote).to.equal(TRUE_VOTE);
      expect(vals[1].validator).to.equal(v[1].address);
      expect(vals[1].vote).to.equal(FALSE_VOTE);
      expect(vals[2].validator).to.equal(v[2].address);
      expect(vals[2].vote).to.equal(UNVERIFIABLE_VOTE);
    });

    it("devuelve array vacio para un hash sin validaciones", async () => {
      expect(await registry.getValidations(CONTENT_HASH)).to.have.lengthOf(0);
    });
  });
});
