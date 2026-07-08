import { Link } from "react-router-dom";
import type { ReputationHistoryEntry, ReputationReason } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

const REASON_LABELS: Record<ReputationReason, string> = {
  VOTE_REWARD: "Acierto al votar",
  VOTE_PENALTY: "Fallo al votar",
  PUBLISH_REWARD: "Tu artículo se verificó como verdadero",
  PUBLISH_PENALTY: "Tu artículo se verificó como falso o no verificable",
  RETROACTIVE: "Ajuste retroactivo",
  PREDICTION_REWARD: "Acierto al predecir",
  PREDICTION_PENALTY: "Fallo al predecir",
  REGISTERED: "Registro inicial como validador",
};

/**
 * Lista completa de movimientos de reputación de una dirección (ledger
 * poblado por el indexador a partir de ReputationUpdated) — responde a "por
 * qué tengo/tiene esta reputación", mostrando cada voto, recompensa/
 * penalización por publicar, reclamación retroactiva, predicción y registro
 * inicial, en vez de solo el efecto de rondas propias como votante.
 */
export function ReputationHistoryList({ entries }: { entries: ReputationHistoryEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState message="Sin variaciones de reputación registradas todavía." />;
  }

  return (
    <Card className="divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate text-zinc-700 dark:text-zinc-300">
              {REASON_LABELS[entry.reason] ?? entry.reason}
            </p>
            <p className="text-xs text-zinc-400">
              {entry.contentHash ? (
                <Link to={`/article/${entry.contentHash}`} className="font-mono hover:text-brand hover:underline">
                  {entry.contentHash.slice(0, 10)}…
                  {entry.round !== null ? ` (ronda ${entry.round})` : ""}
                </Link>
              ) : (
                new Date(entry.createdAt).toLocaleDateString()
              )}
            </p>
          </div>
          <span
            className={`shrink-0 font-semibold ${
              entry.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {entry.delta > 0 ? "+" : ""}
            {entry.delta}
          </span>
        </div>
      ))}
    </Card>
  );
}
