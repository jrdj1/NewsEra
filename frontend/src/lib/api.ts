const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    const message = body?.error?.message ?? `Error ${res.status}`;
    throw new ApiError(code, message, res.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface Round {
  id: number;
  contentHash: string;
  round: number;
  state: "PENDING" | "DEFINITIVE" | "DISPUTED" | "PENDING_REOPEN";
  result: "TRUE" | "FALSE" | "UNVERIFIABLE" | null;
  completed: boolean;
}

export interface Validation {
  id: number;
  contentHash: string;
  validatorAddress: string;
  vote: "TRUE" | "FALSE" | "UNVERIFIABLE";
  round: number;
  txHash: string | null;
  createdAt: string;
}

export interface Publication {
  id: number;
  contentHash: string;
  title: string;
  body: string;
  authorAddress: string;
  tags: string[];
  ipfsCid: string | null;
  consensusState: "PENDING" | "DEFINITIVE" | "DISPUTED";
  currentResult: "TRUE" | "FALSE" | "UNVERIFIABLE" | null;
  currentRound: number;
  reopenRequestCount: number;
  createdAt: string;
  voteCount?: number;
  rounds?: Round[];
  validations?: Validation[];
}

export interface Validator {
  address: string;
  reputationScore: number;
  registeredAt: string;
  updatedAt: string;
}

export interface UserSummary {
  address: string;
  reputationScore: number;
  articleCount: number;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ValidatorDetail {
  address: string;
  reputationScore: number;
  totalValidations: number;
  correctVotes: number;
  accuracy: number | null;
}

export interface ValidationHistoryEntry {
  contentHash: string;
  title: string;
  vote: string;
  round: number;
  roundState: string;
  roundResult: string | null;
  outcome: "won" | "lost" | "unresolved";
  createdAt: string;
}

export type ReputationReason =
  | "VOTE_REWARD"
  | "VOTE_PENALTY"
  | "PUBLISH_REWARD"
  | "PUBLISH_PENALTY"
  | "RETROACTIVE"
  | "PREDICTION_REWARD"
  | "PREDICTION_PENALTY"
  | "REGISTERED";

export interface ReputationHistoryEntry {
  id: number;
  address: string;
  contentHash: string | null;
  round: number | null;
  delta: number;
  newScore: number;
  reason: ReputationReason;
  txHash: string | null;
  blockNumber: string;
  createdAt: string;
}

export type ActivityType = "PUBLICATION" | "VALIDATION" | "REOPEN_REQUEST" | "RETROACTIVE_CLAIM";

export interface ActivityItem {
  type: ActivityType;
  contentHash: string;
  title: string;
  round: number | null;
  vote: string | null;
  netDelta: number | null;
  txHash: string | null;
  createdAt: string;
}

export interface EnrichedProfile {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface FavoriteEntry {
  id: number;
  userAddress: string;
  contentHash: string;
  createdAt: string;
  publication: Publication;
}

export interface NotificationEntry {
  id: number;
  userAddress: string;
  contentHash: string;
  type: "REOPENED" | "CONSENSUS_REACHED" | "RETROACTIVE_APPLIED";
  read: boolean;
  createdAt: string;
}
