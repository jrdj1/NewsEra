import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Publication } from "@/lib/api";
import { ConsensusBadge } from "@/components/ui/ConsensusBadge";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Tarjeta de artículo a pantalla completa (menos la altura del header fijo),
 * pensada para un feed de scroll-snap vertical estilo TikTok. Puramente
 * presentacional: el pie interactivo (votar, predecir, o nada en el caso de
 * un feed de solo lectura) se inyecta vía `actions`.
 */
export function ArticleFullscreenCard({
  publication,
  actions,
}: {
  publication: Publication;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col justify-between overflow-hidden px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ConsensusBadge state={publication.consensusState} result={publication.currentResult} />
          <span className="text-xs text-zinc-400">
            {publication.voteCount ?? 0} voto{publication.voteCount === 1 ? "" : "s"}
          </span>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {publication.title || "(sin título — indexado on-chain)"}
        </h2>

        <p className="mb-4 line-clamp-[10] flex-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {publication.body || "Contenido pendiente de sincronizar desde IPFS/backend."}
        </p>

        {publication.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {publication.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <Link to={`/users/${publication.authorAddress}`} className="font-mono underline-offset-2 hover:underline">
            Autor: {shortAddress(publication.authorAddress)}
          </Link>
          <Link to={`/article/${publication.contentHash}`} className="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand">
            Ver artículo completo
          </Link>
        </div>
      </div>

      {actions && <div className="mx-auto w-full max-w-2xl pt-6">{actions}</div>}
    </div>
  );
}
