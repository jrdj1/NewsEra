# Fase 3 — Pruebas de Sistema (End-to-End)

## Objetivo

Verificar al menos un flujo completo de negocio a través de las 3 capas reales (blockchain + backend + frontend/API), no solo de una capa aislada.

## Alcance concreto

**Nota de diseño:** no se introduce Playwright/Cypress en este ciclo (ver `docs/test/informe-diseno.md` §5). Las pruebas de sistema se implementan como un script/suite Node (Vitest o script standalone) que orquesta llamadas reales contra:
- Un nodo Hardhat local con los 3 contratos desplegados (reutilizando `blockchain/ignition/modules/NewsEra.ts`).
- El backend real corriendo contra ese nodo y una Postgres real (indexador activo).

### Escenario principal (obligatorio)
1. Una cuenta de prueba publica un artículo (`registerPublication` on-chain) y lo registra en el backend (`POST /api/v1/publications`).
2. El indexador refleja la publicación en PostgreSQL (`GET /api/v1/publications/:hash` devuelve `consensusState: "PENDING"`).
3. 3+ cuentas con reputación suficiente votan (`submitValidation`) hasta alcanzar quórum y supermayoría.
4. Se verifica que:
   - El evento `ConsensusReached` se refleja en el backend (`consensusState: "DEFINITIVE"`, `currentResult` correcto).
   - La reputación de los votantes se actualiza según el resultado (ganadores +5, resto −3).
   - El autor recibe el efecto de recompensa/penalización por publicación (+8/−8/−15 según el veredicto).
   - Se genera una `Notification` para cualquier dirección que siguiera el artículo.

### Escenario secundario (si el tiempo lo permite)
Reapertura: `requestReopen` × `reopenThreshold` → nueva ronda → `claimRetroactiveReputation` con delta correcto reflejado tanto on-chain como en el backend.

## Criterios de éxito

- [ ] El escenario principal completo pasa en verde de punta a punta (transacciones reales confirmadas, no simuladas) contra un nodo Hardhat local desplegado en el propio test/setup.
- [ ] Cada aserción compara el estado on-chain (lectura directa del contrato) contra el estado del backend (vía API), no solo uno de los dos — la prueba de sistema existe precisamente para detectar discrepancias entre ambos.
- [ ] Tiempo de ejecución razonable para CI/desarrollo local (documentar cuánto tarda; si supera unos pocos minutos, documentar por qué).
- [ ] Se documenta explícitamente qué queda fuera de esta fase (UI real en navegador) y por qué, para que no se lea como "cobertura E2E completa" cuando no lo es.
