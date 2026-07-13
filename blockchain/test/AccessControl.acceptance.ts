import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ReputationSystem } from "../typechain-types";

// Fase 4 (aceptación) — RNF 6: "El control de acceso a funciones sensibles se
// implementa mediante AccessControl (roles), nunca mediante comprobaciones
// ad-hoc." (docs/ERS.md §2, Seguridad).
//
// ReputationSystem.ts (Fase 1) ya prueba de forma genérica que
// increaseReputation/decreaseReputation revierten para una cuenta sin
// VALIDATOR_ROLE (`.to.be.reverted`, sin más). Este archivo es la
// verificación explícita pedida en docs/test/aceptacion/informe.md: no solo
// que revierte, sino que revierte específicamente con el error propio de
// AccessControl (AccessControlUnauthorizedAccount) y con el rol esperado
// codificado en el mensaje de revert — evidencia de que el control de acceso
// es el de OpenZeppelin AccessControl y no una comprobación ad-hoc que por
// casualidad también revierte.
describe("RNF 6 — control de acceso via AccessControl (ReputationSystem)", () => {
  let reputation: ReputationSystem;
  let admin: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;
  let validator: HardhatEthersSigner;
  let VALIDATOR_ROLE: string;

  beforeEach(async () => {
    [admin, attacker, validator] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ReputationSystem");
    reputation = await Factory.deploy();
    await reputation.waitForDeployment();

    VALIDATOR_ROLE = await reputation.VALIDATOR_ROLE();
    await reputation.registerValidator(validator.address, 10n);
  });

  it("una direccion sin VALIDATOR_ROLE no puede llamar a increaseReputation (revierte con AccessControlUnauthorizedAccount)", async () => {
    expect(await reputation.hasRole(VALIDATOR_ROLE, attacker.address)).to.be.false;

    await expect(
      reputation.connect(attacker).increaseReputation(validator.address, 5n)
    )
      .to.be.revertedWithCustomError(reputation, "AccessControlUnauthorizedAccount")
      .withArgs(attacker.address, VALIDATOR_ROLE);

    // La reputacion no debe haberse modificado: el revert es atomico.
    expect(await reputation.getReputation(validator.address)).to.equal(10n);
  });

  it("una direccion sin VALIDATOR_ROLE no puede llamar a decreaseReputation (revierte con AccessControlUnauthorizedAccount)", async () => {
    expect(await reputation.hasRole(VALIDATOR_ROLE, attacker.address)).to.be.false;

    await expect(
      reputation.connect(attacker).decreaseReputation(validator.address, 3n)
    )
      .to.be.revertedWithCustomError(reputation, "AccessControlUnauthorizedAccount")
      .withArgs(attacker.address, VALIDATOR_ROLE);

    expect(await reputation.getReputation(validator.address)).to.equal(10n);
  });

  it("tras concederle VALIDATOR_ROLE, la misma direccion si puede llamar a increaseReputation/decreaseReputation", async () => {
    // Control positivo: confirma que el mecanismo es realmente basado en el
    // rol (AccessControl.grantRole), no un bloqueo permanente por otra via.
    await reputation.connect(admin).grantRole(VALIDATOR_ROLE, attacker.address);

    await expect(
      reputation.connect(attacker).increaseReputation(validator.address, 5n)
    ).to.not.be.reverted;
    expect(await reputation.getReputation(validator.address)).to.equal(15n);

    await expect(
      reputation.connect(attacker).decreaseReputation(validator.address, 2n)
    ).to.not.be.reverted;
    expect(await reputation.getReputation(validator.address)).to.equal(13n);
  });

  it("una direccion sin DEFAULT_ADMIN_ROLE no puede conceder VALIDATOR_ROLE a si misma", async () => {
    const DEFAULT_ADMIN_ROLE = await reputation.DEFAULT_ADMIN_ROLE();
    expect(await reputation.hasRole(DEFAULT_ADMIN_ROLE, attacker.address)).to.be.false;

    await expect(
      reputation.connect(attacker).grantRole(VALIDATOR_ROLE, attacker.address)
    )
      .to.be.revertedWithCustomError(reputation, "AccessControlUnauthorizedAccount")
      .withArgs(attacker.address, DEFAULT_ADMIN_ROLE);
  });
});
