import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePredictableArticles, type PredictableArticle } from "@/hooks/usePredictableArticles";
import { useTransactionState } from "@/hooks/useTransactionState";
import {
  validationRegistry,
  reputationSystem,
  voteToIndex,
  type VoteLabel,
  MIN_REPUTATION_TO_VALIDATE,
  PREDICTION_REWARD,
  PREDICTION_PENALTY,
} from "@/lib/contracts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/ui/states";

const VOTE_LABELS_ES: Record<VoteLabel, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
};

function ArticlePrediction({ article }: { article: PredictableArticle }) {
  const { publication, correctResult } = article;
  const tx = useTransactionState();
  const [chosen, setChosen] = useState<VoteLabel | null>(null);

  function predict(vote: VoteLabel) {
    setChosen(vote);
    tx.write({
      ...validationRegistry,
      functionName: "submitPrediction",
      args: [publication.contentHash, voteToIndex(vote)],
    });
  }

  const resolved = tx.isConfirmed && chosen !== null;
  const guessedRight = resolved && chosen === correctResult;

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <Link to={`/article/${publication.contentHash}`} className="font-medium underline-offset-2 hover:underline">
          {publication.title || "(sin título)"}
        </Link>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
          Resultado: {VOTE_LABELS_ES[correctResult]}
        </span>
      </div>
      {publication.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {publication.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              #{t}
            </span>
          ))}
        </div>
      )}

      {resolved ? (
        <p className={guessedRight ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-red-600 dark:text-red-400"}>
          {guessedRight
            ? `¡Acertaste! +${PREDICTION_REWARD} de reputación.`
            : `Fallaste. La respuesta era "${VOTE_LABELS_ES[correctResult]}" (−${PREDICTION_PENALTY} de reputación).`}
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {(["TRUE", "FALSE", "UNVERIFIABLE"] as VoteLabel[]).map((vote) => (
            <Button
              key={vote}
              variant="secondary"
              disabled={tx.status !== "idle" && tx.status !== "failed"}
              onClick={() => predict(vote)}
            >
              {VOTE_LABELS_ES[vote]}
            </Button>
          ))}
        </div>
      )}

      {tx.status === "pending" && <p className="mt-2 text-sm text-zinc-500">Confirma en tu cartera...</p>}
      {tx.status === "confirming" && <p className="mt-2 text-sm text-zinc-500">Esperando confirmación...</p>}
      {tx.status === "failed" && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{tx.errorMessage}</p>}
    </Card>
  );
}

export default function Practice() {
  const { address, isConnected } = useAccount();

  const { data: reputation } = useReadContract({
    ...reputationSystem,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: canValidate } = useReadContract({
    ...reputationSystem,
    functionName: "canValidate",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: predictable, isLoading } = usePredictableArticles(address);

  if (!isConnected || !address) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Practicar predicciones</h1>
        <p className="text-sm text-zinc-500">Conecta tu cartera para empezar a predecir y ganar reputación.</p>
        <ConnectButton />
      </div>
    );
  }

  const repValue = reputation !== undefined ? Number(reputation) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Practicar predicciones</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Predice el resultado de artículos ya resueltos. Como la respuesta ya es pública, esto no
        es una prueba de criterio: es una vía de acceso para ganar reputación y llegar a poder
        votar de verdad.
      </p>

      <Card className="mb-8 p-5">
        <p className="text-sm text-zinc-500">
          Reputación actual: <span className="font-semibold text-zinc-900 dark:text-white">{repValue}</span>
        </p>
        {!canValidate && (
          <p className="text-sm text-zinc-500">
            {repValue} / {MIN_REPUTATION_TO_VALIDATE} — te faltan{" "}
            {Math.max(0, MIN_REPUTATION_TO_VALIDATE - repValue)} aciertos para poder votar de verdad.
          </p>
        )}
      </Card>

      {canValidate ? (
        <Card className="p-5">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Ya tienes reputación suficiente para votar de verdad. Visita el{" "}
            <Link to="/" className="underline underline-offset-2">
              feed de artículos pendientes de validación
            </Link>{" "}
            para emitir tu voto.
          </p>
        </Card>
      ) : isLoading ? (
        <LoadingState label="Buscando artículos resueltos..." />
      ) : predictable.length === 0 ? (
        <EmptyState message="No hay artículos nuevos disponibles para predecir ahora mismo." />
      ) : (
        <div className="space-y-4">
          {predictable.map((article) => (
            <ArticlePrediction key={article.publication.contentHash} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
