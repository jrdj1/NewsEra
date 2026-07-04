import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { validatorRepository } from "../repositories/validator.repository.js";
import { validationRepository } from "../repositories/validation.repository.js";
import { roundRepository } from "../repositories/round.repository.js";
import type { Paginated, ValidationOutcome } from "../types/api.js";

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
   * Serie temporal de variaciones de reputación. Derivada de los deltas ya
   * aplicados en Validation/Round (efectos ±5/±3 de ronda propia) porque no
   * existe una tabla dedicada a ReputationUpdated por bloque; ver nota en
   * CLAUDE.md/ERS (D4). No distingue el origen del delta (voto, publicación
   * o predicción) — todos comparten el mismo evento on-chain.
   */
  async getReputationHistory(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    const validations = await validationRepository.findRoundsForValidator(address);
    const rounds = await roundRepository.findByContentHashes(validations.map((v) => v.contentHash));
    const roundByKey = new Map(rounds.map((r) => [`${r.contentHash}:${r.round}`, r]));

    const REWARD = 5;
    const PENALTY = -3;

    return validations
      .map((v) => {
        const round = roundByKey.get(`${v.contentHash}:${v.round}`);
        if (!round || round.state !== "DEFINITIVE") return null;
        return {
          contentHash: v.contentHash,
          round: v.round,
          delta: v.vote === round.result ? REWARD : PENALTY,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  },
};
