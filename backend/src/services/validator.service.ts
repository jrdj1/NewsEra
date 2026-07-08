import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { validatorRepository } from "../repositories/validator.repository.js";
import { validationRepository } from "../repositories/validation.repository.js";
import { roundRepository } from "../repositories/round.repository.js";
import { reputationEventRepository } from "../repositories/reputation-event.repository.js";
import { publicationRepository } from "../repositories/publication.repository.js";
import { reopenRequestRepository } from "../repositories/reopen-request.repository.js";
import { retroactiveClaimRepository } from "../repositories/retroactive-claim.repository.js";
import type { Paginated, ValidationOutcome } from "../types/api.js";

type ActivityItem = {
  type: "PUBLICATION" | "VALIDATION" | "REOPEN_REQUEST" | "RETROACTIVE_CLAIM";
  contentHash: string;
  title: string;
  round: number | null;
  vote: string | null;
  netDelta: number | null;
  txHash: string | null;
  createdAt: Date;
};

function classify(vote: string, round: { state: string; result: string | null } | undefined): ValidationOutcome {
  if (!round || round.state !== "DEFINITIVE") return "unresolved";
  return vote === round.result ? "won" : "lost";
}

export const validatorService = {
  async list(page = 1, limit = 20): Promise<Paginated<unknown>> {
    const { items, total } = await validatorRepository.list(page, limit);
    return { items, page, limit, total };
  },

  async getByAddress(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    const validator = await validatorRepository.getByAddress(address);
    if (!validator) throw new AppError("NOT_FOUND", `Validador no encontrado: ${address}`);

    const validations = await validationRepository.findRoundsForValidator(address);
    const rounds = await roundRepository.findByContentHashes(validations.map((v) => v.contentHash));
    const roundByKey = new Map(rounds.map((r) => [`${r.contentHash}:${r.round}`, r]));

    let correctVotes = 0;
    let resolvedVotes = 0;
    for (const v of validations) {
      const round = roundByKey.get(`${v.contentHash}:${v.round}`);
      const outcome = classify(v.vote, round);
      if (outcome === "unresolved") continue;
      resolvedVotes++;
      if (outcome === "won") correctVotes++;
    }

    return {
      address: validator.address,
      reputationScore: validator.reputationScore,
      totalValidations: validations.length,
      correctVotes,
      accuracy: resolvedVotes > 0 ? correctVotes / resolvedVotes : null,
    };
  },

  async getHistory(rawAddress: string, page = 1, limit = 20) {
    const address = normalizeAddress(rawAddress);
    const { items, total } = await validationRepository.listByValidator(address, page, limit);
    const rounds = await roundRepository.findByContentHashes(items.map((v) => v.contentHash));
    const roundByKey = new Map(rounds.map((r) => [`${r.contentHash}:${r.round}`, r]));

    const enriched = items.map((v) => {
      const round = roundByKey.get(`${v.contentHash}:${v.round}`);
      return {
        contentHash: v.contentHash,
        title: v.publication.title,
        vote: v.vote,
        round: v.round,
        roundState: round?.state ?? "PENDING",
        roundResult: round?.result ?? null,
        outcome: classify(v.vote, round),
        createdAt: v.createdAt,
      };
    });

    return { items: enriched, page, limit, total };
  },

  /**
   * Ledger completo de variaciones de reputación (voto, recompensa/
   * penalización por publicar, reclamación retroactiva, predicción, registro
   * inicial), poblado por el indexador a partir de ReputationUpdated
   * correlacionado con su transacción — ver indexer.ts, handleReputationUpdated.
   */
  async getReputationHistory(rawAddress: string, page = 1, limit = 100) {
    const address = normalizeAddress(rawAddress);
    const { items, total } = await reputationEventRepository.listByAddress(address, page, limit);
    // blockNumber es BigInt en Prisma — no serializa en JSON.stringify sin convertir.
    const shaped = items.map(({ blockNumber, ...rest }) => ({ ...rest, blockNumber: blockNumber.toString() }));
    return { items: shaped, page, limit, total };
  },

  /**
   * Todas las interacciones on-chain de `address` (publicar, votar, solicitar
   * reapertura, reclamar retroactiva) unidas en un único feed cronológico. No
   * incluye predicciones (no se indexan off-chain, ver Sprint 6) ni datos
   * confidenciales (email del perfil enriquecido no forma parte de esto).
   * Se agregan las 4 fuentes en memoria y se pagina el resultado combinado —
   * asumible para el volumen de un prototipo, evita un UNION SQL a mano.
   */
  async getActivity(rawAddress: string, page = 1, limit = 20): Promise<Paginated<ActivityItem>> {
    const address = normalizeAddress(rawAddress);

    const [publications, validations, reopenRequests, retroactiveClaims] = await Promise.all([
      publicationRepository.list({ page: 1, limit: 1000, author: address, sort: "recent" }),
      validationRepository.listByValidator(address, 1, 1000),
      reopenRequestRepository.listByRequester(address),
      retroactiveClaimRepository.listByValidator(address),
    ]);

    const retroactiveHashes = retroactiveClaims.map((c) => c.contentHash);
    const retroactiveTitles = await publicationRepository.findTitlesByHashes(retroactiveHashes);
    const titleByHash = new Map(retroactiveTitles.map((p) => [p.contentHash, p.title]));

    const items: ActivityItem[] = [
      ...publications.items.map((p) => ({
        type: "PUBLICATION" as const,
        contentHash: p.contentHash,
        title: p.title,
        round: null,
        vote: null,
        netDelta: null,
        txHash: null,
        createdAt: p.createdAt,
      })),
      ...validations.items.map((v) => ({
        type: "VALIDATION" as const,
        contentHash: v.contentHash,
        title: v.publication.title,
        round: v.round,
        vote: v.vote,
        netDelta: null,
        txHash: v.txHash,
        createdAt: v.createdAt,
      })),
      ...reopenRequests.map((r) => ({
        type: "REOPEN_REQUEST" as const,
        contentHash: r.contentHash,
        title: r.publication.title,
        round: null,
        vote: null,
        netDelta: null,
        txHash: r.txHash,
        createdAt: r.createdAt,
      })),
      ...retroactiveClaims.map((c) => ({
        type: "RETROACTIVE_CLAIM" as const,
        contentHash: c.contentHash,
        title: titleByHash.get(c.contentHash) ?? "",
        round: null,
        vote: null,
        netDelta: c.netDelta,
        txHash: c.txHash,
        createdAt: c.createdAt,
      })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return { items: paged, page, limit, total };
  },
};
