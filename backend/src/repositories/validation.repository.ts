import { prisma } from "../lib/prisma.js";

export const validationRepository = {
  async create(data: {
    contentHash: string;
    validatorAddress: string;
    vote: string;
    round: number;
    txHash?: string;
  }) {
    return prisma.validation.upsert({
      where: {
        contentHash_validatorAddress: {
          contentHash: data.contentHash,
          validatorAddress: data.validatorAddress,
        },
      },
      update: {},
      create: data,
    });
  },

  async listByValidator(validatorAddress: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.validation.findMany({
        where: { validatorAddress },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { publication: { select: { contentHash: true, title: true } } },
      }),
      prisma.validation.count({ where: { validatorAddress } }),
    ]);
    return { items, total };
  },

  async findRoundsForValidator(validatorAddress: string) {
    return prisma.validation.findMany({
      where: { validatorAddress },
      select: { contentHash: true, vote: true, round: true },
    });
  },

  async countByValidator(validatorAddress: string) {
    return prisma.validation.count({ where: { validatorAddress } });
  },

  async listByPublicationAndFollowers(contentHash: string) {
    return prisma.validation.findMany({
      where: { contentHash },
      select: { validatorAddress: true },
      distinct: ["validatorAddress"],
    });
  },
};
