import { Link } from "react-router-dom";
import type { Publication } from "@/lib/api";
import { Badge, consensusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const STATE_LABELS: Record<string, string> = {
  PENDING: "En votación",
  DEFINITIVE: "Consenso alcanzado",
  DISPUTED: "En disputa",
};

export function PublicationCard({ publication }: { publication: Publication }) {
  return (
    <Link to={`/article/${publication.contentHash}`}>
      <Card className="p-5 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge tone={consensusTone(publication.consensusState)}>
            {STATE_LABELS[publication.consensusState] ?? publication.consensusState}
          </Badge>
          <span className="text-xs text-zinc-400">
            {publication.voteCount ?? 0} voto{publication.voteCount === 1 ? "" : "s"}
          </span>
        </div>
        <h3 className="mb-1 font-semibold text-zinc-900 dark:text-white">
          {publication.title || "(sin título — indexado on-chain)"}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500">
          {publication.body || "Contenido pendiente de sincronizar."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {publication.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-zinc-400">
          Autor: {publication.authorAddress.slice(0, 6)}…{publication.authorAddress.slice(-4)}
        </p>
      </Card>
    </Link>
  );
}
