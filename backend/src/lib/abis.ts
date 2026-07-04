import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abisDir = join(__dirname, "../../../docs/abis");

function loadAbi(name: string) {
  return JSON.parse(readFileSync(join(abisDir, `${name}.json`), "utf-8"));
}

export const publicationRegistryAbi = loadAbi("PublicationRegistry");
export const validationRegistryAbi = loadAbi("ValidationRegistry");
export const reputationSystemAbi = loadAbi("ReputationSystem");
