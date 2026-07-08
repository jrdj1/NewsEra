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
      className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
    >
      <span>🧪 Demo</span>
      <span className="font-mono text-zinc-400">{shortAddress(DEMO_ADDRESS)}</span>
    </button>
  );
}
