import { useQuery } from "@tanstack/react-query";
import { api, type Paginated, type ValidationHistoryEntry, type ReputationHistoryEntry } from "@/lib/api";

export function useValidatorHistory(address: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["validator-history", address, page, limit],
    queryFn: () =>
      api.get<Paginated<ValidationHistoryEntry>>(
        `/api/v1/validators/${address}/history?page=${page}&limit=${limit}`,
      ),
    enabled: !!address,
  });
}

export function useReputationHistory(address: string | undefined) {
  return useQuery({
    queryKey: ["reputation-history", address],
    queryFn: () =>
      api.get<ReputationHistoryEntry[]>(`/api/v1/validators/${address}/reputation-history`),
    enabled: !!address,
  });
}
