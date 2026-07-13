/**
 * Tests unitarios de profileService — repositorios y verifyProfileSignature
 * mockeados con vi.fn(), sin Postgres real. Cubre la verificación de firma
 * personal_sign y la ventana de frescura anti-replay de 5 min (bug D6).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const profileRepositoryMock = {
  getByAddress: vi.fn(),
  upsert: vi.fn(),
};
const favoriteRepositoryMock = {
  listByUser: vi.fn(),
};
const notificationRepositoryMock = {
  listByUser: vi.fn(),
};
const reopenRequestRepositoryMock = {
  listByRequester: vi.fn(),
};
const verifyProfileSignatureMock = vi.fn();

vi.mock("../../src/repositories/profile.repository.js", () => ({
  profileRepository: profileRepositoryMock,
}));
vi.mock("../../src/repositories/favorite.repository.js", () => ({
  favoriteRepository: favoriteRepositoryMock,
}));
vi.mock("../../src/repositories/notification.repository.js", () => ({
  notificationRepository: notificationRepositoryMock,
}));
vi.mock("../../src/repositories/reopen-request.repository.js", () => ({
  reopenRequestRepository: reopenRequestRepositoryMock,
}));
vi.mock("../../src/services/signature.js", () => ({
  verifyProfileSignature: verifyProfileSignatureMock,
}));

const { profileService } = await import("../../src/services/profile.service.js");

const ADDRESS = "0x1111111111111111111111111111111111111111";

function signedBody(timestampOffsetMs: number, overrides: Record<string, unknown> = {}) {
  const message = JSON.stringify({ timestamp: Date.now() + timestampOffsetMs, ...overrides });
  return { displayName: "Nuevo nombre", signature: "0xsig", message };
}

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getPublic", () => {
    it("nunca expone email, aunque el perfil lo tenga", async () => {
      profileRepositoryMock.getByAddress.mockResolvedValue({
        displayName: "Ana",
        avatarUrl: "http://x/a.jpg",
        email: "ana@example.com",
      });

      const result = await profileService.getPublic(ADDRESS);

      expect(result).not.toHaveProperty("email");
      expect(result.displayName).toBe("Ana");
    });

    it("devuelve displayName/avatarUrl null si no hay perfil enriquecido", async () => {
      profileRepositoryMock.getByAddress.mockResolvedValue(null);

      const result = await profileService.getPublic(ADDRESS);

      expect(result.displayName).toBeNull();
      expect(result.avatarUrl).toBeNull();
    });
  });

  describe("update", () => {
    it("revierte con FORBIDDEN si la firma no corresponde a la dirección", async () => {
      verifyProfileSignatureMock.mockResolvedValue(false);

      await expect(profileService.update(ADDRESS, signedBody(0))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(profileRepositoryMock.upsert).not.toHaveBeenCalled();
    });

    it("acepta una firma fresca (timestamp actual) y persiste el perfil", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);
      profileRepositoryMock.upsert.mockResolvedValue({ address: ADDRESS, displayName: "Nuevo nombre" });

      const result = await profileService.update(ADDRESS, signedBody(0));

      expect(profileRepositoryMock.upsert).toHaveBeenCalledWith(
        ADDRESS,
        expect.objectContaining({ displayName: "Nuevo nombre" }),
      );
      expect(result).toEqual({ address: ADDRESS, displayName: "Nuevo nombre" });
    });

    it("revierte con FORBIDDEN si el timestamp tiene más de 5 minutos de antigüedad", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);
      const sixMinutesAgo = -(6 * 60 * 1000);

      await expect(profileService.update(ADDRESS, signedBody(sixMinutesAgo))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(profileRepositoryMock.upsert).not.toHaveBeenCalled();
    });

    it("revierte con FORBIDDEN si el timestamp está muy por delante del reloj del servidor", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);
      const twoMinutesAhead = 2 * 60 * 1000;

      await expect(profileService.update(ADDRESS, signedBody(twoMinutesAhead))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("tolera un pequeño desfase de reloj del cliente hacia el futuro (< 60s)", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);
      profileRepositoryMock.upsert.mockResolvedValue({ address: ADDRESS });
      const thirtySecondsAhead = 30 * 1000;

      await expect(profileService.update(ADDRESS, signedBody(thirtySecondsAhead))).resolves.toBeDefined();
    });

    it("revierte con FORBIDDEN si el mensaje no es JSON válido", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);

      await expect(
        profileService.update(ADDRESS, { displayName: "x", signature: "0xsig", message: "no-json" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("revierte con FORBIDDEN si el mensaje no incluye un timestamp numérico", async () => {
      verifyProfileSignatureMock.mockResolvedValue(true);
      const message = JSON.stringify({ displayName: "x" });

      await expect(
        profileService.update(ADDRESS, { displayName: "x", signature: "0xsig", message }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("getFavorites / getNotifications / getReopenRequests", () => {
    it("delega en el repositorio correspondiente con la dirección normalizada", async () => {
      favoriteRepositoryMock.listByUser.mockResolvedValue({ items: [], total: 0 });
      notificationRepositoryMock.listByUser.mockResolvedValue({ items: [], total: 0 });
      reopenRequestRepositoryMock.listByRequester.mockResolvedValue([]);

      await profileService.getFavorites(ADDRESS);
      await profileService.getNotifications(ADDRESS);
      await profileService.getReopenRequests(ADDRESS);

      expect(favoriteRepositoryMock.listByUser).toHaveBeenCalledWith(ADDRESS, 1, 20);
      expect(notificationRepositoryMock.listByUser).toHaveBeenCalledWith(ADDRESS, 1, 20);
      expect(reopenRequestRepositoryMock.listByRequester).toHaveBeenCalledWith(ADDRESS);
    });
  });
});
