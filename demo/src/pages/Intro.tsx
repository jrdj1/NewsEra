import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SlideDotNav, slideIndexFromScroll } from "@/components/SlideDotNav";
import { LivePreviewCard } from "@/components/LivePreviewCard";
import type { PreviewKind } from "@/components/MiniPreview";

/**
 * Cinemática de apertura de la demo (§1 de DESIGN.md) — se muestra siempre
 * que se entra en "/", con opción de saltarla en todo momento. La página
 * real de artículos vive en /noticias (nunca "feed" de cara al usuario).
 */

interface Feature {
  id: PreviewKind;
  title: string;
  desc: string;
  to: string;
  aboutAnchor: string;
}

const FEATURES: Feature[] = [
  {
    id: "noticias",
    title: "Noticias",
    desc: "Lee lo que la comunidad ya ha verificado — o lo que todavía está en votación.",
    to: "/noticias",
    aboutAnchor: "solucion",
  },
  {
    id: "usuarios",
    title: "Usuarios",
    desc: "Descubre quién valida, cuánta reputación tiene y su historial.",
    to: "/users",
    aboutAnchor: "pilares",
  },
  {
    id: "publicar",
    title: "Publicar",
    desc: "Cualquiera puede publicar un artículo. Queda registrado para siempre.",
    to: "/publish",
    aboutAnchor: "blockchain",
  },
  {
    id: "validar",
    title: "Validar",
    desc: "Vota si un artículo es verdadero, falso o no verificable — aciertas, ganas reputación.",
    to: "/validate",
    aboutAnchor: "verdad",
  },
  {
    id: "perfil",
    title: "Perfil",
    desc: "Tu reputación, tu historial y tus artículos, todo en un mismo sitio.",
    to: "/profile",
    aboutAnchor: "innovacion",
  },
];

const SCENE_IDS = ["portada", ...FEATURES.map((f) => f.id), "empezar"];
const DOT_NAV_SLIDES = [
  { id: "portada", label: "Portada" },
  ...FEATURES.map((f) => ({ id: f.id, label: f.title })),
  { id: "empezar", label: "Empezar" },
];

function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(900px) rotateX(0deg) rotateY(0deg)");

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(900px) rotateX(${(-py * 14).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg)`);
  }

  function handleLeave() {
    setTransform("perspective(900px) rotateX(0deg) rotateY(0deg)");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform, transition: "transform 150ms ease-out" }}
      className="will-change-transform"
    >
      {children}
    </div>
  );
}

export default function Intro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(SCENE_IDS[0]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    function handleScroll() {
      if (!root) return;
      setActive(SCENE_IDS[slideIndexFromScroll(root, SCENE_IDS.length)]);
    }
    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      <Link
        to="/noticias"
        className="fixed right-3 top-3 z-30 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:top-5"
      >
        Saltar intro →
      </Link>

      <SlideDotNav slides={DOT_NAV_SLIDES} active={active} />

      <div
        ref={containerRef}
        className="aurora-bg h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth text-white"
      >
        {/* Escena 0 — Portada */}
        <section
          id="portada"
          className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">Bienvenido a</p>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">NewsEra</h1>
          <p className="max-w-xs text-zinc-300 sm:text-lg">La verdad, verificada por todos.</p>

          <Link to="/about#problema" className="mt-3">
            <TiltCard>
              <div className="relative flex h-56 w-40 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/50 backdrop-blur-md sm:h-64 sm:w-48">
                <span className="text-4xl font-black text-white sm:text-5xl">N</span>
                <p className="text-sm font-semibold text-white">Descubre la idea completa</p>
                <p className="text-xs text-zinc-300">Sobre el proyecto →</p>
              </div>
            </TiltCard>
          </Link>
        </section>

        {/* Escenas 1..N — el mapa del tesoro */}
        {FEATURES.map((f) => (
          <section
            key={f.id}
            id={f.id}
            className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center gap-4 px-6 text-center sm:px-12"
          >
            <h2 className="text-3xl font-bold sm:text-5xl">{f.title}</h2>
            <p className="max-w-md text-balance text-zinc-300 sm:text-lg">{f.desc}</p>

            <LivePreviewCard kind={f.id}>
              <Link
                to={f.to}
                className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Ir a {f.title}
              </Link>
            </LivePreviewCard>

            <Link
              to={`/about#${f.aboutAnchor}`}
              className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
            >
              Por qué existe esta sección →
            </Link>
          </section>
        ))}

        {/* Escena final — Empezar */}
        <section
          id="empezar"
          className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center gap-6 bg-brand px-6 text-center text-white"
        >
          <h2 className="text-3xl font-bold sm:text-5xl">Ya sabes por dónde empezar.</h2>
          <Link
            to="/noticias"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow-lg transition-transform hover:scale-105"
          >
            Entrar a NewsEra
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
