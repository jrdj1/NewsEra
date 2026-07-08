import { Link } from "react-router-dom";
import {
  MIN_REPUTATION_TO_VALIDATE,
  REPUTATION_REWARD,
  REPUTATION_PENALTY,
} from "@/lib/contracts";

export default function ValidatorWelcome() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="text-6xl">🎉</span>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        ¡Ya eres validador!
      </h1>
      <p className="text-sm text-zinc-500">
        Has superado los {MIN_REPUTATION_TO_VALIDATE} puntos de reputación prediciendo acertadamente
        sobre artículos ya resueltos. A partir de ahora tu voto pasa a contar de verdad en la red.
      </p>

      <div className="w-full space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-left text-sm dark:border-zinc-900 dark:bg-zinc-900">
        <p className="font-semibold text-zinc-900 dark:text-white">Qué cambia a partir de ahora:</p>
        <ul className="list-disc space-y-1.5 pl-5 text-zinc-500">
          <li>
            Ya no predices sobre artículos resueltos — votas de verdad en artículos{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">pendientes</span>, y tu voto
            cuenta para el quórum y el consenso real.
          </li>
          <li>
            Acertar con la opción ganadora te da{" "}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{REPUTATION_REWARD}</span>{" "}
            de reputación; quedarte en minoría te resta{" "}
            <span className="font-medium text-red-600 dark:text-red-400">−{REPUTATION_PENALTY}</span>.
          </li>
          <li>
            Puedes solicitar la reapertura de artículos ya resueltos en los que todavía no hayas votado.
          </li>
          <li>
            Puedes reclamar reputación retroactiva desde tu perfil cuando artículos que ya votaste
            acumulen rondas posteriores.
          </li>
        </ul>
      </div>

      <Link
        to="/validate"
        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
      >
        Empezar a validar
      </Link>
    </div>
  );
}
