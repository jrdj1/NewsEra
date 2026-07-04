import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { profileRepository } from "../repositories/profile.repository.js";
import { favoriteRepository } from "../repositories/favorite.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { verifyProfileSignature } from "./signature.js";
import type { UpdateProfileBody, Paginated } from "../types/api.js";

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
};
