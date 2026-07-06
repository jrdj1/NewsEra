const STYLES: Record<string, string> = {
  TRUE: "bg-consensus-true/10 text-consensus-true",
  FALSE: "bg-consensus-false/10 text-consensus-false",
  UNVERIFIABLE: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
  PENDING: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
  DISPUTED: "bg-consensus-unverifiable/10 text-consensus-unverifiable",
};

const LABELS: Record<string, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
  PENDING: "Pendiente",
  DISPUTED: "En disputa",
};

export function ConsensusBadge({ state, result }: { state: string; result?: string | null }) {
  const key = state === "DEFINITIVE" && result ? result : state;
  const label = LABELS[key] ?? key;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[key] ?? "bg-zinc-100 text-zinc-500"}`}>
      {label}
    </span>
  );
}
