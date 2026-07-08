import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { usePublication } from "@/hooks/usePublication";
import { usePublications } from "@/hooks/usePublications";
import { useTransactionState } from "@/hooks/useTransactionState";
import { useFavorites } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { translateError } from "@/lib/errors";
import {
  validationRegistry,
  reputationSystem,
  voteToIndex,
  type VoteLabel,
  REPUTATION_REWARD,
  REPUTATION_PENALTY,
} from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Badge, consensusTone } from "@/components/ui/badge";
import { ConsensusBadge } from "@/components/ui/ConsensusBadge";
import { Card } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { PublicationCard } from "@/components/PublicationCard";
import { UserLabel } from "@/components/UserLabel";
import { tagColor } from "@/lib/tagColor";

const STATE_LABELS: Record<string, string> = {
  PENDING: "En votación",
  DEFINITIVE: "Consenso alcanzado",
  DISPUTED: "En disputa",
};

const VOTE_LABELS_ES: Record<VoteLabel, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
};

export default function Article() {
  const { hash } = useParams<{ hash: string }>();
  const { address, isConnected } = useAccount();
  const { data: publication, isLoading, isError, refetch } = usePublication(hash);

  const voteTx = useTransactionState();
  const reopenTx = useTransactionState();

  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  const currentRound = publication?.currentRound ?? 0;

  const { data: canValidate } = useReadContract({
    ...reputationSystem,
    functionName: "canValidate",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: hasVoted } = useReadContract({
    ...validationRegistry,
    functionName: "hasVoted",
    args: hash && address ? [hash, address] : undefined,
    query: { enabled: !!hash && !!address },
  });

  const { data: roundVoteCount } = useReadContract({
    ...validationRegistry,
    functionName: "roundVoteCount",
    args: hash ? [hash, BigInt(currentRound)] : undefined,
    query: { enabled: !!hash },
  });

  const { data: quorumThreshold } = useReadContract({
    ...validationRegistry,
    functionName: "quorumThreshold",
  });

  const { data: roundVoters } = useReadContract({
    ...validationRegistry,
    functionName: "getRoundVoters",
    args: hash ? [hash, BigInt(currentRound)] : undefined,
    query: { enabled: !!hash },
  });

  const { data: reopenRequestCountOnChain } = useReadContract({
    ...validationRegistry,
    functionName: "reopenRequestCount",
    args: hash ? [hash] : undefined,
    query: { enabled: !!hash },
  });

  const { data: relatedData } = usePublications(
    publication?.tags?.length ? { tags: publication.tags, limit: 6 } : {},
  );
  const related = (relatedData?.items ?? []).filter((p) => p.contentHash !== hash);

  const { data: favoritesData } = useFavorites(address);
  useEffect(() => {
    if (favoritesData && hash) {
      setIsFavorite(favoritesData.items.some((f) => f.contentHash === hash));
    }
  }, [favoritesData, hash]);

  async function handleVote(vote: VoteLabel) {
    if (!hash) return;
    setActionError(null);
    voteTx.write({
      ...validationRegistry,
      functionName: "submitValidation",
      args: [hash, voteToIndex(vote)],
    });
  }

  async function handleReopen() {
    if (!hash) return;
    setActionError(null);
    reopenTx.write({
      ...validationRegistry,
      functionName: "requestReopen",
      args: [hash],
    });
  }

  useEffect(() => {
    if (voteTx.isConfirmed || reopenTx.isConfirmed) {
      refetch();
    }
  }, [voteTx.isConfirmed, reopenTx.isConfirmed, refetch]);

  async function toggleFavorite() {
    if (!hash || !address || favoritePending) return;
    setFavoritePending(true);
    try {
      if (isFavorite) {
        await api.delete(`/api/v1/favorites/${hash}`, { userAddress: address });
        setIsFavorite(false);
      } else {
        await api.post(`/api/v1/favorites/${hash}`, { userAddress: address });
        setIsFavorite(true);
      }
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setFavoritePending(false);
    }
  }

  async function toggleFollow() {
    if (!hash || !address || followPending) return;
    setFollowPending(true);
    try {
      if (isFollowing) {
        await api.delete(`/api/v1/publications/${hash}/follow`, { userAddress: address });
        setIsFollowing(false);
      } else {
        await api.post(`/api/v1/publications/${hash}/follow`, { userAddress: address });
        setIsFollowing(true);
      }
    } catch (err) {
      setActionError(translateError(err));
    } finally {
      setFollowPending(false);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/article/${hash}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return <LoadingState label="Cargando artículo..." />;
  if (isError || !publication) {
    return <ErrorState message="No se encontró el artículo solicitado." onRetry={() => refetch()} />;
  }

  const quorum = quorumThreshold ? Number(quorumThreshold) : 0;
  const votes = roundVoteCount ? Number(roundVoteCount) : 0;
  const voters = (roundVoters as string[] | undefined) ?? [];
  const alreadyVoted = !!hasVoted;
  const isPending = publication.consensusState === "PENDING";
  const isConcluded = publication.consensusState === "DEFINITIVE" || publication.consensusState === "DISPUTED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ConsensusBadge state={publication.consensusState} result={publication.currentResult} />
        <span className="text-xs text-zinc-400">Ronda {publication.currentRound}</span>
        <Link
          to={`/article/${hash}/votes`}
          className="text-xs text-zinc-400 underline-offset-2 hover:text-brand hover:underline"
        >
          {publication.validations?.length ?? 0} voto{(publication.validations?.length ?? 0) === 1 ? "" : "s"} — ver recuento
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">{publication.title || "(sin título)"}</h1>
      <p className="mb-6 flex flex-wrap items-center gap-1 text-xs text-zinc-400">
        Autor: <UserLabel address={publication.authorAddress} />
        <span>· {new Date(publication.createdAt).toLocaleString()}</span>
      </p>

      <article className="mb-8 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {publication.body || "Contenido pendiente de sincronizar desde IPFS/backend."}
      </article>

      <div className="mb-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={toggleFavorite} disabled={!isConnected || favoritePending}>
          {isFavorite ? "★ Quitar de favoritos" : "☆ Guardar en favoritos"}
        </Button>
        <Button variant="outline" onClick={toggleFollow} disabled={!isConnected || followPending}>
          {isFollowing ? "Dejar de seguir" : "Seguir artículo"}
        </Button>
        <Button variant="outline" onClick={handleShare}>
          {copied ? "¡Copiado!" : "Compartir enlace"}
        </Button>
      </div>

      {publication.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {publication.tags.map((t) => (
            <span key={t} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tagColor(t)}`}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Historial de rondas */}
      {publication.rounds && publication.rounds.length > 0 && (
        <Card className="mb-8 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Historial de rondas
          </h2>
          <ul className="space-y-2 text-sm">
            {publication.rounds.map((r) => (
              <li key={r.round} className="flex items-center justify-between">
                <span>Ronda {r.round}</span>
                <Badge tone={consensusTone(r.state)}>
                  {r.completed ? `${STATE_LABELS[r.state] ?? r.state}${r.result ? ` — ${VOTE_LABELS_ES[r.result]}` : ""}` : "En curso"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Progreso de quórum y votantes */}
      {isPending && (
        <Card className="mb-8 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Progreso hacia el quórum
          </h2>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-zinc-900 dark:bg-white"
              style={{ width: `${quorum ? Math.min(100, (votes / quorum) * 100) : 0}%` }}
            />
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            {votes} / {quorum} votos emitidos en esta ronda
          </p>
          {voters.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-zinc-400">Ya han votado (sin revelar el sentido del voto):</p>
              <div className="flex flex-wrap gap-3">
                {voters.map((v) => (
                  <UserLabel key={v} address={v} className="text-xs text-zinc-500" />
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {actionError && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      {/* Votación */}
      {isPending && isConnected && !!canValidate && !alreadyVoted && (
        <Card className="mb-8 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Emitir voto
          </h2>
          <div className="flex flex-wrap gap-3">
            {(["TRUE", "FALSE", "UNVERIFIABLE"] as VoteLabel[]).map((vote) => (
              <Button
                key={vote}
                variant="secondary"
                disabled={voteTx.status !== "idle" && voteTx.status !== "failed"}
                onClick={() => handleVote(vote)}
              >
                {VOTE_LABELS_ES[vote]}
                <span className="ml-1 text-xs text-zinc-400">
                  (+{REPUTATION_REWARD}/−{REPUTATION_PENALTY})
                </span>
              </Button>
            ))}
          </div>
          {voteTx.status !== "idle" && (
            <p className="mt-3 text-sm text-zinc-500">
              {voteTx.status === "pending" && "Confirma en tu cartera..."}
              {voteTx.status === "confirming" && "Esperando confirmación..."}
              {voteTx.status === "confirmed" && "¡Voto registrado!"}
              {voteTx.status === "failed" && (
                <span className="text-red-600 dark:text-red-400">{voteTx.errorMessage}</span>
              )}
            </p>
          )}
        </Card>
      )}

      {isPending && isConnected && !canValidate && !alreadyVoted && (
        <p className="mb-8 text-sm text-zinc-500">
          Todavía no tienes reputación suficiente para votar de verdad.{" "}
          <Link to="/validate" className="text-brand underline underline-offset-2">
            Practica prediciendo sobre artículos ya resueltos
          </Link>{" "}
          para ganar reputación.
        </p>
      )}

      {isPending && alreadyVoted && (
        <p className="mb-8 text-sm text-zinc-500">Ya has votado este artículo en la ronda actual.</p>
      )}

      {/* Reapertura — solo para quienes ya tienen reputación suficiente para
          validar (el contrato revierte con InsufficientReputation si no) */}
      {isConcluded && isConnected && !!canValidate && !alreadyVoted && (
        <Card className="mb-8 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Solicitar reapertura
          </h2>
          <p className="mb-3 text-sm text-zinc-500">
            Solicitudes acumuladas: {reopenRequestCountOnChain ? Number(reopenRequestCountOnChain) : 0}
          </p>
          <Button
            variant="secondary"
            onClick={handleReopen}
            disabled={reopenTx.status !== "idle" && reopenTx.status !== "failed"}
          >
            Solicitar reapertura
          </Button>
          {reopenTx.status === "failed" && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{reopenTx.errorMessage}</p>
          )}
          {reopenTx.status === "confirmed" && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Solicitud registrada.</p>
          )}
        </Card>
      )}

      {/* Artículos relacionados */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Artículos relacionados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.slice(0, 4).map((p) => (
              <PublicationCard key={p.contentHash} publication={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
