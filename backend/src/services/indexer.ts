import { decodeEventLog } from "viem";
import { publicClient } from "../lib/viem.js";
import {
  publicationRegistryAbi,
  validationRegistryAbi,
  reputationSystemAbi,
} from "../lib/abis.js";
import { publicationRepository } from "../repositories/publication.repository.js";
import { roundRepository } from "../repositories/round.repository.js";
import { validationRepository } from "../repositories/validation.repository.js";
import { validatorRepository } from "../repositories/validator.repository.js";
import { reopenRequestRepository } from "../repositories/reopen-request.repository.js";
import { retroactiveClaimRepository } from "../repositories/retroactive-claim.repository.js";
import { followRepository } from "../repositories/follow.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { indexerStateRepository } from "../repositories/indexer-state.repository.js";
import { reputationEventRepository } from "../repositories/reputation-event.repository.js";

const VOTE_LABELS = ["TRUE", "FALSE", "UNVERIFIABLE"] as const;
const STATE_LABELS = ["PENDING", "DEFINITIVE", "DISPUTED", "PENDING_REOPEN"] as const;

function addresses() {
  return {
    publicationRegistry: process.env.PUBLICATION_REGISTRY_ADDRESS as `0x${string}` | undefined,
    validationRegistry: process.env.VALIDATION_REGISTRY_ADDRESS as `0x${string}` | undefined,
    reputationSystem: process.env.REPUTATION_SYSTEM_ADDRESS as `0x${string}` | undefined,
  };
}

// Último bloque procesado, cacheado en memoria y persistido en IndexerState
// para que un reinicio del backend reanude en vez de reprocesar desde 0.
let lastProcessedBlock = 0n;

export function getLastProcessedBlock(): bigint {
  return lastProcessedBlock;
}

export async function loadLastProcessedBlock(): Promise<bigint> {
  lastProcessedBlock = await indexerStateRepository.getLastProcessedBlock();
  return lastProcessedBlock;
}

async function handlePublicationRegistered(log: any) {
  const { contentHash, author } = log.args as { contentHash: string; author: string };
  await publicationRepository.upsertFromChain({ contentHash, authorAddress: author });
  await roundRepository.open(contentHash, 0);
}

async function handleValidationSubmitted(log: any) {
  const { contentHash, validator, vote, round } = log.args as {
    contentHash: string;
    validator: string;
    vote: number;
    round: bigint;
  };
  await validationRepository.create({
    contentHash,
    validatorAddress: validator,
    vote: VOTE_LABELS[vote],
    round: Number(round),
    txHash: log.transactionHash ?? undefined,
  });
}

async function handleConsensusReached(log: any) {
  const { contentHash, result, state, round } = log.args as {
    contentHash: string;
    result: number;
    state: number;
    round: bigint;
  };
  const stateLabel = STATE_LABELS[state];

  await roundRepository.upsert({
    contentHash,
    round: Number(round),
    state: stateLabel,
    result: VOTE_LABELS[result],
    completed: true,
  });
  await publicationRepository.updateConsensusState(
    contentHash,
    stateLabel,
    stateLabel === "DEFINITIVE" ? VOTE_LABELS[result] : null,
  );

  if (stateLabel === "DEFINITIVE") {
    const interested = await followRepository.listInterestedAddresses(contentHash);
    await notificationRepository.createMany(interested, contentHash, "CONSENSUS_REACHED");
  }
}

// Caché de logs por transacción para clasificar ReputationUpdated sin repetir
// la misma llamada RPC cuando varias direcciones cambian de reputación en la
// misma transacción (p. ej. 3 votantes + el autor al alcanzar DEFINITIVE, o
// varios ajustes ±1 de una sola reclamación retroactiva). No tiene TTL/límite
// de tamaño: el proceso del indexador vive lo que vive el backend, y el
// volumen de transacciones de un prototipo no lo hace un problema real.
const receiptLogsCache = new Map<string, any[]>();

async function getReceiptLogs(txHash: string): Promise<any[]> {
  const cached = receiptLogsCache.get(txHash);
  if (cached) return cached;
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
  receiptLogsCache.set(txHash, receipt.logs);
  return receipt.logs;
}

interface ReputationEventContext {
  reason: string;
  contentHash: string | null;
  round: number | null;
}

/**
 * El evento ReputationUpdated (ReputationSystem) no lleva contentHash ni
 * motivo — solo `(validator, newScore, increased)`. Para saber SI el cambio
 * viene de un voto, de la recompensa/penalización por publicar, de una
 * reclamación retroactiva o de una predicción, se buscan en la MISMA
 * transacción los eventos de ValidationRegistry que lo disparan
 * (ConsensusReached / RetroactiveClaimed / PredictionSubmitted) y se usa la
 * magnitud del delta para distinguir voto (±5/±3) de publicación (+8/−8/−15)
 * dentro de un ConsensusReached.
 */
async function classifyReputationEvent(
  log: any,
  delta: number,
): Promise<ReputationEventContext> {
  const txHash = log.transactionHash as string | undefined;
  const validationRegistryAddress = process.env.VALIDATION_REGISTRY_ADDRESS?.toLowerCase();
  if (!txHash || !validationRegistryAddress) {
    return { reason: "REGISTERED", contentHash: null, round: null };
  }

  const logs = await getReceiptLogs(txHash);
  let consensusInfo: { contentHash: string; round: bigint } | undefined;
  let retroInfo: { contentHash: string } | undefined;
  let predictionInfo: { contentHash: string; round: bigint } | undefined;

  for (const l of logs) {
    if ((l.address as string)?.toLowerCase() !== validationRegistryAddress) continue;
    try {
      const decoded = decodeEventLog({ abi: validationRegistryAbi as never, data: l.data, topics: l.topics });
      if (decoded.eventName === "ConsensusReached") {
        consensusInfo = decoded.args as never;
      } else if (decoded.eventName === "RetroactiveClaimed") {
        retroInfo = decoded.args as never;
      } else if (decoded.eventName === "PredictionSubmitted") {
        predictionInfo = decoded.args as never;
      }
    } catch {
      // log de otro evento del mismo contrato (p. ej. ValidationSubmitted), se ignora.
    }
  }

  if (predictionInfo) {
    return {
      reason: delta > 0 ? "PREDICTION_REWARD" : "PREDICTION_PENALTY",
      contentHash: predictionInfo.contentHash,
      round: Number(predictionInfo.round),
    };
  }
  if (retroInfo) {
    return { reason: "RETROACTIVE", contentHash: retroInfo.contentHash, round: null };
  }
  if (consensusInfo) {
    const isPublish = Math.abs(delta) === 8 || Math.abs(delta) === 15;
    const reason = isPublish
      ? delta > 0
        ? "PUBLISH_REWARD"
        : "PUBLISH_PENALTY"
      : delta > 0
        ? "VOTE_REWARD"
        : "VOTE_PENALTY";
    return { reason, contentHash: consensusInfo.contentHash, round: Number(consensusInfo.round) };
  }
  return { reason: "REGISTERED", contentHash: null, round: null };
}

async function handleReputationUpdated(log: any) {
  const { validator, newScore } = log.args as { validator: string; newScore: bigint };
  const before = await validatorRepository.getByAddress(validator);
  const delta = Number(newScore) - (before?.reputationScore ?? 0);

  await validatorRepository.upsertReputation(validator, Number(newScore), log.blockNumber ?? 0n);

  const { reason, contentHash, round } = await classifyReputationEvent(log, delta);
  await reputationEventRepository.create({
    address: validator,
    delta,
    newScore: Number(newScore),
    reason,
    contentHash,
    round,
    txHash: log.transactionHash ?? null,
    blockNumber: log.blockNumber ?? 0n,
  });
}

async function handleReopenRequested(log: any) {
  const { contentHash, requester, count } = log.args as {
    contentHash: string;
    requester: string;
    count: bigint;
  };
  await reopenRequestRepository.upsertFromChain({
    contentHash,
    requesterAddress: requester,
    txHash: log.transactionHash ?? undefined,
  });
  // Se fija el valor absoluto emitido por el contrato (no un incremento
  // relativo): idempotente frente a reprocesados y no depende del orden de
  // llegada respecto a VotingReopened dentro de la misma transacción.
  await publicationRepository.setReopenRequestCount(contentHash, Number(count));
}

async function handleVotingReopened(log: any) {
  const { contentHash, newRound } = log.args as { contentHash: string; newRound: bigint };
  await publicationRepository.openNewRound(contentHash, Number(newRound));
  await roundRepository.open(contentHash, Number(newRound));

  const interested = await followRepository.listInterestedAddresses(contentHash);
  await notificationRepository.createMany(interested, contentHash, "REOPENED");
}

async function handleRetroactiveClaimed(log: any) {
  const { contentHash, validator, netDelta } = log.args as {
    contentHash: string;
    validator: string;
    netDelta: bigint;
  };
  await retroactiveClaimRepository.upsertFromChain({
    contentHash,
    validatorAddress: validator,
    netDelta: Number(netDelta),
    txHash: log.transactionHash,
  });
  await notificationRepository.createMany([validator], contentHash, "RETROACTIVE_APPLIED");
}

const EVENT_HANDLERS: Record<string, (log: any) => Promise<void>> = {
  PublicationRegistered: handlePublicationRegistered,
  ValidationSubmitted: handleValidationSubmitted,
  ConsensusReached: handleConsensusReached,
  ReputationUpdated: handleReputationUpdated,
  ReopenRequested: handleReopenRequested,
  VotingReopened: handleVotingReopened,
  RetroactiveClaimed: handleRetroactiveClaimed,
};

/**
 * Exportada (además de usada internamente) para poder simular en tests un
 * lote de eventos "en vivo" sin depender de `watchContractEvent` real.
 */
export async function processLogs(logs: any[]) {
  // Orden estable: primero por bloque (logIndex se reinicia en cada bloque,
  // así que ordenar solo por logIndex mezcla mal eventos de bloques distintos
  // al procesar un rango histórico completo), y dentro del mismo bloque, en
  // el orden en que el nodo los emite (logIndex ascendente).
  const sorted = [...logs].sort((a, b) => {
    const blockDiff = Number((a.blockNumber ?? 0n) - (b.blockNumber ?? 0n));
    if (blockDiff !== 0) return blockDiff;
    return Number(a.logIndex ?? 0) - Number(b.logIndex ?? 0);
  });
  const startBlock = lastProcessedBlock;
  for (const log of sorted) {
    const handler = EVENT_HANDLERS[log.eventName as string];
    if (handler) await handler(log);
    if (log.blockNumber && log.blockNumber > lastProcessedBlock) {
      lastProcessedBlock = log.blockNumber;
    }
  }

  // Persistir aquí también (no solo al final de processHistoricalEvents):
  // sin esto, un lote procesado en vivo por watchLiveEvents solo avanzaba la
  // variable en memoria, y un reinicio del backend reanudaba desde el último
  // catch-up histórico, reprocesando un tramo ya procesado en vivo.
  if (lastProcessedBlock > startBlock) {
    await indexerStateRepository.setLastProcessedBlock(lastProcessedBlock);
  }
}

interface ContractWatchTarget {
  address: `0x${string}`;
  abi: unknown;
}

// Un target por contrato (no por evento): eventos relacionados emitidos en la
// misma transacción (p.ej. ReopenRequested + VotingReopened) deben llegar
// juntos y procesarse en orden de logIndex — separarlos por watch/query
// independiente por nombre de evento rompe ese orden causal.
function watchTargets(): ContractWatchTarget[] {
  const addr = addresses();
  const targets: ContractWatchTarget[] = [];
  if (addr.publicationRegistry) {
    targets.push({ address: addr.publicationRegistry, abi: publicationRegistryAbi });
  }
  if (addr.validationRegistry) {
    targets.push({ address: addr.validationRegistry, abi: validationRegistryAbi });
  }
  if (addr.reputationSystem) {
    targets.push({ address: addr.reputationSystem, abi: reputationSystemAbi });
  }
  return targets;
}

/** Procesa el historial de eventos desde `fromBlock` hasta el bloque actual. */
export async function processHistoricalEvents(fromBlock: bigint): Promise<bigint> {
  const currentBlock = await publicClient.getBlockNumber();
  if (fromBlock > currentBlock) return currentBlock;

  for (const target of watchTargets()) {
    const logs = await publicClient.getContractEvents({
      address: target.address,
      abi: target.abi as never,
      fromBlock,
      toBlock: currentBlock,
    });
    await processLogs(logs);
  }

  if (currentBlock > lastProcessedBlock) lastProcessedBlock = currentBlock;
  await indexerStateRepository.setLastProcessedBlock(lastProcessedBlock);
  return currentBlock;
}

/** Se suscribe en tiempo real a los eventos de los tres contratos. */
export function watchLiveEvents(): void {
  for (const target of watchTargets()) {
    publicClient.watchContractEvent({
      address: target.address,
      abi: target.abi as never,
      onLogs: (logs) => {
        processLogs(logs).catch((err) => console.error(`[indexer] ${target.address}:`, err));
      },
    });
  }
}

export async function startIndexer(): Promise<void> {
  const deployBlock = BigInt(process.env.DEPLOY_BLOCK ?? "0");
  const persisted = await loadLastProcessedBlock();
  // +1: el bloque persistido ya fue procesado por completo; reanudar en el
  // siguiente evita reprocesar sus eventos y duplicar notificaciones.
  const fromBlock = persisted > 0n ? persisted + 1n : deployBlock;

  const processed = await processHistoricalEvents(fromBlock);
  console.log(`[indexer] historial procesado desde el bloque ${fromBlock} hasta ${processed}`);
  watchLiveEvents();
  console.log("[indexer] suscrito a eventos en tiempo real");
}
