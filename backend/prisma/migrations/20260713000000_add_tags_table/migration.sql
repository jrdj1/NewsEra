-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_tags" (
    "contentHash" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "publication_tags_pkey" PRIMARY KEY ("contentHash","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "publication_tags" ADD CONSTRAINT "publication_tags_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_tags" ADD CONSTRAINT "publication_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: vuelca el array `publications.tags` (String[]) sobre las
-- nuevas tablas relacionales antes de borrar la columna, para no perder las
-- etiquetas ya persistidas.
INSERT INTO "tags" ("name")
SELECT DISTINCT unnest("tags") AS name
FROM "publications"
WHERE cardinality("tags") > 0
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "publication_tags" ("contentHash", "tagId")
SELECT p."contentHash", t."id"
FROM "publications" p
CROSS JOIN LATERAL unnest(p."tags") AS tag_name
JOIN "tags" t ON t."name" = tag_name
ON CONFLICT ("contentHash", "tagId") DO NOTHING;

-- AlterTable
ALTER TABLE "publications" DROP COLUMN "tags";
