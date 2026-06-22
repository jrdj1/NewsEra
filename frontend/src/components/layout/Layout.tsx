import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400 dark:border-zinc-900">
        NewsEra &mdash; TFG 2026, Universidad de Alicante &mdash; Construido sobre Ethereum
      </footer>
    </div>
  );
}
