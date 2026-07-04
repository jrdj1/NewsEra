import { useQuery } from "@tanstack/react-query";
import { api, type Paginated, type Validator } from "@/lib/api";

export function useValidators(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["validators", page, limit],
    queryFn: () => api.get<Paginated<Validator>>(`/api/v1/validators?page=${page}&limit=${limit}`),
  });
}
