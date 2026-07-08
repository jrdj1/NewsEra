import { useQuery } from "@tanstack/react-query";
import {
  api,
  type Paginated,
  type ValidationHistoryEntry,
  type ReputationHistoryEntry,
  type ActivityItem,
} from "@/lib/api";

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

export function useReputationHistory(address: string | undefined, page = 1, limit = 100) {
  return useQuery({
    queryKey: ["reputation-history", address, page, limit],
    queryFn: () =>
      api.get<Paginated<ReputationHistoryEntry>>(
        `/api/v1/validators/${address}/reputation-history?page=${page}&limit=${limit}`,
      ),
    enabled: !!address,
  });
}

export function useActivity(address: string | undefined, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["activity", address, page, limit],
    queryFn: () =>
      api.get<Paginated<ActivityItem>>(`/api/v1/validators/${address}/activity?page=${page}&limit=${limit}`),
    enabled: !!address,
  });
}
