/** Navegación por puntos lateral, compartida entre /about y la cinemática
 * de inicio (/) — mismas 8/N pantallas a scroll-snap, mismo patrón. */
export function SlideDotNav({
  slides,
  active,
}: {
  slides: { id: string; label: string }[];
  active: string;
}) {
  return (
    <nav
      aria-label="Navegación de pantallas"
      className="fixed right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2.5 sm:right-4"
    >
      {slides.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-label={s.label}
          aria-current={active === s.id}
          className={`h-2 w-2 rounded-full ring-1 ring-white/40 transition-all ${
            active === s.id ? "h-5 bg-brand" : "bg-white/50 hover:bg-white/80"
          }`}
        />
      ))}
    </nav>
  );
}

/** Calcula qué pantalla está activa a partir del scroll de un contenedor
 * snap-y — usar dentro de un useEffect con `container.addEventListener`. */
export function slideIndexFromScroll(container: HTMLElement, count: number): number {
  const index = Math.round(container.scrollTop / container.clientHeight);
  return Math.min(count - 1, Math.max(0, index));
}
