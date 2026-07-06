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

async function handleReputationUpdated(log: any) {
  const { validator, newScore } = log.args as { validator: string; newScore: bigint };
  await validatorRepository.upsertReputation(validator, Number(newScore), log.blockNumber ?? 0n);
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
  // Orden estable: los eventos de una misma transacción/bloque deben aplicarse
  // en el orden en que el nodo los emite (logIndex ascendente).
  const sorted = [...logs].sort((a, b) => Number(a.logIndex ?? 0) - Number(b.logIndex ?? 0));
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
