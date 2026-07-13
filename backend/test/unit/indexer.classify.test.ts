/**
 * Tests unitarios de classifyReputationEvent (indexer.ts) — publicClient
 * mockeado con vi.fn() (getTransactionReceipt nunca golpea un nodo real).
 * Los logs de la transacción simulada se codifican con el ABI real de
 * ValidationRegistry (docs/abis/ValidationRegistry.json) para ejercer la
 * decodificación real de viem, no una simulación de ella.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeAbiParameters, encodeEventTopics, parseAbiParameters, pad, toHex } from "viem";

const getTransactionReceiptMock = vi.fn();

vi.mock("../../src/lib/viem.js", () => ({
  publicClient: { getTransactionReceipt: getTransactionReceiptMock },
}));

const { classifyReputationEvent } = await import("../../src/services/indexer.js");
const { validationRegistryAbi } = await import("../../src/lib/abis.js");

const VALIDATION_REGISTRY = pad(toHex(0x33), { size: 20 }) as `0x${string}`;
const CONTENT_HASH = pad(toHex(1), { size: 32 });
const VALIDATOR = pad(toHex(0x11), { size: 20 }) as `0x${string}`;

function consensusReachedLog(result: number, state: number, round: bigint, txHash: string) {
  const topics = encodeEventTopics({
    abi: validationRegistryAbi as never,
    eventName: "ConsensusReached",
    args: { contentHash: CONTENT_HASH },
  });
  const data = encodeAbiParameters(parseAbiParameters("uint8,uint8,uint256"), [result, state, round]);
  return { address: VALIDATION_REGISTRY, topics, data, transactionHash: txHash };
}

function retroactiveClaimedLog(netDelta: bigint, txHash: string) {
  const topics = encodeEventTopics({
    abi: validationRegistryAbi as never,
    eventName: "RetroactiveClaimed",
    args: { contentHash: CONTENT_HASH, validator: VALIDATOR },
  });
  const data = encodeAbiParameters(parseAbiParameters("int256"), [netDelta]);
  return { address: VALIDATION_REGISTRY, topics, data, transactionHash: txHash };
}

function predictionSubmittedLog(vote: number, round: bigint, txHash: string) {
  const topics = encodeEventTopics({
    abi: validationRegistryAbi as never,
    eventName: "PredictionSubmitted",
    args: { contentHash: CONTENT_HASH, predictor: VALIDATOR },
  });
  const data = encodeAbiParameters(parseAbiParameters("uint8,uint256"), [vote, round]);
  return { address: VALIDATION_REGISTRY, topics, data, transactionHash: txHash };
}

describe("classifyReputationEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VALIDATION_REGISTRY_ADDRESS = VALIDATION_REGISTRY;
  });

  it("clasifica REGISTERED si no hay transactionHash en el log", async () => {
    const result = await classifyReputationEvent({ transactionHash: undefined }, 10);

    expect(result).toEqual({ reason: "REGISTERED", contentHash: null, round: null });
    expect(getTransactionReceiptMock).not.toHaveBeenCalled();
  });

  it("clasifica REGISTERED si VALIDATION_REGISTRY_ADDRESS no está configurado", async () => {
    delete process.env.VALIDATION_REGISTRY_ADDRESS;

    const result = await classifyReputationEvent({ transactionHash: "0xtx" }, 10);

    expect(result).toEqual({ reason: "REGISTERED", contentHash: null, round: null });
  });

  it("clasifica VOTE_REWARD/VOTE_PENALTY para un delta de voto (±5) dentro de ConsensusReached", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [consensusReachedLog(0, 1, 3n, "0xtx-vote")],
    });

    const reward = await classifyReputationEvent({ transactionHash: "0xtx-vote" }, 5);
    expect(reward).toEqual({ reason: "VOTE_REWARD", contentHash: CONTENT_HASH, round: 3 });

    const penalty = await classifyReputationEvent({ transactionHash: "0xtx-vote" }, -3);
    expect(penalty).toEqual({ reason: "VOTE_PENALTY", contentHash: CONTENT_HASH, round: 3 });
  });

  it("clasifica PUBLISH_REWARD/PUBLISH_PENALTY para un delta de publicación (magnitud 8 o 15)", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [consensusReachedLog(0, 1, 1n, "0xtx-publish")],
    });

    const reward = await classifyReputationEvent({ transactionHash: "0xtx-publish" }, 8);
    expect(reward.reason).toBe("PUBLISH_REWARD");

    const penaltyUnverifiable = await classifyReputationEvent({ transactionHash: "0xtx-publish" }, -8);
    expect(penaltyUnverifiable.reason).toBe("PUBLISH_PENALTY");

    const penaltyFalse = await classifyReputationEvent({ transactionHash: "0xtx-publish" }, -15);
    expect(penaltyFalse.reason).toBe("PUBLISH_PENALTY");
  });

  it("clasifica RETROACTIVE cuando la transacción incluye RetroactiveClaimed", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [retroactiveClaimedLog(-1n, "0xtx-retro")],
    });

    const result = await classifyReputationEvent({ transactionHash: "0xtx-retro" }, -1);

    expect(result).toEqual({ reason: "RETROACTIVE", contentHash: CONTENT_HASH, round: null });
  });

  it("clasifica PREDICTION_REWARD/PREDICTION_PENALTY cuando la transacción incluye PredictionSubmitted", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [predictionSubmittedLog(0, 2n, "0xtx-pred-reward")],
    });
    const reward = await classifyReputationEvent({ transactionHash: "0xtx-pred-reward" }, 1);
    expect(reward).toEqual({ reason: "PREDICTION_REWARD", contentHash: CONTENT_HASH, round: 2 });

    getTransactionReceiptMock.mockResolvedValue({
      logs: [predictionSubmittedLog(1, 2n, "0xtx-pred-penalty")],
    });
    const penalty = await classifyReputationEvent({ transactionHash: "0xtx-pred-penalty" }, -1);
    expect(penalty).toEqual({ reason: "PREDICTION_PENALTY", contentHash: CONTENT_HASH, round: 2 });
  });

  it("da prioridad a PredictionSubmitted sobre ConsensusReached si ambos aparecieran en la misma tx", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [
        consensusReachedLog(0, 1, 5n, "0xtx-both"),
        predictionSubmittedLog(0, 5n, "0xtx-both"),
      ],
    });

    const result = await classifyReputationEvent({ transactionHash: "0xtx-both" }, 1);

    expect(result.reason).toBe("PREDICTION_REWARD");
  });

  it("ignora logs de otro contrato y logs no decodificables, cayendo a REGISTERED", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [
        { address: "0x9999999999999999999999999999999999999999", topics: [], data: "0x", transactionHash: "0xtx-other" },
      ],
    });

    const result = await classifyReputationEvent({ transactionHash: "0xtx-other" }, 5);

    expect(result).toEqual({ reason: "REGISTERED", contentHash: null, round: null });
  });

  it("cachea los logs de la transacción — solo una llamada a getTransactionReceipt por txHash", async () => {
    getTransactionReceiptMock.mockResolvedValue({
      logs: [consensusReachedLog(0, 1, 1n, "0xtx-cache")],
    });

    await classifyReputationEvent({ transactionHash: "0xtx-cache" }, 5);
    await classifyReputationEvent({ transactionHash: "0xtx-cache" }, -3);

    expect(getTransactionReceiptMock).toHaveBeenCalledTimes(1);
  });
});
