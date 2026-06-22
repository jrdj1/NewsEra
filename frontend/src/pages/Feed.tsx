import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

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

export default function Feed() {
  const { isConnected } = useAccount();

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

      {/* Estado actual */}
      <section className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-400">
            Prototipo en desarrollo &mdash; Sprint 2 completado &mdash; Feed de publicaciones disponible en Sprint 7
          </p>
        </div>
      </section>
    </div>
  );
}
