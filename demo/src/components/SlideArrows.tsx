import { useEffect, useState, type RefObject } from "react";

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
 * (cinemática de inicio, /about, /noticias, /validate) — centrados abajo y
 * con contraste fuerte para que se noten a simple vista, no un detalle
 * secundario. Avanzan una pantalla exacta (`clientHeight`) y se atenúan en
 * los extremos.
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setAtTop(el.scrollTop <= 4);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  function go(dir: 1 | -1) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
  }

  const cls = VARIANT_CLASS[variant];

  return (
    <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2.5 sm:bottom-8">
      <button
        type="button"
        aria-label="Pantalla anterior"
        onClick={() => go(-1)}
        disabled={atTop}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-all disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 ${cls}`}
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        aria-label="Siguiente pantalla"
        onClick={() => go(1)}
        disabled={atBottom}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-all disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 ${cls}`}
      >
        <ChevronDown />
      </button>
    </div>
  );
}
