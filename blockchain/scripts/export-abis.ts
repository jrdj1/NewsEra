import fs   from "fs";
import path  from "path";

const CONTRACTS = [
  "PublicationRegistry",
  "ValidationRegistry",
  "ReputationSystem",
] as const;

const ARTIFACTS_BASE = path.resolve(__dirname, "../artifacts/contracts");
const OUT_DIR        = path.resolve(__dirname, "../../docs/abis");

function artifactPath(name: string): string {
  if (name === "ValidationRegistry") {
    return path.join(ARTIFACTS_BASE, `ValidationRegistry.sol/${name}.json`);
  }
  return path.join(ARTIFACTS_BASE, `${name}.sol/${name}.json`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const name of CONTRACTS) {
  const src = artifactPath(name);
  if (!fs.existsSync(src)) {
    console.error(`Error: artefacto no encontrado: ${src}`);
    console.error("Ejecuta 'npx hardhat compile' antes de exportar ABIs.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(src, "utf8")) as { abi: unknown[] };
  const dest     = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(dest, JSON.stringify(artifact.abi, null, 2));
  console.log(`✓ ${name} → docs/abis/${name}.json (${artifact.abi.length} entradas)`);
}

console.log(`\nABIs exportados a ${OUT_DIR}`);
