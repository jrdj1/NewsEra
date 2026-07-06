/**
 * Seed de datos off-chain sin equivalente on-chain: perfiles enriquecidos
 * (UserProfile), favoritos (Favorite), follows (Follow) y notificaciones
 * (Notification).
 *
 * Requiere que, antes de ejecutarse:
 * 1. `blockchain/scripts/seed.ts` haya registrado las 7 publicaciones de
 *    `docs/seed/articles.json` on-chain (p1..p7) y generado sus
 *    votos/reaperturas/reclamaciones/predicciones.
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
  title: string;
  body: string;
  tags: string[];
};

type SeedFile = {
  accounts: {
    admin: number;
    authors: Record<string, number>;
    validators: number[];
    predictors: number[];
  };
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

  // Direcciones reales derivadas del mnemonic de Hardhat.
  const author = (id: string) => accountAddress(seed.accounts.authors[id]);
  const validator = (i: number) => accountAddress(seed.accounts.validators[i]);

  const p3Author = author("p3"); // DEFINITIVE / TRUE
  const p4Author = author("p4"); // DEFINITIVE / FALSE
  const p7Author = author("p7"); // reabierto: ronda 0 DISPUTED -> ronda 1 DEFINITIVE / FALSE
  const val0 = validator(0);
  const val1 = validator(1);
  const val2 = validator(2);
  const val3 = validator(3);
  const val4 = validator(4);

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

  // 1. Perfiles enriquecidos — 5 direcciones distintas, mezcla autores y validadores.
  const profiles: Array<{ address: `0x${string}`; displayName: string; avatarUrl: string; email?: string }> = [
    { address: p3Author, displayName: "Marta Sánchez Ibáñez", avatarUrl: `https://i.pravatar.cc/150?u=${p3Author}`, email: "marta.sanchez@example.com" },
    { address: p4Author, displayName: "Alejandro Ruiz Molina", avatarUrl: `https://i.pravatar.cc/150?u=${p4Author}` },
    { address: p7Author, displayName: "Lucía Fernández Prieto", avatarUrl: `https://i.pravatar.cc/150?u=${p7Author}`, email: "lucia.fernandez@example.com" },
    { address: val0, displayName: "Javier Moreno Castillo", avatarUrl: `https://i.pravatar.cc/150?u=${val0}` },
    { address: val1, displayName: "Carmen Torres Delgado", avatarUrl: `https://i.pravatar.cc/150?u=${val1}`, email: "carmen.torres@example.com" },
  ];

  for (const p of profiles) {
    await profileRepository.upsert(p.address, {
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      ...(p.email ? { email: p.email } : {}),
    });
  }
  console.log(`Perfiles enriquecidos creados/actualizados: ${profiles.length}`);

  // 2. Favoritos — 4 combinaciones (validador, contentHash), sin repetir.
  const favorites: Array<{ user: `0x${string}`; articleId: string }> = [
    { user: val0, articleId: "p3" },
    { user: val0, articleId: "p5" },
    { user: val1, articleId: "p4" },
    { user: val2, articleId: "p7" },
  ];

  let favoritesCreated = 0;
  for (const f of favorites) {
    const contentHash = hashOf(f.articleId);
    const already = await favoriteRepository.exists(f.user, contentHash);
    if (already) continue;
    await favoriteRepository.add(f.user, contentHash);
    favoritesCreated++;
  }
  console.log(`Favoritos creados: ${favoritesCreated}`);

  // 3. Follows — combinaciones DISTINTAS a las de favoritos, para demostrar
  // que seguir no implica guardar como favorito ni viceversa.
  const follows: Array<{ user: `0x${string}`; articleId: string }> = [
    { user: val1, articleId: "p1" },
    { user: val2, articleId: "p2" },
    { user: val3, articleId: "p6" },
    { user: val4, articleId: "p7" },
  ];

  let followsCreated = 0;
  for (const f of follows) {
    const contentHash = hashOf(f.articleId);
    const already = await followRepository.exists(f.user, contentHash);
    if (already) continue;
    await followRepository.add(f.user, contentHash);
    followsCreated++;
  }
  console.log(`Follows creados: ${followsCreated}`);

  // 4. Notificaciones — cubriendo los 3 tipos posibles.
  // CONSENSUS_REACHED: artículos que ya resolvieron ronda (p3, p4, p5, p6, p7).
  // REOPENED / RETROACTIVE_APPLIED: solo tienen sentido para p7 (el único
  // artículo reabierto del dataset).
  await notificationRepository.createMany([val0, val1], hashOf("p3"), "CONSENSUS_REACHED");
  await notificationRepository.createMany([val2], hashOf("p4"), "CONSENSUS_REACHED");
  await notificationRepository.createMany([val3, val4], hashOf("p7"), "REOPENED");
  await notificationRepository.createMany([val0], hashOf("p7"), "RETROACTIVE_APPLIED");
  await notificationRepository.createMany([val1, val2], hashOf("p6"), "CONSENSUS_REACHED");
  console.log("Notificaciones creadas (o ya existentes, deduplicadas por el repositorio).");

  // Marcar 2-3 notificaciones ya existentes como leídas.
  const toMarkRead = await prisma.notification.findMany({
    where: {
      OR: [
        { userAddress: val0, contentHash: hashOf("p3"), type: "CONSENSUS_REACHED" },
        { userAddress: val3, contentHash: hashOf("p7"), type: "REOPENED" },
        { userAddress: val1, contentHash: hashOf("p6"), type: "CONSENSUS_REACHED" },
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
