import { prisma } from "../lib/prisma.js";

export type PublicationSort = "recent" | "votes" | "state";

export interface ListPublicationsParams {
  page: number;
  limit: number;
  state?: string;
  tags?: string[];
  author?: string;
  sort?: PublicationSort;
}

export const publicationRepository = {
  async list({ page, limit, state, tags, author, sort = "recent" }: ListPublicationsParams) {
    const where = {
      ...(state ? { consensusState: state } : {}),
      ...(author ? { authorAddress: author } : {}),
      ...(tags && tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    };

    const orderBy =
      sort === "state"
        ? [{ consensusState: "asc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

    const [items, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { validations: true } } },
      }),
      prisma.publication.count({ where }),
    ]);

    const shaped = items.map(({ _count, ...rest }) => ({ ...rest, voteCount: _count.validations }));
    if (sort === "votes") {
      shaped.sort((a, b) => b.voteCount - a.voteCount);
    }

    return { items: shaped, total };
  },

  async getByHash(contentHash: string) {
    return prisma.publication.findUnique({
      where: { contentHash },
      include: {
        rounds: { orderBy: { round: "asc" } },
        validations: { orderBy: { round: "asc" } },
      },
    });
  },

  async existsByHash(contentHash: string): Promise<boolean> {
    const count = await prisma.publication.count({ where: { contentHash } });
    return count > 0;
  },

  async create(data: {
    contentHash: string;
    title: string;
    body: string;
    authorAddress: string;
    tags: string[];
    ipfsCid?: string;
  }) {
    // currentRound: 0 — las rondas on-chain empiezan en 0 (ver upsertFromChain).
    return prisma.publication.create({ data: { ...data, currentRound: 0 } });
  },

  async upsertFromChain(data: { contentHash: string; authorAddress: string }) {
    return prisma.publication.upsert({
      where: { contentHash: data.contentHash },
      update: { authorAddress: data.authorAddress },
      create: {
        contentHash: data.contentHash,
        authorAddress: data.authorAddress,
        title: "",
        body: "",
        tags: [],
        // Las rondas on-chain empiezan en 0 (ValidationRegistry.currentRound);
        // se sobrescribe aquí el valor por defecto del schema (1) para que
        // coincida con la ronda real que se abre al registrar la publicación.
        currentRound: 0,
      },
    });
  },

  async updateConsensusState(contentHash: string, consensusState: string) {
    return prisma.publication.update({
      where: { contentHash },
      data: { consensusState },
    });
  },

  async setReopenRequestCount(contentHash: string, count: number) {
    return prisma.publication.update({
      where: { contentHash },
      data: { reopenRequestCount: count },
    });
  },

  async openNewRound(contentHash: string, newRound: number) {
    return prisma.publication.update({
      where: { contentHash },
      data: { currentRound: newRound, reopenRequestCount: 0, consensusState: "PENDING" },
    });
  },
};
