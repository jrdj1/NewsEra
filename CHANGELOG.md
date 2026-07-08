# Changelog — NewsEra

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Versiones alineadas con sprints del TFG (Sprint 2 = v0.2.0, etc.).

---

## [Unreleased] — Sprint 9+

### Añadido
- Infraestructura de siembra de estado de prueba (`make fresh-start`): `blockchain/scripts/seed.ts` ejecuta transacciones on-chain reales (20 artículos, 7 escenarios de `consensusState`/veredicto/reapertura) y deja que el indexador rellene Postgres; `backend/scripts/seed-offchain.ts` siembra lo que no tiene equivalente on-chain (perfiles, favoritos, follows, notificaciones) a partir del dataset compartido `docs/seed/articles.json`.
- Avatares de perfil por género en el seed (`gender: "male"|"female"` por perfil, fotos de `randomuser.me/api/portraits/{men|women}`) para mayor realismo.
- Cuenta de prueba "lista para validar": `hardhat.config.ts` amplía la red `hardhat` a 25 cuentas; el seed hace que la cuenta 20 realice 10 predicciones reales y acertadas hasta alcanzar `MIN_REPUTATION_TO_VALIDATE` por el camino meritocrático real (no bootstrapping manual), imprimiendo su clave privada para importarla en una cartera de pruebas.
- Ledger completo de reputación: nuevo modelo `ReputationEvent` + migración, correlación de `ReputationUpdated` con la transacción que lo originó (`indexer.ts`, `classifyReputationEvent`) para clasificar cada cambio (voto, publicación, retroactiva, predicción, registro inicial); `GET /api/v1/validators/:address/reputation-history` reescrito para leerlo directamente; nuevo `components/ReputationHistoryList.tsx` en `/profile` y `/users/:address`.
- Historial completo de transacciones on-chain de un usuario: nuevo `GET /api/v1/validators/:address/activity` (publicaciones, votos, reaperturas, retroactivas unidos y paginados) y `components/ActivityList.tsx`, integrado en `/profile` y `/users/:address`.
- Página `/article/:hash/votes` con el recuento de votos desglosado por ronda y veredicto, enlazada desde el contador de votos del artículo.
- Etiquetas con color también en la página de detalle del artículo (antes solo en las tarjetas del feed).
- `components/UserLabel.tsx` (dirección + nombre del perfil enriquecido) en la línea de autor y la lista de votantes de `Article.tsx`, y en `ArticleVotes.tsx`; `GET /api/v1/users` ahora expone `displayName`/`avatarUrl` (join con `UserProfile`), mostrados en `/users` junto al hash; su buscador filtra también por nombre.
- Buscador de palabras clave (título/cuerpo, con debounce) y filtro por etiquetas en el feed de Inicio; nuevos `search` en `GET /api/v1/publications` y `GET /api/v1/publications/tags` (etiquetas realmente en uso — son libres, sin catálogo predefinido).
- Página `/validate/welcome`: celebración al alcanzar `MIN_REPUTATION_TO_VALIDATE` y convertirse en validador, explicando qué cambia.
- Nav de `Header.tsx`: el enlace `/validate` muestra "Predecir" en vez de "Validar" cuando la dirección conectada aún no puede votar de verdad.

### Cambiado
- Puerto del frontend en Docker remapeado de `5174` a `8080` en el host (`docker-compose.yml`, `Makefile`) — el puerto interno del contenedor no cambia.

### Corregido
- Indexador: `processLogs` ordenaba los eventos de un lote solo por `logIndex` (que se reinicia en cada bloque), corrompiendo el orden causal al procesar de una vez todo el historial sembrado (varios bloques) — ahora ordena primero por `blockNumber` y solo como desempate por `logIndex`.
- `seed.ts` podía crashear el proceso Node en Windows justo al terminar (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`, bug de libuv con handles JSON-RPC aún abiertos), abortando el resto de `make fresh-start` — corregido forzando `process.exit()` explícito al final de `main()`.
- El `TRUNCATE` de `make fresh-start` no incluía `reputation_events`, duplicando sus filas en cada re-siembra.
- El contador de reputación en `/validate` no se actualizaba tras cada predicción (lectura on-chain solo al montar el componente) — nuevo hook `useReputationStatus` reactivo a `ReputationUpdated`.
- Al alcanzar la reputación mínima para validar no había ningún aviso ni redirección; el usuario podía quedarse en el feed de predicción e intentar predecir, lo que el contrato rechazaba (`NotEligibleForPrediction`).
- La sección "Solicitar reapertura" de `Article.tsx` se mostraba a cualquier dirección conectada sin voto previo, aunque el contrato revierte con `InsufficientReputation` si no tiene reputación suficiente para validar.
- El feed de predicción podía revelar el veredicto del artículo objetivo (badge de consenso, recuento de votos, enlace al detalle) antes de que el usuario predijera — ahora oculto vía el prop `hideConsensus` de `ArticleFullscreenCard`.

### Pendiente
- Deploy en Sepolia + fichero `blockchain/deployments/sepolia.json` (Sprint 9)
- `docs/metricas.json` con valores reales + README operativo (Sprint 9)

---

## [0.8.0] — Sprint 8 (frontend: SPA React + Vite completa)

### Añadido
- Cliente API tipado (`lib/api.ts`) y hooks compartidos con react-query: `usePublications`, `usePublication`, `useValidators`, `useValidatorDetail/History`, `useReputationHistory`, `useEnrichedProfile`, `useFavorites`, `useNotifications`, `useReopenRequests`.
- `useTransactionState` — envuelve `useWriteContract` + `useWaitForTransactionReceipt` en los 5 estados documentados en la memoria (Idle/Pending/Confirming/Confirmed/Failed) y traduce los reverts conocidos a lenguaje natural (`lib/errors.ts`).
- `Publish.tsx` — formulario completo: borrador en `localStorage`, vista previa, cálculo de `contentHash` con viem, subida a IPFS (best-effort si no hay `VITE_PINATA_JWT`), `registerPublication` on-chain, `POST /api/v1/publications`.
- `Article.tsx` — historial de rondas, progreso de quórum, votantes de la ronda actual, voto real (`submitValidation`) o predicción de práctica (`submitPrediction`) según `canValidate`, solicitud de reapertura, favoritos, seguimiento, compartir, artículos relacionados por etiqueta.
- `Validators.tsx` y `ValidatorProfile.tsx` — ranking paginado y perfil público con reputación, % de aciertos, historial e identidad enriquecida.
- `Profile.tsx` — panel con pestañas: reputación y su evolución, historial de validaciones, reclamaciones retroactivas pendientes (calculadas cruzando el historial con `currentRound` on-chain vía `useReadContracts`), solicitudes de reapertura propias, publicaciones propias, favoritos, edición de perfil con `personal_sign`.
- `Header.tsx` — panel de notificaciones con contador de no leídas y refetch periódico.
- `Feed.tsx` ampliado con el listado real de publicaciones (filtro por estado, orden, paginación) — antes solo tenía la landing page.
- `GET /api/v1/profile/:address/reopen-requests` (backend) — gap señalado en el prompt de Sprint 8: no existía forma de listar las solicitudes de reapertura propias del usuario.

### Corregido
- **CORS** (bug crítico): el backend no tenía middleware CORS — el navegador bloqueaba toda petición del frontend. Añadido `hono/cors` sobre `/api/*`.

---

## [0.7.0] — Sprint 7 (backend: API REST + indexador de eventos)

### Añadido
- `backend/prisma/schema.prisma` ampliado: `Round`, `UserProfile`, `Favorite`, `Follow`, `Notification`, `IndexerState` (bookkeeping interno); `Publication.consensusState/currentRound/reopenRequestCount`, `Validator.registeredAt`.
- Arquitectura de 3 capas (`routes` → `services` → `repositories`); ningún router accede a Prisma directamente.
- Endpoints núcleo: `GET/POST /api/v1/publications`, `GET /api/v1/publications/:hash`, `POST /api/v1/publications/:hash/reopen-request`, `POST /api/v1/publications/:hash/claim-retroactive`, `GET /api/v1/validators`, `GET /api/v1/validators/:address`, `GET /api/v1/validators/:address/history`, `GET /api/v1/validators/:address/reputation-history`.
- Perfil enriquecido, favoritos, seguimiento y notificaciones: `GET/PUT /api/v1/profile/:address` (verificación `personal_sign` con viem), `GET /api/v1/profile/:address/favorites`, `POST/DELETE /api/v1/favorites/:hash`, `POST/DELETE /api/v1/publications/:hash/follow`, `GET /api/v1/profile/:address/notifications`, `PATCH /api/v1/notifications/:id/read`.
- `POST /api/v1/sync/events` (HU-7.6) — re-sincronización manual del indexador protegida con `Authorization: Bearer <SERVICE_TOKEN>`.
- Indexador de eventos on-chain (`services/indexer.ts`) con `viem`: procesa historial desde `DEPLOY_BLOCK`/último bloque persistido y se suscribe en tiempo real a los tres contratos; genera notificaciones para `ConsensusReached`, `VotingReopened` y `RetroactiveClaimed`.
- `backend/Dockerfile` + servicio `backend` en `docker-compose.yml` (contexto = raíz del repo, ya que depende de `docs/abis/`); nuevos targets de Makefile (`backend`, `stop-backend`, `logs-backend`, `migrate`, `migrate-deploy`, `prisma-generate`, `prisma-studio`, `test-backend`).
- 9 tests de integración contra PostgreSQL y Hardhat Network reales (sin mocks): publicaciones, firma de perfil, favoritos, notificaciones, indexador.

### Corregido
- `lib/viem.ts` (D4) — antes solo configuraba Sepolia con un nombre de variable de entorno distinto al documentado (`SEPOLIA_RPC_URL`); ahora soporta `NETWORK=local|sepolia` con `RPC_URL_LOCAL`/`RPC_URL_SEPOLIA`.
- Manejo de errores global movido de middleware (`app.use`) a `app.onError(...)` — un middleware con `try/await next()/catch` no capturaba de forma fiable los errores lanzados en rutas montadas vía `app.route()`.
- Direcciones Ethereum normalizadas a checksum EIP-55 en el límite de los servicios (`lib/address.ts`) — sin esto, la misma dirección en distinto casing (p.ej. de una wallet vs. de un evento on-chain) se trataba como dos entidades distintas en PostgreSQL.
- Orden de procesado del indexador: se pasó de un watch/query por nombre de evento a uno por contrato completo, para que eventos relacionados de una misma transacción (`ReopenRequested` + `VotingReopened`) se procesen en el orden real de `logIndex` — la separación por evento corrompía `reopenRequestCount`.
- `handleReopenRequested` pasó de incrementar `reopenRequestCount` de forma relativa a fijar el valor absoluto emitido por el contrato; inserciones del indexador en `ReopenRequest`/`RetroactiveClaim` usan `upsert` para ser idempotentes frente a reprocesados.

### Métricas
- **Total tests backend:** 9 passing (integración, sin mocks)

---

## [0.6.0] — Sprint 6 (reputación II: recompensa por publicación y predicciones)

### Añadido
- `ValidationRegistry.sol` — recompensa/penalización de reputación al autor cuando la ronda de su artículo alcanza `DEFINITIVE` por primera vez: `+8` (TRUE), `−8` (UNVERIFIABLE), `−15` (FALSE), sin efecto en DISPUTED. Se aplica una única vez por artículo (`_authorRewarded`); una ronda DISPUTED no la marca, así que una reapertura posterior que sí alcance DEFINITIVE la dispara entonces.
- `ValidationRegistry.sol` — `submitPrediction(bytes32, uint8)`: acceso meritocrático a reputación para direcciones con `canValidate == false`, sin contar para quórum/supermayoría. Se resuelve automáticamente (no *pull*) junto con los votantes reales al alcanzar `DEFINITIVE`: `±PREDICTION_REWARD/PENALTY = ±1`.
- Nueva dependencia de solo lectura `IPublicationRegistry` en `ValidationRegistry` (5º parámetro del constructor); `ignition/modules/NewsEra.ts` actualizado para pasar la dirección de `PublicationRegistry`.
- Guard simétrico: una dirección que ya predijo un artículo tampoco puede votarlo después (`_hasPredicted` añadido a la comprobación de `submitValidation`).
- 16 tests nuevos: recompensa/penalización por publicación (incluyendo no reaplicación tras reapertura y resolución diferida tras DISPUTED), guards de `submitPrediction`, resolución automática de predicciones y acumulación de reputación hasta `MIN_REPUTATION_TO_VALIDATE`.

### Eliminado
- `ignition/modules/ValidationRegistry.ts` — módulo Sprint 3, dejó de ser compilable con el 5º parámetro del constructor y ya estaba completamente sustituido por `NewsEra.ts` desde el Sprint 5.

### Métricas
- **Total tests:** 91 passing
- **Cobertura:** 96.97% statements / 88.46% branch / 100% functions

---

## [0.5.0] — Sprint 5 (integración y auditoría de contratos)

### Añadido
- `blockchain/ignition/modules/NewsEra.ts` — módulo Ignition unificado: despliega PublicationRegistry → ReputationSystem → ValidationRegistry y concede `VALIDATOR_ROLE`
- `blockchain/test/e2e/NewsEra.e2e.ts` — tests E2E integrados: flujo básico (publicar → votar → consenso → reputación), flujo multironda con `claimRetroactiveReputation`, resistencia Sybil, degradación de validadores
- `.github/workflows/slither.yml` — análisis estático en CI
- `scripts/export-abis.ts` — exporta ABIs de los 3 contratos a `docs/abis/`

### Corregido
- `claimRetroactiveReputation` — doble procesado de la última ronda ya contabilizada al reclamar en llamadas separadas (`_retroLastRound` guardaba `latestRound` en vez de `latestRound + 1`)

### Métricas
- **Total tests:** 75 passing

---

## [0.3.0] — 2026-06-26 — Sprint 3/4 (contratos de validación y reputación)

### Añadido
- `blockchain/contracts/ValidationRegistry.sol` — contrato de validación con gobernanza completa:
  - Enum `ConsensusState { PENDING, DEFINITIVE, DISPUTED }`
  - Enum `VoteType { TRUE, FALSE, UNVERIFIABLE }` — UNVERIFIABLE es veredicto de primera clase
  - Struct `Validation` con tight variable packing (`address` 20b + `VoteType` 1b = 1 slot)
  - Parámetros de gobernanza configurables en constructor: `quorumThreshold`, `superMajorityBps`
  - `submitValidation(bytes32, uint8)` con guards: `ConsensusAlreadyReached`, `InsufficientReputation`, `AlreadyValidated`
  - `_checkConsensus` interno: evalúa quórum → calcula `winnerBps = (winnerVotes * 10000) / total` → DEFINITIVE si ≥ `superMajorityBps`, DISPUTED si no
  - DEFINITIVE: efectos reputacionales simétricos para todos (+REWARD si votó ganador, −PENALTY si no, incluyendo UNVERIFIABLE cuando gana TRUE/FALSE)
  - DISPUTED: quórum alcanzado pero sin supermayoría → sin efectos reputacionales
  - Evento `ConsensusReached(bytes32 indexed, uint8 result, uint8 state)`
  - Consultas: `getValidations`, `hasValidated`, `consensusState`, `consensusResult`
- `blockchain/contracts/ReputationSystem.sol` — contrato de reputación con AccessControl:
  - `VALIDATOR_ROLE` (solo `ValidationRegistry` puede modificar reputaciones)
  - `DEFAULT_ADMIN_ROLE` para `registerValidator` (bootstrapping)
  - Constantes: `MIN_REPUTATION_TO_VALIDATE=10`, `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`
  - `increaseReputation` / `decreaseReputation` (suelo en 0, nunca negativo)
  - `canValidate(address)` — resistencia Sybil: cuenta nueva = rep 0 < umbral
  - Evento `ReputationUpdated(address indexed, uint256 newScore, bool increased)`
  - Custom errors: `ValidatorAlreadyRegistered`, `ValidatorNotRegistered`
- `blockchain/test/ValidationRegistry.ts` — 28 tests de integración:
  - `submitValidation`: éxito, AlreadyValidated, InsufficientReputation, ConsensusAlreadyReached (DEFINITIVE y DISPUTED), hashes independientes, `hasValidated`
  - PENDING: sin quórum, sigue abierto
  - DEFINITIVE TRUE/FALSE/UNVERIFIABLE con 3 y 5 votantes; efectos reputacionales verificados
  - UNVERIFIABLE voter penalizado cuando gana TRUE (y viceversa)
  - DISPUTED: 66.6%, 50%, 33.3% — sin cambio de reputación
  - `getValidations`: datos correctos y array vacío
- `blockchain/test/ReputationSystem.ts` — 22 tests unitarios:
  - `registerValidator`: éxito, evento, duplicado (revert), acceso sin rol (revert)
  - `increaseReputation` / `decreaseReputation`: valores exactos, eventos, suelo en 0, acceso sin rol
  - `canValidate`: true/false según umbral, false sin registrar
  - Consultas públicas: `getReputation`, `isRegisteredValidator`
  - Resistencia Sybil: cuenta nueva, penalizado por debajo del umbral, whitewashing
- `blockchain/ignition/modules/ValidationRegistry.ts` — módulo Ignition: despliega ReputationSystem → ValidationRegistry → `grantRole(VALIDATOR_ROLE, validationRegistry)`

### Cambiado
- `blockchain/contracts/ValidationRegistry.sol` — rediseño completo respecto al diseño inicial:
  - `consensusReached: bool` reemplazado por `consensusState: ConsensusState`
  - Lógica de consenso anterior (mayoría simple TRUE vs FALSE, UNVERIFIABLE ignorado) reemplazada por supermayoría configurable con UNVERIFIABLE como opción ganadora
  - Evento `ConsensusReached` añade parámetro `state`
  - Constructor añade parámetro `superMajorityBps_`

### Métricas
- **Total tests:** 50 passing (8 PublicationRegistry + 22 ReputationSystem + 28 ValidationRegistry — 2 integración superpuestos recontados como 50 únicos)
- **Cobertura:** 100% statements / 100% branch / 100% funcs / 100% lines (3 contratos)

---

## [0.2.0] — 2026-06-21/22 — Sprint 2 (PublicationRegistry + frontend base + infra Docker)

### Añadido
- `blockchain/contracts/PublicationRegistry.sol` — registro inmutable de hashes:
  - Struct `Publication` con tight variable packing (`address author` 20b + `uint96 timestamp` 12b = 1 slot, `bool exists` en slot 2)
  - `registerPublication(bytes32)` — revierte con `PublicationAlreadyExists` si hash duplicado
  - `getPublication(bytes32)` — revierte con `PublicationNotFound` si no existe
  - Evento `PublicationRegistered(bytes32 indexed, address indexed, uint256)`
  - Abierto a cualquier dirección (sin control de acceso)
- `blockchain/test/PublicationRegistry.ts` — 8 tests (100% cobertura):
  - Registro exitoso, evento emitido, duplicado (revert), múltiples autores
  - Datos correctos, `author == msg.sender`, not-found para hash inexistente y para hash distinto
- `blockchain/ignition/modules/PublicationRegistry.ts` — módulo Ignition básico
- `blockchain/scripts/verify.ts` — script de verificación manual en red local
- `frontend/src/pages/Feed.tsx` — landing page `/`:
  - Hero con CTA condicional (ConnectButton si desconectado, link a `/publish` si conectado)
  - Tres pilares: Inmutabilidad, Validación colectiva, Resistencia a la captura
- `frontend/src/pages/About.tsx` — página `/about`:
  - Resumen del proyecto, flujo en 3 pasos, tabla de contratos
  - Enlace a la memoria del TFG (`github.com/jrdj1/TFG-NewsEra-memoria`)
  - Sección de autor: Jorge Rafael de Julián Vicedo, Dr. Higinio Mora Mora, UA 2026
- `frontend/src/components/layout/Header.tsx` — cabecera fija con logo, navegación y `ConnectButton` de RainbowKit
- `frontend/src/components/layout/Layout.tsx` — layout raíz con `<Outlet />` y footer
- `frontend/src/App.tsx` — React Router v6 con rutas anidadas bajo `<Layout />`; añadida ruta `/about`
- `frontend/src/lib/wagmi.ts` — wagmi v2 + RainbowKit v2: `chains: [hardhat, sepolia]`, `projectId` con fallback
- `frontend/Dockerfile` — imagen node:20-alpine, puerto 5174
- `blockchain/Dockerfile.node` — imagen node:20-alpine, Hardhat node en 0.0.0.0:8545
- `docker-compose.yml` — tres servicios: `newsera-hardhat` (8545), `newsera-frontend` (5174), `newsera-db` PostgreSQL 16 (5432); healthchecks para los tres
- `Makefile` — 28 targets organizados por categoría: entorno, servicios individuales, logs, blockchain, frontend, métricas, limpieza

### Corregido
- Healthcheck de `hardhat-node`: Alpine busybox wget no soporta `--post-data`; sustituido por request HTTP inline con Node.js
- Healthcheck de `frontend`: busybox resuelve `localhost` como IPv6 `::1` pero Vite solo escucha IPv4; cambiado a `127.0.0.1`
- wagmi config: `chains: [sepolia]` sola no reconoce chainId 31337; añadido `hardhat`
- RainbowKit: `projectId: ""` causa pantalla negra; añadido fallback `"newsera-local-dev"`
- Puerto: movido de 5173 a 5174 (conflicto con otro proyecto)

---

## [0.1.0] — 2026-06-21 — Infraestructura base

### Añadido
- Migración de Next.js a React + Vite SPA (decisión KISS — sin SSR)
- Estructura de directorios: `blockchain/`, `backend/`, `frontend/`, `docs/`, `scripts/`
- `blockchain/hardhat.config.ts` con redes `localhost` (127.0.0.1:8545, chainId 31337) y `sepolia`
- `blockchain/tsconfig.json` con `rootDir: "."` e includes para `ignition/**` y `test/**`
- Stack blockchain: Hardhat ^2.22, OpenZeppelin ^5.x, TypeChain para ethers-v6
- Stack frontend: React 18 + Vite + TypeScript strict, wagmi v2, viem, RainbowKit v2, Tailwind CSS v4, shadcn/ui, React Router v6

---

## [0.0.1] — 2026-06-18 — Inicialización del repositorio

### Añadido
- Estructura vacía del repositorio NewsEra
- `CLAUDE.md` con guía de desarrollo, stack tecnológico, convenciones, backlog de sprints
