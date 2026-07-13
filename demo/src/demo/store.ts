import { keccak256, toBytes } from "viem";
import seed from "../../../docs/seed/articles.json";
import { addressOf } from "./addresses";
import type {
  Publication,
  Round,
  Validation,
  UserSummary,
  EnrichedProfile,
  ReputationHistoryEntry,
  ReputationReason,
  ActivityItem,
  FavoriteEntry,
  NotificationEntry,
} from "@/lib/api";

type Scenario =
  | "PENDING_ZERO"
  | "PENDING_PARTIAL"
  | "DEFINITIVE_TRUE"
  | "DEFINITIVE_FALSE"
  | "DEFINITIVE_UNVERIFIABLE"
  | "DISPUTED"
  | "REOPEN_TO_FALSE";

type SeedArticle = {
  id: string;
  scenario: Scenario;
  authorIndex: number;
  title: string;
  body: string;
  tags: string[];
};

type SeedProfile = {
  signerIndex: number;
  displayName: string;
  gender: "male" | "female";
  avatarImg: number;
  email?: string;
};

const seedData = seed as {
  accounts: { admin: number; authorPool: number[]; validators: number[]; predictors: number[]; readyValidator: number };
  profiles: SeedProfile[];
  articles: SeedArticle[];
};

/** Dirección "conectada" en la demo — persona con reputación suficiente para
 * votar de verdad, así se ve la interacción central de la plataforma
 * (votar) sin necesitar una cartera real. */
export const DEMO_ADDRESS = addressOf(seedData.accounts.readyValidator);

const VALIDATOR_INDICES = seedData.accounts.validators; // [11..16]
const QUORUM = 3;

// ── Construcción de perfiles enriquecidos ────────────────────────────────
const profilesByAddress = new Map<string, EnrichedProfile & { gender?: string }>();
for (const p of seedData.profiles) {
  const address = addressOf(p.signerIndex);
  const genderPath = p.gender === "male" ? "men" : "women";
  profilesByAddress.set(address, {
    address,
    displayName: p.displayName,
    avatarUrl: `https://randomuser.me/api/portraits/${genderPath}/${p.avatarImg}.jpg`,
  });
}

// ── Construcción de artículos + rondas + votos según el escenario ────────
interface ReputationEventInternal {
  id: number;
  address: string;
  delta: number;
  reason: ReputationReason;
  contentHash: string | null;
  round: number | null;
  txHash: string | null;
  createdAt: string;
}

let eventIdSeq = 1;
let validationIdSeq = 1;
let notificationIdSeq = 1;
const reputationEvents: ReputationEventInternal[] = [];
const publications: Publication[] = [];

function fakeTxHash(seedStr: string): string {
  return keccak256(toBytes(`tx:${seedStr}`));
}

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function pushReputationEvent(
  address: string,
  delta: number,
  reason: ReputationReason,
  contentHash: string | null,
  round: number | null,
  daysAgo: number,
) {
  reputationEvents.push({
    id: eventIdSeq++,
    address,
    delta,
    reason,
    contentHash,
    round,
    txHash: fakeTxHash(`${address}-${reason}-${contentHash}-${round}-${eventIdSeq}`),
    createdAt: isoDate(daysAgo),
  });
}

// REGISTERED — bootstrapping manual de los 6 validadores (+10 cada uno).
VALIDATOR_INDICES.forEach((idx, i) => {
  pushReputationEvent(addressOf(idx), 10, "REGISTERED", null, null, 20 - i);
});

let dayCounter = 18;
for (const article of seedData.articles) {
  const contentHash = keccak256(toBytes(article.body));
  const authorAddress = addressOf(article.authorIndex);
  const createdAt = isoDate(dayCounter);

  const rounds: Round[] = [];
  const validations: Validation[] = [];
  let consensusState: Publication["consensusState"] = "PENDING";
  let currentResult: Publication["currentResult"] = null;
  let currentRound = 0;

  function addVote(validatorIdx: number, vote: "TRUE" | "FALSE" | "UNVERIFIABLE", round: number) {
    validations.push({
      id: validationIdSeq++,
      contentHash,
      validatorAddress: addressOf(validatorIdx),
      vote,
      round,
      txHash: fakeTxHash(`${contentHash}-${validatorIdx}-${round}`),
      createdAt: isoDate(dayCounter - round),
    });
  }

  switch (article.scenario) {
    case "PENDING_ZERO":
      rounds.push({ id: rounds.length + 1, contentHash, round: 0, state: "PENDING", result: null, completed: false });
      break;

    case "PENDING_PARTIAL":
      rounds.push({ id: rounds.length + 1, contentHash, round: 0, state: "PENDING", result: null, completed: false });
      addVote(VALIDATOR_INDICES[0], "TRUE", 0);
      break;

    case "DEFINITIVE_TRUE":
    case "DEFINITIVE_FALSE":
    case "DEFINITIVE_UNVERIFIABLE": {
      const vote =
        article.scenario === "DEFINITIVE_TRUE" ? "TRUE" : article.scenario === "DEFINITIVE_FALSE" ? "FALSE" : "UNVERIFIABLE";
      for (let i = 0; i < 3; i++) addVote(VALIDATOR_INDICES[i], vote, 0);
      rounds.push({ id: rounds.length + 1, contentHash, round: 0, state: "DEFINITIVE", result: vote, completed: true });
      consensusState = "DEFINITIVE";
      currentResult = vote;
      break;
    }

    case "DISPUTED":
      addVote(VALIDATOR_INDICES[0], "TRUE", 0);
      addVote(VALIDATOR_INDICES[1], "TRUE", 0);
      addVote(VALIDATOR_INDICES[2], "FALSE", 0);
      rounds.push({ id: rounds.length + 1, contentHash, round: 0, state: "DISPUTED", result: null, completed: true });
      consensusState = "DISPUTED";
      break;

    case "REOPEN_TO_FALSE":
      addVote(VALIDATOR_INDICES[0], "TRUE", 0);
      addVote(VALIDATOR_INDICES[1], "TRUE", 0);
      addVote(VALIDATOR_INDICES[2], "FALSE", 0);
      rounds.push({ id: rounds.length + 1, contentHash, round: 0, state: "DISPUTED", result: null, completed: true });

      addVote(VALIDATOR_INDICES[3], "FALSE", 1);
      addVote(VALIDATOR_INDICES[4], "FALSE", 1);
      addVote(VALIDATOR_INDICES[5], "FALSE", 1);
      rounds.push({ id: rounds.length + 1, contentHash, round: 1, state: "DEFINITIVE", result: "FALSE", completed: true });

      consensusState = "DEFINITIVE";
      currentResult = "FALSE";
      currentRound = 1;
      // Reclamación retroactiva real capturada en un seed on-chain: validador[0]
      // (voto TRUE en la ronda 0, DISPUTED) reclama tras la ronda 1 (DEFINITIVE/FALSE).
      pushReputationEvent(addressOf(VALIDATOR_INDICES[0]), 1, "RETROACTIVE", contentHash, null, dayCounter - 2);
      break;
  }

  // Efectos reputacionales de voto (solo en rondas DEFINITIVE).
  for (const v of validations) {
    const round = rounds.find((r) => r.round === v.round);
    if (round?.state !== "DEFINITIVE") continue;
    if (v.vote === round.result) {
      pushReputationEvent(v.validatorAddress, 5, "VOTE_REWARD", contentHash, v.round, dayCounter - v.round);
    } else {
      pushReputationEvent(v.validatorAddress, -3, "VOTE_PENALTY", contentHash, v.round, dayCounter - v.round);
    }
  }

  // Efecto reputacional de publicación (solo la primera vez que llega a DEFINITIVE).
  if (consensusState === "DEFINITIVE") {
    if (currentResult === "TRUE") {
      pushReputationEvent(authorAddress, 8, "PUBLISH_REWARD", contentHash, null, dayCounter);
    } else if (currentResult === "UNVERIFIABLE") {
      pushReputationEvent(authorAddress, -8, "PUBLISH_PENALTY", contentHash, null, dayCounter);
    } else if (currentResult === "FALSE") {
      pushReputationEvent(authorAddress, -15, "PUBLISH_PENALTY", contentHash, null, dayCounter);
    }
  }

  publications.push({
    id: publications.length + 1,
    contentHash,
    title: article.title,
    body: article.body,
    authorAddress,
    tags: article.tags,
    ipfsCid: null,
    consensusState,
    currentResult,
    currentRound,
    reopenRequestCount: 0,
    createdAt,
    voteCount: validations.length,
    rounds,
    validations,
  });

  dayCounter = Math.max(1, dayCounter - 1);
}

// Predicciones (acceso meritocrático): 3 predictores + la cuenta demo, todas
// sobre p3 (DEFINITIVE/TRUE) — igual que el seed real. No generan Validation
// (las predicciones no se indexan como votos), solo eventos de reputación.
const p3 = publications.find((p) => p.title.includes("Ley de Cambio Climático"))!;
const predictorIndices = seedData.accounts.predictors; // [17, 18, 19]
const predictorVotes: ("TRUE" | "FALSE" | "TRUE")[] = ["TRUE", "FALSE", "TRUE"];
predictorIndices.forEach((idx, i) => {
  const correct = predictorVotes[i] === p3.currentResult;
  pushReputationEvent(
    addressOf(idx),
    correct ? 1 : -1,
    correct ? "PREDICTION_REWARD" : "PREDICTION_PENALTY",
    p3.contentHash,
    0,
    3,
  );
});

// La cuenta demo (readyValidator): 10 predicciones acertadas reales sobre los
// primeros 10 artículos DEFINITIVE, hasta alcanzar MIN_REPUTATION_TO_VALIDATE.
const definitiveArticles = publications.filter((p) => p.consensusState === "DEFINITIVE").slice(0, 10);
definitiveArticles.forEach((p, i) => {
  pushReputationEvent(DEMO_ADDRESS, 1, "PREDICTION_REWARD", p.contentHash, p.currentRound, 10 - i);
});

// ── Reputación derivada: suma de todos los eventos de esa dirección ──────
function reputationScoreOf(address: string): number {
  return reputationEvents
    .filter((e) => e.address.toLowerCase() === address.toLowerCase())
    .reduce((sum, e) => Math.max(0, sum + e.delta), 0);
}

// ── Usuarios: unión de autores (con artículos) + direcciones con eventos ──
// Solo la lista de direcciones es estable — reputación/artículos se
// recalculan al vuelo en cada consulta (ver getUsers), para no quedarse
// desactualizados tras votar/predecir dentro de la misma sesión.
const authorIndices = [...new Set(seedData.articles.map((a) => a.authorIndex))];
const eventAddresses = [...new Set(reputationEvents.map((e) => e.address))];
const knownUserAddresses = new Set<string>([...authorIndices.map(addressOf), ...eventAddresses]);

function articleCountOf(address: string): number {
  return publications.filter((p) => p.authorAddress.toLowerCase() === address.toLowerCase()).length;
}

function buildUserSummary(address: string): UserSummary {
  const profile = profilesByAddress.get(address);
  return {
    address,
    reputationScore: reputationScoreOf(address),
    articleCount: articleCountOf(address),
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}

// ── Estado mutable de sesión (favoritos, follows, notificaciones) ────────
const favorites = new Map<string, Set<string>>(); // address -> Set<contentHash>
const follows = new Map<string, Set<string>>();
const notifications: NotificationEntry[] = [
  {
    id: notificationIdSeq++,
    userAddress: DEMO_ADDRESS,
    contentHash: publications[2].contentHash,
    type: "CONSENSUS_REACHED",
    read: false,
    createdAt: isoDate(2),
  },
];

// ── Persistencia en localStorage: sin esto, cualquier recarga completa de
// página (no una navegación por la SPA) perdía artículos publicados, votos
// y demás dentro de la misma sesión de demo — sensación de "app rota" para
// quien recarga o comparte un enlace directo. Se guarda una foto completa
// del estado mutable tras cada escritura y se restaura al cargar el módulo.
const STORAGE_KEY = "newsera-demo-state-v1";

interface PersistedState {
  publications: Publication[];
  reputationEvents: ReputationEventInternal[];
  favorites: [string, string[]][];
  follows: [string, string[]][];
  notifications: NotificationEntry[];
  profiles: [string, EnrichedProfile][];
  eventIdSeq: number;
  validationIdSeq: number;
  notificationIdSeq: number;
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function persistState() {
  try {
    const snapshot: PersistedState = {
      publications,
      reputationEvents,
      favorites: [...favorites.entries()].map(([addr, set]) => [addr, [...set]]),
      follows: [...follows.entries()].map(([addr, set]) => [addr, [...set]]),
      notifications,
      profiles: [...profilesByAddress.entries()],
      eventIdSeq,
      validationIdSeq,
      notificationIdSeq,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage puede fallar (modo privado, cuota) — la demo sigue
    // funcionando igual, simplemente sin sobrevivir a una recarga.
  }
}

const persisted = loadPersistedState();
if (persisted) {
  publications.length = 0;
  publications.push(...persisted.publications);
  reputationEvents.length = 0;
  reputationEvents.push(...persisted.reputationEvents);
  notifications.length = 0;
  notifications.push(...persisted.notifications);
  for (const [addr, hashes] of persisted.favorites) favorites.set(addr, new Set(hashes));
  for (const [addr, hashes] of persisted.follows) follows.set(addr, new Set(hashes));
  for (const [addr, profile] of persisted.profiles) profilesByAddress.set(addr, profile);
  eventIdSeq = persisted.eventIdSeq;
  validationIdSeq = persisted.validationIdSeq;
  notificationIdSeq = persisted.notificationIdSeq;
  // Los autores/direcciones de artículos publicados durante la sesión
  // (creados con la cuenta demo) ya están cubiertos por DEMO_ADDRESS.
}

/** Borra el estado guardado y recarga — vuelve la demo a su punto de partida. */
export function resetDemoState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } finally {
    window.location.reload();
  }
}

// ── API pública del store (usada por lib/api.ts y wagmi-shim.tsx) ────────
export const demoStore = {
  address: DEMO_ADDRESS,

  getPublications(filters: {
    page?: number;
    limit?: number;
    state?: string;
    result?: string;
    tags?: string[];
    author?: string;
    search?: string;
    sort?: "recent" | "votes" | "state";
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    let items = [...publications];

    if (filters.state) items = items.filter((p) => p.consensusState === filters.state);
    if (filters.result) items = items.filter((p) => p.currentResult === filters.result);
    if (filters.author) items = items.filter((p) => p.authorAddress.toLowerCase() === filters.author!.toLowerCase());
    if (filters.tags?.length) items = items.filter((p) => p.tags.some((t) => filters.tags!.includes(t)));
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(needle) || p.body.toLowerCase().includes(needle),
      );
    }

    if (filters.sort === "votes") items.sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));
    else if (filters.sort === "state") items.sort((a, b) => a.consensusState.localeCompare(b.consensusState));
    else items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const paged = items.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { items: paged, page, limit, total };
  },

  getDistinctTags(): string[] {
    const set = new Set<string>();
    for (const p of publications) for (const t of p.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  },

  getPublicationByHash(hash: string): Publication | undefined {
    return publications.find((p) => p.contentHash === hash);
  },

  createPublication(data: {
    contentHash: string;
    title: string;
    body: string;
    tags: string[];
    links?: string[];
    ipfsCid?: string;
  }) {
    const publication: Publication = {
      id: publications.length + 1,
      contentHash: data.contentHash,
      title: data.title,
      body: data.body,
      authorAddress: DEMO_ADDRESS,
      tags: data.tags,
      ipfsCid: data.ipfsCid ?? null,
      consensusState: "PENDING",
      currentResult: null,
      currentRound: 0,
      reopenRequestCount: 0,
      createdAt: new Date().toISOString(),
      voteCount: 0,
      rounds: [{ id: 1, contentHash: data.contentHash, round: 0, state: "PENDING", result: null, completed: false }],
      validations: [],
      links: (data.links ?? [])
        .map((hash) => {
          const target = publications.find((p) => p.contentHash === hash);
          return target ? { contentHash: target.contentHash, title: target.title } : null;
        })
        .filter((l): l is { contentHash: string; title: string } => l !== null),
    };
    publications.unshift(publication);
    persistState();
    return publication;
  },

  getUsers(page = 1, limit = 20, sort: "reputation" | "articles" = "reputation", search?: string) {
    let all = [...knownUserAddresses].map(buildUserSummary);
    if (search) {
      const needle = search.toLowerCase();
      all = all.filter((u) => u.address.toLowerCase().includes(needle) || u.displayName?.toLowerCase().includes(needle));
    }
    all.sort((a, b) => (sort === "articles" ? b.articleCount - a.articleCount : b.reputationScore - a.reputationScore));
    const total = all.length;
    const items = all.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { items, page, limit, total };
  },

  getUserDetail(address: string) {
    const validations = publications.flatMap((p) => p.validations ?? []).filter(
      (v) => v.validatorAddress.toLowerCase() === address.toLowerCase(),
    );
    let correctVotes = 0;
    let resolvedVotes = 0;
    for (const v of validations) {
      const pub = publications.find((p) => p.contentHash === v.contentHash);
      const round = pub?.rounds?.find((r) => r.round === v.round);
      if (round?.state !== "DEFINITIVE") continue;
      resolvedVotes++;
      if (v.vote === round.result) correctVotes++;
    }
    return {
      address,
      reputationScore: reputationScoreOf(address),
      totalValidations: validations.length,
      correctVotes,
      accuracy: resolvedVotes > 0 ? correctVotes / resolvedVotes : null,
    };
  },

  getProfile(address: string): EnrichedProfile {
    const profile = profilesByAddress.get(address);
    return { address, displayName: profile?.displayName ?? null, avatarUrl: profile?.avatarUrl ?? null };
  },

  updateProfile(address: string, data: { displayName?: string; avatarUrl?: string }) {
    const existing = profilesByAddress.get(address) ?? { address, displayName: null, avatarUrl: null };
    profilesByAddress.set(address, { ...existing, ...data });
    persistState();
  },

  getFavorites(address: string, page = 1, limit = 20) {
    const hashes = [...(favorites.get(address) ?? [])];
    const items: FavoriteEntry[] = hashes
      .map((hash, i) => {
        const publication = publications.find((p) => p.contentHash === hash);
        return publication ? { id: i + 1, userAddress: address, contentHash: hash, createdAt: isoDate(1), publication } : null;
      })
      .filter((f): f is FavoriteEntry => f !== null);
    const total = items.length;
    return { items: items.slice((page - 1) * limit, (page - 1) * limit + limit), page, limit, total };
  },

  isFavorite(address: string, hash: string): boolean {
    return favorites.get(address)?.has(hash) ?? false;
  },

  addFavorite(address: string, hash: string) {
    if (!favorites.has(address)) favorites.set(address, new Set());
    favorites.get(address)!.add(hash);
    persistState();
  },

  removeFavorite(address: string, hash: string) {
    favorites.get(address)?.delete(hash);
    persistState();
  },

  isFollowing(address: string, hash: string): boolean {
    return follows.get(address)?.has(hash) ?? false;
  },

  addFollow(address: string, hash: string) {
    if (!follows.has(address)) follows.set(address, new Set());
    follows.get(address)!.add(hash);
    persistState();
  },

  removeFollow(address: string, hash: string) {
    follows.get(address)?.delete(hash);
    persistState();
  },

  getNotifications(address: string) {
    const items = notifications.filter((n) => n.userAddress.toLowerCase() === address.toLowerCase());
    return { items, page: 1, limit: items.length, total: items.length };
  },

  markNotificationRead(id: number) {
    const n = notifications.find((n) => n.id === id);
    if (n) n.read = true;
    persistState();
  },

  getReopenRequests(_address: string) {
    return [] as never[];
  },

  getValidationHistory(address: string, page = 1, limit = 20) {
    const items = publications
      .flatMap((p) => (p.validations ?? []).map((v) => ({ v, p })))
      .filter(({ v }) => v.validatorAddress.toLowerCase() === address.toLowerCase())
      .map(({ v, p }) => {
        const round = p.rounds?.find((r) => r.round === v.round);
        const outcome: "won" | "lost" | "unresolved" =
          round?.state !== "DEFINITIVE" ? "unresolved" : v.vote === round.result ? "won" : "lost";
        return {
          contentHash: v.contentHash,
          title: p.title,
          vote: v.vote,
          round: v.round,
          roundState: round?.state ?? "PENDING",
          roundResult: round?.result ?? null,
          outcome,
          createdAt: v.createdAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    return { items: items.slice((page - 1) * limit, (page - 1) * limit + limit), page, limit, total };
  },

  getReputationHistory(address: string, page = 1, limit = 100): { items: ReputationHistoryEntry[]; page: number; limit: number; total: number } {
    const items = reputationEvents
      .filter((e) => e.address.toLowerCase() === address.toLowerCase())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .reduce<ReputationHistoryEntry[]>((acc, e) => {
        const prevScore = acc.length > 0 ? acc[acc.length - 1].newScore : 0;
        acc.push({
          id: e.id,
          address: e.address,
          contentHash: e.contentHash,
          round: e.round,
          delta: e.delta,
          newScore: Math.max(0, prevScore + e.delta),
          reason: e.reason,
          txHash: e.txHash,
          blockNumber: String(e.id * 3),
          createdAt: e.createdAt,
        });
        return acc;
      }, [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    return { items: items.slice((page - 1) * limit, (page - 1) * limit + limit), page, limit, total };
  },

  getActivity(address: string, page = 1, limit = 20): { items: ActivityItem[]; page: number; limit: number; total: number } {
    const items: ActivityItem[] = [];

    for (const p of publications) {
      if (p.authorAddress.toLowerCase() === address.toLowerCase()) {
        items.push({
          type: "PUBLICATION",
          contentHash: p.contentHash,
          title: p.title,
          round: null,
          vote: null,
          netDelta: null,
          txHash: null,
          createdAt: p.createdAt,
        });
      }
      for (const v of p.validations ?? []) {
        if (v.validatorAddress.toLowerCase() === address.toLowerCase()) {
          items.push({
            type: "VALIDATION",
            contentHash: p.contentHash,
            title: p.title,
            round: v.round,
            vote: v.vote,
            netDelta: null,
            txHash: v.txHash,
            createdAt: v.createdAt,
          });
        }
      }
    }

    for (const e of reputationEvents) {
      if (e.reason === "RETROACTIVE" && e.address.toLowerCase() === address.toLowerCase() && e.contentHash) {
        const p = publications.find((pub) => pub.contentHash === e.contentHash);
        items.push({
          type: "RETROACTIVE_CLAIM",
          contentHash: e.contentHash,
          title: p?.title ?? "",
          round: null,
          vote: null,
          netDelta: e.delta,
          txHash: e.txHash,
          createdAt: e.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    return { items: items.slice((page - 1) * limit, (page - 1) * limit + limit), page, limit, total };
  },

  // ── Lecturas "on-chain" (usadas por el wagmi-shim) ──────────────────────
  getReputation(address: string): number {
    return reputationScoreOf(address);
  },

  canValidate(address: string): boolean {
    return reputationScoreOf(address) >= 10;
  },

  hasVoted(hash: string, address: string): boolean {
    const p = publications.find((pub) => pub.contentHash === hash);
    return !!p?.validations?.some((v) => v.validatorAddress.toLowerCase() === address.toLowerCase());
  },

  hasPredicted(hash: string, address: string): boolean {
    return reputationEvents.some(
      (e) =>
        e.contentHash === hash &&
        e.address.toLowerCase() === address.toLowerCase() &&
        (e.reason === "PREDICTION_REWARD" || e.reason === "PREDICTION_PENALTY"),
    );
  },

  getRoundResult(hash: string): "TRUE" | "FALSE" | "UNVERIFIABLE" | null {
    const p = publications.find((pub) => pub.contentHash === hash);
    return p?.currentResult ?? null;
  },

  quorumThreshold(): number {
    return QUORUM;
  },

  roundVoteCount(hash: string, round: number): number {
    const p = publications.find((pub) => pub.contentHash === hash);
    return p?.validations?.filter((v) => v.round === round).length ?? 0;
  },

  getRoundVoters(hash: string, round: number): string[] {
    const p = publications.find((pub) => pub.contentHash === hash);
    return p?.validations?.filter((v) => v.round === round).map((v) => v.validatorAddress) ?? [];
  },

  reopenRequestCount(_hash: string): number {
    return 0;
  },

  currentRound(hash: string): number {
    const p = publications.find((pub) => pub.contentHash === hash);
    return p?.currentRound ?? 0;
  },

  // ── Escrituras simuladas (invocadas al "confirmarse" la tx del shim) ────
  submitVote(hash: string, address: string, vote: "TRUE" | "FALSE" | "UNVERIFIABLE") {
    const p = publications.find((pub) => pub.contentHash === hash);
    if (!p) return;
    p.validations = p.validations ?? [];
    p.validations.push({
      id: validationIdSeq++,
      contentHash: hash,
      validatorAddress: address,
      vote,
      round: p.currentRound,
      txHash: fakeTxHash(`${hash}-${address}-${Date.now()}`),
      createdAt: new Date().toISOString(),
    });
    p.voteCount = p.validations.length;

    const roundVotes = p.validations.filter((v) => v.round === p.currentRound);
    if (roundVotes.length >= QUORUM) {
      const tally: Record<string, number> = { TRUE: 0, FALSE: 0, UNVERIFIABLE: 0 };
      for (const v of roundVotes) tally[v.vote]++;
      const [winner, count] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      const superMajority = count / roundVotes.length >= 0.6667;
      const round = p.rounds?.find((r) => r.round === p.currentRound);
      if (round) {
        round.completed = true;
        round.state = superMajority ? "DEFINITIVE" : "DISPUTED";
        round.result = superMajority ? (winner as Publication["currentResult"]) : null;
      }
      p.consensusState = superMajority ? "DEFINITIVE" : "DISPUTED";
      p.currentResult = superMajority ? (winner as Publication["currentResult"]) : null;

      for (const v of roundVotes) {
        if (!superMajority) continue;
        pushReputationEvent(
          v.validatorAddress,
          v.vote === winner ? 5 : -3,
          v.vote === winner ? "VOTE_REWARD" : "VOTE_PENALTY",
          hash,
          v.round,
          0,
        );
      }
    }
    persistState();
  },

  submitPrediction(hash: string, address: string, vote: "TRUE" | "FALSE" | "UNVERIFIABLE") {
    const p = publications.find((pub) => pub.contentHash === hash);
    if (!p || !p.currentResult) return;
    const correct = vote === p.currentResult;
    pushReputationEvent(address, correct ? 1 : -1, correct ? "PREDICTION_REWARD" : "PREDICTION_PENALTY", hash, null, 0);
    persistState();
  },

  requestReopen(_hash: string, _address: string) {
    // Simplificación de demo: no acumula solicitudes reales de reapertura.
  },

  claimRetroactiveReputation(_hash: string, _address: string) {
    // Simplificación de demo: sin nuevas rondas posteriores que reclamar.
  },
};
