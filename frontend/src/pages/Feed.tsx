import { useEffect, useRef, useState } from "react";
import { usePublications } from "@/hooks/usePublications";
import { ArticleFullscreenCard } from "@/components/ArticleFullscreenCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import type { Publication } from "@/lib/api";

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
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Publication[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = FILTERS.find((f) => f.key === filter)!;
  const { data, isLoading, isError, refetch } = usePublications({
    state: active.state,
    result: active.result,
    page,
    limit: PAGE_SIZE,
    sort: "recent",
  });

  useEffect(() => {
    setItems([]);
    setPage(1);
    containerRef.current?.scrollTo({ top: 0 });
  }, [filter]);

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
      <div className="sticky top-16 z-10 flex justify-start gap-2 overflow-x-auto border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-900 dark:bg-zinc-950/90 sm:justify-center">
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
