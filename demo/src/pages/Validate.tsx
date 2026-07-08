import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePredictableArticles, type PredictableArticle } from "@/hooks/usePredictableArticles";
import { useVotableArticles } from "@/hooks/useVotableArticles";
import { useReputationStatus } from "@/hooks/useReputationStatus";
import { useTransactionState } from "@/hooks/useTransactionState";
import {
  validationRegistry,
  voteToIndex,
  type VoteLabel,
  MIN_REPUTATION_TO_VALIDATE,
  REPUTATION_REWARD,
  REPUTATION_PENALTY,
  PREDICTION_REWARD,
  PREDICTION_PENALTY,
} from "@/lib/contracts";
import { ArticleFullscreenCard } from "@/components/ArticleFullscreenCard";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/ui/states";
import type { Publication } from "@/lib/api";

const VOTE_LABELS_ES: Record<VoteLabel, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
};

function VoteActions({ publication }: { publication: Publication }) {
  const tx = useTransactionState();

  function vote(v: VoteLabel) {
    tx.write({
      ...validationRegistry,
      functionName: "submitValidation",
      args: [publication.contentHash, voteToIndex(v)],
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {(["TRUE", "FALSE", "UNVERIFIABLE"] as VoteLabel[]).map((v) => (
          <Button key={v} variant="secondary" disabled={tx.status !== "idle" && tx.status !== "failed"} onClick={() => vote(v)}>
            {VOTE_LABELS_ES[v]}
            <span className="ml-1 text-xs text-zinc-400">
              (+{REPUTATION_REWARD}/−{REPUTATION_PENALTY})
            </span>
          </Button>
        ))}
      </div>
      {tx.status === "pending" && <p className="mt-2 text-sm text-zinc-500">Confirma en tu cartera...</p>}
      {tx.status === "confirming" && <p className="mt-2 text-sm text-zinc-500">Esperando confirmación...</p>}
      {tx.status === "confirmed" && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">¡Voto registrado!</p>}
      {tx.status === "failed" && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{tx.errorMessage}</p>}
    </div>
  );
}

function PredictActions({ article }: { article: PredictableArticle }) {
  const { publication, correctResult } = article;
  const tx = useTransactionState();
  const [chosen, setChosen] = useState<VoteLabel | null>(null);

  function predict(v: VoteLabel) {
    setChosen(v);
    tx.write({
      ...validationRegistry,
      functionName: "submitPrediction",
      args: [publication.contentHash, voteToIndex(v)],
    });
  }

  const resolved = tx.isConfirmed && chosen !== null;
  const guessedRight = resolved && chosen === correctResult;

  if (resolved) {
    return (
      <p className={guessedRight ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-red-600 dark:text-red-400"}>
        {guessedRight
          ? `¡Acertaste! +${PREDICTION_REWARD} de reputación.`
          : `Fallaste. La respuesta era "${VOTE_LABELS_ES[correctResult]}" (−${PREDICTION_PENALTY} de reputación).`}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {(["TRUE", "FALSE", "UNVERIFIABLE"] as VoteLabel[]).map((v) => (
          <Button key={v} variant="secondary" disabled={tx.status !== "idle" && tx.status !== "failed"} onClick={() => predict(v)}>
            {VOTE_LABELS_ES[v]}
          </Button>
        ))}
      </div>
      {tx.status === "pending" && <p className="mt-2 text-sm text-zinc-500">Confirma en tu cartera...</p>}
      {tx.status === "confirming" && <p className="mt-2 text-sm text-zinc-500">Esperando confirmación...</p>}
      {tx.status === "failed" && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{tx.errorMessage}</p>}
    </div>
  );
}

function ReputationHeader({ reputation, canValidate }: { reputation: number; canValidate: boolean }) {
  return (
    <div className="sticky top-16 z-10 border-b border-zinc-100 bg-white/90 px-4 py-3 text-center text-sm backdrop-blur-sm dark:border-zinc-900 dark:bg-zinc-950/90">
      {canValidate ? (
        <span className="text-zinc-500">Reputación actual: <strong className="text-zinc-900 dark:text-white">{reputation}</strong> — ya puedes votar de verdad</span>
      ) : (
        <span className="text-zinc-500">
          {reputation} / {MIN_REPUTATION_TO_VALIDATE} — te faltan {Math.max(0, MIN_REPUTATION_TO_VALIDATE - reputation)} aciertos para votar de verdad
        </span>
      )}
    </div>
  );
}

export default function Validate() {
  const { address, isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { reputation, canValidate } = useReputationStatus(address);

  const { data: votable, isLoading: isLoadingVotable } = useVotableArticles(canValidate ? address : undefined);
  const { data: predictable, isLoading: isLoadingPredictable } = usePredictableArticles(
    canValidate === false ? address : undefined,
  );

  // Detecta la transición predictor -> validador (solo dentro de esta sesión:
  // si ya eras validador al entrar, `prevCanValidate` arranca en `true` y no
  // se dispara la celebración de nuevo en cada recarga).
  const prevCanValidateRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevCanValidateRef.current === false && canValidate === true) {
      navigate("/validate/welcome");
    }
    prevCanValidateRef.current = canValidate;
  }, [canValidate, navigate]);

  if (!isConnected || !address) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Validar</h1>
        <p className="text-sm text-zinc-500">Conecta tu cartera para votar o practicar predicciones.</p>
        <ConnectButton />
      </div>
    );
  }

  const isLoading = canValidate === undefined || isLoadingVotable || isLoadingPredictable;

  return (
    <div>
      <ReputationHeader reputation={reputation} canValidate={!!canValidate} />

      {isLoading && <LoadingState label="Buscando artículos..." />}

      {!isLoading && canValidate && votable.length === 0 && (
        <EmptyState message="No hay artículos pendientes de votar ahora mismo." />
      )}
      {!isLoading && canValidate === false && predictable.length === 0 && (
        <EmptyState message="No hay artículos nuevos disponibles para predecir ahora mismo." />
      )}

      {!isLoading && canValidate && votable.length > 0 && (
        <div ref={containerRef} className="h-[calc(100dvh-7.5rem)] snap-y snap-mandatory overflow-y-auto">
          {votable.map((p) => (
            <ArticleFullscreenCard key={p.contentHash} publication={p} actions={<VoteActions publication={p} />} />
          ))}
        </div>
      )}

      {!isLoading && canValidate === false && predictable.length > 0 && (
        <div ref={containerRef} className="h-[calc(100dvh-7.5rem)] snap-y snap-mandatory overflow-y-auto">
          {predictable.map((article) => (
            <ArticleFullscreenCard
              key={article.publication.contentHash}
              publication={article.publication}
              actions={<PredictActions article={article} />}
              hideConsensus
            />
          ))}
        </div>
      )}

      {!isLoading && canValidate === false && (
        <p className="mx-auto max-w-2xl px-4 py-6 text-center text-xs text-zinc-400">
          Como el artículo ya está resuelto públicamente, cualquiera puede consultar la respuesta antes
          de predecir — es una vía de acceso deliberadamente accesible, no una prueba de criterio.{" "}
          <Link to="/about" className="underline underline-offset-2">Saber más</Link>
        </p>
      )}
    </div>
  );
}
