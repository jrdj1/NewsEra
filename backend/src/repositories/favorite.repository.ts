import { prisma } from "../lib/prisma.js";

export const favoriteRepository = {
  async exists(userAddress: string, contentHash: string): Promise<boolean> {
    const count = await prisma.favorite.count({ where: { userAddress, contentHash } });
    return count > 0;
  },

  async add(userAddress: string, contentHash: string) {
    return prisma.favorite.create({ data: { userAddress, contentHash } });
  },

  async remove(userAddress: string, contentHash: string) {
    return prisma.favorite.deleteMany({ where: { userAddress, contentHash } });
  },

  async listByUser(userAddress: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userAddress },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { publication: true },
      }),
      prisma.favorite.count({ where: { userAddress } }),
    ]);
    return { items, total };
  },
};
