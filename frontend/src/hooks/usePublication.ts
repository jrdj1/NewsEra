import { useQuery } from "@tanstack/react-query";
import { api, type Publication } from "@/lib/api";

export function usePublication(hash: string | undefined) {
  return useQuery({
    queryKey: ["publication", hash],
    queryFn: () => api.get<Publication>(`/api/v1/publications/${hash}`),
    enabled: !!hash,
  });
}
