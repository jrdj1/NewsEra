/**
 * Tests unitarios de validatorService — repositorios mockeados con vi.fn(),
 * sin Postgres real. Cubre sobre todo `classify` (won/lost/unresolved) vía
 * getByAddress/getHistory, incluyendo que DISPUTED nunca cuenta como ganada
 * ni perdida.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const validatorRepositoryMock = {
  list: vi.fn(),
  getByAddress: vi.fn(),
};

const validationRepositoryMock = {
  findRoundsForValidator: vi.fn(),
  listByValidator: vi.fn(),
};

const roundRepositoryMock = {
  findByContentHashes: vi.fn(),
};

const reputationEventRepositoryMock = {
  listByAddress: vi.fn(),
};

const publicationRepositoryMock = {
  list: vi.fn(),
  findTitlesByHashes: vi.fn(),
};

const reopenRequestRepositoryMock = {
  listByRequester: vi.fn(),
};

const retroactiveClaimRepositoryMock = {
  listByValidator: vi.fn(),
};

vi.mock("../../src/repositories/validator.repository.js", () => ({
  validatorRepository: validatorRepositoryMock,
}));
vi.mock("../../src/repositories/validation.repository.js", () => ({
  validationRepository: validationRepositoryMock,
}));
vi.mock("../../src/repositories/round.repository.js", () => ({
  roundRepository: roundRepositoryMock,
}));
vi.mock("../../src/repositories/reputation-event.repository.js", () => ({
  reputationEventRepository: reputationEventRepositoryMock,
}));
vi.mock("../../src/repositories/publication.repository.js", () => ({
  publicationRepository: publicationRepositoryMock,
}));
vi.mock("../../src/repositories/reopen-request.repository.js", () => ({
  reopenRequestRepository: reopenRequestRepositoryMock,
}));
vi.mock("../../src/repositories/retroactive-claim.repository.js", () => ({
  retroactiveClaimRepository: retroactiveClaimRepositoryMock,
}));

const { validatorService } = await import("../../src/services/validator.service.js");

const ADDRESS = "0x1111111111111111111111111111111111111111";

describe("validatorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByAddress", () => {
    it("revierte con NOT_FOUND si el validador no existe", async () => {
      validatorRepositoryMock.getByAddress.mockResolvedValue(null);

      await expect(validatorService.getByAddress(ADDRESS)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("calcula accuracy solo sobre rondas resueltas (DISPUTED no cuenta)", async () => {
      validatorRepositoryMock.getByAddress.mockResolvedValue({
        address: ADDRESS,
        reputationScore: 20,
      });
      validationRepositoryMock.findRoundsForValidator.mockResolvedValue([
        { contentHash: "0x1", vote: "TRUE", round: 0 }, // DEFINITIVE, ganó
        { contentHash: "0x2", vote: "FALSE", round: 0 }, // DEFINITIVE, perdió
        { contentHash: "0x3", vote: "TRUE", round: 0 }, // DISPUTED, no cuenta
        { contentHash: "0x4", vote: "TRUE", round: 0 }, // sin ronda registrada, no cuenta
      ]);
      roundRepositoryMock.findByContentHashes.mockResolvedValue([
        { contentHash: "0x1", round: 0, state: "DEFINITIVE", result: "TRUE" },
        { contentHash: "0x2", round: 0, state: "DEFINITIVE", result: "TRUE" },
        { contentHash: "0x3", round: 0, state: "DISPUTED", result: null },
      ]);

      const result = await validatorService.getByAddress(ADDRESS);

      expect(result.totalValidations).toBe(4);
      expect(result.correctVotes).toBe(1);
      expect(result.accuracy).toBe(0.5); // 1 de 2 resueltas
    });

    it("accuracy es null si no hay ninguna ronda resuelta", async () => {
      validatorRepositoryMock.getByAddress.mockResolvedValue({
        address: ADDRESS,
        reputationScore: 0,
      });
      validationRepositoryMock.findRoundsForValidator.mockResolvedValue([
        { contentHash: "0x1", vote: "TRUE", round: 0 },
      ]);
      roundRepositoryMock.findByContentHashes.mockResolvedValue([
        { contentHash: "0x1", round: 0, state: "PENDING", result: null },
      ]);

      const result = await validatorService.getByAddress(ADDRESS);

      expect(result.accuracy).toBeNull();
    });
  });

  describe("getHistory", () => {
    it("clasifica cada validación como won/lost/unresolved y nunca DISPUTED como won/lost", async () => {
      validationRepositoryMock.listByValidator.mockResolvedValue({
        items: [
          {
            contentHash: "0x1",
            vote: "TRUE",
            round: 0,
            publication: { title: "A" },
            createdAt: new Date(),
          },
          {
            contentHash: "0x2",
            vote: "TRUE",
            round: 0,
            publication: { title: "B" },
            createdAt: new Date(),
          },
        ],
        total: 2,
      });
      roundRepositoryMock.findByContentHashes.mockResolvedValue([
        { contentHash: "0x1", round: 0, state: "DEFINITIVE", result: "TRUE" },
        { contentHash: "0x2", round: 0, state: "DISPUTED", result: null },
      ]);

      const { items } = await validatorService.getHistory(ADDRESS);

      expect(items[0].outcome).toBe("won");
      expect(items[1].outcome).toBe("unresolved");
    });
  });

  describe("getReputationHistory", () => {
    it("serializa blockNumber (BigInt) a string", async () => {
      reputationEventRepositoryMock.listByAddress.mockResolvedValue({
        items: [
          {
            id: 1,
            address: ADDRESS,
            delta: 5,
            newScore: 15,
            reason: "VOTE_REWARD",
            contentHash: "0x1",
            round: 0,
            txHash: "0xtx",
            blockNumber: 123456789n,
            createdAt: new Date(),
          },
        ],
        total: 1,
      });

      const { items } = await validatorService.getReputationHistory(ADDRESS);

      expect(items[0].blockNumber).toBe("123456789");
      expect(typeof items[0].blockNumber).toBe("string");
    });
  });

  describe("getActivity", () => {
    it("une y ordena cronológicamente publicaciones, votos, reaperturas y reclamaciones", async () => {
      const old = new Date("2026-01-01T00:00:00Z");
      const mid = new Date("2026-02-01T00:00:00Z");
      const recent = new Date("2026-03-01T00:00:00Z");

      publicationRepositoryMock.list.mockResolvedValue({
        items: [{ contentHash: "0xpub", title: "Publicación", createdAt: old }],
        total: 1,
      });
      validationRepositoryMock.listByValidator.mockResolvedValue({
        items: [
          {
            contentHash: "0xval",
            vote: "TRUE",
            round: 0,
            txHash: "0xtx1",
            createdAt: recent,
            publication: { title: "Votada" },
          },
        ],
        total: 1,
      });
      reopenRequestRepositoryMock.listByRequester.mockResolvedValue([
        {
          contentHash: "0xreopen",
          txHash: "0xtx2",
          createdAt: mid,
          publication: { title: "Reapertura" },
        },
      ]);
      retroactiveClaimRepositoryMock.listByValidator.mockResolvedValue([]);
      publicationRepositoryMock.findTitlesByHashes.mockResolvedValue([]);

      const { items, total } = await validatorService.getActivity(ADDRESS);

      expect(total).toBe(3);
      expect(items.map((i) => i.type)).toEqual(["VALIDATION", "REOPEN_REQUEST", "PUBLICATION"]);
    });

    it("pagina el feed combinado en memoria", async () => {
      publicationRepositoryMock.list.mockResolvedValue({
        items: Array.from({ length: 5 }, (_, i) => ({
          contentHash: `0x${i}`,
          title: `P${i}`,
          createdAt: new Date(2026, 0, i + 1),
        })),
        total: 5,
      });
      validationRepositoryMock.listByValidator.mockResolvedValue({ items: [], total: 0 });
      reopenRequestRepositoryMock.listByRequester.mockResolvedValue([]);
      retroactiveClaimRepositoryMock.listByValidator.mockResolvedValue([]);
      publicationRepositoryMock.findTitlesByHashes.mockResolvedValue([]);

      const { items, total, page, limit } = await validatorService.getActivity(ADDRESS, 2, 2);

      expect(total).toBe(5);
      expect(page).toBe(2);
      expect(limit).toBe(2);
      expect(items).toHaveLength(2);
    });
  });
});
