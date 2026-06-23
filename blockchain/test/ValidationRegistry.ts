import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ReputationSystem, ValidationRegistry } from "../typechain-types";

const CONTENT_HASH  = ethers.keccak256(ethers.toUtf8Bytes("articulo de prueba sprint-3"));
const CONTENT_HASH2 = ethers.keccak256(ethers.toUtf8Bytes("otro articulo"));
const QUORUM        = 3n;
const INIT_REP      = 10n;

describe("ValidationRegistry", () => {
  let reputation: ReputationSystem;
  let registry:   ValidationRegistry;
  let admin:      HardhatEthersSigner;
  let v:          HardhatEthersSigner[]; // validadores [0..4]

  beforeEach(async () => {
    [admin, ...v] = await ethers.getSigners();

    // Desplegar ReputationSystem
    const RepFactory = await ethers.getContractFactory("ReputationSystem");
    reputation = await RepFactory.deploy();
    await reputation.waitForDeployment();

    // Desplegar ValidationRegistry
    const ValFactory = await ethers.getContractFactory("ValidationRegistry");
    registry = await ValFactory.deploy(await reputation.getAddress(), QUORUM);
    await registry.waitForDeployment();

    // Conceder VALIDATOR_ROLE al ValidationRegistry
    const VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
    await reputation.grantRole(VALIDATOR_ROLE, await registry.getAddress());

    // Registrar 5 validadores con reputación inicial 10
    for (let i = 0; i < 5; i++) {
      await reputation.registerValidator(v[i].address, INIT_REP);
    }
  });

  // ── submitValidation ────────────────────────────────────────────────────────

  describe("submitValidation", () => {
    it("registra el voto y emite ValidationSubmitted", async () => {
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH, 0))
        .to.emit(registry, "ValidationSubmitted")
        .withArgs(CONTENT_HASH, v[0].address, 0);
    });

    it("revierte AlreadyValidated si el mismo validador vota dos veces", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0);
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH, 1))
        .to.be.revertedWithCustomError(registry, "AlreadyValidated")
        .withArgs(CONTENT_HASH, v[0].address);
    });

    it("revierte InsufficientReputation si la reputacion es menor al minimo", async () => {
      // admin no esta registrado → reputacion 0
      await expect(registry.connect(admin).submitValidation(CONTENT_HASH, 0))
        .to.be.revertedWithCustomError(registry, "InsufficientReputation")
        .withArgs(admin.address);
    });

    it("revierte ConsensusAlreadyReached si el consenso ya esta cerrado", async () => {
      // 2 TRUE + 1 FALSE = consenso TRUE (quorum=3)
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 1);

      await expect(registry.connect(v[3]).submitValidation(CONTENT_HASH, 0))
        .to.be.revertedWithCustomError(registry, "ConsensusAlreadyReached")
        .withArgs(CONTENT_HASH);
    });

    it("permite votar hashes distintos de forma independiente", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0);
      await expect(registry.connect(v[0]).submitValidation(CONTENT_HASH2, 1))
        .to.emit(registry, "ValidationSubmitted");
    });
  });

  // ── Consenso ────────────────────────────────────────────────────────────────

  describe("consenso", () => {
    it("alcanza consenso TRUE con mayoria y emite ConsensusReached", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0); // TRUE
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0); // TRUE
      await expect(registry.connect(v[2]).submitValidation(CONTENT_HASH, 1)) // FALSE
        .to.emit(registry, "ConsensusReached")
        .withArgs(CONTENT_HASH, 0); // 0 = TRUE

      expect(await registry.consensusReached(CONTENT_HASH)).to.be.true;
      expect(await registry.consensusResult(CONTENT_HASH)).to.equal(0n);
    });

    it("alcanza consenso FALSE con mayoria", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 1); // FALSE
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 1); // FALSE
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 0); // TRUE

      expect(await registry.consensusReached(CONTENT_HASH)).to.be.true;
      expect(await registry.consensusResult(CONTENT_HASH)).to.equal(1n); // FALSE
    });

    it("empate TRUE vs FALSE: no alcanza consenso aunque haya quorum", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0); // TRUE
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 1); // FALSE
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 2); // UNVERIFIABLE

      // 3 votos >= quorum, pero 1T == 1F → sin consenso
      expect(await registry.consensusReached(CONTENT_HASH)).to.be.false;
    });

    it("todos UNVERIFIABLE: no alcanza consenso", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 2);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 2);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 2);

      expect(await registry.consensusReached(CONTENT_HASH)).to.be.false;
    });

    it("el consenso no se alcanza con menos votos que el quorum", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0);

      expect(await registry.consensusReached(CONTENT_HASH)).to.be.false;
    });
  });

  // ── Reputación tras consenso ─────────────────────────────────────────────────

  describe("reputacion tras consenso", () => {
    it("incrementa reputacion de acertantes y penaliza a errantes", async () => {
      // 2 TRUE, 1 FALSE → consenso TRUE
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0); // TRUE ✓
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0); // TRUE ✓
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 1); // FALSE ✗

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + 5n);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP + 5n);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP - 3n);
    });

    it("UNVERIFIABLE no recibe recompensa ni penalizacion", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0); // TRUE ✓
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0); // TRUE ✓
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 2); // UNVERIFIABLE

      // v[2] mantiene su reputacion intacta
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP);
    });

    it("los valores de reputacion son exactamente +5 y -3 tras el consenso", async () => {
      // 2 TRUE (v[0], v[1]) + 1 FALSE (v[2]) → consenso TRUE
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0);
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 0);
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 1);

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + 5n); // 15
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP + 5n); // 15
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP - 3n); // 7
    });
  });

  // ── getValidations ───────────────────────────────────────────────────────────

  describe("getValidations", () => {
    it("devuelve todas las validaciones de un contentHash", async () => {
      await registry.connect(v[0]).submitValidation(CONTENT_HASH, 0); // TRUE
      await registry.connect(v[1]).submitValidation(CONTENT_HASH, 1); // FALSE
      await registry.connect(v[2]).submitValidation(CONTENT_HASH, 2); // UNVERIFIABLE

      const vals = await registry.getValidations(CONTENT_HASH);
      expect(vals).to.have.lengthOf(3);
      expect(vals[0].validator).to.equal(v[0].address);
      expect(vals[0].vote).to.equal(0n); // TRUE
      expect(vals[1].validator).to.equal(v[1].address);
      expect(vals[1].vote).to.equal(1n); // FALSE
      expect(vals[2].validator).to.equal(v[2].address);
      expect(vals[2].vote).to.equal(2n); // UNVERIFIABLE
    });

    it("devuelve array vacio para un hash sin validaciones", async () => {
      const vals = await registry.getValidations(CONTENT_HASH);
      expect(vals).to.have.lengthOf(0);
    });
  });
});
