# Fase 1 — Pruebas Unitarias — Informe de Resultados

**Fecha:** Julio 2026

## Resumen

Los 3 criterios de alcance (backend, frontend, blockchain) se implementaron y verificaron
ejecutando los comandos reales indicados en `unitarias/informe.md`. Todos los criterios de
éxito se cumplen.

## Archivos nuevos

### backend/
- `backend/test/unit/publication.service.test.ts` — 18 tests
- `backend/test/unit/validator.service.test.ts` — 7 tests
- `backend/test/unit/profile.service.test.ts` — 10 tests
- `backend/test/unit/indexer.classify.test.ts` — 9 tests
- `backend/src/services/indexer.ts` — modificado: `classifyReputationEvent` se exporta
  (antes era una función interna no accesible desde tests) para poder testearla de forma
  aislada mockeando `publicClient.getTransactionReceipt`. No se cambió su lógica.

### frontend/
- `frontend/vitest.config.ts` — nuevo, config de Vitest dedicada con entorno `jsdom`
  (separada de `vite.config.ts` para no cargar el plugin de Tailwind v4 en los tests)
- `frontend/vitest.setup.ts` — nuevo, importa `@testing-library/jest-dom/vitest`
- `frontend/package.json` — añadidas devDependencies: `@testing-library/react`,
  `@testing-library/jest-dom`, `jsdom`
- `frontend/src/lib/errors.test.ts` — 4 tests (`translateError`)
- `frontend/src/lib/article.test.ts` — 6 tests (`composeArticleBody`)
- `frontend/src/lib/tagColor.test.ts` — 4 tests (`tagColor`)
- `frontend/src/hooks/useReputationStatus.test.ts` — 6 tests (wagmi mockeado con `vi.fn()`)

### blockchain/ (auditoría, no reescritura)
Se encontraron 3 huecos genuinos y se añadieron como `it()` puntuales, sin tocar ningún
test existente:
- `blockchain/test/ReputationSystem.ts` — 2 tests nuevos en la sección nueva
  "increaseReputation/decreaseReputation sobre direcciones no registradas": documentan que
  `increaseReputation`/`decreaseReputation` pueden operar sobre una dirección que nunca
  pasó por `registerValidator` (el camino real que sigue la recompensa de publicación de
  `ValidationRegistry`, que llama a `increaseReputation`/`decreaseReputation` sobre el
  autor sin que este esté nunca "registrado" como validador), y que `canValidate` puede
  volverse `true` por esa vía — la resistencia Sybil depende solo del umbral de reputación,
  no del flag `isRegisteredValidator`. No estaba cubierto explícitamente.
- `blockchain/test/ValidationRegistry.ts` — 1 test nuevo en la sección nueva "acoplamiento
  con PublicationRegistry": `submitValidation` no comprueba que el `contentHash` esté
  registrado en `PublicationRegistry` antes de aceptar votos, pero `_checkConsensus` sí
  necesita leer `getPublication(contentHash).author` la primera vez que una ronda alcanza
  `DEFINITIVE`. Si se vota sobre un hash nunca registrado en `PublicationRegistry`, la
  transacción del voto que dispara `DEFINITIVE` revierte por completo con
  `PublicationNotFound` (ni siquiera ese último voto queda registrado). No era un
  comportamiento cubierto por la suite existente.

No se forzaron tests artificiales sobre otros casos límite ya revisados (suelo de
reputación en 0, umbral exacto de `reopenThreshold`, `claimRetroactiveReputation` con cap,
predicciones): ya estaban cubiertos con detalle en la suite existente.

## Comandos ejecutados y resultado real

```
cd backend && npx vitest run test/unit
→ 4 test files, 44 tests, 44 passed, 0 failed (~2.3s)

cd frontend && npx vitest run
→ 4 test files, 20 tests, 20 passed, 0 failed (~5.0s)

cd blockchain && npx hardhat test
→ 93 passing (90 previos + 3 nuevos), 0 failing (~4-5s)

cd backend && npx tsc --noEmit
→ sin salida (limpio)

cd frontend && npx tsc -b
→ sin salida (limpio)
```

No se midió cobertura (`npx hardhat coverage` / `--coverage` de Vitest) en esta fase — no
era un criterio de éxito de Fase 1 (sí lo es de fases posteriores/informe consolidado si se
decide medirla).

## Criterios de éxito — verificación final

- [x] `cd backend && npx vitest run test/unit` → 100% verde, sin requerir Postgres levantado
      (todos los repositorios y `publicClient` están mockeados con `vi.fn()`; ninguna
      conexión real a base de datos ni a un nodo).
- [x] `cd frontend && npx vitest run` → 100% verde, sin requerir backend/blockchain reales
      (wagmi mockeado en el test del hook; `lib/*` son funciones puras).
- [x] `cd blockchain && npx hardhat test` → sigue en verde (93 tests: 90 previos + 3 nuevos
      de la auditoría de huecos).
- [x] `npx tsc -b` (backend: `tsc --noEmit`, sin project references configuradas; frontend:
      `tsc -b` real, con project references) limpio en ambos.
- [x] Ningún test nuevo depende de un puerto de red real: backend mockea `publicClient` y
      todos los repositorios; frontend mockea `wagmi` (ningún hook llega a golpear un RPC);
      blockchain usa exclusivamente el nodo Hardhat en memoria que ya gestiona
      `npx hardhat test` (igual que la suite previa, no es un puerto real).

## Notas para las siguientes fases

- `classifyReputationEvent` ahora es una exportación pública de `indexer.ts` — a tener en
  cuenta si Fase 2 (integración) reescribe parte del indexador; el cambio es mínimo
  (añadir `export`) y no afecta a `processLogs`/`processHistoricalEvents`, que no se
  tocaron.
- El hook `useReputationStatus.ts` fue el elegido para el test de hook con dependencias
  mockeables (en vez de, p. ej., `usePublications.ts`) porque encapsula tanto lecturas
  (`useReadContract` × 2) como una suscripción a eventos (`useWatchContractEvent`) en un
  único hook pequeño y autocontenido — cobertura más rica sin necesitar
  `QueryClientProvider`/`WagmiProvider` reales.
