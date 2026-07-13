import { useEffect, useRef, useState, type RefObject } from "react";

// Cuánto tiempo sin scrollear/tocar la pantalla antes de que las flechas se
// atenúen en móvil (en escritorio siempre se ven al 100%, ver className).
const IDLE_DELAY_MS = 900;

function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
      <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const VARIANT_CLASS: Record<"dark" | "light", string> = {
  dark: "border-white/40 bg-black/70 text-white shadow-black/40 hover:bg-black/85",
  light:
    "border-zinc-300 bg-white text-zinc-700 shadow-zinc-400/30 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/40 dark:hover:bg-zinc-800",
};

/**
 * Botones de flecha arriba/abajo para páginas de scroll-snap vertical
 * (cinemática de inicio, /about, /noticias, /validate) — centrados en el
 * borde derecho de la pantalla (a la izquierda de `SlideDotNav`, que ocupa
 * ese mismo borde), con contraste fuerte para que se noten a simple vista.
 * Avanzan una pantalla exacta (`clientHeight`) y se atenúan en los extremos.
 */
export function SlideArrows({
  containerRef,
  variant = "light",
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  variant?: "dark" | "light";
}) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [idle, setIdle] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tailwind ya no basta aquí: el reset de Preflight (`button { opacity: 1 }`)
  // gana por orden de capas a una utilidad de opacidad plana en este build,
  // así que la atenuación se aplica por estilo en línea (siempre gana sobre
  // cualquier regla de hoja de estilos sin !important) y el límite "solo en
  // móvil" se decide en JS con matchMedia en vez de con el prefijo `sm:`.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    function update() {
      setIsMobile(mq.matches);
    }
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setAtTop(el.scrollTop <= 4);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    }

    function resetIdle() {
      setIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), IDLE_DELAY_MS);
    }

    update();
    resetIdle();
    el.addEventListener("scroll", update, { passive: true });
    el.addEventListener("scroll", resetIdle, { passive: true });
    el.addEventListener("touchstart", resetIdle, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("scroll", resetIdle);
      el.removeEventListener("touchstart", resetIdle);
      window.removeEventListener("resize", update);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [containerRef]);

  function go(dir: 1 | -1) {
    setIdle(false);
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
  }

  const cls = VARIANT_CLASS[variant];
  const fadeStyle = idle && isMobile ? { opacity: 0.2 } : undefined;

  return (
    <div className="fixed right-10 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2.5 sm:right-16">
      <button
        type="button"
        aria-label="Pantalla anterior"
        onClick={() => go(-1)}
        disabled={atTop}
        style={fadeStyle}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-opacity duration-300 disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 ${cls}`}
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        aria-label="Siguiente pantalla"
        onClick={() => go(1)}
        disabled={atBottom}
        style={fadeStyle}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-opacity duration-300 disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 ${cls}`}
      >
        <ChevronDown />
      </button>
    </div>
  );
}
