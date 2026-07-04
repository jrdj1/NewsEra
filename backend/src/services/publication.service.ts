import { keccak256, toBytes } from "viem";
import { AppError } from "../errors/AppError.js";
import { normalizeAddress } from "../lib/address.js";
import { publicationRepository, type PublicationSort } from "../repositories/publication.repository.js";
import { reopenRequestRepository } from "../repositories/reopen-request.repository.js";
import { retroactiveClaimRepository } from "../repositories/retroactive-claim.repository.js";
import { publicClient } from "../lib/viem.js";
import { publicationRegistryAbi } from "../lib/abis.js";
import type { CreatePublicationBody, ReopenRequestBody, ClaimRetroactiveBody, Paginated } from "../types/api.js";

function getPublicationRegistryAddress(): `0x${string}` {
  const address = process.env.PUBLICATION_REGISTRY_ADDRESS;
  if (!address) throw new AppError("INTERNAL_ERROR", "PUBLICATION_REGISTRY_ADDRESS no configurado");
  return address as `0x${string}`;
}

export const publicationService = {
  async list(params: {
    page?: number;
    limit?: number;
    state?: string;
    tags?: string;
    author?: string;
    sort?: PublicationSort;
  }): Promise<Paginated<unknown>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const tags = params.tags ? params.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

    const { items, total } = await publicationRepository.list({
      page,
      limit,
      state: params.state,
      tags,
      author: params.author ? normalizeAddress(params.author) : undefined,
      sort: params.sort,
    });

    return { items, page, limit, total };
  },

  async getByHash(hash: string) {
    const publication = await publicationRepository.getByHash(hash);
    if (!publication) throw new AppError("NOT_FOUND", `Publicación no encontrada: ${hash}`);
    return publication;
  },

  async create(body: CreatePublicationBody) {
    const { contentHash, ipfsCid, title, body: articleBody, tags = [] } = body;

    if (await publicationRepository.existsByHash(contentHash)) {
      throw new AppError("CONFLICT", `Ya existe una publicación registrada con hash ${contentHash}`);
    }

    if (keccak256(toBytes(articleBody)) !== contentHash) {
      throw new AppError(
        "UNPROCESSABLE",
        "keccak256(body) no coincide con el contentHash indicado",
      );
    }

    let onChainAuthor: string;
    try {
      const publication = (await publicClient.readContract({
        address: getPublicationRegistryAddress(),
        abi: publicationRegistryAbi,
        functionName: "getPublication",
        args: [contentHash as `0x${string}`],
      })) as { author: string };
      onChainAuthor = publication.author;
    } catch {
      throw new AppError(
        "UNPROCESSABLE",
        `El contentHash ${contentHash} no está registrado on-chain en PublicationRegistry`,
      );
    }

    return publicationRepository.create({
      contentHash,
      title,
      body: articleBody,
      authorAddress: onChainAuthor,
      tags,
      ipfsCid,
    });
  },

  async requestReopen(hash: string, body: ReopenRequestBody) {
    const requesterAddress = normalizeAddress(body.requesterAddress);
    if (!(await publicationRepository.existsByHash(hash))) {
      throw new AppError("NOT_FOUND", `Publicación no encontrada: ${hash}`);
    }
    if (await reopenRequestRepository.existsFor(hash, requesterAddress)) {
      throw new AppError("CONFLICT", `${requesterAddress} ya solicitó la reapertura de ${hash}`);
    }
    return reopenRequestRepository.create({
      contentHash: hash,
      requesterAddress,
      txHash: body.txHash,
    });
  },

  async claimRetroactive(hash: string, body: ClaimRetroactiveBody) {
    const validatorAddress = normalizeAddress(body.validatorAddress);
    if (!(await publicationRepository.existsByHash(hash))) {
      throw new AppError("NOT_FOUND", `Publicación no encontrada: ${hash}`);
    }
    if (
      body.txHash &&
      (await retroactiveClaimRepository.existsFor(hash, validatorAddress, body.txHash))
    ) {
      throw new AppError(
        "CONFLICT",
        `Reclamación retroactiva ya registrada para ${validatorAddress} en ${hash} (${body.txHash})`,
      );
    }
    return retroactiveClaimRepository.create({
      contentHash: hash,
      validatorAddress,
      netDelta: body.netDelta,
      txHash: body.txHash,
    });
  },
};
