// Actualiza el .env de la raíz con las direcciones REALES del último
// despliegue de Ignition. El backend en Docker solo lee estas variables al
// crear el contenedor — un `docker restart` no las refresca — y el nonce del
// deployer no siempre parte de 0 en cada redeploy, así que las direcciones
// no son fijas: hace falta reescribirlas aquí tras cada `make fresh-start`.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const deployedPath = path.join(root, "blockchain/ignition/deployments/chain-31337/deployed_addresses.json");
const envPath = path.join(root, ".env");

const addrs = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
const map = {
  PUBLICATION_REGISTRY_ADDRESS: addrs["NewsEraModule#PublicationRegistry"],
  VALIDATION_REGISTRY_ADDRESS: addrs["NewsEraModule#ValidationRegistry"],
  REPUTATION_SYSTEM_ADDRESS: addrs["NewsEraModule#ReputationSystem"],
};

let env = fs.readFileSync(envPath, "utf-8");
for (const [key, value] of Object.entries(map)) {
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env) ? env.replace(re, `${key}=${value}`) : `${env}\n${key}=${value}`;
}
fs.writeFileSync(envPath, env);

console.log("  .env actualizado:", map);
