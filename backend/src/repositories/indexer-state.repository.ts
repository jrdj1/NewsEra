import { prisma } from "../lib/prisma.js";

export const indexerStateRepository = {
  async getLastProcessedBlock(): Promise<bigint> {
    const state = await prisma.indexerState.findUnique({ where: { id: 1 } });
    return state?.lastProcessedBlock ?? 0n;
  },

  async setLastProcessedBlock(block: bigint): Promise<void> {
    await prisma.indexerState.upsert({
      where: { id: 1 },
      update: { lastProcessedBlock: block },
      create: { id: 1, lastProcessedBlock: block },
    });
  },
};
