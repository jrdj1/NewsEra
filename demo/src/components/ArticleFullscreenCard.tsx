import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Publication } from "@/lib/api";
import { ConsensusBadge } from "@/components/ui/ConsensusBadge";
import { useEnrichedProfile } from "@/hooks/useProfile";
import { tagColor } from "@/lib/tagColor";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function AuthorLink({ address }: { address: string }) {
  const { data: profile } = useEnrichedProfile(address);

  return (
    <Link
      to={`/users/${address}`}
      className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-brand dark:text-zinc-400"
    >
      {profile?.displayName && <span className="font-medium">{profile.displayName}</span>}
      <span className="font-mono text-xs">{shortAddress(address)}</span>
    </Link>
  );
}

/** Evita que un clic en un enlace/botón interno (autor, votos, acciones de
 * voto) también dispare la navegación al artículo completo del contenedor. */
function stopPropagation(e: MouseEvent) {
  e.stopPropagation();
}

/**
 * Tarjeta de artículo a pantalla completa (menos la altura del header fijo),
 * pensada para un feed de scroll-snap vertical estilo TikTok. Puramente
 * presentacional: el pie interactivo (votar, predecir, o nada en el caso de
 * un feed de solo lectura) se inyecta vía `actions`. La propia tarjeta tiene
 * marco propio (no solo texto flotando sobre el fondo) y es clicable en su
 * totalidad hacia el artículo completo, salvo en modo predicción.
 */
export function ArticleFullscreenCard({
  publication,
  actions,
  hideConsensus = false,
}: {
  publication: Publication;
  actions?: ReactNode;
  /**
   * Oculta el estado/veredicto de consenso, el recuento de votos, el enlace
   * al artículo completo y desactiva el clic en la tarjeta. Usado en el feed
   * de predicción: el artículo objetivo ya es DEFINITIVE (por eso se puede
   * predecir sobre él), así que mostrar su estado o dejar navegar al detalle
   * revelaría la respuesta antes de predecir.
   */
  hideConsensus?: boolean;
}) {
  const navigate = useNavigate();
  const clickable = !hideConsensus;

  function goToArticle() {
    if (clickable) navigate(`/article/${publication.contentHash}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToArticle();
    }
  }

  return (
    <div
      id={publication.contentHash}
      className="flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start items-center justify-center overflow-hidden px-4 py-8 sm:px-8"
    >
      <div
        role={clickable ? "link" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? goToArticle : undefined}
        onKeyDown={clickable ? handleKeyDown : undefined}
        aria-label={clickable ? `Leer artículo completo: ${publication.title}` : undefined}
        className={`mx-auto flex w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900/70 ${
          clickable ? "cursor-pointer hover:border-brand/50 hover:shadow-md" : ""
        }`}
      >
        {!hideConsensus && (
          <div className="flex flex-wrap items-center gap-2" onClick={stopPropagation}>
            <ConsensusBadge state={publication.consensusState} result={publication.currentResult} />
            <Link
              to={`/article/${publication.contentHash}/votes`}
              className="text-xs text-zinc-400 underline-offset-2 hover:text-brand hover:underline"
            >
              {publication.voteCount ?? 0} voto{publication.voteCount === 1 ? "" : "s"}
            </Link>
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {publication.title || "(sin título — indexado on-chain)"}
        </h2>

        <p className="line-clamp-[8] whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {publication.body || "Contenido pendiente de sincronizar desde IPFS/backend."}
        </p>

        {publication.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {publication.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${tagColor(tag)}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1" onClick={stopPropagation}>
          <AuthorLink address={publication.authorAddress} />
          {!hideConsensus && (
            <Link
              to={`/article/${publication.contentHash}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
            >
              Ver artículo completo
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>

        {actions && (
          <div className="pt-2" onClick={stopPropagation}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
