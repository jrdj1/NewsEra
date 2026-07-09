import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { resetDemoState } from "@/demo/store";

interface SlideDef {
  id: string;
  eyebrow: string;
  headline: string;
  body?: string;
  visual: string;
  accent: string;
}

const SLIDES: SlideDef[] = [
  {
    id: "problema",
    eyebrow: "El problema",
    headline: "La verdad tiene dueño.",
    body: "Hoy deciden qué es cierto unos pocos — medios, plataformas, gobiernos. Quien controla la respuesta, controla la conversación.",
    visual: "🔒",
    accent: "text-consensus-false",
  },
  {
    id: "solucion",
    eyebrow: "La solución",
    headline: "Que decida todo el mundo.",
    body: "NewsEra reparte esa decisión entre miles de personas, con reglas que nadie controla en solitario — ni siquiera quien lo creó.",
    visual: "🌍",
    accent: "text-brand",
  },
  {
    id: "verdad",
    eyebrow: '¿Qué es "verdad" aquí?',
    headline: "No una autoridad. Un consenso.",
    body: "Aquí nadie dicta la verdad desde arriba: la construye la comunidad votando, y queda anotada para siempre.",
    visual: "🗳️",
    accent: "text-consensus-unverifiable",
  },
  {
    id: "pilares",
    eyebrow: "Los pilares",
    headline: "Tres reglas que no se rompen.",
    visual: "🏛️",
    accent: "text-brand",
  },
  {
    id: "innovacion",
    eyebrow: "Lo nuevo",
    headline: "No mejora al árbitro. Cambia el juego.",
    body: "No es un verificador más encima de los de siempre — es una cancha nueva donde nadie empieza con ventaja.",
    visual: "⚡",
    accent: "text-violet-500",
  },
  {
    id: "blockchain",
    eyebrow: "La tecnología",
    headline: "Un cuaderno que nadie puede tachar.",
    body: "La blockchain es un registro compartido por miles de ordenadores. Lo que se escribe, se queda escrito — y cualquiera puede comprobarlo.",
    visual: "📖",
    accent: "text-brand",
  },
  {
    id: "slogan",
    eyebrow: "",
    headline: "La verdad ya no se pide. Se demuestra.",
    body: "Tú también puedes votar, publicar y decidir.",
    visual: "✊",
    accent: "text-white",
  },
  {
    id: "memoria",
    eyebrow: "Para saber más",
    headline: "¿Quieres el detalle técnico completo?",
    body: "Arquitectura, contratos inteligentes y evaluación del sistema, documentados a fondo.",
    visual: "📚",
    accent: "text-zinc-400",
  },
];

const PILARES = [
  { icon: "🔗", label: "Inmutable", desc: "Nada se borra." },
  { icon: "👥", label: "Colectivo", desc: "Nadie decide solo." },
  { icon: "🛡️", label: "Resistente", desc: "Nadie lo captura." },
];

const CONTRATOS = ["PublicationRegistry", "ValidationRegistry", "ReputationSystem"];

function SlideShell({
  id,
  eyebrow,
  headline,
  body,
  visual,
  accent,
  className = "",
  children,
}: SlideDef & { className?: string; children?: ReactNode }) {
  return (
    <section
      id={id}
      className={`flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center px-6 py-10 text-center sm:px-12 ${className}`}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 sm:gap-5">
        <span className="text-6xl sm:text-7xl" aria-hidden="true">
          {visual}
        </span>
        {eyebrow && (
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accent}`}>{eyebrow}</p>
        )}
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{headline}</h2>
        {body && (
          <p className="text-balance text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg">
            {body}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

function DotNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="Navegación de la introducción"
      className="fixed right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2.5 sm:right-4"
    >
      {SLIDES.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-label={s.eyebrow || s.headline}
          aria-current={active === s.id}
          className={`h-2 w-2 rounded-full transition-all ${
            active === s.id ? "h-5 bg-brand" : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700"
          }`}
        />
      ))}
    </nav>
  );
}

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(SLIDES[0].id);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    function handleScroll() {
      if (!root) return;
      const index = Math.round(root.scrollTop / root.clientHeight);
      const slide = SLIDES[Math.min(SLIDES.length - 1, Math.max(0, index))];
      if (slide) setActive(slide.id);
    }

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, []);

  const [problema, solucion, verdad, pilares, innovacion, blockchain, slogan, memoria] = SLIDES;

  return (
    <div className="relative">
      <DotNav active={active} />
      <div
        ref={containerRef}
        className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        <SlideShell {...problema} />
        <SlideShell {...solucion} />
        <SlideShell {...verdad} />

        <SlideShell {...pilares}>
          <div className="mt-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {PILARES.map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-zinc-100 p-5 dark:border-zinc-900"
              >
                <span className="text-3xl" aria-hidden="true">
                  {p.icon}
                </span>
                <p className="font-semibold">{p.label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </SlideShell>

        <SlideShell {...innovacion} />

        <SlideShell {...blockchain}>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {CONTRATOS.map((c) => (
              <span
                key={c}
                className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand"
              >
                {c}
              </span>
            ))}
          </div>
        </SlideShell>

        <SlideShell {...slogan} className="bg-brand text-white">
          {/* TODO: apuntar a /noticias cuando llegue la fase 2 (cinemática
              de inicio + renombrado del feed a "Noticias", ver DESIGN.md). */}
          <Link
            to="/"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow-lg transition-transform hover:scale-105"
          >
            Entrar a NewsEra
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </SlideShell>

        <SlideShell {...memoria}>
          <a
            href="https://github.com/jrdj1/TFG-NewsEra-memoria"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Leer la memoria (GitHub)
          </a>

          <div className="mt-8 space-y-0.5 text-xs text-zinc-400">
            <p>
              Jorge Rafael de Julián Vicedo — Grado en Ingeniería Informática, EPS, Universidad de Alicante
            </p>
            <p>Tutor: Dr. Higinio Mora Mora — 2026</p>
          </div>

          <div className="mt-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            🧪 Estás en el modo demo: datos simulados y guardados solo en este navegador.{" "}
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Reiniciar la demo a su estado original? Se perderá lo que hayas hecho en esta sesión.")) {
                  resetDemoState();
                }
              }}
              className="font-semibold underline underline-offset-2"
            >
              Reiniciar demo
            </button>
          </div>
        </SlideShell>
      </div>
    </div>
  );
}
