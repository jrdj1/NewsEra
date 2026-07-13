# Fase 2 — Pruebas de Integración — Informe de Resultados

**Fecha:** 2026-07-13

## 1. Qué se implementó

### backend/ (`backend/test/integration.test.ts`, ampliado — no sustituido)

Se añadieron cuatro bloques `describe` nuevos al archivo existente (que ya cubría
publicaciones/usuarios/perfil/favoritos/notificaciones/indexador desde antes de esta fase):

1. **`reapertura y reclamación retroactiva (off-chain, HU-7.2)`**
   - `POST /api/v1/publications/:hash/reopen-request`: registro exitoso (201, fila real en
     `reopen_requests`), duplicado del mismo `requesterAddress` → 409, hash inexistente → 404.
   - `POST /api/v1/publications/:hash/claim-retroactive`: registro exitoso (201, fila real en
     `retroactive_claims` con `netDelta` correcto), mismo `txHash` duplicado → 409, hash
     inexistente → 404.

2. **`POST /api/v1/sync/events (HU-7.6, re-sincronización manual)`**
   - 401 sin cabecera `Authorization`.
   - 401 con token incorrecto.
   - 200 con el `SERVICE_TOKEN` correcto: se registra una publicación **directamente on-chain**
     (sin pasar por `POST /publications`) y se comprueba que la única forma de que la fila
     exista en Postgres es la re-sincronización disparada por este endpoint — verifica
     `fromBlock`/`processedUntil` en la respuesta y la fila resultante en `publications`.

3. **`actividad y ledger de reputación (GET /validators/:address/activity y /reputation-history)`**
   - Flujo real: 3 validadores registrados y financiados on-chain votan `TRUE` sobre un
     artículo hasta alcanzar `DEFINITIVE` (supermayoría 3/3), sin mocks.
   - `GET /validators/:address/activity` del autor: contiene la entrada `PUBLICATION`.
   - `GET /validators/:address/activity` de un votante: contiene la entrada `VALIDATION` con
     el voto correcto.
   - `GET /validators/:address/reputation-history`: contiene el evento `VOTE_REWARD` con
     `delta: 5` para el votante ganador, clasificado por el indexador a partir del recibo de
     la transacción real (`classifyReputationEvent`, ya cubierto unitariamente en Fase 1 con
     mocks; aquí se verifica contra una transacción real).

Se mantiene sin tocar el resto del archivo (tests de Fase 1 en `backend/test/unit/` no se
tocaron en absoluto, conforme a lo indicado).

### blockchain ↔ backend (indexador)

El archivo ya contenía un test de este tipo (`indexador > procesa PublicationRegistered y
ReputationUpdated...`, con `processHistoricalEvents` y aserciones sobre filas reales de
Postgres). Se mantiene y se refuerza indirectamente con el nuevo test de "actividad y ledger
de reputación" (§3), que además verifica el efecto de `ConsensusReached` (una transacción con
varios eventos correlacionados) — no solo un evento aislado. Ambos usan polling implícito vía
`processHistoricalEvents` con `waitForTransactionReceipt` explícito (no `sleep` arbitrario:
se espera la confirmación real de cada transacción antes de indexar).

### frontend/ (`frontend/src/hooks/usePublications.integration.test.tsx`, nuevo)

Se instaló `msw` (`^2.15.0`) como devDependency (`npm install -D msw` en `frontend/`). Se
escribió un test de integración de `usePublications` (hook compuesto: `useQuery` de
`@tanstack/react-query` + `api.get` de `src/lib/api.ts`, sin mockear ni `fetch` ni `api.ts`)
contra un servidor HTTP simulado con `setupServer` de `msw/node`:
- Éxito: la API responde 200 con publicaciones → el hook expone `data.items`/`data.total`.
- Vacío: la API responde 200 con `items: []` → estado vacío correcto, sin quedarse en loading.
- Error: la API responde 500 con `{ error: { code, message } }` → `isError` true y el mensaje
  de `ApiError` coincide con el de la API (verifica la traducción de errores de `api.ts`).
- Paginación: al cambiar `page` se dispara una nueva petición con la query string correcta
  (`page=2&limit=1`), y el hook refleja los datos de la nueva página.
- Filtros: `state`, `result` y `tags` se serializan correctamente en la query string real
  enviada por el hook.

No se mockea react-query, `api.ts` ni `fetch`: solo la respuesta HTTP está controlada por MSW,
que intercepta a nivel de red (undici/fetch de Node) — es la integración real
hook → cliente API → estado de react-query.

## 2. Comandos ejecutados y resultado real

```
make postgres   # ya estaba levantado junto con el resto del stack (make up / fresh-start previos)
cd backend && npm test
```
Resultado: **5 archivos, 71 tests, 100% verde** (incluye los 63 tests previos de Fase 1 +
integración base, más los 8 tests nuevos de esta fase). Ejecutado 2 veces consecutivas para
descartar flakiness — estable en ambas.

```
cd frontend && npx vitest run
```
Resultado: **5 archivos, 25 tests, 100% verde** (incluye los tests de Fase 1: `article.test.ts`,
`tagColor.test.ts`, `errors.test.ts`, `useReputationStatus.test.ts`, más los 5 tests nuevos de
integración de `usePublications`). Ejecutado 2 veces consecutivas — estable.

## 3. Bloqueo de infraestructura encontrado y su solución

El entorno tenía el stack Docker completo levantado (`newsera-backend`, `newsera-db`,
`newsera-hardhat`, `newsera-frontend`), incluyendo el contenedor del **backend real corriendo
su propio indexador en vivo** (`watchContractEvent`) contra el mismo nodo Hardhat y la misma
base de datos Postgres que usan los tests. Al añadir tests que emiten transacciones on-chain
reales y truncan las tablas en cada `beforeEach`, se producía una **condición de carrera**: el
indexador del contenedor procesaba eventos en vivo (p. ej. `ValidationSubmitted`) justo cuando
el test truncaba `publications`, provocando un error real
`Foreign key constraint violated on the constraint: validations_contentHash_fkey`.

Solución aplicada: `docker stop newsera-backend` antes de ejecutar `npm test` en `backend/`
(la suite de tests ya arranca su propia instancia de la app vía `app.request(...)` en proceso,
no necesita el contenedor del backend corriendo en paralelo). Al terminar, se hizo
`docker start newsera-backend` para dejar el stack tal y como se encontró. **Recomendación
para el futuro:** documentar en el README/Makefile que `make test-backend` (o el comando
equivalente) debe pararse el contenedor `backend` primero, o añadir un target dedicado
(`make stop-backend && cd backend && npm test`).

Un segundo problema, de causa relacionada pero distinta, apareció solo al ejecutar la suite
completa (no en aislamiento): dos tests nuevos capturaban `fromBlock` con
`await publicClient.getBlockNumber()` de forma **inclusiva** del bloque ya minado por el test
anterior de la misma suite. Como `getContractEvents({ fromBlock, toBlock })` trata `fromBlock`
como inclusivo, el test siguiente reprocesaba un evento ya gestionado por el test previo
contra una base de datos recién truncada, con dos síntomas:
- Un `ValidationSubmitted` reprocesado sin su `Publication` correspondiente → mismo error de
  FK que el del contenedor Docker (dos causas distintas, mismo síntoma).
- Un `ReputationUpdated` de "registro inicial" (10 de reputación) excluido del rango
  procesado porque el `fromBlock` se capturó *después* de la transacción `registerValidator`
  — el indexador calculó el delta de reputación contra una base de 0 en vez de 10,
  clasificando mal el efecto (`PUBLISH_REWARD` con `delta: 15` en vez de `VOTE_REWARD` con
  `delta: 5`).

Solución: capturar `fromBlock` como `(await publicClient.getBlockNumber()) + 1n` (excluye el
bloque ya minado por un test anterior) y, en el test de actividad/reputación, capturarlo
**antes** de la transacción `registerValidator` del votante (no solo antes de publicar), para
que el indexador reconstruya correctamente el reputationScore "antes" de cada evento. Ambos
cambios están documentados con comentarios en el propio archivo de test. No se introdujo
ningún workaround que oculte el problema (nada de `sleep`, nada de `skip`): es un fix real del
propio test.

## 4. Criterios de éxito — estado

| # | Criterio | Estado |
|---|----------|--------|
| 1 | `make postgres && cd backend && npm test` → 100% verde, incluyendo los endpoints nuevos | **Cumplido.** 71/71 tests verdes (ver §2). Nota: fue necesario parar el contenedor `newsera-backend` para evitar la condición de carrera del indexador en vivo (ver §3) — con `make postgres` en su acepción literal (solo Postgres, sin el resto del stack Docker) el criterio se cumple sin matices. |
| 2 | Al menos 1 test verifica que un evento on-chain real produce la fila esperada en Postgres, con timeout explícito | **Cumplido.** El test preexistente `indexador > procesa PublicationRegistered y ReputationUpdated...` y el nuevo test de "actividad y ledger de reputación" registran transacciones reales (`registerPublication`, `registerValidator`, `submitValidation` × 3) con `waitForTransactionReceipt` explícito (no `sleep` arbitrario) antes de invocar `processHistoricalEvents`, y verifican filas reales en `publications`/`validators`/`reputation_events`. |
| 3 | `cd frontend && npx vitest run` sigue en verde con los nuevos tests de hooks | **Cumplido.** 25/25 tests verdes (20 de Fase 1 + 5 nuevos de integración `usePublications`). |
| 4 | Ningún test de esta fase mockea la pieza que se está integrando | **Cumplido.** Backend: PostgreSQL real, Hardhat Network real, sin mocks de BD ni de blockchain. Frontend: `fetch`/`api.ts`/react-query reales; solo la respuesta HTTP está controlada por MSW (intercepta a nivel de red, no mockea el módulo `api.ts` ni el hook). |

## 5. Archivos modificados/creados

- `backend/test/integration.test.ts` (ampliado: +8 tests nuevos, +2 comentarios de fix de
  `fromBlock` sobre tests preexistentes).
- `frontend/src/hooks/usePublications.integration.test.tsx` (nuevo).
- `frontend/package.json` / `frontend/package-lock.json` (nueva devDependency: `msw@^2.15.0`).

## 6. Estado del entorno al finalizar

El stack Docker completo (`newsera-backend`, `newsera-db`, `newsera-hardhat`,
`newsera-frontend`) se dejó **levantado y en el mismo estado en que se encontró** (el
contenedor `backend`, parado temporalmente durante la ejecución de los tests para evitar la
condición de carrera de §3, se reinició al terminar con `docker start newsera-backend`).
