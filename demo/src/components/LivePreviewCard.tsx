import { useState, type ReactNode } from "react";
import { MiniPreview, type PreviewKind } from "./MiniPreview";

/**
 * Envuelve un enlace y muestra, al pasar el ratón o el foco (accesible por
 * teclado), una tarjeta con una maqueta en miniatura de esa pantalla —
 * dibujada con nuestros propios componentes (ver MiniPreview.tsx), no un
 * iframe de la app entera: renderizar la SPA dentro de sí misma a escala
 * reducida se veía roto (barra de navegador, avisos del navegador, etc.).
 */
export function LivePreviewCard({ kind, children }: { kind: PreviewKind; children: ReactNode }) {
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
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-56 -translate-x-1/2 rounded-xl border border-white/15 bg-zinc-950/95 p-2 shadow-2xl sm:w-64">
          <MiniPreview kind={kind} />
          <p className="pt-2 text-center text-[10px] text-zinc-400">Vista previa</p>
        </div>
      )}
    </div>
  );
}
