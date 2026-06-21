/**
 * Script de verificación manual de PublicationRegistry en red local.
 * Uso: npx hardhat run scripts/verify.ts --network localhost
 */
import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("NewsEra — Verificación de PublicationRegistry");
  console.log("=".repeat(60));
  console.log("Red        :", network.name, `(chainId ${network.chainId})`);
  console.log("Cuenta     :", deployer.address);

  // ── 1. Despliegue ────────────────────────────────────────────
  console.log("\n[1/4] Desplegando PublicationRegistry...");
  const Factory = await ethers.getContractFactory("PublicationRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  console.log("      Dirección:", await registry.getAddress());

  // ── 2. Registrar una publicación ─────────────────────────────
  const cuerpo = "NewsEra: primer artículo de prueba en red local";
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(cuerpo));

  console.log("\n[2/4] registerPublication()");
  console.log("      contentHash:", contentHash);

  const tx = await registry.registerPublication(contentHash);
  const receipt = await tx.wait();
  console.log("      tx         :", tx.hash);
  console.log("      bloque     :", receipt?.blockNumber);

  // ── 3. Consultar la publicación ───────────────────────────────
  console.log("\n[3/4] getPublication()");
  const pub = await registry.getPublication(contentHash);
  const fecha = new Date(Number(pub.timestamp) * 1000).toISOString();
  console.log("      author    :", pub.author);
  console.log("      timestamp :", fecha);
  console.log("      exists    :", pub.exists);

  const autorOk = pub.author.toLowerCase() === deployer.address.toLowerCase();
  console.log("      author == deployer:", autorOk ? "✅" : "❌");

  // ── 4. Verificar los dos reverts ──────────────────────────────
  console.log("\n[4/4] Comprobando reverts...");

  // 4a. Hash duplicado → PublicationAlreadyExists
  try {
    await registry.registerPublication(contentHash);
    console.log("      Duplicado: ❌ No revirtió");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const ok = msg.includes("PublicationAlreadyExists");
    console.log(`      Duplicado: ${ok ? "✅" : "❌"} PublicationAlreadyExists`);
  }

  // 4b. Hash inexistente → PublicationNotFound
  const hashFalso = ethers.keccak256(ethers.toUtf8Bytes("no existe"));
  try {
    await registry.getPublication(hashFalso);
    console.log("      NotFound : ❌ No revirtió");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const ok = msg.includes("PublicationNotFound");
    console.log(`      NotFound : ${ok ? "✅" : "❌"} PublicationNotFound`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verificación completada.");
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
