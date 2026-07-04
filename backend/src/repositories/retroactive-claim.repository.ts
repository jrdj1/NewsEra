import { prisma } from "../lib/prisma.js";

export const retroactiveClaimRepository = {
  async existsFor(
    contentHash: string,
    validatorAddress: string,
    txHash: string,
  ): Promise<boolean> {
    const count = await prisma.retroactiveClaim.count({
      where: { contentHash, validatorAddress, txHash },
    });
    return count > 0;
  },

  async create(data: {
    contentHash: string;
    validatorAddress: string;
    netDelta: number;
    txHash?: string;
  }) {
    return prisma.retroactiveClaim.create({ data });
  },

  /** Idempotente — usado por el indexador, que puede reprocesar el mismo evento. */
  async upsertFromChain(data: {
    contentHash: string;
    validatorAddress: string;
    netDelta: number;
    txHash: string;
  }) {
    return prisma.retroactiveClaim.upsert({
      where: {
        contentHash_validatorAddress_txHash: {
          contentHash: data.contentHash,
          validatorAddress: data.validatorAddress,
          txHash: data.txHash,
        },
      },
      update: {},
      create: data,
    });
  },
};
