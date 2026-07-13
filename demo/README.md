# NewsEra — Demo estática

Copia independiente del frontend (`../frontend`) pensada **solo para validar la
idea y el diseño de la interfaz** ante cualquier persona, sin necesitar
backend, PostgreSQL ni un nodo blockchain reales. No interfiere con el
proyecto real: vive en su propia carpeta, con su propio `package.json` y
puerto de desarrollo (`4173`, frente a `5173`/`8080` del proyecto real). La
única variable de entorno real que usa es la de la base de datos de
encuestas (`DATABASE_URL`, ver más abajo) — el resto de la demo (artículos,
votos, cartera) sigue sin necesitar ninguna.

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

## Encuestas de validación (única parte con base de datos real)

Dos páginas fuera del "modo demo" en memoria: `/encuestas/problema` (valida
si el problema de la desinformación es percibido como grave) y
`/encuestas/producto` (valida, tras explorar la demo, si NewsEra convence
como solución concreta). Ambas están enlazadas desde la última pantalla de
`/about`.

- Las respuestas se envían a `POST /api/survey` (`demo/api/survey.ts`), una
  función serverless de Vercel — no pasa por `demoStore` ni por
  `localStorage`, es la única escritura de la demo que sale del navegador.
- Persistencia en Postgres vía la integración Neon de Vercel
  (`@neondatabase/serverless`), con un esquema mínimo de una sola tabla
  creada de forma perezosa (`CREATE TABLE IF NOT EXISTS survey_responses`
  en cada petición) — sin migraciones formales, a propósito: es una
  funcionalidad satélite, no la base de datos relacional real del proyecto
  (esa es `backend/prisma/schema.prisma`).
- **Datos piloto sintéticos:** `survey_responses` tiene una columna `source`
  (`'live'` por defecto para respuestas reales, `'seed_pilot'` para las 20+20
  respuestas ficticias insertadas por `scripts/seed-surveys.mjs` para probar
  el formulario y el cálculo antes de tener respuestas reales). El endpoint
  `GET /api/survey` ya filtra por `source = 'live'`; cualquier análisis nuevo
  sobre la tabla debe hacer lo mismo. Detalle completo en
  `docs/encuestas/informe-diseno-experimentos.md` §"Nota sobre datos piloto
  sintéticos".
- **Variable de entorno requerida**: `DATABASE_URL` — la rellena
  automáticamente Vercel al conectar el proyecto a una base de datos
  Postgres/Neon desde su dashboard (Storage → Create Database → Postgres);
  no hay que copiarla a mano. Ver `.env.example`.
- **Solo funciona desplegado en Vercel** (o con `vercel dev` localmente, que
  sí sirve `demo/api/`). Con `npm run dev`/`npm run preview` normales
  (Vite puro) no existe `/api`, y el formulario lo refleja con un mensaje
  de error explícito en vez de fallar en silencio o dejar una pantalla en
  blanco — comportamiento verificado, no solo asumido.

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
  Vercel detecta `demo/api/survey.ts` automáticamente como función
  serverless — no requiere configuración adicional más allá de conectar la
  base de datos (ver sección de encuestas arriba).
- **Netlify / Cloudflare Pages / GitHub Pages**: mismo build command y
  carpeta de salida `dist`, pero **sin `/api`** — funcionan para el resto de
  la demo (100% estática), no para las encuestas, que necesitan un runtime
  serverless. Si se despliega ahí, las dos páginas de encuestas seguirán
  siendo visitables pero el envío mostrará el error de red esperado.
