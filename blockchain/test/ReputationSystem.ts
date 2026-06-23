import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ReputationSystem } from "../typechain-types";

describe("ReputationSystem", () => {
  let reputation: ReputationSystem;
  let admin:      HardhatEthersSigner;
  let validator:  HardhatEthersSigner;
  let other:      HardhatEthersSigner;
  let roleHolder: HardhatEthersSigner; // cuenta con VALIDATOR_ROLE concedido manualmente

  beforeEach(async () => {
    [admin, validator, other, roleHolder] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ReputationSystem");
    reputation = await Factory.deploy();
    await reputation.waitForDeployment();
  });

  // ── registerValidator ────────────────────────────────────────────────────────

  describe("registerValidator", () => {
    it("registra un validador con reputacion inicial correcta", async () => {
      await reputation.registerValidator(validator.address, 10n);
      expect(await reputation.getReputation(validator.address)).to.equal(10n);
      expect(await reputation.isRegisteredValidator(validator.address)).to.be.true;
    });

    it("emite ReputationUpdated al registrar", async () => {
      await expect(reputation.registerValidator(validator.address, 15n))
        .to.emit(reputation, "ReputationUpdated")
        .withArgs(validator.address, 15n, true);
    });

    it("revierte ValidatorAlreadyRegistered si se registra dos veces", async () => {
      await reputation.registerValidator(validator.address, 10n);
      await expect(reputation.registerValidator(validator.address, 5n))
        .to.be.revertedWithCustomError(reputation, "ValidatorAlreadyRegistered")
        .withArgs(validator.address);
    });

    it("revierte si lo llama alguien sin DEFAULT_ADMIN_ROLE", async () => {
      await expect(
        reputation.connect(other).registerValidator(validator.address, 10n)
      ).to.be.reverted;
    });
  });

  // ── increaseReputation ───────────────────────────────────────────────────────

  describe("increaseReputation", () => {
    let VALIDATOR_ROLE: string;

    beforeEach(async () => {
      VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
      await reputation.grantRole(VALIDATOR_ROLE, roleHolder.address);
      await reputation.registerValidator(validator.address, 10n);
    });

    it("incrementa la reputacion correctamente", async () => {
      await reputation.connect(roleHolder).increaseReputation(validator.address, 5n);
      expect(await reputation.getReputation(validator.address)).to.equal(15n);
    });

    it("emite ReputationUpdated con increased=true", async () => {
      await expect(
        reputation.connect(roleHolder).increaseReputation(validator.address, 5n)
      )
        .to.emit(reputation, "ReputationUpdated")
        .withArgs(validator.address, 15n, true);
    });

    it("revierte si lo llama alguien sin VALIDATOR_ROLE", async () => {
      await expect(
        reputation.connect(other).increaseReputation(validator.address, 5n)
      ).to.be.reverted;
    });
  });

  // ── decreaseReputation ───────────────────────────────────────────────────────

  describe("decreaseReputation", () => {
    let VALIDATOR_ROLE: string;

    beforeEach(async () => {
      VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
      await reputation.grantRole(VALIDATOR_ROLE, roleHolder.address);
      await reputation.registerValidator(validator.address, 10n);
    });

    it("decrementa la reputacion correctamente", async () => {
      await reputation.connect(roleHolder).decreaseReputation(validator.address, 3n);
      expect(await reputation.getReputation(validator.address)).to.equal(7n);
    });

    it("emite ReputationUpdated con increased=false", async () => {
      await expect(
        reputation.connect(roleHolder).decreaseReputation(validator.address, 3n)
      )
        .to.emit(reputation, "ReputationUpdated")
        .withArgs(validator.address, 7n, false);
    });

    it("el suelo es 0: la penalizacion no produce valores negativos", async () => {
      // Reputacion = 10, penalizacion = 15 → debe quedar en 0
      await reputation.connect(roleHolder).decreaseReputation(validator.address, 15n);
      expect(await reputation.getReputation(validator.address)).to.equal(0n);
    });

    it("suelo exacto: penalizacion igual a la reputacion da 0", async () => {
      await reputation.connect(roleHolder).decreaseReputation(validator.address, 10n);
      expect(await reputation.getReputation(validator.address)).to.equal(0n);
    });

    it("revierte si lo llama alguien sin VALIDATOR_ROLE", async () => {
      await expect(
        reputation.connect(other).decreaseReputation(validator.address, 3n)
      ).to.be.reverted;
    });
  });

  // ── canValidate ──────────────────────────────────────────────────────────────

  describe("canValidate", () => {
    it("devuelve true si la reputacion es igual al minimo (10)", async () => {
      await reputation.registerValidator(validator.address, 10n);
      expect(await reputation.canValidate(validator.address)).to.be.true;
    });

    it("devuelve true si la reputacion supera el minimo", async () => {
      await reputation.registerValidator(validator.address, 50n);
      expect(await reputation.canValidate(validator.address)).to.be.true;
    });

    it("devuelve false si la reputacion es menor al minimo", async () => {
      await reputation.registerValidator(validator.address, 9n);
      expect(await reputation.canValidate(validator.address)).to.be.false;
    });

    it("devuelve false para una direccion sin registrar (reputacion 0)", async () => {
      expect(await reputation.canValidate(other.address)).to.be.false;
    });
  });

  // ── getReputation / isRegisteredValidator ────────────────────────────────────

  describe("consultas publicas", () => {
    it("getReputation devuelve 0 para una direccion sin registrar", async () => {
      expect(await reputation.getReputation(other.address)).to.equal(0n);
    });

    it("isRegisteredValidator devuelve false para una direccion sin registrar", async () => {
      expect(await reputation.isRegisteredValidator(other.address)).to.be.false;
    });

    it("isRegisteredValidator devuelve true tras registrar", async () => {
      await reputation.registerValidator(validator.address, 0n);
      expect(await reputation.isRegisteredValidator(validator.address)).to.be.true;
    });
  });

  // ── Resistencia Sybil ────────────────────────────────────────────────────────

  describe("resistencia Sybil", () => {
    it("una direccion nueva no puede validar (reputacion 0 < minimo 10)", async () => {
      expect(await reputation.canValidate(other.address)).to.be.false;
    });

    it("un validador penalizado por debajo del umbral pierde el derecho a validar", async () => {
      const VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
      await reputation.grantRole(VALIDATOR_ROLE, roleHolder.address);
      await reputation.registerValidator(validator.address, 10n);

      // Penalizacion que baja la rep a 9 (debajo de MIN_REPUTATION_TO_VALIDATE)
      await reputation.connect(roleHolder).decreaseReputation(validator.address, 2n);
      expect(await reputation.canValidate(validator.address)).to.be.false;
    });

    it("whitewashing: abandonar direccion y usar una nueva no otorga reputacion", async () => {
      // El atacante registra una nueva cuenta "limpia" — sigue en 0
      expect(await reputation.getReputation(other.address)).to.equal(0n);
      expect(await reputation.canValidate(other.address)).to.be.false;
    });
  });
});
