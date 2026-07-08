import { useState } from "react";
import { Link } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function Users() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"reputation" | "articles">("reputation");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useUsers(page, 20, sort, search || undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Usuarios</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Descubre validadores y publicadores de la comunidad.
      </p>

      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre o dirección..."
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="reputation">Por reputación</option>
          <option value="articles">Por artículos publicados</option>
        </select>
      </div>

      {isLoading && <LoadingState label="Cargando usuarios..." />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && data.items.length === 0 && <EmptyState message="No se encontraron usuarios." />}

      {data && data.items.length > 0 && (
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.items.map((u, i) => (
            <Link
              key={u.address}
              to={`/users/${u.address}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-sm font-medium text-zinc-400">
                  {(page - 1) * 20 + i + 1}
                </span>
                {u.avatarUrl && (
                  <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <div>
                  {u.displayName && <p className="text-sm font-medium">{u.displayName}</p>}
                  <span className="font-mono text-xs text-zinc-400">{shortAddress(u.address)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">
                  {u.articleCount} artículo{u.articleCount === 1 ? "" : "s"}
                </span>
                <span className="font-semibold">{u.reputationScore} rep.</span>
              </div>
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
