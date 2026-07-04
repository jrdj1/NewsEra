import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReopenRequestEntry {
  id: number;
  contentHash: string;
  requesterAddress: string;
  txHash: string | null;
  createdAt: string;
  publication: { contentHash: string; title: string; consensusState: string };
}

export function useReopenRequests(address: string | undefined) {
  return useQuery({
    queryKey: ["reopen-requests", address],
    queryFn: () => api.get<ReopenRequestEntry[]>(`/api/v1/profile/${address}/reopen-requests`),
    enabled: !!address,
  });
}
