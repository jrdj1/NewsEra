import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";

// El feed de Inicio, la página de Validar y "Sobre el proyecto" (8
// pantallas a modo de cinemática) son a pantalla completa (scroll-snap) —
// un footer por debajo rompería esa ilusión, añadiendo scroll extra donde
// no debería haberlo.
const FULLSCREEN_ROUTES = ["/", "/validate", "/about"];

export default function Layout() {
  const { pathname } = useLocation();
  const isFullscreenRoute = FULLSCREEN_ROUTES.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isFullscreenRoute && (
        <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400 dark:border-zinc-900">
          NewsEra &mdash; TFG 2026, Universidad de Alicante &mdash; Construido sobre Ethereum &mdash;{" "}
          <Link to="/about" className="underline underline-offset-2">
            Sobre el proyecto
          </Link>
        </footer>
      )}
    </div>
  );
}
