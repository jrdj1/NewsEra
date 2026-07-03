import { useParams } from "react-router-dom";

export default function Article() {
  const { hash } = useParams<{ hash: string }>();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Artículo</h1>
      <p className="font-mono text-sm text-zinc-400 break-all">{hash}</p>
      <p className="text-zinc-500 text-sm">Sprint 8 — pendiente:</p>
      <ul className="text-left text-sm text-zinc-400 list-disc list-inside space-y-1">
        <li>Ronda actual y estado (PENDING / DEFINITIVE / DISPUTED)</li>
        <li>Historial de rondas anteriores con resultado de cada una</li>
        <li>Botones TRUE / FALSE / UNVERIFIABLE (si canValidate y ronda PENDING)</li>
        <li>Botón "Solicitar reapertura" (si DEFINITIVE o DISPUTED y no has votado aún)</li>
        <li>Manejo de error VotingNotOpen en submitValidation</li>
      </ul>
    </main>
  );
}
