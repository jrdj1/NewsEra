import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { favoriteRepository } from "../repositories/favorite.repository.js";
import { publicationRepository } from "../repositories/publication.repository.js";

export const favoriteService = {
  async add(hash: string, rawUserAddress: string) {
    const userAddress = normalizeAddress(rawUserAddress);
    if (!(await publicationRepository.existsByHash(hash))) {
      throw new AppError("NOT_FOUND", `Publicación no encontrada: ${hash}`);
    }
    if (await favoriteRepository.exists(userAddress, hash)) {
      throw new AppError("CONFLICT", `${userAddress} ya tiene ${hash} en favoritos`);
    }
    return favoriteRepository.add(userAddress, hash);
  },

  async remove(hash: string, rawUserAddress: string) {
    const userAddress = normalizeAddress(rawUserAddress);
    await favoriteRepository.remove(userAddress, hash);
  },
};
