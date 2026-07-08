import { useEffect, useRef, useState, type ReactNode } from "react";
import { demoStore, DEMO_ADDRESS } from "./store";

/**
 * Sustituto local de "wagmi" para la demo estática (ver vite.config.ts,
 * resolve.alias). No hay cartera ni cadena reales: la dirección "conectada"
 * es fija (persona con reputación suficiente para votar de verdad, así se
 * ve la interacción central de la plataforma sin necesitar MetaMask) y las
 * lecturas/escrituras de contrato se resuelven contra `demoStore` (datos en
 * memoria). El resto del código de la app (páginas, hooks) no cambia una
 * sola línea: sigue importando estos mismos nombres de "wagmi".
 */

const VOTE_LABELS = ["TRUE", "FALSE", "UNVERIFIABLE"] as const;

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAccount() {
  return {
    address: DEMO_ADDRESS as `0x${string}`,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  };
}

export function useSignMessage() {
  return {
    signMessageAsync: async (_args: { message: string }) => {
      await new Promise((r) => setTimeout(r, 400));
      return "0xdemo00000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
    },
  };
}

interface ReadContractConfig {
  functionName: string;
  args?: readonly unknown[];
  query?: { enabled?: boolean };
}

function resolveRead({ functionName, args = [] }: ReadContractConfig): unknown {
  switch (functionName) {
    case "canValidate":
      return demoStore.canValidate(String(args[0]));
    case "getReputation":
      return demoStore.getReputation(String(args[0]));
    case "hasVoted":
      return demoStore.hasVoted(String(args[0]), String(args[1]));
    case "hasPredicted":
      return demoStore.hasPredicted(String(args[0]), String(args[1]));
    case "quorumThreshold":
      return demoStore.quorumThreshold();
    case "roundVoteCount":
      return demoStore.roundVoteCount(String(args[0]), Number(args[1]));
    case "getRoundVoters":
      return demoStore.getRoundVoters(String(args[0]), Number(args[1]));
    case "reopenRequestCount":
      return demoStore.reopenRequestCount(String(args[0]));
    case "currentRound":
      return demoStore.currentRound(String(args[0]));
    case "rounds": {
      const result = demoStore.getRoundResult(String(args[0]));
      const resultIndex = result ? VOTE_LABELS.indexOf(result) : 0;
      return [resultIndex, 0, true];
    }
    default:
      return undefined;
  }
}

export function useReadContract(config: ReadContractConfig) {
  const enabled = config.query?.enabled ?? true;
  const [, forceRerender] = useState(0);
  const data = enabled ? resolveRead(config) : undefined;
  return {
    data,
    isLoading: false,
    refetch: () => forceRerender((n) => n + 1),
  };
}

export function useReadContracts({ contracts, query }: { contracts: ReadContractConfig[]; query?: { enabled?: boolean } }) {
  const enabled = query?.enabled ?? true;
  const data = enabled ? contracts.map((c) => ({ result: resolveRead(c), status: "success" as const })) : undefined;
  return { data, isLoading: false };
}

export function useWatchContractEvent(_config: unknown) {
  // No hay eventos reales que observar en la demo — no-op.
}

interface WriteContractConfig {
  functionName: string;
  args?: readonly unknown[];
}

function applyWrite({ functionName, args = [] }: WriteContractConfig) {
  switch (functionName) {
    case "submitValidation":
      demoStore.submitVote(String(args[0]), DEMO_ADDRESS, VOTE_LABELS[Number(args[1])]);
      break;
    case "submitPrediction":
      demoStore.submitPrediction(String(args[0]), DEMO_ADDRESS, VOTE_LABELS[Number(args[1])]);
      break;
    case "requestReopen":
      demoStore.requestReopen(String(args[0]), DEMO_ADDRESS);
      break;
    case "claimRetroactiveReputation":
      demoStore.claimRetroactiveReputation(String(args[0]), DEMO_ADDRESS);
      break;
    // "registerPublication": la creación real ocurre en el POST posterior
    // a /api/v1/publications (ver Publish.tsx) — nada que mutar aquí.
  }
}

function fakeHash(): `0x${string}` {
  return (`0xdemo${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.padEnd(66, "0")) as `0x${string}`;
}

export function useWriteContract() {
  const [state, setState] = useState<{ isPending: boolean; hash?: `0x${string}`; error?: Error }>({
    isPending: false,
  });

  function writeContract(config: WriteContractConfig) {
    setState({ isPending: true, hash: undefined, error: undefined });
    try {
      applyWrite(config);
    } catch (err) {
      setState({ isPending: false, error: err as Error });
      return;
    }
    setTimeout(() => {
      setState({ isPending: false, hash: fakeHash() });
    }, 500);
  }

  function reset() {
    setState({ isPending: false, hash: undefined, error: undefined });
  }

  return {
    writeContract,
    data: state.hash,
    error: state.error,
    isPending: state.isPending,
    reset,
  };
}

export function useWaitForTransactionReceipt({ hash }: { hash?: `0x${string}` }) {
  const [status, setStatus] = useState<{ isLoading: boolean; isSuccess: boolean }>({
    isLoading: false,
    isSuccess: false,
  });
  const seen = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!hash || seen.current === hash) return;
    seen.current = hash;
    setStatus({ isLoading: true, isSuccess: false });
    const id = setTimeout(() => setStatus({ isLoading: false, isSuccess: true }), 700);
    return () => clearTimeout(id);
  }, [hash]);

  return { isLoading: status.isLoading, isSuccess: status.isSuccess, error: undefined };
}
