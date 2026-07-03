# Sprint 7 — Backend completo

Prompt generado a partir del ERS completo de la memoria del TFG
(`D:\TFG-NewsEra\TFG-TFM_EPS`, Capítulo 4 §4.1 y Anexo A — 42 casos de uso),
listo para pegar en el proyecto Claude dedicado a este repositorio.

Sprints 0–6 ya completos (contratos, tests, Ignition, Slither, ABIs
exportados, y la ampliación de reputación por publicación/predicciones del
Sprint 6). Ejecutar en orden: Sprint 7 → Sprint 8 → Sprint 9.

---

```
Implementa el Sprint 7 de NewsEra: API REST completa con Hono + Prisma +
PostgreSQL, indexador de eventos on-chain, y las funcionalidades de perfil
enriquecido, favoritos, seguimiento y notificaciones definidas en el ERS de
la memoria (42 casos de uso).

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\backend\`. Stack: Hono ^4.x, Prisma ^6.x, viem
^2.x, TypeScript ESM strict (`moduleResolution: NodeNext`), Vitest.
Sprints 0-6 completos (contratos + tests + Ignition + Slither + ABIs
exportados a `docs/abis/`; ValidationRegistry ampliado en Sprint 6 con
recompensa por publicación y predicciones — este sprint de backend NO
necesita indexar el evento `PredictionSubmitted`, ver nota en el prompt de
Sprint 6). El backend NUNCA firma transacciones.

Arquitectura de capas obligatoria (CLAUDE.md):
  Router (Hono) → Repository (Prisma)
El router NO accede directamente a Prisma. Los repositorios encapsulan TODOS
los accesos a PostgreSQL.

Estado actual: `backend/src/index.ts` es un esqueleto; `routes/`,
`services/`, `repositories/` están vacíos; `schema.prisma` tiene el modelo
antiguo (sin `Round`, `UserProfile`, `Favorite`, `Follow`, `Notification`).

---

## Tarea 0 — HU-7.0: Corregir y ampliar schema.prisma

Sustituir `backend/prisma/schema.prisma` completo por el esquema documentado
en CLAUDE.md §Sprint 7 (Publication con consensusState/currentRound/
reopenRequestCount, Round, Validation, Validator con registeredAt,
ReopenRequest, RetroactiveClaim, UserProfile, Favorite, Follow, Notification).

Ejecutar:
  npx prisma migrate dev --name add-rounds-profile-favorites-notifications
  npx prisma generate

Verificar: `npx prisma studio` muestra las 9 tablas sin errores.

Commit: `feat(backend): amplía schema Prisma — Round, UserProfile, Favorite, Follow, Notification`

---

## Tarea 1 — HU-7.1: Infraestructura base

Crear la siguiente estructura (si no existe):

```
backend/src/
  types/
    api.ts              ← tipos TS de request/response de todos los endpoints
  errors/
    AppError.ts          ← clase AppError { code, message, status }
  middleware/
    errorHandler.ts       ← Hono middleware: AppError → JSON { error: { code, message } }
  repositories/
    publication.repository.ts
    validator.repository.ts
    profile.repository.ts
    favorite.repository.ts
    follow.repository.ts
    notification.repository.ts
  routes/
    publications.ts
    validators.ts
    profile.ts
    favorites.ts
    notifications.ts
    sync.ts
  services/
    indexer.ts
    signature.ts          ← verificación personal_sign con viem
```

`errors/AppError.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public code: "NOT_FOUND" | "CONFLICT" | "UNPROCESSABLE" | "FORBIDDEN" | "INTERNAL_ERROR",
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
```

`middleware/errorHandler.ts` captura `AppError` y devuelve
`{ "error": { "code", "message" } }` con el status correspondiente; cualquier
otro error no controlado devuelve 500 `INTERNAL_ERROR` sin filtrar detalles
internos.

Verificar: `npm run dev` levanta el servidor en `localhost:3001` sin errores;
`GET /` sigue respondiendo `{ status: "ok" }`.

Commit: `feat(backend): estructura de capas — types, errors, middleware, repositories, routes`

---

## Tarea 2 — HU-7.2: Endpoints núcleo de publicaciones y validadores

### `publication.repository.ts`
- `list({ page, limit, state?, tags?, author?, sort? })` — filtra por
  `consensusState`, `tags` (array overlap), `authorAddress`; ordena por
  `createdAt desc` (`recent`), nº de votos (`votes`, requiere agregación de
  `validations`), o `consensusState` (`state`)
- `getByHash(hash)` — incluye `rounds` (ordenadas por `round`) y `validations`
  agrupadas por ronda
- `create({ contentHash, ipfsCid?, title, body, tags })` — antes de insertar,
  verifica con `viem` que `contentHash` existe en `PublicationRegistry`
  (lectura `getPublication`); si `body` viene informado, verifica
  `keccak256(body) === contentHash`; revert → `UNPROCESSABLE`

### `validator.repository.ts`
- `list({ page, limit })` — ordenado por `reputationScore desc`
- `getByAddress(address)` — `reputationScore`, `totalValidations`,
  `correctVotes`, `accuracy` (calculado sobre rondas `DEFINITIVE` únicamente;
  las rondas `DISPUTED` no cuentan ni como acierto ni como fallo)
- `getHistory(address, { page, limit })` — join `Validation` + `Round` por
  `(contentHash, round)`; cada entrada indica `roundState`, `roundResult` y
  clasificación ganada/perdida/sin resolver
- `getReputationHistory(address)` — requiere que el indexador (Tarea 3)
  persista el histórico de `ReputationUpdated`; si no existe una tabla
  específica, derivarlo de los deltas ya aplicados en `Validation`/`Round`
  (documentar la limitación si la granularidad exacta por bloque no está
  disponible). El histórico incluirá también los deltas de recompensa por
  publicación aplicados en Sprint 6 (mismo evento `ReputationUpdated`, sin
  distinción de origen a nivel de evento — no es necesario diferenciarlos).

### `routes/publications.ts`
- `GET /api/v1/publications` — query params `page`, `limit`, `state`, `tags`,
  `author`, `sort`
- `GET /api/v1/publications/:hash`
- `POST /api/v1/publications` — body `{ contentHash, ipfsCid?, title, body, tags }`
- `POST /api/v1/publications/:hash/reopen-request` — body `{ requesterAddress, txHash? }`;
  409 si ya existe `(contentHash, requesterAddress)`
- `POST /api/v1/publications/:hash/claim-retroactive` — body
  `{ validatorAddress, netDelta, txHash? }`; 409 si ya existe
  `(contentHash, validatorAddress, txHash)`

### `routes/validators.ts`
- `GET /api/v1/validators`
- `GET /api/v1/validators/:address`
- `GET /api/v1/validators/:address/history`
- `GET /api/v1/validators/:address/reputation-history`

Verificar: cada endpoint responde con datos sembrados manualmente en
PostgreSQL local (sin depender aún del indexador).

Commit: `feat(backend): endpoints de publicaciones y validadores`

---

## Tarea 3 — HU-7.3: Indexador de eventos

`services/indexer.ts` usa `watchContractEvent` de viem sobre los tres
contratos (direcciones desde `.env`, ABIs desde `docs/abis/`):

- `PublicationRegistered` → upsert en `publications`
- `ValidationSubmitted` → insert en `validations` (incluye `round`)
- `ConsensusReached` → upsert en `rounds` (`state`, `result`, `completed: true`),
  actualiza `consensusState` en `publications`; genera `Notification`
  (`type: "CONSENSUS_REACHED"`) para cada dirección con `Follow` o
  `Validation` sobre ese `contentHash`
- `ReputationUpdated` → update `reputationScore` en `validators`, `lastSyncBlock`
  (este evento cubre tanto los efectos sobre votantes como la recompensa por
  publicación y las predicciones del Sprint 6 — no requiere lógica distinta)
- `ReopenRequested` → insert en `reopen_requests`, incrementa
  `reopenRequestCount` en `publications`
- `VotingReopened` → update `currentRound`, resetea `reopenRequestCount` a 0,
  crea nueva fila en `rounds`; genera `Notification` (`type: "REOPENED"`)
  para cada dirección con `Follow` o `Validation` sobre ese `contentHash`
- `RetroactiveClaimed` → insert en `retroactive_claims`; genera
  `Notification` (`type: "RETROACTIVE_APPLIED"`) solo para el validador que
  reclamó

No es necesario indexar `PredictionSubmitted` (Sprint 6) en este sprint —
ver la nota al respecto en el prompt de Sprint 6.

Al arrancar (`index.ts`), procesar eventos históricos desde `deployBlock`
(leer de `blockchain/deployments/sepolia.json` o de una variable de entorno
`DEPLOY_BLOCK` para red local) hasta el bloque actual, y después suscribirse
en tiempo real.

Verificar: con Hardhat Network local corriendo y el módulo Ignition
desplegado, publicar un artículo y votar desde un script de prueba —
comprobar que las tablas se actualizan sin intervención manual.

Commit: `feat(backend): indexador de eventos on-chain con generación de notificaciones`

---

## Tarea 4 — HU-7.5: Perfil enriquecido, favoritos, follow, notificaciones

`services/signature.ts`:
```typescript
import { verifyMessage } from "viem";

export async function verifyProfileSignature(
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`,
): Promise<boolean> {
  return verifyMessage({ address, message, signature });
}
```

### `routes/profile.ts`
- `GET /api/v1/profile/:address` — devuelve `displayName`, `avatarUrl` (nunca
  `email`)
- `PUT /api/v1/profile/:address` — body `{ displayName?, avatarUrl?, email?, signature, message }`;
  verifica con `verifyProfileSignature` que `message` fue firmado por
  `:address`; si no coincide → 403 `FORBIDDEN`; si coincide, upsert en
  `UserProfile`
- `GET /api/v1/profile/:address/favorites` — paginado
- `GET /api/v1/profile/:address/notifications` — paginado, incluye `read`

### `routes/favorites.ts`
- `POST /api/v1/favorites/:hash` — body `{ userAddress }`; 409 si ya existe
- `DELETE /api/v1/favorites/:hash` — body `{ userAddress }`

### En `routes/publications.ts`, añadir:
- `POST /api/v1/publications/:hash/follow` — body `{ userAddress }`
- `DELETE /api/v1/publications/:hash/follow` — body `{ userAddress }`

### `routes/notifications.ts`
- `PATCH /api/v1/notifications/:id/read` — marca `read: true`

Verificar: `PUT /api/v1/profile/:address` con una firma de una dirección
distinta a `:address` devuelve 403; con la firma correcta, persiste.

Commit: `feat(backend): perfil enriquecido con verificación personal_sign, favoritos, follow y notificaciones`

---

## Tarea 5 — Tests de integración

Vitest contra una base de datos real (no mocks, per Definition of Done).
Cubrir como mínimo:
- Creación y listado de publicaciones con filtros
- Rechazo de `PUT /profile/:address` con firma inválida
- Favoritos: crear, listar, duplicado (409), eliminar
- Notificaciones: marcar como leída
- Indexador: al menos un test que simule un evento y verifique el efecto en DB
  (puede usar un cliente Hardhat Network local en el pipeline de test)

Verificar: `npm test` pasa completo.

Commit: `test(backend): tests de integración con base de datos real`

---

## Criterio de éxito

- `docker compose up -d && npm run dev` sin errores
- `npx prisma migrate dev` aplica el esquema sin errores
- Todos los endpoints de HU-7.2 y HU-7.5 responden con datos reales de
  Hardhat Network local
- El indexador procesa el histórico desde `deployBlock` y genera
  notificaciones correctamente
- `npm test` pasa completo
```
