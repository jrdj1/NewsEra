-- CreateTable
CREATE TABLE "publication_links" (
    "contentHash" TEXT NOT NULL,
    "linkedContentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_links_pkey" PRIMARY KEY ("contentHash","linkedContentHash")
);

-- AddForeignKey
ALTER TABLE "publication_links" ADD CONSTRAINT "publication_links_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_links" ADD CONSTRAINT "publication_links_linkedContentHash_fkey" FOREIGN KEY ("linkedContentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: los enlaces internos ya existían como texto libre dentro de
-- `body` (bajo "## Enlaces relacionados", ver lib/article.ts en el
-- frontend) — nunca se habían persistido de forma estructurada. Se
-- extraen aquí con una expresión regular antes de que nada dependa todavía
-- de la tabla nueva, para no perder los que ya hubiera. Solo se insertan
-- enlaces cuyo destino exista realmente como publicación (la FK lo exigiría
-- de todos modos) y que no sean autorreferencias.
INSERT INTO "publication_links" ("contentHash", "linkedContentHash")
SELECT DISTINCT p."contentHash", m[1]
FROM "publications" p,
LATERAL regexp_matches(p."body", '/article/(0x[0-9a-fA-F]+)', 'g') AS m
JOIN "publications" target ON target."contentHash" = m[1]
WHERE m[1] <> p."contentHash"
ON CONFLICT ("contentHash", "linkedContentHash") DO NOTHING;

