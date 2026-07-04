-- CreateTable
CREATE TABLE "indexer_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedBlock" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);
