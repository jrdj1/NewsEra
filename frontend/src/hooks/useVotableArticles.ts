import { useReadContracts } from "wagmi";
import { usePublications } from "@/hooks/usePublications";
import { validationRegistry } from "@/lib/contracts";
import type { Publication } from "@/lib/api";

/**
 * Artículos PENDING que `address` (ya elegible para votar, `canValidate ===
 * true`) todavía no ha votado. `hasVoted` es on-chain, comprobado con una
 * llamada batched por artículo visible, igual que `usePredictableArticles`.
 */
export function useVotableArticles(address: string | undefined) {
  const { data: pendingData, isLoading: isLoadingPublications } = usePublications({
    state: "PENDING",
    limit: 20,
    sort: "recent",
  });

  const articles = pendingData?.items ?? [];

  const { data: votedFlags, isLoading: isLoadingVoted } = useReadContracts({
    contracts: articles.map((a) => ({
      ...validationRegistry,
      functionName: "hasVoted",
      args: [a.contentHash, address],
    })),
    query: { enabled: !!address && articles.length > 0 },
  });

  const votable: Publication[] = address
    ? articles.filter((_, i) => votedFlags?.[i]?.result !== true)
    : [];

  return {
    data: votable,
    isLoading: isLoadingPublications || (articles.length > 0 && isLoadingVoted),
  };
}
