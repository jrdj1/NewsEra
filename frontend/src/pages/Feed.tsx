import { useState } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { usePublications } from "@/hooks/usePublications";
import { PublicationCard } from "@/components/PublicationCard";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { reputationSystem } from "@/lib/contracts";

function Pillar({
  title,
  description,
  label,
}: {
  title: string;
  description: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

const STATE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "En votación" },
  { value: "DEFINITIVE", label: "Consenso" },
  { value: "DISPUTED", label: "En disputa" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "votes", label: "Más votados" },
  { value: "state", label: "Por estado" },
] as const;

function FeedSection() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState("");
  const [sort, setSort] = useState<"recent" | "votes" | "state">("recent");

  const { data, isLoading, isError, refetch } = usePublications({ page, limit: 12, state: state || undefined, sort });

  return (
    <section className="border-t border-zinc-100 dark:border-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Feed de publicaciones
          </h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {STATE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <LoadingState label="Cargando publicaciones..." />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {data && data.items.length === 0 && <EmptyState message="Todavía no hay publicaciones." />}

        {data && data.items.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((p) => (
                <PublicationCard key={p.contentHash} publication={p} />
              ))}
            </div>
            {data.total > data.limit && (
              <div className="mt-8 flex justify-center gap-3">
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
          </>
        )}
      </div>
    </section>
  );
}

export default function Feed() {
  const { address, isConnected } = useAccount();

  const { data: canValidate } = useReadContract({
    ...reputationSystem,
    functionName: "canValidate",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
          La verdad,{" "}
          <span className="text-zinc-500">registrada en la blockchain</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-500">
          NewsEra es una plataforma descentralizada donde cualquier persona puede
          publicar información y la comunidad la valida colectivamente. Sin
          intermediarios. Sin censura.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isConnected ? (
            <Link
              to="/publish"
              className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Publicar articulo
            </Link>
          ) : (
            <ConnectButton />
          )}
          <Link
            to="/about"
            className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Saber mas
          </Link>
        </div>
      </section>

      {/* Pilares */}
      <section className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Por que NewsEra
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Pillar
              label="Pilar 1"
              title="Inmutabilidad"
              description="Cada publicacion queda registrada en la blockchain mediante su hash keccak256. Ningun actor puede alterarla ni eliminarla una vez confirmada."
            />
            <Pillar
              label="Pilar 2"
              title="Validacion colectiva"
              description="La comunidad de validadores con reputacion suficiente vota la veracidad de cada publicacion. El consenso se determina por quorum, no por autoridad central."
            />
            <Pillar
              label="Pilar 3"
              title="Resistencia a la captura"
              description="Las reglas de publicacion y gobernanza viven en contratos inteligentes publicos. Ningun grupo de poder puede modificarlas unilateralmente."
            />
          </div>
        </div>
      </section>

      {/* Rampa de acceso a predicciones */}
      {isConnected && canValidate === false && (
        <section className="border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="text-lg font-semibold">Todavía no tienes reputación suficiente para votar</h2>
              <p className="text-sm text-zinc-500">
                Practica prediciendo el resultado de artículos ya resueltos y gana reputación.
              </p>
            </div>
            <Link
              to="/practice"
              className="shrink-0 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Empieza a ganar reputación
            </Link>
          </div>
        </section>
      )}

      <FeedSection />
    </div>
  );
}
