import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, NavLink } from "react-router-dom";
import { useAccount } from "wagmi";
import { useNotifications } from "@/hooks/useNotifications";
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
  { to: "/users", label: "Usuarios", end: false, Icon: UsersIcon },
  { to: "/publish", label: "Publicar", end: false, Icon: PublishIcon },
  { to: "/validate", label: "Validar", end: false, Icon: ValidateIcon },
];

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

  const links = isConnected
    ? [...navLinks, { to: "/profile", label: "Perfil", end: false, Icon: ProfileIcon }]
    : navLinks;

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-2 sm:px-4">
        <Link to="/" className="mr-1 shrink-0 sm:mr-2">
          <img src="/logo.jpg" alt="NewsEra" className="h-9 w-9 rounded-lg object-cover" />
        </Link>

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

        <div className="flex shrink-0 items-center gap-2">
          {isConnected && address && <NotificationBell address={address} />}
          <ConnectButton accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} showBalance={false} />
        </div>
      </div>
    </header>
  );
}
