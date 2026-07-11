import { useAccount, useReadContract } from "wagmi";
import { usePublications } from "@/hooks/usePublications";
import { useUsers, useUserDetail } from "@/hooks/useUsers";
import { useEnrichedProfile } from "@/hooks/useProfile";
import { validationRegistry } from "@/lib/contracts";

/**
 * Maqueta en miniatura de una pantalla de la app — con datos REALES del
 * backend y de la blockchain (títulos, usuarios, reputación, quórum...), no
 * barras y círculos abstractos. Cada sección hace su propia consulta (React
 * Query ya cachea/comparte esas mismas consultas con el resto de la app) y
 * muestra un esqueleto mientras carga.
 */
export type PreviewKind = "noticias" | "usuarios" | "publicar" | "validar" | "perfil";

const CONSENSUS_STYLE: Record<string, string> = {
  TRUE: "bg-consensus-true/20 text-consensus-true",
  FALSE: "bg-consensus-false/20 text-consensus-false",
  UNVERIFIABLE: "bg-consensus-unverifiable/20 text-consensus-unverifiable",
  PENDING: "bg-white/15 text-zinc-300",
  DISPUTED: "bg-consensus-unverifiable/20 text-consensus-unverifiable",
};

const CONSENSUS_LABEL: Record<string, string> = {
  TRUE: "Verdadero",
  FALSE: "Falso",
  UNVERIFIABLE: "No verificable",
  PENDING: "En votación",
  DISPUTED: "En disputa",
};

function ConsensusChip({ state, result }: { state: string; result?: string | null }) {
  const key = state === "DEFINITIVE" && result ? result : state;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONSENSUS_STYLE[key] ?? "bg-white/15 text-zinc-300"}`}>
      {CONSENSUS_LABEL[key] ?? key}
    </span>
  );
}

function Avatar({ url, name, size = "1.75rem" }: { url?: string | null; name: string; size?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand/40 text-[10px] font-bold text-white"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function PreviewChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-lg bg-zinc-900/90">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-2.5 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-amber-400/70" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </div>
  );
}

function SkeletonLine({ w = "100%" }: { w?: string }) {
  return <div className="h-2.5 animate-pulse rounded-full bg-white/10" style={{ width: w }} />;
}

function PreviewSkeleton() {
  return (
    <PreviewChrome>
      <SkeletonLine w="55%" />
      <SkeletonLine w="90%" />
      <SkeletonLine w="70%" />
    </PreviewChrome>
  );
}

function PreviewEmpty({ message }: { message: string }) {
  return (
    <PreviewChrome>
      <p className="py-4 text-center text-[11px] text-zinc-400">{message}</p>
    </PreviewChrome>
  );
}

function NoticiasPreview() {
  const { data, isLoading } = usePublications({ limit: 2, sort: "recent" });
  if (isLoading) return <PreviewSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) return <PreviewEmpty message="Aún no hay artículos publicados." />;
  return (
    <PreviewChrome>
      {items.map((p) => (
        <div key={p.contentHash} className="space-y-1 rounded-md bg-white/5 p-2 text-left">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">{p.title}</p>
            <ConsensusChip state={p.consensusState} result={p.currentResult} />
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {p.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-zinc-300">
                #{t}
              </span>
            ))}
            <span className="text-[9px] text-zinc-500">{p.voteCount ?? 0} votos</span>
          </div>
        </div>
      ))}
    </PreviewChrome>
  );
}

function UsuariosPreview() {
  const { data, isLoading } = useUsers(1, 3, "reputation");
  if (isLoading) return <PreviewSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) return <PreviewEmpty message="Aún no hay usuarios con reputación." />;
  return (
    <PreviewChrome>
      {items.map((u) => (
        <div key={u.address} className="flex items-center gap-2">
          <Avatar url={u.avatarUrl} name={u.displayName ?? u.address} size="1.5rem" />
          <p className="flex-1 truncate text-[11px] text-white">{u.displayName ?? shortAddr(u.address)}</p>
          <span className="rounded-full bg-brand/30 px-1.5 py-0.5 text-[9px] font-semibold text-brand-dark">
            {u.reputationScore} rep
          </span>
        </div>
      ))}
    </PreviewChrome>
  );
}

function PublicarPreview() {
  const { data, isLoading } = usePublications({ limit: 1, sort: "recent" });
  if (isLoading) return <PreviewSkeleton />;
  const example = data?.items?.[0];
  const hash = example ? `${example.contentHash.slice(0, 10)}…${example.contentHash.slice(-6)}` : "0x…";
  return (
    <PreviewChrome>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Título</p>
      <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-left text-[11px] text-white">
        {example ? example.title : "Tu artículo…"}
      </div>
      <p className="pt-1 text-[9px] text-zinc-400">keccak256(cuerpo) calculado al instante:</p>
      <p className="truncate rounded-md bg-black/40 px-2 py-1 text-left font-mono text-[9px] text-emerald-300">{hash}</p>
    </PreviewChrome>
  );
}

function ValidarPreview() {
  const { data: pendingData, isLoading: isLoadingPending } = usePublications({ state: "PENDING", limit: 1 });
  const { data: fallbackData, isLoading: isLoadingFallback } = usePublications({ limit: 1, sort: "recent" });
  const { data: quorumThreshold } = useReadContract({ ...validationRegistry, functionName: "quorumThreshold" });

  if (isLoadingPending || isLoadingFallback) return <PreviewSkeleton />;

  const article = pendingData?.items?.[0] ?? fallbackData?.items?.[0];
  if (!article) return <PreviewEmpty message="Aún no hay artículos en votación." />;

  const quorum = quorumThreshold !== undefined ? Number(quorumThreshold) : "…";
  const votes = article.voteCount ?? 0;

  return (
    <PreviewChrome>
      <p className="line-clamp-2 text-left text-[11px] font-semibold text-white">{article.title}</p>
      <p className="text-left text-[9px] text-zinc-400">
        {votes}/{quorum} votos para quórum
      </p>
      <div className="flex gap-1.5 pt-1">
        <div className="flex-1 rounded-full bg-consensus-true/25 py-1 text-center text-[9px] font-semibold text-consensus-true">
          Verdadero
        </div>
        <div className="flex-1 rounded-full bg-consensus-false/25 py-1 text-center text-[9px] font-semibold text-consensus-false">
          Falso
        </div>
        <div className="flex-1 rounded-full bg-consensus-unverifiable/25 py-1 text-center text-[9px] font-semibold text-consensus-unverifiable">
          No verif.
        </div>
      </div>
    </PreviewChrome>
  );
}

function PerfilPreview() {
  const { address, isConnected } = useAccount();
  const { data: profile } = useEnrichedProfile(address);
  const { data: detail, isLoading } = useUserDetail(address);

  if (!isConnected || !address) {
    return <PreviewEmpty message="Conecta tu cartera para ver aquí tu reputación." />;
  }
  if (isLoading || !detail) return <PreviewSkeleton />;

  return (
    <PreviewChrome>
      <div className="flex items-center gap-2">
        <Avatar url={profile?.avatarUrl} name={profile?.displayName ?? address} size="2rem" />
        <div className="text-left">
          <p className="text-[11px] font-semibold text-white">{profile?.displayName ?? shortAddr(address)}</p>
          <p className="text-[9px] text-zinc-400">{shortAddr(address)}</p>
        </div>
      </div>
      <div className="flex gap-1.5 pt-1">
        <div className="flex-1 rounded-md bg-white/5 py-1.5 text-center">
          <p className="text-[12px] font-bold text-brand-dark">{detail.reputationScore}</p>
          <p className="text-[8px] text-zinc-400">reputación</p>
        </div>
        <div className="flex-1 rounded-md bg-white/5 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">{detail.totalValidations}</p>
          <p className="text-[8px] text-zinc-400">votos</p>
        </div>
        <div className="flex-1 rounded-md bg-white/5 py-1.5 text-center">
          <p className="text-[12px] font-bold text-white">
            {detail.accuracy !== null ? `${Math.round(detail.accuracy * 100)}%` : "—"}
          </p>
          <p className="text-[8px] text-zinc-400">acierto</p>
        </div>
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
