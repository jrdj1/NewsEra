import { prisma } from "../lib/prisma.js";

export const reopenRequestRepository = {
  async existsFor(contentHash: string, requesterAddress: string): Promise<boolean> {
    const count = await prisma.reopenRequest.count({
      where: { contentHash, requesterAddress },
    });
    return count > 0;
  },

  async create(data: { contentHash: string; requesterAddress: string; txHash?: string }) {
    return prisma.reopenRequest.create({ data });
  },

  /** Idempotente — usado por el indexador, que puede reprocesar el mismo evento. */
  async upsertFromChain(data: { contentHash: string; requesterAddress: string; txHash?: string }) {
    return prisma.reopenRequest.upsert({
      where: {
        contentHash_requesterAddress: {
          contentHash: data.contentHash,
          requesterAddress: data.requesterAddress,
        },
      },
      update: {},
      create: data,
    });
  },

  async listByRequester(requesterAddress: string) {
    return prisma.reopenRequest.findMany({
      where: { requesterAddress },
      orderBy: { createdAt: "desc" },
      include: { publication: { select: { contentHash: true, title: true, consensusState: true } } },
    });
  },
};
