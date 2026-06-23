import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const QUORUM_THRESHOLD = 3n;

const ValidationRegistryModule = buildModule("ValidationRegistryModule", (m) => {
  // 1. Desplegar ReputationSystem
  const reputationSystem = m.contract("ReputationSystem");

  // 2. Desplegar ValidationRegistry apuntando al ReputationSystem
  const validationRegistry = m.contract("ValidationRegistry", [
    reputationSystem,
    QUORUM_THRESHOLD,
  ]);

  // 3. Conceder VALIDATOR_ROLE al ValidationRegistry en el ReputationSystem
  const validatorRole = m.staticCall(reputationSystem, "VALIDATOR_ROLE", [], 0, {
    id: "GetValidatorRole",
  });
  m.call(reputationSystem, "grantRole", [validatorRole, validationRegistry], {
    id: "GrantValidatorRole",
  });

  return { reputationSystem, validationRegistry };
});

export default ValidationRegistryModule;
