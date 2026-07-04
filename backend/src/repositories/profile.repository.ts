import { prisma } from "../lib/prisma.js";

export const profileRepository = {
  async getByAddress(address: string) {
    return prisma.userProfile.findUnique({ where: { address } });
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
