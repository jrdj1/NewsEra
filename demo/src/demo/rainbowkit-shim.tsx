import type { ReactNode } from "react";
import { DEMO_ADDRESS } from "./store";

/**
 * Sustituto local de "@rainbow-me/rainbowkit" para la demo estática (ver
 * vite.config.ts, resolve.alias) — sin WalletConnect ni modal real de
 * conexión. La cartera "conectada" es siempre la misma persona demo (ver
 * wagmi-shim.tsx), así que `ConnectButton` solo muestra un indicador de
 * modo demo en vez de abrir un flujo de conexión real.
 */

function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function RainbowKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function getDefaultConfig(_opts: unknown) {
  return {};
}

export function lightTheme(_opts?: unknown) {
  return {};
}

export function darkTheme(_opts?: unknown) {
  return {};
}

export function ConnectButton(_props: unknown) {
  return (
    <button
      type="button"
      title="Demo: cartera simulada, sin conexión real"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-800 sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-xs sm:font-medium sm:text-zinc-600 sm:dark:text-zinc-300"
    >
      {/* Icono suelto en móvil (mismo tamaño que avatar/notificaciones) — el
          texto completo solo aporta en escritorio, donde sobra sitio. */}
      <span aria-hidden="true" className="sm:hidden">
        🧪
      </span>
      <span className="hidden sm:inline">🧪 Demo</span>
      <span className="hidden font-mono text-zinc-400 sm:inline">{shortAddress(DEMO_ADDRESS)}</span>
    </button>
  );
}
