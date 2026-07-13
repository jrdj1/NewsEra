/**
 * Tests unitarios de publicationService — repositorios y publicClient
 * mockeados con vi.fn(), sin Postgres ni nodo Hardhat reales.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { keccak256, toBytes } from "viem";

const publicationRepositoryMock = {
  list: vi.fn(),
  listDistinctTags: vi.fn(),
  getByHash: vi.fn(),
  existsByHash: vi.fn(),
  create: vi.fn(),
};

const reopenRequestRepositoryMock = {
  existsFor: vi.fn(),
  create: vi.fn(),
};

const retroactiveClaimRepositoryMock = {
  existsFor: vi.fn(),
  create: vi.fn(),
};

const publicClientMock = {
  readContract: vi.fn(),
};

vi.mock("../../src/repositories/publication.repository.js", () => ({
  publicationRepository: publicationRepositoryMock,
}));
vi.mock("../../src/repositories/reopen-request.repository.js", () => ({
  reopenRequestRepository: reopenRequestRepositoryMock,
}));
vi.mock("../../src/repositories/retroactive-claim.repository.js", () => ({
  retroactiveClaimRepository: retroactiveClaimRepositoryMock,
}));
vi.mock("../../src/lib/viem.js", () => ({
  publicClient: publicClientMock,
}));

const { publicationService } = await import("../../src/services/publication.service.js");

const AUTHOR = "0x1111111111111111111111111111111111111111";

describe("publicationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUBLICATION_REGISTRY_ADDRESS = "0x2222222222222222222222222222222222222222";
  });

  describe("list", () => {
    it("aplica valores por defecto de paginación (page=1, limit=20)", async () => {
      publicationRepositoryMock.list.mockResolvedValue({ items: [], total: 0 });

      await publicationService.list({});

      expect(publicationRepositoryMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it("nunca deja page por debajo de 1 ni limit por debajo de 1", async () => {
      publicationRepositoryMock.list.mockResolvedValue({ items: [], total: 0 });

      await publicationService.list({ page: -5, limit: -1 });

      expect(publicationRepositoryMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 1 }),
      );
    });

    it("limita limit a un máximo de 100", async () => {
      publicationRepositoryMock.list.mockResolvedValue({ items: [], total: 0 });

      await publicationService.list({ limit: 5000 });

      expect(publicationRepositoryMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });

    it("divide la lista de tags separada por comas y descarta vacíos", async () => {
      publicationRepositoryMock.list.mockResolvedValue({ items: [], total: 0 });

      await publicationService.list({ tags: "política, ,  economía " });

      expect(publicationRepositoryMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ["política", "economía"] }),
      );
    });

    it("normaliza la dirección del autor si se indica", async () => {
      publicationRepositoryMock.list.mockResolvedValue({ items: [], total: 0 });
      const lower = "0x1111111111111111111111111111111111111111";

      await publicationService.list({ author: lower });

      expect(publicationRepositoryMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ author: expect.stringMatching(/^0x/i) }),
      );
    });
  });

  describe("getByHash", () => {
    it("revierte con NOT_FOUND si la publicación no existe", async () => {
      publicationRepositoryMock.getByHash.mockResolvedValue(null);

      await expect(publicationService.getByHash("0xabc")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("devuelve la publicación si existe", async () => {
      const pub = { contentHash: "0xabc", title: "t" };
      publicationRepositoryMock.getByHash.mockResolvedValue(pub);

      await expect(publicationService.getByHash("0xabc")).resolves.toBe(pub);
    });
  });

  describe("create", () => {
    const body = "cuerpo del artículo de prueba";
    const contentHash = keccak256(toBytes(body));

    function baseInput(overrides: Partial<Parameters<typeof publicationService.create>[0]> = {}) {
      return {
        contentHash,
        title: "Título",
        body,
        tags: [],
        links: [],
        ...overrides,
      };
    }

    it("revierte con CONFLICT si el hash ya está registrado en la BD", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(true);

      await expect(publicationService.create(baseInput())).rejects.toMatchObject({
        code: "CONFLICT",
      });
      expect(publicClientMock.readContract).not.toHaveBeenCalled();
    });

    it("revierte con UNPROCESSABLE si keccak256(body) no coincide con contentHash", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(false);

      await expect(
        publicationService.create(baseInput({ contentHash: "0xdeadbeef" })),
      ).rejects.toMatchObject({ code: "UNPROCESSABLE" });
    });

    it("revierte con UNPROCESSABLE si un enlace interno no corresponde a una publicación existente", async () => {
      publicationRepositoryMock.existsByHash
        .mockResolvedValueOnce(false) // el propio contentHash no existe aún
        .mockResolvedValueOnce(false); // el link no existe

      await expect(
        publicationService.create(baseInput({ links: ["0xlinkinexistente"] })),
      ).rejects.toMatchObject({ code: "UNPROCESSABLE" });
    });

    it("revierte con UNPROCESSABLE si el contentHash no está registrado on-chain", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(false);
      publicClientMock.readContract.mockRejectedValue(new Error("revert"));

      await expect(publicationService.create(baseInput())).rejects.toMatchObject({
        code: "UNPROCESSABLE",
      });
    });

    it("crea la publicación con el autor leído on-chain cuando todo es válido", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(false);
      publicClientMock.readContract.mockResolvedValue({ author: AUTHOR, timestamp: 123n, exists: true });
      publicationRepositoryMock.create.mockResolvedValue({ contentHash, authorAddress: AUTHOR });

      const result = await publicationService.create(baseInput());

      expect(publicationRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ contentHash, authorAddress: AUTHOR }),
      );
      expect(result).toEqual({ contentHash, authorAddress: AUTHOR });
    });
  });

  describe("requestReopen", () => {
    it("revierte con NOT_FOUND si la publicación no existe", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(false);

      await expect(
        publicationService.requestReopen("0xabc", { requesterAddress: AUTHOR }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("revierte con CONFLICT si el usuario ya solicitó la reapertura", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(true);
      reopenRequestRepositoryMock.existsFor.mockResolvedValue(true);

      await expect(
        publicationService.requestReopen("0xabc", { requesterAddress: AUTHOR }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("registra la solicitud de reapertura cuando es válida", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(true);
      reopenRequestRepositoryMock.existsFor.mockResolvedValue(false);
      reopenRequestRepositoryMock.create.mockResolvedValue({ id: 1 });

      const result = await publicationService.requestReopen("0xabc", { requesterAddress: AUTHOR });

      expect(reopenRequestRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ contentHash: "0xabc" }),
      );
      expect(result).toEqual({ id: 1 });
    });
  });

  describe("claimRetroactive", () => {
    it("revierte con NOT_FOUND si la publicación no existe", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(false);

      await expect(
        publicationService.claimRetroactive("0xabc", { validatorAddress: AUTHOR, netDelta: 1 }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("revierte con CONFLICT si ya existe la misma reclamación (mismo txHash)", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(true);
      retroactiveClaimRepositoryMock.existsFor.mockResolvedValue(true);

      await expect(
        publicationService.claimRetroactive("0xabc", {
          validatorAddress: AUTHOR,
          netDelta: 1,
          txHash: "0xtx",
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("registra la reclamación cuando es válida", async () => {
      publicationRepositoryMock.existsByHash.mockResolvedValue(true);
      retroactiveClaimRepositoryMock.create.mockResolvedValue({ id: 1 });

      const result = await publicationService.claimRetroactive("0xabc", {
        validatorAddress: AUTHOR,
        netDelta: -2,
      });

      expect(retroactiveClaimRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ contentHash: "0xabc", netDelta: -2 }),
      );
      expect(result).toEqual({ id: 1 });
    });
  });
});
