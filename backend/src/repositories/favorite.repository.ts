import { prisma } from "../lib/prisma.js";

/** Misma forma que `Publication.tagLinks` en publication.repository.ts —
 * aquí también hay que aplanarla, porque `listByUser` incluye la
 * publicación completa anidada dentro de cada favorito. */
function shapePublicationTags<T extends { tagLinks: { tag: { name: string } }[] }>(
  p: T,
): Omit<T, "tagLinks"> & { tags: string[] } {
  const { tagLinks, ...rest } = p;
  return { ...rest, tags: tagLinks.map((l) => l.tag.name) };
}

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
        include: { publication: { include: { tagLinks: { include: { tag: true } } } } },
      }),
      prisma.favorite.count({ where: { userAddress } }),
    ]);
    return { items: items.map((f) => ({ ...f, publication: shapePublicationTags(f.publication) })), total };
  },
};
