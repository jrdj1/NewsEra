import { useState } from "react";
import { Link } from "react-router-dom";
import { useValidators } from "@/hooks/useValidators";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function Validators() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useValidators(page, 20);

  if (isLoading) return <LoadingState label="Cargando ranking de validadores..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Validadores</h1>
      <p className="mb-8 text-sm text-zinc-500">Ranking por reputación, de mayor a menor.</p>

      {items.length === 0 ? (
        <EmptyState message="Todavía no hay validadores registrados." />
      ) : (
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((v, i) => (
            <Link
              key={v.address}
              to={`/validators/${v.address}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-sm font-medium text-zinc-400">
                  {(page - 1) * 20 + i + 1}
                </span>
                <span className="font-mono text-sm">{shortAddress(v.address)}</span>
              </div>
              <span className="font-semibold">{v.reputationScore}</span>
            </Link>
          ))}
        </Card>
      )}

      {data && data.total > data.limit && (
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page * data.limit >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
