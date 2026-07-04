import { prisma } from "../lib/prisma.js";

export const roundRepository = {
  async upsert(data: {
    contentHash: string;
    round: number;
    state: string;
    result?: string;
    completed: boolean;
  }) {
    return prisma.round.upsert({
      where: { contentHash_round: { contentHash: data.contentHash, round: data.round } },
      update: { state: data.state, result: data.result, completed: data.completed },
      create: data,
    });
  },

  async open(contentHash: string, round: number) {
    return prisma.round.upsert({
      where: { contentHash_round: { contentHash, round } },
      update: {},
      create: { contentHash, round, state: "PENDING", completed: false },
    });
  },

  async findByContentHashes(contentHashes: string[]) {
    if (contentHashes.length === 0) return [];
    return prisma.round.findMany({ where: { contentHash: { in: contentHashes } } });
  },
};
