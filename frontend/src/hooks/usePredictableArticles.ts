import { useReadContracts } from "wagmi";
import { usePublications } from "@/hooks/usePublications";
import { validationRegistry, VOTE_LABELS, type VoteLabel } from "@/lib/contracts";
import type { Publication } from "@/lib/api";

export interface PredictableArticle {
  publication: Publication;
  correctResult: VoteLabel;
}

/**
 * Artículos ya DEFINITIVE que `address` todavía no ha predicho, junto con el
 * resultado ya fijado de su ronda actual. `hasPredicted` y el resultado en sí
 * son puramente on-chain (las predicciones no se indexan off-chain, ver
 * docs/prompts/fix-prediccion-articulos-resueltos.md), así que se comprueban
 * con llamadas batched por artículo visible en la página actual.
 */
export function usePredictableArticles(address: string | undefined) {
  const { data: definitiveData, isLoading: isLoadingPublications } = usePublications({
    state: "DEFINITIVE",
    limit: 20,
    sort: "recent",
  });

  const articles = definitiveData?.items ?? [];

  const { data: roundInfos, isLoading: isLoadingRounds } = useReadContracts({
    contracts: articles.map((a) => ({
      ...validationRegistry,
      functionName: "rounds",
      args: [a.contentHash, BigInt(a.currentRound)],
    })),
    query: { enabled: articles.length > 0 },
  });

  const { data: predictedFlags, isLoading: isLoadingPredicted } = useReadContracts({
    contracts: articles.map((a) => ({
      ...validationRegistry,
      functionName: "hasPredicted",
      args: [a.contentHash, address],
    })),
    query: { enabled: !!address && articles.length > 0 },
  });

  const predictable: PredictableArticle[] = address
    ? articles
        .map((publication, i) => {
          const roundInfo = roundInfos?.[i]?.result as readonly [number, number, boolean] | undefined;
          const correctResult = roundInfo ? VOTE_LABELS[roundInfo[0]] : undefined;
          const alreadyPredicted = predictedFlags?.[i]?.result === true;
          return correctResult && !alreadyPredicted ? { publication, correctResult } : null;
        })
        .filter((item): item is PredictableArticle => item !== null)
    : [];

  return {
    data: predictable,
    isLoading:
      isLoadingPublications || (articles.length > 0 && (isLoadingRounds || isLoadingPredicted)),
  };
}
