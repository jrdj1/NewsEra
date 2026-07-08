import { useQuery } from "@tanstack/react-query";
import { api, type Paginated, type UserSummary, type ValidatorDetail } from "@/lib/api";

export function useUsers(page = 1, limit = 20, sort: "reputation" | "articles" = "reputation", search?: string) {
  return useQuery({
    queryKey: ["users", page, limit, sort, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
      if (search) params.set("search", search);
      return api.get<Paginated<UserSummary>>(`/api/v1/users?${params.toString()}`);
    },
  });
}

export function useUserDetail(address: string | undefined) {
  return useQuery({
    queryKey: ["user-detail", address],
    queryFn: () => api.get<ValidatorDetail>(`/api/v1/users/${address}`),
    enabled: !!address,
  });
}
