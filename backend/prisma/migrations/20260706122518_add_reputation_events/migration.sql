-- CreateTable
CREATE TABLE "reputation_events" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "contentHash" TEXT,
    "round" INTEGER,
    "txHash" TEXT,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reputation_events_address_idx" ON "reputation_events"("address");
