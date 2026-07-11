import { useEffect, useState, type RefObject } from "react";

function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
      <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const VARIANT_CLASS: Record<"dark" | "light", string> = {
  dark: "border-white/25 bg-black/40 text-white hover:bg-black/60",
  light:
    "border-zinc-200 bg-white/90 text-zinc-600 shadow-md hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800",
};

/**
 * Botones de flecha arriba/abajo para páginas de scroll-snap vertical
 * (cinemática de inicio, /about, /noticias, /validate) — hacen explícito
 * que se navega deslizando/scrolleando, que no todo el mundo descubre solo.
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
    <div className="fixed bottom-5 right-3 z-30 flex flex-col gap-2 sm:bottom-8 sm:right-6">
      <button
        type="button"
        aria-label="Pantalla anterior"
        onClick={() => go(-1)}
        disabled={atTop}
        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity disabled:pointer-events-none disabled:opacity-30 ${cls}`}
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        aria-label="Siguiente pantalla"
        onClick={() => go(1)}
        disabled={atBottom}
        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-opacity disabled:pointer-events-none disabled:opacity-30 ${cls}`}
      >
        <ChevronDown />
      </button>
    </div>
  );
}
