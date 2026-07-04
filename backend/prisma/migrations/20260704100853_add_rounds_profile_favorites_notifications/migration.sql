-- CreateTable
CREATE TABLE "publications" (
    "id" SERIAL NOT NULL,
    "contentHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorAddress" TEXT NOT NULL,
    "tags" TEXT[],
    "ipfsCid" TEXT,
    "consensusState" TEXT NOT NULL DEFAULT 'PENDING',
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "reopenRequestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" SERIAL NOT NULL,
    "contentHash" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validations" (
    "id" SERIAL NOT NULL,
    "contentHash" TEXT NOT NULL,
    "validatorAddress" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validators" (
    "address" TEXT NOT NULL,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "lastSyncBlock" BIGINT NOT NULL DEFAULT 0,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validators_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "reopen_requests" (
    "id" SERIAL NOT NULL,
    "contentHash" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reopen_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retroactive_claims" (
    "id" SERIAL NOT NULL,
    "contentHash" TEXT NOT NULL,
    "validatorAddress" TEXT NOT NULL,
    "netDelta" INTEGER NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retroactive_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "address" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "publications_contentHash_key" ON "publications"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_contentHash_round_key" ON "rounds"("contentHash", "round");

-- CreateIndex
CREATE UNIQUE INDEX "validations_contentHash_validatorAddress_key" ON "validations"("contentHash", "validatorAddress");

-- CreateIndex
CREATE UNIQUE INDEX "reopen_requests_contentHash_requesterAddress_key" ON "reopen_requests"("contentHash", "requesterAddress");

-- CreateIndex
CREATE UNIQUE INDEX "retroactive_claims_contentHash_validatorAddress_txHash_key" ON "retroactive_claims"("contentHash", "validatorAddress", "txHash");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userAddress_contentHash_key" ON "favorites"("userAddress", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "follows_userAddress_contentHash_key" ON "follows"("userAddress", "contentHash");

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validations" ADD CONSTRAINT "validations_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reopen_requests" ADD CONSTRAINT "reopen_requests_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_contentHash_fkey" FOREIGN KEY ("contentHash") REFERENCES "publications"("contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;
