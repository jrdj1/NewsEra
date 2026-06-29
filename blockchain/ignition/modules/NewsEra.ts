import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const QUORUM_THRESHOLD   = 3n;
const SUPER_MAJORITY_BPS = 6667n; // 66.67 %
const REOPEN_THRESHOLD   = 3n;

const NewsEraModule = buildModule("NewsEraModule", (m) => {
  // 1. PublicationRegistry — inmutable, sin dependencias
  const publicationRegistry = m.contract("PublicationRegistry");

  // 2. ReputationSystem — AccessControl, sin dependencias
  const reputationSystem = m.contract("ReputationSystem");

  // 3. ValidationRegistry — depende de ReputationSystem para canValidate / rep changes
  const validationRegistry = m.contract("ValidationRegistry", [
    reputationSystem,
    QUORUM_THRESHOLD,
    SUPER_MAJORITY_BPS,
    REOPEN_THRESHOLD,
  ]);

  // 4. Conceder VALIDATOR_ROLE a ValidationRegistry en ReputationSystem
  const validatorRole = m.staticCall(reputationSystem, "VALIDATOR_ROLE", [], 0, {
    id: "GetValidatorRole",
  });
  m.call(reputationSystem, "grantRole", [validatorRole, validationRegistry], {
    id: "GrantValidatorRole",
  });

  return { publicationRegistry, reputationSystem, validationRegistry };
});

export default NewsEraModule;
