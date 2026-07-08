import { useState } from "react";
import { useParams } from "react-router-dom";
import { useUserDetail } from "@/hooks/useUsers";
import { useValidatorHistory, useReputationHistory, useActivity } from "@/hooks/useValidatorProfile";
import { useEnrichedProfile } from "@/hooks/useProfile";
import { usePublications } from "@/hooks/usePublications";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { PublicationCard } from "@/components/PublicationCard";
import { ReputationHistoryList } from "@/components/ReputationHistoryList";
import { ActivityList } from "@/components/ActivityList";

const OUTCOME_LABELS: Record<string, { label: string; tone: "success" | "danger" | "neutral" }> = {
  won: { label: "Ganada", tone: "success" },
  lost: { label: "Perdida", tone: "danger" },
  unresolved: { label: "Sin resolver", tone: "neutral" },
};

export default function UserProfile() {
  const { address } = useParams<{ address: string }>();
  const [activityPage, setActivityPage] = useState(1);
  const { data: detail, isLoading, isError, refetch } = useUserDetail(address);
  const { data: history } = useValidatorHistory(address);
  const { data: reputationHistory } = useReputationHistory(address);
  const { data: activity } = useActivity(address, activityPage, 10);
  const { data: profile } = useEnrichedProfile(address);
  const { data: publications } = usePublications(address ? { author: address } : {});

  if (isLoading) return <LoadingState label="Cargando perfil..." />;
  if (isError || !detail) {
    return <ErrorState message="No se encontró este usuario." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        {profile?.avatarUrl && (
          <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile?.displayName || "Usuario"}</h1>
          <p className="font-mono text-xs text-zinc-400 break-all">{address}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{detail.reputationScore}</p>
          <p className="text-xs text-zinc-500">Reputación</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{detail.totalValidations}</p>
          <p className="text-xs text-zinc-500">Validaciones</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">
            {detail.accuracy !== null ? `${Math.round(detail.accuracy * 100)}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500">% de aciertos</p>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Historial de validaciones
      </h2>
      {!history || history.items.length === 0 ? (
        <EmptyState message="Sin validaciones todavía." />
      ) : (
        <Card className="mb-10 divide-y divide-zinc-100 dark:divide-zinc-800">
          {history.items.map((h) => (
            <div key={`${h.contentHash}-${h.round}`} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium">{h.title || h.contentHash.slice(0, 12)}</p>
                <p className="text-xs text-zinc-400">Ronda {h.round} — voto {h.vote}</p>
              </div>
              <Badge tone={OUTCOME_LABELS[h.outcome].tone}>{OUTCOME_LABELS[h.outcome].label}</Badge>
            </div>
          ))}
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Movimientos de reputación
      </h2>
      <div className="mb-10">
        <ReputationHistoryList entries={reputationHistory?.items ?? []} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Todas las transacciones
      </h2>
      <div className="mb-10">
        <ActivityList
          entries={activity?.items ?? []}
          page={activityPage}
          totalPages={activity ? Math.max(1, Math.ceil(activity.total / activity.limit)) : 1}
          onPageChange={setActivityPage}
        />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Artículos publicados
      </h2>
      {!publications || publications.items.length === 0 ? (
        <EmptyState message="Esta dirección no ha publicado artículos." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {publications.items.map((p) => (
            <PublicationCard key={p.contentHash} publication={p} />
          ))}
        </div>
      )}
    </div>
  );
}
