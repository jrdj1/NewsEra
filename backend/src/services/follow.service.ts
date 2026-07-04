import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { followRepository } from "../repositories/follow.repository.js";
import { publicationRepository } from "../repositories/publication.repository.js";

export const followService = {
  async add(hash: string, rawUserAddress: string) {
    const userAddress = normalizeAddress(rawUserAddress);
    if (!(await publicationRepository.existsByHash(hash))) {
      throw new AppError("NOT_FOUND", `Publicación no encontrada: ${hash}`);
    }
    if (await followRepository.exists(userAddress, hash)) {
      throw new AppError("CONFLICT", `${userAddress} ya sigue ${hash}`);
    }
    return followRepository.add(userAddress, hash);
  },

  async remove(hash: string, rawUserAddress: string) {
    const userAddress = normalizeAddress(rawUserAddress);
    await followRepository.remove(userAddress, hash);
  },
};
