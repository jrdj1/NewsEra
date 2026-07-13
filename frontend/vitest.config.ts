import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Config de Vitest dedicada (separada de vite.config.ts): añadir el plugin de
 * Tailwind v4 (@tailwindcss/vite) al entorno de test no aporta nada — no se
 * renderiza CSS real en jsdom — y solo ralentiza el arranque de cada test.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
});
