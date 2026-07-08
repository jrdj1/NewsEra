import { Link, useParams } from "react-router-dom";
import { usePublication } from "@/hooks/usePublication";
import { ConsensusBadge } from "@/components/ui/ConsensusBadge";
import { Card } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { UserLabel } from "@/components/UserLabel";
import type { VoteLabel } from "@/lib/contracts";

export default function ArticleVotes() {
  const { hash } = useParams<{ hash: string }>();
  const { data: publication, isLoading, isError, refetch } = usePublication(hash);

  if (isLoading) return <LoadingState label="Cargando recuento de votos..." />;
  if (isError || !publication) {
    return <ErrorState message="No se encontró el artículo solicitado." onRetry={() => refetch()} />;
  }

  const rounds = [...(publication.rounds ?? [])].sort((a, b) => a.round - b.round);
  const validations = publication.validations ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to={`/article/${hash}`} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand">
        ← Volver al artículo
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">Recuento de votos</h1>
      <p className="mb-8 text-sm text-zinc-500">{publication.title || "(sin título)"}</p>

      {rounds.length === 0 ? (
        <EmptyState message="Todavía no hay rondas de votación registradas." />
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => {
            const roundValidations = validations.filter((v) => v.round === round.round);
            const tally: Record<VoteLabel, number> = { TRUE: 0, FALSE: 0, UNVERIFIABLE: 0 };
            for (const v of roundValidations) tally[v.vote]++;

            return (
              <Card key={round.round} className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                    Ronda {round.round}
                  </h2>
                  <ConsensusBadge state={round.state} result={round.result} />
                </div>

                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                  {(["TRUE", "FALSE", "UNVERIFIABLE"] as VoteLabel[]).map((v) => (
                    <div key={v} className="flex items-center gap-1.5">
                      <ConsensusBadge state="DEFINITIVE" result={v} />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{tally[v]}</span>
                    </div>
                  ))}
                </div>

                {roundValidations.length === 0 ? (
                  <p className="text-xs text-zinc-400">Sin votos en esta ronda todavía.</p>
                ) : (
                  <ul className="space-y-2">
                    {roundValidations.map((v) => (
                      <li key={v.id} className="flex items-center justify-between text-sm">
                        <UserLabel address={v.validatorAddress} className="text-xs text-zinc-500" />
                        <ConsensusBadge state="DEFINITIVE" result={v.vote} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-400">
        {validations.length} voto{validations.length === 1 ? "" : "s"} en total
      </p>
    </div>
  );
}
