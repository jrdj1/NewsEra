import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

const navLinks = [
  { to: "/", label: "Inicio", end: true },
  { to: "/validators", label: "Validadores", end: false },
  { to: "/about", label: "Sobre el proyecto", end: false },
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

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
        >
          NewsEra
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive
                  ? "font-medium text-zinc-900 dark:text-white"
                  : "text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
              }
            >
              {label}
            </NavLink>
          ))}
          {isConnected && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive
                  ? "font-medium text-zinc-900 dark:text-white"
                  : "text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
              }
            >
              Mi perfil
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isConnected && address && <NotificationBell address={address} />}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
