import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PublicationRegistryModule = buildModule("PublicationRegistryModule", (m) => {
  const registry = m.contract("PublicationRegistry");
  return { registry };
});

export default PublicationRegistryModule;
