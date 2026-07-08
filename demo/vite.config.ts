import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Demo estática sin backend ni blockchain reales: "wagmi" y
// "@rainbow-me/rainbowkit" se sustituyen por versiones locales que simulan
// cartera/lecturas/transacciones sobre datos en memoria (ver src/demo/).
// Los paquetes reales se mantienen en package.json solo para que `tsc`
// resuelva sus tipos — nunca se empaquetan gracias a este alias.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Coincidencia EXACTA (^...$): el alias de Vite hace prefix-match por
      // defecto con claves de objeto simples, lo que capturaba también
      // subpaths reales como "@rainbow-me/rainbowkit/styles.css" o
      // "wagmi/chains" y rompía su resolución.
      { find: /^wagmi$/, replacement: path.resolve(__dirname, "./src/demo/wagmi-shim.tsx") },
      {
        find: /^@rainbow-me\/rainbowkit$/,
        replacement: path.resolve(__dirname, "./src/demo/rainbowkit-shim.tsx"),
      },
    ],
  },
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
});
