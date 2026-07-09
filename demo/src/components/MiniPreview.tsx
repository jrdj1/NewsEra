/**
 * Maqueta en miniatura de una pantalla de la app, dibujada con nuestros
 * propios componentes (nunca un iframe — renderizar la SPA entera dentro
 * de sí misma a escala reducida se veía roto). Solo un puñado de "kinds",
 * uno por destino del menú.
 */
export type PreviewKind = "noticias" | "usuarios" | "publicar" | "validar" | "perfil";

function Bar({ w = "100%", h = "0.5rem" }: { w?: string; h?: string }) {
  return <div className="rounded-full bg-white/15" style={{ width: w, height: h }} />;
}

function Dot({ size = "1.75rem", tone = "bg-white/20" }: { size?: string; tone?: string }) {
  return <div className={`shrink-0 rounded-full ${tone}`} style={{ width: size, height: size }} />;
}

function PreviewChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-lg bg-zinc-900/90">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-2.5 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-amber-400/70" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
      </div>
      <div className="space-y-2.5 p-3">{children}</div>
    </div>
  );
}

function NoticiasPreview() {
  return (
    <PreviewChrome>
      {[0, 1].map((i) => (
        <div key={i} className="space-y-1.5 rounded-md bg-white/5 p-2">
          <Bar w="55%" h="0.4rem" />
          <Bar w="90%" />
          <Bar w="70%" />
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-3 w-10 rounded-full bg-brand/40" />
            <div className="h-3 w-10 rounded-full bg-violet-400/30" />
          </div>
        </div>
      ))}
    </PreviewChrome>
  );
}

function UsuariosPreview() {
  return (
    <PreviewChrome>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Dot size="1.25rem" />
          <Bar w={`${60 - i * 10}%`} />
        </div>
      ))}
    </PreviewChrome>
  );
}

function PublicarPreview() {
  return (
    <PreviewChrome>
      <Bar w="40%" h="0.45rem" />
      <div className="space-y-1.5 rounded-md border border-white/10 p-2">
        <Bar w="90%" />
        <Bar w="80%" />
        <Bar w="60%" />
      </div>
      <div className="h-5 w-20 rounded-full bg-brand/50" />
    </PreviewChrome>
  );
}

function ValidarPreview() {
  return (
    <PreviewChrome>
      <Bar w="70%" h="0.5rem" />
      <Bar w="90%" />
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 flex-1 rounded-full bg-consensus-true/40" />
        <div className="h-5 flex-1 rounded-full bg-consensus-false/40" />
        <div className="h-5 flex-1 rounded-full bg-consensus-unverifiable/40" />
      </div>
    </PreviewChrome>
  );
}

function PerfilPreview() {
  return (
    <PreviewChrome>
      <div className="flex items-center gap-2">
        <Dot size="2rem" />
        <div className="space-y-1">
          <Bar w="5rem" h="0.45rem" />
          <Bar w="3.5rem" h="0.35rem" />
        </div>
      </div>
      <div className="flex gap-1.5 pt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 flex-1 rounded-md bg-white/5" />
        ))}
      </div>
    </PreviewChrome>
  );
}

const PREVIEWS: Record<PreviewKind, () => React.JSX.Element> = {
  noticias: NoticiasPreview,
  usuarios: UsuariosPreview,
  publicar: PublicarPreview,
  validar: ValidarPreview,
  perfil: PerfilPreview,
};

export function MiniPreview({ kind }: { kind: PreviewKind }) {
  const Preview = PREVIEWS[kind];
  return <Preview />;
}
