import { Link } from "react-router-dom";
import { useEnrichedProfile } from "@/hooks/useProfile";

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Dirección + nombre visible (si tiene perfil enriquecido), enlazando a su
 * perfil público. Un hook por etiqueta, igual que `AuthorLink` en
 * `ArticleFullscreenCard` — consistente con el resto de la app, sin
 * optimizar prematuramente listas largas de votantes.
 */
export function UserLabel({ address, className = "" }: { address: string; className?: string }) {
  const { data: profile } = useEnrichedProfile(address);

  return (
    <Link
      to={`/users/${address}`}
      className={`inline-flex items-center gap-1 hover:text-brand hover:underline ${className}`}
    >
      {profile?.displayName && <span className="font-medium">{profile.displayName}</span>}
      <span className="font-mono">{shortAddress(address)}</span>
    </Link>
  );
}
