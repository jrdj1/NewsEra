# NewsEra — Demo estática

Copia independiente del frontend (`../frontend`) pensada **solo para validar la
idea y el diseño de la interfaz** ante cualquier persona, sin necesitar
backend, PostgreSQL ni un nodo blockchain reales. No interfiere con el
proyecto real: vive en su propia carpeta, con su propio `package.json`,
puerto de desarrollo (`4173`, frente a `5173`/`8080` del proyecto real) y
sin variables de entorno.

Desplegada en Vercel desde esta rama (`demo`) con Root Directory `demo`,
Build Command `npm run build` y Output Directory `dist`.

## Cómo funciona

- **Datos**: `src/demo/store.ts` reconstruye en memoria, en el propio
  navegador, el mismo estado que produce `make fresh-start` en el proyecto
  real (20 artículos, rondas, votos, reputaciones), reutilizando el dataset
  compartido `docs/seed/articles.json`. Las direcciones se derivan del mismo
  mnemonic de prueba de Hardhat, así que coinciden con las que verías en un
  entorno local real.
- **"Backend"**: `src/lib/api.ts` mantiene la misma interfaz (`api.get/post/
  put/patch/delete`) que la versión real, pero enruta cada llamada contra
  `demoStore` en vez de hacer `fetch` — ningún hook de la app ha tenido que
  cambiar.
- **"Blockchain"**: `wagmi` y `@rainbow-me/rainbowkit` se sustituyen por
  versiones locales (`src/demo/wagmi-shim.tsx`, `src/demo/rainbowkit-shim.tsx`)
  vía alias de Vite (`vite.config.ts`). Hay una cartera "conectada" fija (una
  persona con reputación 10, ya elegible para validar) — así cualquier
  visitante ve la app en su estado más interesante sin instalar MetaMask.
  Las escrituras (votar, predecir, publicar...) simulan el ciclo real
  Pending → Confirming → Confirmed y mutan los datos en memoria.
- Los paquetes reales `wagmi`/`@rainbow-me/rainbowkit` se mantienen en
  `package.json` solo para que TypeScript resuelva sus tipos — nunca se
  empaquetan (el alias los sustituye por completo en tiempo de build).
- **Persistencia**: tras cada escritura (votar, predecir, publicar,
  favoritos, seguir, notificaciones, editar perfil) el estado completo se
  guarda en `localStorage` del navegador (`newsera-demo-state-v1`) y se
  restaura al cargar — una recarga completa de página ya no borra lo que
  hayas hecho. Botón "Reiniciar demo" en `/about` para volver al estado
  original sembrado.

## Limitaciones (a propósito)

- El estado persiste en `localStorage`, así que es **local a ese
  navegador/dispositivo** — no se comparte entre visitantes ni entre
  pestañas de incógnito distintas. Si el navegador bloquea `localStorage`
  (modo privado estricto, cuota agotada), la demo sigue funcionando igual,
  simplemente sin sobrevivir a una recarga.
- No hay wallet real, ni transacciones reales, ni backend, ni IPFS. No
  demuestra el mecanismo on-chain real (eso requiere el proyecto completo
  contra Sepolia o un nodo Hardhat local — ver README de la raíz del repo).

## Desarrollo local

```bash
cd demo
npm install
npm run dev      # http://localhost:4173
```

## Build y despliegue gratuito

```bash
npm run build     # genera demo/dist — HTML/CSS/JS 100% estáticos
```

`demo/dist` se puede desplegar gratis en cualquier hosting estático:

- **Vercel**: `vercel --cwd demo` o importar el repo señalando `demo` como
  root directory y `npm run build` / `dist` como comandos de build/output.
- **Netlify**: base directory `demo`, build command `npm run build`,
  publish directory `demo/dist`.
- **Cloudflare Pages / GitHub Pages**: mismo build command y carpeta de
  salida `dist`.

No requiere ninguna variable de entorno.
