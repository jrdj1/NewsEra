import { useEffect, useRef, useState } from "react";
import { usePublications, usePublicationTags } from "@/hooks/usePublications";
import { ArticleFullscreenCard } from "@/components/ArticleFullscreenCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import type { Publication } from "@/lib/api";

/** Evita disparar una petición en cada pulsación del buscador. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type FilterKey = "TRUE" | "FALSE" | "UNVERIFIABLE" | "PENDING" | "DISPUTED";

const FILTERS: {
  key: FilterKey;
  label: string;
  state: string;
  result?: "TRUE" | "FALSE" | "UNVERIFIABLE";
  activeClass: string;
}[] = [
  { key: "TRUE", label: "Verdadero", state: "DEFINITIVE", result: "TRUE", activeClass: "bg-consensus-true text-white" },
  { key: "FALSE", label: "Falso", state: "DEFINITIVE", result: "FALSE", activeClass: "bg-consensus-false text-white" },
  {
    key: "UNVERIFIABLE",
    label: "No verificable",
    state: "DEFINITIVE",
    result: "UNVERIFIABLE",
    activeClass: "bg-consensus-unverifiable text-white",
  },
  { key: "PENDING", label: "Pendientes", state: "PENDING", activeClass: "bg-consensus-unverifiable text-white" },
  { key: "DISPUTED", label: "En disputa", state: "DISPUTED", activeClass: "bg-consensus-unverifiable text-white" },
];

const PAGE_SIZE = 10;

export default function Feed() {
  const [filter, setFilter] = useState<FilterKey>("TRUE");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Publication[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: availableTags } = usePublicationTags();

  const active = FILTERS.find((f) => f.key === filter)!;
  const { data, isLoading, isError, refetch } = usePublications({
    state: active.state,
    result: active.result,
    search: debouncedSearch || undefined,
    tags: tag ? [tag] : undefined,
    page,
    limit: PAGE_SIZE,
    sort: "recent",
  });

  useEffect(() => {
    setItems([]);
    setPage(1);
    containerRef.current?.scrollTo({ top: 0 });
  }, [filter, debouncedSearch, tag]);

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
  }, [data, page]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el || !data || isLoading) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - el.clientHeight / 2;
    if (nearBottom && items.length < data.total) {
      setPage((p) => p + 1);
    }
  }

  return (
    <div>
      <div className="sticky top-16 z-10 space-y-2 border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-900 dark:bg-zinc-950/90">
        <div className="flex justify-start gap-2 overflow-x-auto sm:justify-center">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? f.activeClass
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por palabras clave..."
            className="min-w-0 max-w-xs flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="max-w-[9rem] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Todas las etiquetas</option>
            {availableTags?.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && page === 1 && <LoadingState label="Cargando artículos..." />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState message="No hay artículos que coincidan con este filtro todavía." />
      )}

      {items.length > 0 && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto"
        >
          {items.map((p) => (
            <ArticleFullscreenCard key={p.contentHash} publication={p} />
          ))}
        </div>
      )}
    </div>
  );
}
