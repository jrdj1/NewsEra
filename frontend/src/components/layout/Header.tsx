import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, NavLink } from "react-router-dom";
import { useAccount } from "wagmi";
import { useNotifications } from "@/hooks/useNotifications";
import { useReputationStatus } from "@/hooks/useReputationStatus";
import { useEnrichedProfile } from "@/hooks/useProfile";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      <path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9" />
      <path d="M22 20c0-3-2-5.3-5-6" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
      <path d="M4 5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2" />
      <path d="M7 9h9M7 12.5h9M7 16h5" strokeLinecap="round" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 11.5h1v5h1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ValidateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function PredictIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2 1.8-2.5 3" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const navLinks = [
  { to: "/", label: "Inicio", end: true, Icon: HomeIcon },
  { to: "/noticias", label: "Noticias", end: true, Icon: NewsIcon },
  { to: "/users", label: "Usuarios", end: false, Icon: UsersIcon },
  { to: "/publish", label: "Publicar", end: false, Icon: PublishIcon },
  { to: "/validate", label: "Validar", end: false, Icon: ValidateIcon },
];

const ABOUT_LINK = { to: "/about", label: "Sobre Nosotros", end: false, Icon: AboutIcon };

function ProfileAvatarLink({ address }: { address: string }) {
  const { data: profile } = useEnrichedProfile(address);

  return (
    <NavLink
      to="/profile"
      aria-label="Perfil"
      className={({ isActive }) =>
        `flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-colors ${
          isActive ? "ring-brand" : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700"
        }`
      }
    >
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <ProfileIcon />
        </span>
      )}
    </NavLink>
  );
}

function NotificationBell({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications(address);
  const unread = data?.items.filter((n) => !n.read).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && <NotificationPanel address={address} onClose={() => setOpen(false)} />}
    </div>
  );
}

export default function Header() {
  const { address, isConnected } = useAccount();
  const { canValidate } = useReputationStatus(address);

  const baseLinks =
    isConnected && canValidate === false
      ? navLinks.map((link) =>
          link.to === "/validate" ? { ...link, label: "Predecir", Icon: PredictIcon } : link,
        )
      : navLinks;

  const links = [...baseLinks, ABOUT_LINK];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-2 sm:gap-3 sm:px-4">
        <Link to="/" className="shrink-0">
          <img src="/logo.jpg" alt="NewsEra" className="h-9 w-9 rounded-lg object-cover" />
        </Link>

        {/* Cuenta: red + cartera, perfil y notificaciones — agrupadas y
            separadas del menú de navegación con un borde, para que no se
            confundan con los destinos de contenido (Noticias, Validar...). */}
        <div className="flex shrink-0 items-center gap-2 border-r border-zinc-200 pr-2 dark:border-zinc-800 sm:gap-3 sm:pr-3">
          <ConnectButton accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} showBalance={false} />
          {isConnected && address && (
            <>
              <ProfileAvatarLink address={address} />
              <NotificationBell address={address} />
            </>
          )}
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm ${
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                }`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
