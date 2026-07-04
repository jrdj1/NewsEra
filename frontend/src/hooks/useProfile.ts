import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type EnrichedProfile, type Paginated, type FavoriteEntry } from "@/lib/api";

export function useEnrichedProfile(address: string | undefined) {
  return useQuery({
    queryKey: ["profile", address],
    queryFn: () => api.get<EnrichedProfile>(`/api/v1/profile/${address}`),
    enabled: !!address,
  });
}

export function useFavorites(address: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["favorites", address, page, limit],
    queryFn: () =>
      api.get<Paginated<FavoriteEntry>>(`/api/v1/profile/${address}/favorites?page=${page}&limit=${limit}`),
    enabled: !!address,
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return (address: string | undefined) => {
    queryClient.invalidateQueries({ queryKey: ["profile", address] });
    queryClient.invalidateQueries({ queryKey: ["favorites", address] });
  };
}
