import { useQuery } from "@tanstack/react-query";
import { api, type Paginated, type Publication } from "@/lib/api";

export interface PublicationFilters {
  page?: number;
  limit?: number;
  state?: string;
  result?: "TRUE" | "FALSE" | "UNVERIFIABLE";
  tags?: string[];
  author?: string;
  search?: string;
  sort?: "recent" | "votes" | "state";
}

function buildQuery(filters: PublicationFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.state) params.set("state", filters.state);
  if (filters.result) params.set("result", filters.result);
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.author) params.set("author", filters.author);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function usePublications(filters: PublicationFilters = {}) {
  return useQuery({
    queryKey: ["publications", filters],
    queryFn: () => api.get<Paginated<Publication>>(`/api/v1/publications${buildQuery(filters)}`),
  });
}

/** Etiquetas realmente en uso — no hay catálogo predefinido, cualquier autor
 * escribe las suyas libremente al publicar (ver Publish.tsx). */
export function usePublicationTags() {
  return useQuery({
    queryKey: ["publication-tags"],
    queryFn: () => api.get<string[]>("/api/v1/publications/tags"),
    staleTime: 60_000,
  });
}
