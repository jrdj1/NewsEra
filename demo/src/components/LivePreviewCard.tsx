import { useState, type ReactNode } from "react";

/**
 * Envuelve un enlace y muestra, al pasar el ratón o el foco (accesible por
 * teclado), una tarjeta con una vista previa en vivo real de esa ruta —
 * un iframe de la propia demo escalado, no una captura estática, así
 * siempre refleja el estado real (incluida la persistencia en
 * localStorage, ver demo/src/demo/store.ts).
 */
export function LivePreviewCard({ path, children }: { path: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-white/15 bg-zinc-900 shadow-2xl sm:w-80">
          <div className="h-40 w-full overflow-hidden sm:h-52">
            <iframe
              src={path}
              title=""
              tabIndex={-1}
              aria-hidden="true"
              className="h-[400%] w-[400%] origin-top-left scale-[.25] border-0"
            />
          </div>
          <p className="border-t border-white/10 px-3 py-1.5 text-[10px] text-zinc-400">
            Vista previa en vivo
          </p>
        </div>
      )}
    </div>
  );
}
