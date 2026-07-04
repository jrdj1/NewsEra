import { useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi } from "viem";
import { translateError } from "@/lib/errors";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

interface WriteConfig {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
}

/**
 * Envuelve useWriteContract + useWaitForTransactionReceipt en los 5 estados
 * documentados en la memoria: Idle, Pending, Confirming, Confirmed, Failed.
 * Traduce los errores de revert conocidos a lenguaje natural (RI 7).
 */
export function useTransactionState() {
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isSigning,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const status: TxStatus = useMemo(() => {
    if (writeError || receiptError) return "failed";
    if (isConfirmed) return "confirmed";
    if (isConfirming) return "confirming";
    if (isSigning) return "pending";
    return "idle";
  }, [writeError, receiptError, isConfirmed, isConfirming, isSigning]);

  const error = writeError ?? receiptError ?? null;

  function write(config: WriteConfig) {
    writeContract(config as never);
  }

  function reset() {
    resetWrite();
  }

  return {
    write,
    reset,
    status,
    hash,
    error,
    errorMessage: error ? translateError(error) : null,
    isIdle: status === "idle",
    isPending: status === "pending",
    isConfirming: status === "confirming",
    isConfirmed: status === "confirmed",
    isFailed: status === "failed",
  };
}
