import { prisma } from "../lib/prisma.js";

// lastSyncBlock es un BigInt de Prisma (no serializable en JSON) y es un
// campo de bookkeeping interno (RD-13), no forma parte de la API pública.
const PUBLIC_SELECT = {
  address: true,
  reputationScore: true,
  registeredAt: true,
  updatedAt: true,
} as const;

export const validatorRepository = {
  async list(page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.validator.findMany({
        orderBy: { reputationScore: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: PUBLIC_SELECT,
      }),
      prisma.validator.count(),
    ]);
    return { items, total };
  },

  async getByAddress(address: string) {
    return prisma.validator.findUnique({ where: { address }, select: PUBLIC_SELECT });
  },

  async upsertReputation(address: string, reputationScore: number, lastSyncBlock: bigint) {
    return prisma.validator.upsert({
      where: { address },
      update: { reputationScore, lastSyncBlock },
      create: { address, reputationScore, lastSyncBlock },
    });
  },
};
