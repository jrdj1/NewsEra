import { prisma } from "../lib/prisma.js";

export type PublicationSort = "recent" | "votes" | "state";

const TAG_LINKS_INCLUDE = { tagLinks: { include: { tag: true } } } as const;
const PUBLICATION_LINKS_INCLUDE = {
  links: { include: { linkedPublication: { select: { contentHash: true, title: true } } } },
} as const;

/** Aplana la relación `tagLinks` (join con Tag) de vuelta a `tags: string[]`
 * — la forma que espera el resto de la API, sin filtrar la tabla de unión
 * hacia fuera de la capa de repositorio. */
function shapeTags<T extends { tagLinks: { tag: { name: string } }[] }>(
  p: T,
): Omit<T, "tagLinks"> & { tags: string[] } {
  const { tagLinks, ...rest } = p;
  return { ...rest, tags: tagLinks.map((l) => l.tag.name) };
}

/** Aplana la relación `links` (join `PublicationLink`) a la forma pública
 * `links: { contentHash, title }[]` — igual que `shapeTags`, sin filtrar la
 * tabla de unión hacia fuera de la capa de repositorio. */
function shapeLinks<T extends { links: { linkedPublication: { contentHash: string; title: string } }[] }>(
  p: T,
): Omit<T, "links"> & { links: { contentHash: string; title: string }[] } {
  const { links, ...rest } = p;
  return { ...rest, links: links.map((l) => l.linkedPublication) };
}

/** Datos de creación anidada para `PublicationTag`: `connectOrCreate` por
 * nombre — reutiliza la fila de Tag si ya existe (etiquetas libres, sin
 * catálogo cerrado) o la crea al vuelo. Dedupe defensivo: un mismo nombre
 * repetido en `tags` violaría la clave compuesta (contentHash, tagId). */
function tagLinksCreateData(tags: string[]) {
  return [...new Set(tags)].map((name) => ({
    tag: { connectOrCreate: { where: { name }, create: { name } } },
  }));
}

/** Datos de creación anidada para `PublicationLink`: a diferencia de las
 * etiquetas, el destino debe ser una publicación ya existente (lo exige la
 * FK) — el selector del frontend (ArticleLinkPicker) solo permite elegir
 * artículos reales, así que aquí basta con `create` simple, no
 * `connectOrCreate`. Dedupe defensivo por la misma razón que en tags. */
function publicationLinksCreateData(linkedContentHashes: string[]) {
  return [...new Set(linkedContentHashes)].map((linkedContentHash) => ({ linkedContentHash }));
}

export interface ListPublicationsParams {
  page: number;
  limit: number;
  state?: string;
  result?: string;
  tags?: string[];
  author?: string;
  search?: string;
  sort?: PublicationSort;
}

export const publicationRepository = {
  async list({ page, limit, state, result, tags, author, search, sort = "recent" }: ListPublicationsParams) {
    const where = {
      ...(state ? { consensusState: state } : {}),
      ...(result ? { currentResult: result } : {}),
      ...(author ? { authorAddress: author } : {}),
      ...(tags && tags.length > 0 ? { tagLinks: { some: { tag: { name: { in: tags } } } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { body: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
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
        include: { _count: { select: { validations: true } }, ...TAG_LINKS_INCLUDE },
      }),
      prisma.publication.count({ where }),
    ]);

    const shaped = items.map(({ _count, ...rest }) => ({ ...shapeTags(rest), voteCount: _count.validations }));
    if (sort === "votes") {
      shaped.sort((a, b) => b.voteCount - a.voteCount);
    }

    return { items: shaped, total };
  },

  async getByHash(contentHash: string) {
    const publication = await prisma.publication.findUnique({
      where: { contentHash },
      include: {
        rounds: { orderBy: { round: "asc" } },
        validations: { orderBy: { round: "asc" } },
        ...TAG_LINKS_INCLUDE,
        ...PUBLICATION_LINKS_INCLUDE,
      },
    });
    return publication ? shapeLinks(shapeTags(publication)) : null;
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
    links?: string[];
    ipfsCid?: string;
  }) {
    const { tags, links = [], ...rest } = data;
    // currentRound: 0 — las rondas on-chain empiezan en 0 (ver upsertFromChain).
    const created = await prisma.publication.create({
      data: {
        ...rest,
        currentRound: 0,
        tagLinks: { create: tagLinksCreateData(tags) },
        links: { create: publicationLinksCreateData(links) },
      },
      include: { ...TAG_LINKS_INCLUDE, ...PUBLICATION_LINKS_INCLUDE },
    });
    return shapeLinks(shapeTags(created));
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
        // Las rondas on-chain empiezan en 0 (ValidationRegistry.currentRound);
        // se sobrescribe aquí el valor por defecto del schema (1) para que
        // coincida con la ronda real que se abre al registrar la publicación.
        currentRound: 0,
      },
    });
  },

  /**
   * Rellena título/cuerpo/tags/ipfsCid sobre una fila ya existente (creada
   * por el indexador vía `upsertFromChain` a partir del evento
   * PublicationRegistered, que solo conoce contentHash/autor). Uso: scripts
   * de seed que registran contenido on-chain sin pasar por el flujo normal
   * `POST /api/v1/publications` (que rechazaría con 409 CONFLICT una fila
   * que el indexador ya creó). Idempotente: sustituye por completo el
   * conjunto de etiquetas en vez de acumularlas en cada re-siembra.
   */
  async setContent(
    contentHash: string,
    data: { title: string; body: string; tags: string[]; links?: string[]; ipfsCid?: string },
  ) {
    const { tags, links = [], ...rest } = data;
    const updated = await prisma.publication.update({
      where: { contentHash },
      data: {
        ...rest,
        tagLinks: { deleteMany: {}, create: tagLinksCreateData(tags) },
        links: { deleteMany: {}, create: publicationLinksCreateData(links) },
      },
      include: { ...TAG_LINKS_INCLUDE, ...PUBLICATION_LINKS_INCLUDE },
    });
    return shapeLinks(shapeTags(updated));
  },

  async updateConsensusState(contentHash: string, consensusState: string, currentResult: string | null = null) {
    return prisma.publication.update({
      where: { contentHash },
      data: { consensusState, currentResult },
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
      data: { currentRound: newRound, reopenRequestCount: 0, consensusState: "PENDING", currentResult: null },
    });
  },

  /**
   * Etiquetas ya en uso (las etiquetas son libres — cualquier autor puede
   * escribir una nueva al publicar, no hay catálogo cerrado — así que el
   * filtro del feed se puebla con lo que realmente existe en vez de una
   * lista fija). Con persistencia propia en `Tag`, es una consulta directa
   * a esa tabla en vez de deduplicar en memoria sobre un array por fila.
   */
  async listDistinctTags(): Promise<string[]> {
    const rows = await prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } });
    return rows.map((r) => r.name);
  },

  async findTitlesByHashes(contentHashes: string[]) {
    if (contentHashes.length === 0) return [];
    return prisma.publication.findMany({
      where: { contentHash: { in: contentHashes } },
      select: { contentHash: true, title: true },
    });
  },

  async authorStats(): Promise<{ authorAddress: string; articleCount: number }[]> {
    const grouped = await prisma.publication.groupBy({
      by: ["authorAddress"],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ authorAddress: g.authorAddress, articleCount: g._count._all }));
  },
};
