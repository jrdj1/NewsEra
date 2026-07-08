import { useReadContract, useWatchContractEvent } from "wagmi";
import { reputationSystem } from "@/lib/contracts";

/**
 * Reputación y elegibilidad (`canValidate`) de `address`, reactivas a
 * `ReputationUpdated`. Los votos y predicciones aplican su efecto
 * reputacional en la misma transacción (ver ValidationRegistry), así que
 * sin este watcher la UI se queda con el valor leído al montar el
 * componente — el contador de "aciertos para votar de verdad" no avanzaba
 * tras cada predicción, y el cambio a validador pasaba desapercibido.
 */
export function useReputationStatus(address: string | undefined) {
  const reputationQuery = useReadContract({
    ...reputationSystem,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const canValidateQuery = useReadContract({
    ...reputationSystem,
    functionName: "canValidate",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useWatchContractEvent({
    ...reputationSystem,
    eventName: "ReputationUpdated",
    enabled: !!address,
    onLogs(logs) {
      const affectsMe = logs.some((log) => {
        const validator = (log as { args?: { validator?: string } }).args?.validator;
        return validator?.toLowerCase() === address?.toLowerCase();
      });
      if (affectsMe) {
        reputationQuery.refetch();
        canValidateQuery.refetch();
      }
    },
  });

  return {
    reputation: reputationQuery.data !== undefined ? Number(reputationQuery.data) : 0,
    canValidate: canValidateQuery.data as boolean | undefined,
    isLoading: reputationQuery.isLoading || canValidateQuery.isLoading,
  };
}
