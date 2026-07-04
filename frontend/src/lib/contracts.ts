import type { Abi } from "viem";
import publicationRegistryAbiJson from "../../../docs/abis/PublicationRegistry.json";
import validationRegistryAbiJson from "../../../docs/abis/ValidationRegistry.json";
import reputationSystemAbiJson from "../../../docs/abis/ReputationSystem.json";

// Los JSON importados no conservan los tipos literales ("function", "event", ...)
// que Abi de viem exige — se afirma el tipo aquí una única vez.
const publicationRegistryAbi = publicationRegistryAbiJson as Abi;
const validationRegistryAbi = validationRegistryAbiJson as Abi;
const reputationSystemAbi = reputationSystemAbiJson as Abi;

export const publicationRegistry = {
  address: import.meta.env.VITE_PUBLICATION_REGISTRY_ADDRESS as `0x${string}`,
  abi: publicationRegistryAbi,
};

export const validationRegistry = {
  address: import.meta.env.VITE_VALIDATION_REGISTRY_ADDRESS as `0x${string}`,
  abi: validationRegistryAbi,
};

export const reputationSystem = {
  address: import.meta.env.VITE_REPUTATION_SYSTEM_ADDRESS as `0x${string}`,
  abi: reputationSystemAbi,
};

export const VOTE_LABELS = ["TRUE", "FALSE", "UNVERIFIABLE"] as const;
export type VoteLabel = (typeof VOTE_LABELS)[number];

export function voteToIndex(vote: VoteLabel): number {
  return VOTE_LABELS.indexOf(vote);
}

export const REPUTATION_REWARD = 5;
export const REPUTATION_PENALTY = 3;
export const MIN_REPUTATION_TO_VALIDATE = 10;
export const PREDICTION_REWARD = 1;
export const PREDICTION_PENALTY = 1;
export const PUBLISH_REPUTATION_REWARD = 8;
export const PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE = 8;
export const PUBLISH_REPUTATION_PENALTY_FALSE = 15;
