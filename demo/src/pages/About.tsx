import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { resetDemoState } from "@/demo/store";
import { SlideDotNav, slideIndexFromScroll } from "@/components/SlideDotNav";

interface SlideDef {
  id: string;
  eyebrow: string;
  headline: string;
  body?: string;
  accent: string;
}

const SLIDES: SlideDef[] = [
  {
    id: "problema",
    eyebrow: "El problema",
    headline: "Dos grietas, un mismo síntoma.",
    body: "No es solo que se cuele alguna mentira de vez en cuando. Es que el propio sistema para separar lo cierto de lo falso tiene grietas estructurales.",
    accent: "text-red-400",
  },
  {
    id: "solucion",
    eyebrow: "La solución",
    headline: "Un periódico que no tiene redacción.",
    body: 'NewsEra es un periódico comunitario: nadie decide en su nombre qué es noticia ni qué es verdad. Esa decisión se traslada desde una redacción, una plataforma o un gobierno hacia miles de personas corrientes. Cómo se vota, cuándo se declara "verdad" y cómo se reparte la reputación está escrito en un contrato inteligente — código público que se ejecuta igual para todos. Ni siquiera quien lo programó puede cambiarlo de un día para otro sin que la comunidad entera lo note.',
    accent: "text-blue-400",
  },
  {
    id: "verdad",
    eyebrow: '¿Qué es "verdad" aquí?',
    headline: "No la dicta una autoridad. La vota un jurado.",
    body: "Cuando se publica un artículo, se abre una votación. La comunidad decide, con su propia reputación en juego, si es verdadero, falso o si sencillamente no hay pruebas suficientes todavía. Hace falta una mayoría de dos tercios — no una simple mitad más uno — para dar el veredicto por definitivo, así una votación reñida no se confunde con un consenso real. El resultado queda anotado para siempre, junto con quién votó qué.",
    accent: "text-amber-400",
  },
  {
    id: "pilares",
    eyebrow: "Los pilares",
    headline: "Tres reglas que no se rompen.",
    accent: "text-blue-400",
  },
  {
    id: "innovacion",
    eyebrow: "Lo nuevo",
    headline: "No mejora al árbitro. Cambia el juego.",
    body: "Los verificadores tradicionales añaden una capa de revisión encima de un sistema que ya tiene sus propios intereses. NewsEra no revisa ese sistema — lo sustituye por uno nuevo, donde publicar, votar y ganar reputación siguen exactamente las mismas reglas para quien fundó el proyecto que para la primera persona que se registra hoy.",
    accent: "text-violet-400",
  },
  {
    id: "blockchain",
    eyebrow: "La tecnología",
    headline: "Un cuaderno que nadie puede tachar.",
    body: "La blockchain es, en esencia, un registro compartido por miles de ordenadores en vez de guardado en un único servidor. Cada anotación nueva se enlaza criptográficamente a todas las anteriores, así que alterar una implicaría rehacer todo el historial a la vista de toda la red — en la práctica, imposible. Estos tres contratos son ese cuaderno:",
    accent: "text-blue-400",
  },
  {
    id: "slogan",
    eyebrow: "",
    headline: "La verdad ya no se pide. Se demuestra.",
    body: "Tú también puedes votar, publicar y decidir.",
    accent: "text-white",
  },
  {
    id: "memoria",
    eyebrow: "Para saber más",
    headline: "¿Quieres el detalle técnico completo?",
    body: "La memoria del TFG documenta la arquitectura completa: el diseño de cada contrato, las decisiones de seguridad, los casos de uso y la evaluación del sistema con datos reales.",
    accent: "text-zinc-300",
  },
];

const PROBLEMAS = [
  {
    title: "Lo falso viaja más rápido",
    desc: 'Un estudio del MIT publicado en Science (2018) analizó 126.000 noticias compartidas 4,5 millones de veces en Twitter: las falsas se comparten un 70% más y alcanzan a 1.500 personas seis veces más rápido que las verdaderas.',
  },
  {
    title: "Pocas manos controlan la conversación",
    desc: "En EE. UU., más de la mitad del tráfico a las grandes webs de noticias se concentra en sitios controlados por solo siete familias o grupos empresariales (2026). En Reino Unido, tres empresas controlan el 90% de los periódicos nacionales.",
  },
];

const PILARES = [
  { icon: "🔗", label: "Inmutable", desc: "Una vez publicado o votado, nada se borra ni se reescribe." },
  { icon: "👥", label: "Colectivo", desc: "Ninguna persona ni entidad decide sola qué es verdad." },
  { icon: "🛡️", label: "Resistente", desc: "Sin una autoridad central que capturar, no hay un único punto de fallo." },
];

const CONTRATOS = ["PublicationRegistry", "ValidationRegistry", "ReputationSystem"];

function SlideShell({
  id,
  eyebrow,
  headline,
  body,
  accent,
  className = "",
  children,
}: SlideDef & { className?: string; children?: ReactNode }) {
  return (
    <section
      id={id}
      className={`relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center px-6 py-10 text-center sm:px-12 ${className}`}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 sm:gap-5">
        {eyebrow && (
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accent}`}>{eyebrow}</p>
        )}
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{headline}</h2>
        {body && (
          <p className="text-balance text-base leading-relaxed text-zinc-300 sm:text-lg">{body}</p>
        )}
        {children}
      </div>
    </section>
  );
}

const DOT_NAV_SLIDES = SLIDES.map((s) => ({ id: s.id, label: s.eyebrow || s.headline }));

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(SLIDES[0].id);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    function handleScroll() {
      if (!root) return;
      const index = slideIndexFromScroll(root, SLIDES.length);
      setActive(SLIDES[index].id);
    }

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, []);

  const [problema, solucion, verdad, pilares, innovacion, blockchain, slogan, memoria] = SLIDES;

  return (
    <div className="relative">
      <SlideDotNav slides={DOT_NAV_SLIDES} active={active} />
      <div
        ref={containerRef}
        className="aurora-bg h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth text-white"
      >
        <SlideShell {...problema}>
          <div className="mt-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {PROBLEMAS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-sm">
                <p className="mb-1.5 font-semibold text-white">{p.title}</p>
                <p className="text-sm leading-relaxed text-zinc-300">{p.desc}</p>
              </div>
            ))}
          </div>
        </SlideShell>

        <SlideShell {...solucion} />
        <SlideShell {...verdad} />

        <SlideShell {...pilares}>
          <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {PILARES.map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
              >
                <span className="text-3xl" aria-hidden="true">
                  {p.icon}
                </span>
                <p className="font-semibold text-white">{p.label}</p>
                <p className="text-xs text-zinc-300">{p.desc}</p>
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
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 font-mono text-xs text-white backdrop-blur-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </SlideShell>

        <SlideShell {...slogan} className="bg-brand">
          <Link
            to="/noticias"
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
            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Leer la memoria (GitHub)
          </a>

          <div className="mt-8 space-y-0.5 text-xs text-zinc-300">
            <p>
              Jorge Rafael de Julián Vicedo — Grado en Ingeniería Informática, EPS, Universidad de Alicante
            </p>
            <p>Tutor: Dr. Higinio Mora Mora — 2026</p>
          </div>

          <div className="mt-6 max-w-sm rounded-xl border border-amber-300/40 bg-amber-950/60 p-3 text-xs text-amber-200 backdrop-blur-sm">
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
