import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { profileRepository } from "../repositories/profile.repository.js";
import { favoriteRepository } from "../repositories/favorite.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { reopenRequestRepository } from "../repositories/reopen-request.repository.js";
import { verifyProfileSignature } from "./signature.js";
import type { UpdateProfileBody, Paginated } from "../types/api.js";

// Ventana de frescura del mensaje firmado en PUT /profile/:address (Bug D6):
// sin esto, cualquier firma válida antigua capturada podía reenviarse en
// cualquier momento posterior y el backend la aceptaba como edición nueva.
const PROFILE_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos
const PROFILE_SIGNATURE_CLOCK_SKEW_MS = 60 * 1000; // tolerancia por desfase de reloj del cliente

function assertFreshSignature(message: string): void {
  let timestamp: unknown;
  try {
    timestamp = JSON.parse(message).timestamp;
  } catch {
    throw new AppError("FORBIDDEN", "La firma ha caducado, vuelve a firmar");
  }

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new AppError("FORBIDDEN", "La firma ha caducado, vuelve a firmar");
  }

  const age = Date.now() - timestamp;
  if (age > PROFILE_SIGNATURE_MAX_AGE_MS || age < -PROFILE_SIGNATURE_CLOCK_SKEW_MS) {
    throw new AppError("FORBIDDEN", "La firma ha caducado, vuelve a firmar");
  }
}

export const profileService = {
  async getPublic(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    const profile = await profileRepository.getByAddress(address);
    return {
      address,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  },

  async update(rawAddress: string, body: UpdateProfileBody) {
    const address = normalizeAddress(rawAddress);
    const { displayName, avatarUrl, email, signature, message } = body;

    const valid = await verifyProfileSignature(address, message, signature);
    if (!valid) {
      throw new AppError("FORBIDDEN", "La firma no corresponde a la dirección indicada");
    }
    assertFreshSignature(message);

    return profileRepository.upsert(address, { displayName, avatarUrl, email });
  },

  async getFavorites(rawAddress: string, page = 1, limit = 20): Promise<Paginated<unknown>> {
    const address = normalizeAddress(rawAddress);
    const { items, total } = await favoriteRepository.listByUser(address, page, limit);
    return { items, page, limit, total };
  },

  async getNotifications(rawAddress: string, page = 1, limit = 20): Promise<Paginated<unknown>> {
    const address = normalizeAddress(rawAddress);
    const { items, total } = await notificationRepository.listByUser(address, page, limit);
    return { items, page, limit, total };
  },

  /**
   * HU-8.7/UC 9 (Sprint 8): no existía un endpoint para las solicitudes de
   * reapertura propias del usuario — se añade aquí en vez de en Sprint 7
   * porque el frontend es el primer consumidor de este listado.
   */
  async getReopenRequests(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    return reopenRequestRepository.listByRequester(address);
  },
};
