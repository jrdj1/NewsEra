export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface CreatePublicationBody {
  contentHash: string;
  ipfsCid?: string;
  title: string;
  body: string;
  tags?: string[];
  /** Hashes de otras publicaciones citadas — persistidos en PublicationLink
   * además de estar ya embebidos como texto en `body` (que compone el hash
   * on-chain, RD6). */
  links?: string[];
}

export interface ReopenRequestBody {
  requesterAddress: string;
  txHash?: string;
}

export interface ClaimRetroactiveBody {
  validatorAddress: string;
  netDelta: number;
  txHash?: string;
}

export interface FavoriteBody {
  userAddress: string;
}

export interface FollowBody {
  userAddress: string;
}

export interface UpdateProfileBody {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  signature: string;
  message: string;
}

export type ValidationOutcome = "won" | "lost" | "unresolved";
