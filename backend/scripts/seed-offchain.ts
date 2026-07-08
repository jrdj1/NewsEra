/**
 * Seed de datos off-chain sin equivalente on-chain: contenido real de las
 * publicaciones, perfiles enriquecidos (UserProfile), favoritos (Favorite),
 * follows (Follow) y notificaciones (Notification).
 *
 * Requiere que, antes de ejecutarse:
 * 1. `blockchain/scripts/seed.ts` haya registrado las publicaciones de
 *    `docs/seed/articles.json` on-chain y generado sus votos/reaperturas/
 *    reclamaciones/predicciones.
 * 2. El indexador del backend (`src/services/indexer.ts`) ya haya procesado
 *    ese historial, de modo que las filas de `publications` (con sus
 *    `contentHash` reales) existan en Postgres.
 *
 * Este script NO crea publicaciones, rondas, validaciones, validadores,
 * reaperturas ni reclamaciones retroactivas — todo eso lo puebla el
 * indexador a partir de transacciones on-chain reales. Aquí solo se añade
 * lo que el indexador nunca podría generar por sí mismo.
 *
 * Ejecución: `tsx scripts/seed-offchain.ts` (o `npm run seed:offchain`)
 * desde `backend/`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { keccak256, toBytes } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { prisma } from "../src/lib/prisma.js";
import { profileRepository } from "../src/repositories/profile.repository.js";
import { publicationRepository } from "../src/repositories/publication.repository.js";
import { favoriteRepository } from "../src/repositories/favorite.repository.js";
import { followRepository } from "../src/repositories/follow.repository.js";
import { notificationRepository } from "../src/repositories/notification.repository.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mismo mnemonic estándar de Hardhat usado por `blockchain/scripts/seed.ts`
// y por `docs/seed/articles.json` (accounts.note) para derivar las 20
// direcciones por defecto.
const HARDHAT_MNEMONIC = "test test test test test test test test test test test junk";

function accountAddress(index: number): `0x${string}` {
  return mnemonicToAccount(HARDHAT_MNEMONIC, { addressIndex: index }).address;
}

type SeedArticle = {
  id: string;
  scenario: string;
  authorIndex: number;
  title: string;
  body: string;
  tags: string[];
};

type SeedProfile = {
  signerIndex: number;
  displayName: string;
  gender: "male" | "female";
  avatarImg: number;
  email?: string;
};

type SeedFile = {
  accounts: {
    admin: number;
    authorPool: number[];
    validators: number[];
    predictors: number[];
  };
  profiles: SeedProfile[];
  articles: SeedArticle[];
};

function loadSeedFile(): SeedFile {
  const path = join(__dirname, "../../docs/seed/articles.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

function contentHashOf(article: SeedArticle): `0x${string}` {
  return keccak256(toBytes(article.body));
}

async function main() {
  const seed = loadSeedFile();
  const articlesById = new Map(seed.articles.map((a) => [a.id, a]));
  const hashOf = (id: string): `0x${string}` => contentHashOf(articlesById.get(id)!);

  const validators = seed.accounts.validators.map(accountAddress);
  const [val0, val1, val2, val3, val4, val5] = validators;

  // 0. Título/cuerpo/tags reales — el indexador ya creó una fila por cada
  // contentHash (evento PublicationRegistered), pero solo con contentHash y
  // autor; el contenido normalmente lo rellena el propio frontend vía
  // POST /api/v1/publications justo después de publicar, paso que el script
  // on-chain no hace. No se puede usar ese endpoint aquí (rechazaría con 409
  // CONFLICT una fila que el indexador ya creó), así que se rellena
  // directamente sobre la fila existente.
  for (const article of seed.articles) {
    await publicationRepository.setContent(hashOf(article.id), {
      title: article.title,
      body: article.body,
      tags: article.tags,
    });
  }
  console.log(`Contenido real (título/cuerpo/tags) aplicado a ${seed.articles.length} publicaciones.`);

  // 1. Perfiles enriquecidos — uno por cada autor/validador/predictor del
  // dataset, con nombre o nickname y avatar creíbles (no fotos ni personas
  // reales). El avatar coincide con el género del perfil (randomuser.me
  // separa sus retratos estáticos en /portraits/men/ y /portraits/women/)
  // para reforzar el realismo del nombre mostrado.
  for (const profile of seed.profiles) {
    const address = accountAddress(profile.signerIndex);
    const genderPath = profile.gender === "male" ? "men" : "women";
    await profileRepository.upsert(address, {
      displayName: profile.displayName,
      avatarUrl: `https://randomuser.me/api/portraits/${genderPath}/${profile.avatarImg}.jpg`,
      ...(profile.email ? { email: profile.email } : {}),
    });
  }
  console.log(`Perfiles enriquecidos creados/actualizados: ${seed.profiles.length}`);

  // 2. Favoritos — varias combinaciones (validador, artículo DEFINITIVE),
  // sin repetir.
  const favoriteArticleIds = ["p3", "p5", "p7", "p11", "p13", "p15", "p18", "p19"];
  const favoriteUsers = [val0, val1, val2, val0, val1, val2, val0, val1];
  let favoritesCreated = 0;
  for (let i = 0; i < favoriteArticleIds.length; i++) {
    const user = favoriteUsers[i];
    const contentHash = hashOf(favoriteArticleIds[i]);
    if (await favoriteRepository.exists(user, contentHash)) continue;
    await favoriteRepository.add(user, contentHash);
    favoritesCreated++;
  }
  console.log(`Favoritos creados: ${favoritesCreated}`);

  // 3. Follows — combinaciones DISTINTAS a las de favoritos, para demostrar
  // que seguir no implica guardar como favorito ni viceversa.
  const followArticleIds = ["p1", "p2", "p6", "p9", "p10", "p12", "p17", "p20"];
  const followUsers = [val1, val2, val3, val4, val5, val3, val4, val5];
  let followsCreated = 0;
  for (let i = 0; i < followArticleIds.length; i++) {
    const user = followUsers[i];
    const contentHash = hashOf(followArticleIds[i]);
    if (await followRepository.exists(user, contentHash)) continue;
    await followRepository.add(user, contentHash);
    followsCreated++;
  }
  console.log(`Follows creados: ${followsCreated}`);

  // 4. Notificaciones — cubriendo los 3 tipos posibles. CONSENSUS_REACHED
  // sobre varios artículos ya DEFINITIVE/DISPUTED; REOPENED y
  // RETROACTIVE_APPLIED solo tienen sentido para p7 (el único artículo
  // reabierto del dataset).
  const consensusNotifyTargets: Array<[string, `0x${string}`[]]> = [
    ["p3", [val0, val1]],
    ["p4", [val2]],
    ["p5", [val3]],
    ["p6", [val1, val2]],
    ["p11", [val0]],
    ["p15", [val4]],
    ["p18", [val5]],
    ["p19", [val0, val3]],
  ];
  for (const [articleId, users] of consensusNotifyTargets) {
    await notificationRepository.createMany(users, hashOf(articleId), "CONSENSUS_REACHED");
  }
  await notificationRepository.createMany([val3, val4, val5], hashOf("p7"), "REOPENED");
  await notificationRepository.createMany([val0], hashOf("p7"), "RETROACTIVE_APPLIED");
  console.log("Notificaciones creadas (o ya existentes, deduplicadas por el repositorio).");

  // Marcar varias notificaciones ya existentes como leídas.
  const toMarkRead = await prisma.notification.findMany({
    where: {
      OR: [
        { userAddress: val0, contentHash: hashOf("p3"), type: "CONSENSUS_REACHED" },
        { userAddress: val3, contentHash: hashOf("p7"), type: "REOPENED" },
        { userAddress: val1, contentHash: hashOf("p6"), type: "CONSENSUS_REACHED" },
        { userAddress: val0, contentHash: hashOf("p19"), type: "CONSENSUS_REACHED" },
      ],
    },
  });
  for (const n of toMarkRead) {
    await notificationRepository.markRead(n.id);
  }
  console.log(`Notificaciones marcadas como leídas: ${toMarkRead.length}`);

  console.log("Seed off-chain completado.");
}

main()
  .catch((err) => {
    console.error("Error en seed-offchain:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
