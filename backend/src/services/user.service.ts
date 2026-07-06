import { normalizeAddress } from "../lib/address.js";
import { validatorRepository } from "../repositories/validator.repository.js";
import { publicationRepository } from "../repositories/publication.repository.js";
import { validatorService } from "./validator.service.js";
import type { Paginated } from "../types/api.js";

export interface UserSummary {
  address: string;
  reputationScore: number;
  articleCount: number;
}

/**
 * Une validadores (tabla `validators`, alimentada por ReputationUpdated) con
 * autores puros que aún no tienen reputación (ningún voto/publicación
 * resuelta todavía) — sin esto, un autor recién llegado es invisible en
 * /api/v1/validators pese a tener artículos publicados.
 */
export const userService = {
  async list(
    page = 1,
    limit = 20,
    sort: "reputation" | "articles" = "reputation",
    search?: string,
  ): Promise<Paginated<UserSummary>> {
    const [validators, authorStats] = await Promise.all([
      validatorRepository.listAll(),
      publicationRepository.authorStats(),
    ]);

    const byAddress = new Map<string, UserSummary>();
    for (const v of validators) {
      byAddress.set(v.address, { address: v.address, reputationScore: v.reputationScore, articleCount: 0 });
    }
    for (const a of authorStats) {
      const existing = byAddress.get(a.authorAddress);
      if (existing) existing.articleCount = a.articleCount;
      else byAddress.set(a.authorAddress, { address: a.authorAddress, reputationScore: 0, articleCount: a.articleCount });
    }

    let all = [...byAddress.values()];
    if (search) {
      const needle = search.toLowerCase();
      all = all.filter((u) => u.address.toLowerCase().includes(needle));
    }
    all.sort((a, b) =>
      sort === "articles" ? b.articleCount - a.articleCount : b.reputationScore - a.reputationScore,
    );

    const total = all.length;
    const items = all.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { items, page, limit, total };
  },

  async getByAddress(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    const validator = await validatorRepository.getByAddress(address);
    if (validator) return validatorService.getByAddress(address);

    // Autor puro: nunca ha votado ni recibido/perdido reputación todavía.
    return { address, reputationScore: 0, totalValidations: 0, correctVotes: 0, accuracy: null };
  },
};
