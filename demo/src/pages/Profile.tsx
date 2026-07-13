import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useReadContracts, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useValidatorHistory, useReputationHistory, useActivity } from "@/hooks/useValidatorProfile";
import { useUserDetail } from "@/hooks/useUsers";
import { useEnrichedProfile, useFavorites, useInvalidateProfile } from "@/hooks/useProfile";
import { usePublications } from "@/hooks/usePublications";
import { useReopenRequests } from "@/hooks/useReopenRequests";
import { useTransactionState } from "@/hooks/useTransactionState";
import { reputationSystem, validationRegistry, MIN_REPUTATION_TO_VALIDATE } from "@/lib/contracts";
import { api } from "@/lib/api";
import { translateError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, consensusTone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { PublicationCard } from "@/components/PublicationCard";
import { ReputationHistoryList } from "@/components/ReputationHistoryList";
import { ActivityList } from "@/components/ActivityList";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.9l6-.9 2.6-5.4Z" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" strokeLinecap="round" />
      <path d="M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.5-2.2" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M6 3h9l3 3v15H6Z" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 20s-7-4.4-9.5-8.8C.7 7.6 2.6 4 6.2 4c2 0 3.4 1.1 4.3 2.4C11.4 5.1 12.8 4 14.8 4c3.6 0 5.5 3.6 3.7 7.2C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
      <path d="M13 6.5 17.5 11" strokeLinecap="round" />
    </svg>
  );
}

const TAB_ORDER = [
  "reputacion",
  "actividad",
  "validaciones",
  "retroactivas",
  "reaperturas",
  "publicaciones",
  "favoritos",
] as const;
const TABS = [...TAB_ORDER, "editar"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<(typeof TAB_ORDER)[number], { label: string; Icon: () => React.JSX.Element }> = {
  reputacion: { label: "Reputación", Icon: StarIcon },
  actividad: { label: "Todas las transacciones", Icon: ClockIcon },
  validaciones: { label: "Mis votaciones", Icon: CheckCircleIcon },
  retroactivas: { label: "Reclamaciones", Icon: RefreshIcon },
  reaperturas: { label: "Reaperturas", Icon: LockOpenIcon },
  publicaciones: { label: "Mis publicaciones", Icon: DocIcon },
  favoritos: { label: "Favoritos", Icon: HeartIcon },
};

const OUTCOME_LABELS: Record<string, { label: string; tone: "success" | "danger" | "neutral" }> = {
  won: { label: "Ganada", tone: "success" },
  lost: { label: "Perdida", tone: "danger" },
  unresolved: { label: "Sin resolver", tone: "neutral" },
};

function ProfileAvatar({ url, name, size = "h-16 w-16" }: { url?: string | null; name: string; size?: string }) {
  if (url) {
    return <img src={url} alt="" className={`${size} shrink-0 rounded-full object-cover ring-4 ring-brand/10`} />;
  }
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand/15 text-xl font-bold text-brand ring-4 ring-brand/10`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function RetroactiveClaims({ address }: { address: string }) {
  const { data: history } = useValidatorHistory(address, 1, 100);
  const items = history?.items ?? [];
  const uniqueHashes = useMemo(() => [...new Set(items.map((i) => i.contentHash))], [items]);

  const { data: currentRounds } = useReadContracts({
    contracts: uniqueHashes.map((hash) => ({
      ...validationRegistry,
      functionName: "currentRound",
      args: [hash],
    })),
    query: { enabled: uniqueHashes.length > 0 },
  });

  const roundByHash = new Map(
    uniqueHashes.map((hash, i) => [hash, currentRounds?.[i]?.result as bigint | undefined]),
  );

  const eligible = items.filter((item) => {
    const onChainRound = roundByHash.get(item.contentHash);
    return onChainRound !== undefined && Number(onChainRound) > item.round;
  });

  const tx = useTransactionState();
  const [claimingHash, setClaimingHash] = useState<string | null>(null);

  function claim(hash: string) {
    setClaimingHash(hash);
    tx.write({ ...validationRegistry, functionName: "claimRetroactiveReputation", args: [hash] });
  }

  if (eligible.length === 0) {
    return <EmptyState message="No tienes reclamaciones retroactivas pendientes." />;
  }

  return (
    <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {eligible.map((item) => (
        <div key={item.contentHash} className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium">{item.title || item.contentHash.slice(0, 12)}</p>
            <p className="text-xs text-zinc-400">Votaste en la ronda {item.round}</p>
          </div>
          <Button
            variant="secondary"
            disabled={tx.status !== "idle" && tx.status !== "failed" && claimingHash === item.contentHash}
            onClick={() => claim(item.contentHash)}
          >
            Reclamar
          </Button>
        </div>
      ))}
      {claimingHash && tx.status !== "idle" && (
        <div className="px-5 py-3 text-sm">
          {tx.status === "pending" && "Confirma en tu cartera..."}
          {tx.status === "confirming" && "Esperando confirmación..."}
          {tx.status === "confirmed" && "¡Reclamación aplicada!"}
          {tx.status === "failed" && <span className="text-red-600 dark:text-red-400">{tx.errorMessage}</span>}
        </div>
      )}
    </Card>
  );
}

function EditProfileForm({ address, onDone }: { address: string; onDone: () => void }) {
  const { data: profile } = useEnrichedProfile(address);
  const invalidate = useInvalidateProfile();
  const { signMessageAsync } = useSignMessage();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const message = JSON.stringify({ displayName, avatarUrl, email, timestamp: Date.now() });
      const signature = await signMessageAsync({ message });
      await api.put(`/api/v1/profile/${address}`, { displayName, avatarUrl, email, signature, message });
      invalidate(address);
      setSaved(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <button
        type="button"
        onClick={onDone}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        ← Volver al perfil
      </button>

      <div className="flex items-center gap-3">
        <ProfileAvatar url={avatarUrl || undefined} name={displayName || address} size="h-14 w-14" />
        <p className="text-xs text-zinc-400">Vista previa del avatar</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Nombre visible</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">URL del avatar</label>
        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email (opcional, nunca se muestra públicamente)</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Firmando y guardando..." : "Guardar cambios"}
      </Button>
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Perfil actualizado.</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default function Profile() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("reputacion");
  const [activityPage, setActivityPage] = useState(1);

  const { data: reputation } = useReadContract({
    ...reputationSystem,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: profile } = useEnrichedProfile(address);
  const { data: detail } = useUserDetail(address);
  const { data: reputationHistory } = useReputationHistory(address);
  const { data: history } = useValidatorHistory(address);
  const { data: reopenRequests } = useReopenRequests(address);
  const { data: activity } = useActivity(address, activityPage, 10);
  const { data: publications } = usePublications(address ? { author: address } : {});
  const { data: favorites } = useFavorites(address);

  if (!isConnected || !address) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-zinc-500">Conecta tu cartera para ver tu perfil.</p>
        <ConnectButton />
      </div>
    );
  }

  const repNumber = reputation !== undefined ? Number(reputation) : undefined;
  const canValidate = repNumber !== undefined && repNumber >= MIN_REPUTATION_TO_VALIDATE;

  const STATS = [
    { label: "Reputación", value: repNumber ?? "—" },
    { label: "Validaciones", value: detail?.totalValidations ?? 0 },
    { label: "% de aciertos", value: detail?.accuracy != null ? `${Math.round(detail.accuracy * 100)}%` : "—" },
    { label: "Publicaciones", value: publications?.total ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {tab === "editar" ? (
        <EditProfileForm address={address} onDone={() => setTab("reputacion")} />
      ) : (
        <>
          {/* Cabecera: identidad + estadísticas rápidas de un vistazo */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <ProfileAvatar url={profile?.avatarUrl} name={profile?.displayName ?? address} />
                <div>
                  <p className="text-xl font-bold">{profile?.displayName ?? shortAddress(address)}</p>
                  {profile?.displayName && (
                    <p className="font-mono text-xs text-zinc-400">{shortAddress(address)}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={canValidate ? "success" : "neutral"}>
                      {repNumber ?? "—"} de reputación
                    </Badge>
                    {canValidate && <Badge tone="success">Validador</Badge>}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setTab("editar")} className="self-start sm:self-center">
                <PencilIcon />
                Editar perfil
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-900">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            {repNumber !== undefined && !canValidate && (
              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>Progreso hacia validador</span>
                  <span>
                    {repNumber} / {MIN_REPUTATION_TO_VALIDATE}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${Math.min(100, (repNumber / MIN_REPUTATION_TO_VALIDATE) * 100)}%` }}
                  />
                </div>
                <Link to="/validate" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
                  Practicar predicciones para ganar reputación →
                </Link>
              </div>
            )}
          </div>

          <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto border-b border-zinc-100 pb-4 dark:border-zinc-900">
            {TAB_ORDER.map((t) => {
              const { label, Icon } = TAB_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon />
                  {label}
                </button>
              );
            })}
          </nav>

          {tab === "reputacion" && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
                Evolución de reputación
              </h2>
              <ReputationHistoryList entries={reputationHistory?.items ?? []} />
            </div>
          )}

          {tab === "actividad" && (
            <ActivityList
              entries={activity?.items ?? []}
              page={activityPage}
              totalPages={activity ? Math.max(1, Math.ceil(activity.total / activity.limit)) : 1}
              onPageChange={setActivityPage}
            />
          )}

          {tab === "validaciones" && (
            <div>
              {!history || history.items.length === 0 ? (
                <EmptyState message="Todavía no has votado ningún artículo." />
              ) : (
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.items.map((h) => (
                    <div key={`${h.contentHash}-${h.round}`} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link to={`/article/${h.contentHash}`} className="font-medium hover:underline">
                        {h.title || h.contentHash.slice(0, 12)}
                      </Link>
                      <Badge tone={OUTCOME_LABELS[h.outcome].tone}>{OUTCOME_LABELS[h.outcome].label}</Badge>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {tab === "retroactivas" && <RetroactiveClaims address={address} />}

          {tab === "reaperturas" && (
            <div>
              {!reopenRequests || reopenRequests.length === 0 ? (
                <EmptyState message="No has solicitado ninguna reapertura." />
              ) : (
                <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {reopenRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link to={`/article/${r.contentHash}`} className="font-medium hover:underline">
                        {r.publication.title || r.contentHash.slice(0, 12)}
                      </Link>
                      <Badge tone={consensusTone(r.publication.consensusState)}>{r.publication.consensusState}</Badge>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {tab === "publicaciones" && (
            <div>
              {!publications || publications.items.length === 0 ? (
                <EmptyState message="Todavía no has publicado ningún artículo." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {publications.items.map((p) => (
                    <PublicationCard key={p.contentHash} publication={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "favoritos" && (
            <div>
              {!favorites || favorites.items.length === 0 ? (
                <EmptyState message="No tienes artículos guardados en favoritos." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {favorites.items.map((f) => (
                    <PublicationCard key={f.contentHash} publication={f.publication} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
