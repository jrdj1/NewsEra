# Fase 2 — Pruebas de Integración

## Objetivo

Validar que 2 o más componentes reales (no mockeados) funcionan correctamente juntos. Requiere infraestructura real levantada (`make postgres`, opcionalmente `make hardhat`).

## Alcance concreto

### backend/ (ya existe una base — se amplía, no se sustituye)
`backend/test/integration.test.ts` ya cubre publicaciones, usuarios, perfil enriquecido, favoritos y notificaciones contra PostgreSQL real. Huecos a cerrar en esta fase:
- `POST /api/v1/publications/:hash/reopen-request` y `POST /api/v1/publications/:hash/claim-retroactive` — no aparecen cubiertos en el archivo actual.
- `POST /api/v1/sync/events` (HU-7.6) — autenticación con `SERVICE_TOKEN`, incluyendo el camino `401 UNAUTHORIZED`.
- `GET /api/v1/validators/:address/activity` y `/reputation-history` — verificar que el ledger de `ReputationEvent` se lee correctamente.

### blockchain ↔ backend (indexador)
Prueba de integración real evento→BD: desplegar contratos en Hardhat local, emitir un evento real (`PublicationRegistered`, `ConsensusReached`) y verificar que el indexador del backend (corriendo contra ese nodo) refleja el estado correcto en PostgreSQL — sin usar el seed script, con una transacción ad hoc dentro del propio test.

### frontend/ (integración de hooks, sin backend real)
Con `msw` (Mock Service Worker) o un mock de `fetch` a nivel de módulo: verificar que un hook compuesto (p. ej. `usePublications` + paginación) y su consumidor reaccionan correctamente a distintas respuestas de la API (éxito, error, vacío) — sigue sin ser un test de UI en navegador real, pero sí cubre la integración hook↔cliente-API↔estado de react-query.

## Criterios de éxito

- [ ] `make postgres && cd backend && npm test` → 100% verde, incluyendo los endpoints nuevos listados arriba.
- [ ] Prueba indexador↔chain: al menos 1 test verifica que un evento on-chain real produce la fila esperada en PostgreSQL (con timeout explícito, no un `sleep` arbitrario).
- [ ] `cd frontend && npx vitest run` (incluye los tests de Fase 1) sigue en verde con los nuevos tests de integración de hooks añadidos.
- [ ] Ningún test de esta fase usa mocks para las piezas que se están integrando (si se mockea la BD, no es un test de integración backend↔BD).
