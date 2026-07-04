import { prisma } from "../lib/prisma.js";

export const followRepository = {
  async exists(userAddress: string, contentHash: string): Promise<boolean> {
    const count = await prisma.follow.count({ where: { userAddress, contentHash } });
    return count > 0;
  },

  async add(userAddress: string, contentHash: string) {
    return prisma.follow.create({ data: { userAddress, contentHash } });
  },

  async remove(userAddress: string, contentHash: string) {
    return prisma.follow.deleteMany({ where: { userAddress, contentHash } });
  },

  /** Direcciones a notificar: quienes siguen el artículo o han votado en él. */
  async listInterestedAddresses(contentHash: string): Promise<string[]> {
    const [follows, validations] = await Promise.all([
      prisma.follow.findMany({ where: { contentHash }, select: { userAddress: true } }),
      prisma.validation.findMany({
        where: { contentHash },
        select: { validatorAddress: true },
        distinct: ["validatorAddress"],
      }),
    ]);
    const addresses = new Set<string>();
    for (const f of follows) addresses.add(f.userAddress);
    for (const v of validations) addresses.add(v.validatorAddress);
    return [...addresses];
  },
};
