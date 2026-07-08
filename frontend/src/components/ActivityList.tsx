import { Link } from "react-router-dom";
import type { ActivityItem, ActivityType } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<ActivityType, string> = {
  PUBLICATION: "Publicó un artículo",
  VALIDATION: "Emitió un voto",
  REOPEN_REQUEST: "Solicitó una reapertura",
  RETROACTIVE_CLAIM: "Reclamó reputación retroactiva",
};

const VOTE_LABELS_ES: Record<string, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
};

function detail(entry: ActivityItem): string | null {
  if (entry.type === "VALIDATION" && entry.vote) {
    return `Voto: ${VOTE_LABELS_ES[entry.vote] ?? entry.vote} (ronda ${entry.round})`;
  }
  if (entry.type === "RETROACTIVE_CLAIM" && entry.netDelta !== null) {
    return `Ajuste neto: ${entry.netDelta > 0 ? "+" : ""}${entry.netDelta}`;
  }
  return null;
}

/**
 * Historial completo de interacciones on-chain de una dirección (publicar,
 * votar, solicitar reapertura, reclamar retroactiva), paginado y ordenado
 * por fecha descendente — no incluye predicciones (no se indexan off-chain)
 * ni datos confidenciales, todo lo mostrado es público on-chain.
 */
export function ActivityList({
  entries,
  page,
  totalPages,
  onPageChange,
}: {
  entries: ActivityItem[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (entries.length === 0) {
    return <EmptyState message="Sin transacciones registradas todavía." />;
  }

  return (
    <div>
      <Card className="divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
        {entries.map((entry, i) => (
          <div key={`${entry.type}-${entry.contentHash}-${entry.txHash ?? i}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="min-w-0">
              <p className="text-zinc-700 dark:text-zinc-300">{TYPE_LABELS[entry.type]}</p>
              <Link
                to={`/article/${entry.contentHash}`}
                className="block truncate text-xs text-zinc-400 hover:text-brand hover:underline"
              >
                {entry.title || entry.contentHash.slice(0, 12) + "…"}
              </Link>
              {detail(entry) && <p className="text-xs text-zinc-400">{detail(entry)}</p>}
            </div>
            <span className="shrink-0 text-xs text-zinc-400">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </Card>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-zinc-400">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
