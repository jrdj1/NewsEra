# Fase 1 — Pruebas Unitarias

## Objetivo

Cubrir con tests unitarios (sin Docker, sin PostgreSQL real, sin nodo Hardhat corriendo) la lógica que hoy no tiene ninguna prueba aislada:

- **backend/**: capa de servicios (`src/services/*.service.ts`), que hoy solo se ejerce indirectamente vía `test/integration.test.ts` contra una BD real.
- **frontend/**: 0 tests existentes. Prioridad a lógica pura y hooks con dependencias mockeables (no requieren renderizar el árbol completo de la app).
- **blockchain/**: auditoría de huecos puntuales sobre la suite ya madura (no reescritura).

## Alcance concreto

### backend/ (Vitest + mocks manuales)
Nuevos archivos en `backend/test/unit/`, cada uno mockeando su capa de repositorios con `vi.fn()`:
- `publication.service.test.ts` — validación de `keccak256(body) == contentHash`, normalización de direcciones, paginación/filtros.
- `validator.service.test.ts` — cálculo de `accuracy`, clasificación ganada/perdida/sin resolver (DISPUTED nunca cuenta).
- `profile.service.test.ts` — verificación de firma `personal_sign` y ventana de frescura anti-replay (5 min).
- `indexer` — función pura `classifyReputationEvent` (clasificación VOTE/PUBLISH/RETROACTIVE/PREDICTION/REGISTERED por magnitud y eventos de la misma tx), extraíble y testeable sin conexión real a la chain.

### frontend/ (Vitest + Testing Library, nuevo)
Requiere añadir `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` como devDependencies y un `vitest.config.ts` con entorno `jsdom`. Nuevos archivos en `frontend/src/**/*.test.ts(x)` junto a cada módulo:
- `lib/errors.test.ts` — `translateError` traduce cada mensaje de revert conocido y cae al genérico en los desconocidos.
- `lib/article.test.ts` — `composeArticleBody` compone correctamente el cuerpo + enlaces + referencias.
- `lib/tagColor.test.ts` — determinismo del color asignado por etiqueta.
- `hooks/useReputationStatus.test.ts` (u otro hook similar sin dependencia de red real) — con `api`/`viem` mockeados.

### blockchain/ (Hardhat + Chai, auditoría)
Revisar `ValidationRegistry.ts` y `ReputationSystem.ts` en busca de casos límite no cubiertos explícitamente (p. ej. `decreaseReputation` cuando el resultado sería negativo — suelo en 0; `requestReopen` en el mismo bloque que se alcanza el umbral). Añadir solo los `it()` que falten; no tocar los existentes.

## Criterios de éxito

- [ ] `cd backend && npx vitest run test/unit` → 100% verde, sin requerir Postgres levantado.
- [ ] `cd frontend && npx vitest run` → 100% verde, sin requerir backend/blockchain reales.
- [ ] `cd blockchain && npx hardhat test` → sigue en verde (90 tests previos + los nuevos casos límite).
- [ ] `npx tsc -b` limpio en `backend/` y `frontend/`.
- [ ] Ningún test nuevo depende de un puerto de red real (Postgres 5432/5433, Hardhat 8545, backend 3001).
