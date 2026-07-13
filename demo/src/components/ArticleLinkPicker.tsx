import { useEffect, useRef, useState } from "react";
import { usePublications } from "@/hooks/usePublications";

export interface LinkedArticle {
  contentHash: string;
  title: string;
}

/** Evita disparar una petición en cada pulsación del buscador. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Selector de enlaces internos: busca artículos ya publicados en NewsEra por
 * título y los añade como enlace real (`/article/:hash`), en vez de que el
 * autor tenga que copiar/pegar hashes a mano.
 */
export function ArticleLinkPicker({
  value,
  onChange,
}: {
  value: LinkedArticle[];
  onChange: (links: LinkedArticle[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>();
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = usePublications({
    search: debouncedQuery.trim().length >= 2 ? debouncedQuery.trim() : undefined,
    limit: 6,
    sort: "recent",
  });
  const results = (data?.items ?? []).filter((p) => !value.some((v) => v.contentHash === p.contentHash));

  function addLink(article: LinkedArticle) {
    onChange([...value, article]);
    setQuery("");
  }

  function removeLink(contentHash: string) {
    onChange(value.filter((v) => v.contentHash !== contentHash));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((link) => (
            <li
              key={link.contentHash}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <span className="truncate text-zinc-700 dark:text-zinc-300">{link.title}</span>
              <button
                type="button"
                onClick={() => removeLink(link.contentHash)}
                aria-label={`Quitar enlace a ${link.title}`}
                className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            clearTimeout(blurTimeout.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Busca un artículo de NewsEra por título..."
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-white"
        />

        {open && debouncedQuery.trim().length >= 2 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {isLoading && <li className="px-3 py-2 text-zinc-400">Buscando...</li>}
            {!isLoading && results.length === 0 && (
              <li className="px-3 py-2 text-zinc-400">Sin resultados para "{debouncedQuery.trim()}".</li>
            )}
            {!isLoading &&
              results.map((p) => (
                <li key={p.contentHash}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addLink({ contentHash: p.contentHash, title: p.title })}
                    className="block w-full truncate px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {p.title || "(sin título)"}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
