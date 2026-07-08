import { prisma } from "../lib/prisma.js";

export const reputationEventRepository = {
  async create(data: {
    address: string;
    delta: number;
    newScore: number;
    reason: string;
    contentHash?: string | null;
    round?: number | null;
    txHash?: string | null;
    blockNumber: bigint;
  }) {
    return prisma.reputationEvent.create({ data });
  },

  async listByAddress(address: string, page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      prisma.reputationEvent.findMany({
        where: { address },
        orderBy: [{ blockNumber: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reputationEvent.count({ where: { address } }),
    ]);
    return { items, total };
  },
};
