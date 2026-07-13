// Demo estática: no hay backend real. Esta capa mantiene exactamente la
// misma forma (`api.get/post/put/patch/delete`, `ApiError`) que la versión
// real (`frontend/src/lib/api.ts`), pero enruta cada llamada contra
// `demoStore` (datos en memoria, ver src/demo/store.ts) en vez de hacer
// `fetch` — así ningún hook (usePublications, useUsers, useProfile, ...)
// necesita cambiar una sola línea.
import { demoStore } from "@/demo/store";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function parseQuery(search: string): URLSearchParams {
  return new URLSearchParams(search);
}

function splitPath(path: string): { pathname: string; query: URLSearchParams } {
  const [pathname, search = ""] = path.split("?");
  return { pathname, query: parseQuery(search) };
}

function match(pathname: string, pattern: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return params;
}

async function route<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { pathname, query } = splitPath(path);
  const page = query.get("page") ? Number(query.get("page")) : undefined;
  const limit = query.get("limit") ? Number(query.get("limit")) : undefined;
  let params: Record<string, string> | null;

  if (method === "GET" && (params = match(pathname, "/api/v1/publications/tags"))) {
    return demoStore.getDistinctTags() as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/publications"))) {
    return demoStore.getPublications({
      page,
      limit,
      state: query.get("state") ?? undefined,
      result: query.get("result") ?? undefined,
      tags: query.get("tags")?.split(",").filter(Boolean),
      author: query.get("author") ?? undefined,
      search: query.get("search") ?? undefined,
      sort: (query.get("sort") as "recent" | "votes" | "state" | null) ?? undefined,
    }) as T;
  }
  if (method === "POST" && match(pathname, "/api/v1/publications")) {
    const b = body as {
      contentHash: string;
      ipfsCid?: string;
      title: string;
      body: string;
      tags: string[];
      links?: string[];
    };
    return demoStore.createPublication(b) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/publications/:hash"))) {
    const publication = demoStore.getPublicationByHash(params.hash);
    if (!publication) throw new ApiError("NOT_FOUND", `Publicación no encontrada: ${params.hash}`, 404);
    return publication as T;
  }
  if (method === "POST" && (params = match(pathname, "/api/v1/favorites/:hash"))) {
    demoStore.addFavorite((body as { userAddress: string }).userAddress, params.hash);
    return undefined as T;
  }
  if (method === "DELETE" && (params = match(pathname, "/api/v1/favorites/:hash"))) {
    demoStore.removeFavorite((body as { userAddress: string }).userAddress, params.hash);
    return undefined as T;
  }
  if (method === "POST" && (params = match(pathname, "/api/v1/publications/:hash/follow"))) {
    demoStore.addFollow((body as { userAddress: string }).userAddress, params.hash);
    return undefined as T;
  }
  if (method === "DELETE" && (params = match(pathname, "/api/v1/publications/:hash/follow"))) {
    demoStore.removeFollow((body as { userAddress: string }).userAddress, params.hash);
    return undefined as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/profile/:address/favorites"))) {
    return demoStore.getFavorites(params.address, page, limit) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/profile/:address/notifications"))) {
    return demoStore.getNotifications(params.address) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/profile/:address/reopen-requests"))) {
    return demoStore.getReopenRequests(params.address) as T;
  }
  if (method === "PUT" && (params = match(pathname, "/api/v1/profile/:address"))) {
    const b = body as { displayName?: string; avatarUrl?: string };
    demoStore.updateProfile(params.address, b);
    return demoStore.getProfile(params.address) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/profile/:address"))) {
    return demoStore.getProfile(params.address) as T;
  }
  if (method === "PATCH" && (params = match(pathname, "/api/v1/notifications/:id/read"))) {
    demoStore.markNotificationRead(Number(params.id));
    return undefined as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/users/:address"))) {
    return demoStore.getUserDetail(params.address) as T;
  }
  if (method === "GET" && match(pathname, "/api/v1/users")) {
    return demoStore.getUsers(
      page,
      limit,
      (query.get("sort") as "reputation" | "articles" | null) ?? undefined,
      query.get("search") ?? undefined,
    ) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/validators/:address/history"))) {
    return demoStore.getValidationHistory(params.address, page, limit) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/validators/:address/reputation-history"))) {
    return demoStore.getReputationHistory(params.address, page, limit) as T;
  }
  if (method === "GET" && (params = match(pathname, "/api/v1/validators/:address/activity"))) {
    return demoStore.getActivity(params.address, page, limit) as T;
  }

  throw new ApiError("NOT_FOUND", `Ruta de demo no implementada: ${method} ${path}`, 404);
}

export const api = {
  get: <T>(path: string) => route<T>("GET", path),
  post: <T>(path: string, body?: unknown) => route<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => route<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => route<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) => route<T>("DELETE", path, body),
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
  /** Enlaces internos citados — solo presente en el detalle (GET /:hash). */
  links?: { contentHash: string; title: string }[];
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
