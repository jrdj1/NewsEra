import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { resetDemoState } from "@/demo/store";
import { ABOUT_IMAGES, type AboutImage } from "@/demo/about-images";

interface SlideDef {
  id: string;
  eyebrow: string;
  headline: string;
  body?: string;
  accent: string;
  image?: AboutImage;
}

// Tratamiento vintage uniforme para todas las fotos — blanco y negro con un
// punto de tono "sucio" (sepia leve), igual en las 6 imágenes sin importar
// su tono original. Aplicado por CSS, nunca editando los archivos.
const VINTAGE_FILTER = "grayscale sepia-[.35] contrast-125 brightness-[.6]";

const SLIDES: SlideDef[] = [
  {
    id: "problema",
    eyebrow: "El problema (con datos)",
    headline: "Lo falso viaja más rápido que lo cierto.",
    body: 'Un estudio del MIT (revista Science, 2018) descubrió que las noticias falsas se comparten un 70% más que las verdaderas, y llegan a 1.500 personas 6 veces más rápido.',
    accent: "text-red-400",
    image: ABOUT_IMAGES.problema,
  },
  {
    id: "solucion",
    eyebrow: "La solución",
    headline: "Que decida todo el mundo, no unos pocos.",
    body: "NewsEra reparte la verificación entre miles de personas, con reglas que nadie controla en solitario — ni siquiera quien lo creó.",
    accent: "text-blue-400",
    image: ABOUT_IMAGES.solucion,
  },
  {
    id: "verdad",
    eyebrow: '¿Qué es "verdad" aquí?',
    headline: "No la dicta una autoridad. La vota un jurado.",
    body: "La comunidad vota si un hecho es verdadero, falso o no verificable — y ese consenso queda anotado para siempre.",
    accent: "text-amber-400",
    image: ABOUT_IMAGES.verdad,
  },
  {
    id: "pilares",
    eyebrow: "Los pilares",
    headline: "Tres reglas que no se rompen.",
    accent: "text-blue-400",
    image: ABOUT_IMAGES.pilares,
  },
  {
    id: "innovacion",
    eyebrow: "Lo nuevo",
    headline: "No mejora al árbitro. Cambia el juego.",
    body: "No es un verificador más encima de los de siempre — es una cancha nueva donde nadie empieza con ventaja.",
    accent: "text-violet-400",
    image: ABOUT_IMAGES.innovacion,
  },
  {
    id: "blockchain",
    eyebrow: "La tecnología",
    headline: "Un cuaderno que nadie puede tachar.",
    body: "La blockchain es un registro compartido por miles de ordenadores. Lo que se escribe, se queda escrito — y cualquiera puede comprobarlo.",
    accent: "text-blue-400",
    image: ABOUT_IMAGES.blockchain,
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
    body: "Arquitectura, contratos inteligentes y evaluación del sistema, documentados a fondo.",
    accent: "text-zinc-300",
    image: ABOUT_IMAGES.memoria,
  },
];

const PILARES = [
  { icon: "🔗", label: "Inmutable", desc: "Nada se borra." },
  { icon: "👥", label: "Colectivo", desc: "Nadie decide solo." },
  { icon: "🛡️", label: "Resistente", desc: "Nadie lo captura." },
];

const CONTRATOS = ["PublicationRegistry", "ValidationRegistry", "ReputationSystem"];

const IMAGE_CREDITS = SLIDES.map((s) => s.image?.credit).filter((c): c is NonNullable<typeof c> => !!c);

function SlideShell({
  id,
  eyebrow,
  headline,
  body,
  accent,
  image,
  className = "",
  children,
}: SlideDef & { className?: string; children?: ReactNode }) {
  return (
    <section
      id={id}
      className={`relative flex h-[calc(100dvh-4rem)] w-full shrink-0 snap-start flex-col items-center justify-center overflow-hidden px-6 py-10 text-center sm:px-12 ${className}`}
    >
      {image && (
        <>
          <img
            src={image.url}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover ${VINTAGE_FILTER}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-black/75" />
        </>
      )}
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-3 sm:gap-5">
        {eyebrow && (
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accent}`}>{eyebrow}</p>
        )}
        <h2
          className={`text-3xl font-bold leading-tight tracking-tight sm:text-5xl ${image ? "text-white" : ""}`}
        >
          {headline}
        </h2>
        {body && (
          <p
            className={`text-balance text-base leading-relaxed sm:text-lg ${
              image ? "text-zinc-200" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
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
          className={`h-2 w-2 rounded-full ring-1 ring-white/40 transition-all ${
            active === s.id ? "h-5 bg-brand" : "bg-white/50 hover:bg-white/80"
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
          <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {PILARES.map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-black/20 p-5 backdrop-blur-sm"
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

          {IMAGE_CREDITS.length > 0 && (
            <p className="mt-6 max-w-sm text-[10px] leading-relaxed text-zinc-400">
              Fotografías:{" "}
              {IMAGE_CREDITS.map((c, i) => (
                <span key={c.href}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline">
                    {c.text}
                  </a>
                  {i < IMAGE_CREDITS.length - 1 ? " · " : ""}
                </span>
              ))}{" "}
              (Wikimedia Commons)
            </p>
          )}
        </SlideShell>
      </div>
    </div>
  );
}
