import { prisma } from "../lib/prisma.js";

export const profileRepository = {
  async getByAddress(address: string) {
    return prisma.userProfile.findUnique({ where: { address } });
  },

  async listByAddresses(addresses: string[]) {
    if (addresses.length === 0) return [];
    return prisma.userProfile.findMany({
      where: { address: { in: addresses } },
      select: { address: true, displayName: true, avatarUrl: true },
    });
  },

  async upsert(
    address: string,
    data: { displayName?: string; avatarUrl?: string; email?: string },
  ) {
    return prisma.userProfile.upsert({
      where: { address },
      update: data,
      create: { address, ...data },
    });
  },
};
