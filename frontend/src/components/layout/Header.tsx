import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink, Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Inicio", end: true },
  { to: "/validators", label: "Validadores", end: false },
  { to: "/about", label: "Sobre el proyecto", end: false },
];

export default function Header() {
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
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
}
