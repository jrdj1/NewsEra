import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useReadContracts, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useValidatorHistory, useReputationHistory } from "@/hooks/useValidatorProfile";
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

const TABS = [
  "reputacion",
  "validaciones",
  "retroactivas",
  "reaperturas",
  "publicaciones",
  "favoritos",
  "editar",
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  reputacion: "Reputación",
  validaciones: "Mis votaciones",
  retroactivas: "Reclamaciones",
  reaperturas: "Reaperturas",
  publicaciones: "Mis publicaciones",
  favoritos: "Favoritos",
  editar: "Editar perfil",
};

const OUTCOME_LABELS: Record<string, { label: string; tone: "success" | "danger" | "neutral" }> = {
  won: { label: "Ganada", tone: "success" },
  lost: { label: "Perdida", tone: "danger" },
  unresolved: { label: "Sin resolver", tone: "neutral" },
};

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

function EditProfileForm({ address }: { address: string }) {
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
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre visible</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">URL del avatar</label>
        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
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

  const { data: reputation } = useReadContract({
    ...reputationSystem,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: detail } = useUserDetail(address);
  const { data: reputationHistory } = useReputationHistory(address);
  const { data: history } = useValidatorHistory(address);
  const { data: reopenRequests } = useReopenRequests(address);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Mi perfil</h1>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-900">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {tab === "reputacion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{reputation !== undefined ? Number(reputation) : "—"}</p>
              <p className="text-xs text-zinc-500">Reputación actual</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">{detail?.totalValidations ?? 0}</p>
              <p className="text-xs text-zinc-500">Validaciones</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold">
                {detail?.accuracy != null ? `${Math.round(detail.accuracy * 100)}%` : "—"}
              </p>
              <p className="text-xs text-zinc-500">% de aciertos</p>
            </Card>
          </div>

          {reputation !== undefined && Number(reputation) < MIN_REPUTATION_TO_VALIDATE && (
            <Card className="flex items-center justify-between gap-4 p-4">
              <p className="text-sm text-zinc-500">
                Te faltan {MIN_REPUTATION_TO_VALIDATE - Number(reputation)} puntos de reputación para
                poder votar de verdad.
              </p>
              <Link
                to="/validate"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Practicar predicciones
              </Link>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Evolución de reputación
            </h2>
            {!reputationHistory || reputationHistory.length === 0 ? (
              <EmptyState message="Sin variaciones de reputación registradas todavía." />
            ) : (
              <Card className="divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
                {reputationHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-mono text-xs text-zinc-400">
                      {entry.contentHash.slice(0, 10)}… (ronda {entry.round})
                    </span>
                    <span className={entry.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {entry.delta > 0 ? "+" : ""}
                      {entry.delta}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
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

      {tab === "editar" && <EditProfileForm address={address} />}
    </div>
  );
}
