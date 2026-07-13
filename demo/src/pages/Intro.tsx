import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SlideDotNav, slideIndexFromScroll } from "@/components/SlideDotNav";
import { SlideArrows } from "@/components/SlideArrows";
import { MiniPreview, type PreviewKind } from "@/components/MiniPreview";

/**
 * Cinemática de apertura de la demo (§1 de DESIGN.md) — se muestra siempre
 * que se entra en "/", con opción de saltarla en todo momento. La página
 * real de artículos vive en /noticias (nunca "feed" de cara al usuario).
 * La vista previa de cada sección va siempre visible (no solo al pasar el
 * ratón): en móvil, que es donde entra la mayoría, el hover no existe.
 */

interface Feature {
  id: PreviewKind;
  title: string;
  desc: string;
  long: string;
  to: string;
  aboutAnchor: string;
  icon: ReactNode;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7 text-brand">
      {children}
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    id: "noticias",
    title: "Noticias",
    desc: "Lee lo que la comunidad ya ha verificado — o lo que todavía está en votación.",
    long: "Cada artículo muestra su estado en tiempo real: si ya alcanzó un veredicto (verdadero, falso o no verificable) o si aún está reuniendo votos. Nada se marca como \"verdad\" hasta que la comunidad lo decide.",
    to: "/noticias",
    aboutAnchor: "solucion",
    icon: (
      <Icon>
        <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
        <path d="M4 5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2" />
        <path d="M7 9h9M7 12.5h9M7 16h5" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: "usuarios",
    title: "Usuarios",
    desc: "Descubre quién valida, cuánta reputación tiene y su historial.",
    long: "La reputación no la asigna nadie: se gana votando bien, publicando artículos que resultan ciertos, o perdiendo puntos cuando el veredicto de la comunidad te da la razón — o no. Todo el historial es público.",
    to: "/users",
    aboutAnchor: "pilares",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 14a5 5 0 0 1 5.5 5" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: "publicar",
    title: "Publicar",
    desc: "Cualquiera puede publicar un artículo. Queda registrado para siempre.",
    long: "Al publicar, el contenido se resume en un hash keccak256 que se ancla en la blockchain — inmutable desde ese instante. Ni el propio autor puede borrarlo o reescribirlo después.",
    to: "/publish",
    aboutAnchor: "blockchain",
    icon: (
      <Icon>
        <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
        <path d="M13 6.5 17.5 11" strokeLinecap="round" />
      </Icon>
    ),
  },
  {
    id: "validar",
    title: "Validar",
    desc: "Vota si un artículo es verdadero, falso o no verificable — aciertas, ganas reputación.",
    long: "Hace falta una mayoría de dos tercios para cerrar una votación como definitiva. Votar con el resultado ganador suma reputación; votar en contra la resta — el riesgo es real, igual que el mérito.",
    to: "/validate",
    aboutAnchor: "verdad",
    icon: (
      <Icon>
        <path d="M12 3.5 5 6v6c0 4.2 3 7 7 8.5 4-1.5 7-4.3 7-8.5V6l-7-2.5Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
      </Icon>
    ),
  },
  {
    id: "perfil",
    title: "Perfil",
    desc: "Tu reputación, tu historial y tus artículos, todo en un mismo sitio.",
    long: "Revisa cada movimiento de tu reputación con su motivo exacto, reclama ajustes retroactivos cuando una votación posterior te da la razón, y sigue de cerca los artículos que te importan.",
    to: "/profile",
    aboutAnchor: "innovacion",
    icon: (
      <Icon>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </Icon>
    ),
  },
];

const SCENE_IDS = ["portada", ...FEATURES.map((f) => f.id), "empezar"];
const DOT_NAV_SLIDES = [
  { id: "portada", label: "Portada" },
  ...FEATURES.map((f) => ({ id: f.id, label: f.title })),
  { id: "empezar", label: "Empezar" },
];

const STATS = [
  { value: "Público", label: "cada voto queda anotado, nunca en secreto" },
  { value: "Permanente", label: "nada se borra ni se reescribe" },
  { value: "0", label: "dueños con poder de censura" },
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
      <SlideArrows containerRef={containerRef} variant="dark" />

      <div
        ref={containerRef}
        className="aurora-bg no-scrollbar h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth text-white"
      >
        {/* Escena 0 — Portada */}
        <section
          id="portada"
          className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center gap-3 px-6 text-center sm:gap-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">Bienvenido a</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-7xl">NewsEra</h1>
          <p className="max-w-sm text-balance text-sm text-zinc-300 sm:max-w-md sm:text-lg">
            El periódico donde la verdad no tiene dueño: la decide la gente, con las reglas
            escritas en blockchain — no en la letra pequeña de una empresa.
          </p>

          <div className="hidden flex-wrap justify-center gap-3 pt-1 sm:flex sm:gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <p className="text-base font-black text-brand sm:text-lg">{s.value}</p>
                <p className="max-w-[7rem] text-[10px] leading-tight text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:flex-row sm:items-stretch sm:gap-4">
            <Link to="/about#problema">
              <TiltCard>
                <div className="relative flex h-40 w-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-3 shadow-2xl shadow-black/50 backdrop-blur-md sm:h-64 sm:w-48 sm:gap-3 sm:p-4">
                  <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover sm:h-14 sm:w-14" />
                  <p className="text-xs font-semibold text-white sm:text-sm">Descubre la idea completa</p>
                  <p className="text-[11px] text-zinc-300 sm:text-xs">Sobre el proyecto →</p>
                </div>
              </TiltCard>
            </Link>

            <Link to="/encuestas">
              <TiltCard>
                <div className="relative flex h-40 w-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-3 shadow-2xl shadow-black/50 backdrop-blur-md sm:h-64 sm:w-48 sm:gap-3 sm:p-4">
                  <span className="text-3xl sm:text-5xl">🙋</span>
                  <p className="text-xs font-semibold text-white sm:text-sm">Ayúdanos contestando a una breve encuesta</p>
                  <p className="text-[11px] text-zinc-300 sm:text-xs">Participar →</p>
                </div>
              </TiltCard>
            </Link>
          </div>
        </section>

        {/* Escenas 1..N — el mapa del tesoro */}
        {FEATURES.map((f, i) => (
          <section
            key={f.id}
            id={f.id}
            className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start items-center justify-center px-6 py-8 sm:px-12"
          >
            <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-10">
              <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                    {f.icon}
                  </span>
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">{f.title}</h2>
                <p className="text-balance text-zinc-200 sm:text-lg">{f.desc}</p>
                <p className="text-balance text-sm leading-relaxed text-zinc-400">{f.long}</p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:justify-start">
                  <Link
                    to={f.to}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
                  >
                    Ir a {f.title}
                  </Link>
                  <Link
                    to={`/about#${f.aboutAnchor}`}
                    className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
                  >
                    Por qué existe esta sección →
                  </Link>
                </div>
              </div>

              <Link
                to={f.to}
                aria-label={`Ir a ${f.title}`}
                className="mx-auto block w-full max-w-xs rounded-2xl border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/40 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/10 sm:max-w-sm"
              >
                <MiniPreview kind={f.id} />
                <p className="pt-2 text-center text-[10px] text-zinc-400">Así se ve ahora mismo en la demo — toca para entrar</p>
              </Link>
            </div>
          </section>
        ))}

        {/* Escena final — Empezar */}
        <section
          id="empezar"
          className="relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center gap-6 bg-brand px-6 text-center text-white"
        >
          <h2 className="text-3xl font-bold sm:text-5xl">Ya sabes por dónde empezar.</h2>
          <p className="max-w-sm text-balance text-white/85">
            Noticias, usuarios, publicar, validar, perfil — las cinco piezas ya son tuyas. Entra y pruébalas.
          </p>
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
