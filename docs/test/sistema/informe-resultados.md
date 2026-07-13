# Fase 3 — Pruebas de Sistema (End-to-End) — Informe de Resultados

**Fecha:** 2026-07-13

## 1. Qué se implementó

Nuevo archivo `backend/test/system.test.ts` (Vitest), independiente de `backend/test/integration.test.ts`
(Fase 2, no tocado) y de `backend/test/unit/` (Fase 1, no tocado). Nuevo script
`backend/package.json` → `"test:system": "vitest run test/system.test.ts"`.

### Diferencia deliberada con la Fase 2

`integration.test.ts` importa la app de Hono **en proceso** (`app.request(...)`) y llama a
`processHistoricalEvents(...)` **a mano** para indexar — es una prueba de integración de
componentes en el mismo proceso Node, no un flujo de sistema real. Por eso, antes de
ejecutarla, hay que parar el contenedor `newsera-backend` (su indexador en vivo compite por
las tablas que la suite trunca).

`system.test.ts`, en cambio, **no importa nada del código fuente del backend**. Habla:
- Por HTTP real (`fetch`) contra `http://localhost:3001`, el contenedor `newsera-backend` ya
  levantado, con su **indexador en vivo** (`watchContractEvent`) corriendo de verdad.
- Por JSON-RPC real (`viem`) contra `http://localhost:8545`, el nodo `newsera-hardhat`.

Las 3 capas (blockchain + backend + indexador) son procesos independientes reales, tal cual en
producción — por eso **no se para el contenedor del backend**: aquí es precisamente la pieza
bajo prueba, no un obstáculo. Tampoco se importa Prisma ni se trunca ninguna tabla: cada
ejecución genera cuentas (`generatePrivateKey`) y contenido (`Date.now()-Math.random()` en el
cuerpo del artículo) al vuelo, así que es segura de ejecutar contra una base de datos y una
cadena que ya tienen datos de sesiones anteriores (`make fresh-start`, otras suites, uso
manual) sin interferir con ellos ni necesitar aislamiento.

### Escenario principal (obligatorio, HU del `docs/test/sistema/informe.md`)

1. Cuentas nuevas generadas al vuelo (autor + 3 votantes), financiadas en ETH desde la cuenta
   deployer (`accounts[0]`, `DEFAULT_ADMIN_ROLE` en `ReputationSystem`) y los 3 votantes
   registrados con `registerValidator(address, 10)` — reputación exactamente el mínimo para
   validar, igual que ya hace `backend/test/integration.test.ts` (no se reutilizan cuentas del
   mnemonic ya usadas por `make fresh-start`, para no depender de qué reputación/votos previos
   tuvieran esas direcciones).
2. `registerPublication(contentHash)` real on-chain + `POST /api/v1/publications` real.
3. **Polling con timeout explícito** (no `sleep` fijo) hasta que
   `GET /api/v1/publications/:hash` refleja `consensusState: "PENDING"` — comparado además
   contra `ValidationRegistry.currentRound(contentHash) == 0` leído directamente del contrato.
4. 3 votos `TRUE` reales (`submitValidation`) → alcanza quórum (3) y supermayoría (100 % ≥
   66.67 %) → `ConsensusReached` (DEFINITIVE/TRUE).
5. Verificación cruzada on-chain vs backend, en cada aserción:
   - `consensusState`/`currentResult` del backend contra `ValidationRegistry.rounds(hash, round)`
     leído directamente del contrato (no solo "algún" DEFINITIVE — se comparan los mismos
     valores decodificados de ambas fuentes).
   - Reputación de los 3 votantes: `ReputationSystem.getReputation(voter) == 15` (10+5) on-chain
     y `GET /api/v1/validators/:address.reputationScore == 15` en backend, más el ledger
     (`GET /validators/:address/reputation-history`) con el motivo `VOTE_REWARD` y `delta: 5`.
   - Reputación del autor: `getReputation(author) == 8` on-chain (veredicto TRUE ⇒
     `PUBLISH_REPUTATION_REWARD`) y `reputationScore == 8` en backend, con el ledger
     (`reason: "PUBLISH_REWARD"`, `delta: 8`).
   - Notificación: al menos uno de los votantes (que ya tiene una `Validation` sobre ese
     `contentHash`, sin necesidad de `follow` explícito) recibe una `Notification` tipo
     `CONSENSUS_REACHED` — verificado vía `GET /api/v1/profile/:address/notifications`.

### Escenario secundario (opcional, cubierto)

Reapertura completa: ronda 0 (3 votos `TRUE` → DEFINITIVE), 3 direcciones nuevas con
reputación suficiente que **no han votado** solicitan `requestReopen` × 3 (`reopenThreshold`)
→ `VotingReopened` abre la ronda 1 (verificado `currentRound == 1` on-chain y en backend, con
`consensusState` vuelto a `PENDING`). Las mismas 3 direcciones votan `FALSE` en la ronda 1 →
nueva DEFINITIVE con veredicto **contrario** al de la ronda 0. Los 3 votantes originales de la
ronda 0 (que ganaron, `wasCorrect = true`) llaman a `claimRetroactiveReputation`: como la ronda
1 **contradice** su resultado, el contrato aplica `−RETROACTIVE_DELTA` (−1) neto — reputación
esperada `15 − 1 = 14`, verificada on-chain (`getReputation`) y en backend
(`reputationScore` y `GET /validators/:address/activity` con una entrada `RETROACTIVE_CLAIM`,
`netDelta: -1`, indexada por el evento `RetroactiveClaimed` real). También se compara el
historial de rondas expuesto por `GET /api/v1/publications/:hash` (`rounds[0].result === "TRUE"`,
`rounds[1].result === "FALSE"`, ambas `state: "DEFINITIVE"`, `completed: true`) contra la
lectura directa de `ValidationRegistry.rounds(hash, 1)`.

## 2. Comando ejecutado y resultado real

```
cd backend
npm run test:system
# equivalente: npx vitest run test/system.test.ts
```

Requiere el stack Docker completo levantado (`newsera-hardhat`, `newsera-backend` con su
indexador en vivo, `newsera-db`) — **no** requiere pararlos, a diferencia de la Fase 2.

**Resultado:** 1 archivo, 2 tests, **100 % verde**, ejecutado 3 veces consecutivas para
descartar flakiness (dado que el escenario depende del polling contra un indexador en vivo,
asíncrono por naturaleza) — estable en las 3 ejecuciones:

| Ejecución | Escenario principal | Escenario secundario (reapertura) | Total |
|---|---|---|---|
| 1 | 2.5 s | — (no incluido aún) | 2.9 s |
| 2 | 1.3 s | 24.0 s | 25.4 s |
| 3 | 1.4 s | 23.9 s | 25.3 s |

Se verificó además que, al parar el contenedor `newsera-backend` (para confirmar que
`system.test.ts` depende realmente del backend real y no de un mock), la suite falla con
`ECONNREFUSED 127.0.0.1:3001` — confirma que la prueba ejerce de verdad la pieza que dice
ejercer. Se reinició el contenedor a continuación y se re-verificó el verde.

También se ejecutó la suite completa de Fase 1+2
(`docker stop newsera-backend && cd backend && npx vitest run` — excluyendo `system.test.ts`,
que requiere el backend vivo) para confirmar que nada se rompió: **71/71 tests verdes**
(igual que al cierre de Fase 2), sin cambios en `integration.test.ts` ni en `test/unit/`.

## 3. Tiempo de ejecución — por qué el escenario secundario tarda ~24 s

El escenario principal tarda 1.3–2.5 s: el indexador en vivo del contenedor
(`watchContractEvent` sobre transporte HTTP) sondea la cadena a intervalos cortos, y todas las
transacciones de Hardhat Network se minan al instante (auto-mining), así que el polling del
test converge casi de inmediato tras la última transacción.

El escenario secundario tarda ~24 s porque encadena **muchas más transacciones reales y
secuenciales** que el principal (cada `await ... waitForTransactionReceipt` espera la
confirmación real antes de continuar, no hay paralelismo entre ellas para no complicar el
manejo de nonces de una misma wallet):
- 7 transferencias de fondos (autor + 3 votantes ronda 0 + 3 reaperturadores).
- 6 registros de validador (`registerValidator`).
- 1 publicación + 3 votos ronda 0.
- 3 `requestReopen` + 3 votos ronda 1.
- 3 `claimRetroactiveReputation`.

Sobre 26 transacciones reales encadenadas, con un polling adicional de varios segundos tras
cada hito (PENDING inicial, DEFINITIVE ronda 0, reapertura, DEFINITIVE ronda 1, reputación
tras cada reclamación), ~24 s es razonable para CI/desarrollo local y no indica ningún
problema — es la naturaleza de un escenario que deliberadamente ejercita **todo** el ciclo de
vida multironda con 3+ cuentas reales.

## 4. Qué queda fuera de esta fase (y por qué)

Conforme a `docs/test/informe-diseno.md` §5 y `docs/test/sistema/informe.md`: **no se
introduce automatización de navegador real (Playwright/Cypress)**. Esta suite verifica el
flujo de negocio completo a **nivel de API/proceso** (backend real por HTTP + Hardhat real por
JSON-RPC), no la interfaz de `frontend/` en un navegador. La UI (`frontend/`) tiene su propia
cobertura de tests unitarios/integración de hooks (Fases 1–2, con MSW), pero conducir la
aplicación React real en un navegador headless (clics, formularios, `MetaMask`/wallet real)
está fuera de alcance de este ciclo: introducir un runner de navegador es un cambio de
infraestructura mayor (nuevo framework, browsers headless, tiempos de CI mucho más largos)
para un prototipo de TFG, y ya estaba documentado como decisión de diseño antes de empezar
esta fase, no como una limitación descubierta a posteriori. Queda como trabajo futuro si se
necesita cobertura de UI real end-to-end.

Tampoco se prueban aquí los flujos de perfil enriquecido / favoritos / seguimiento (ya
cubiertos con datos reales en `integration.test.ts`, Fase 2) ni la carga a IPFS/Pinata (best
effort, sin cuenta real disponible en el entorno de desarrollo, ver notas de Sprint 8 en
`CLAUDE.md`) — el foco de esta fase es el ciclo publicar→indexar→validar→consenso→reputación
descrito en `docs/test/sistema/informe.md`, no una repetición de la cobertura ya alcanzada en
fases anteriores.

## 5. Criterios de éxito — estado

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Escenario principal completo pasa en verde de punta a punta, con transacciones reales confirmadas (no simuladas), contra un nodo Hardhat local | **Cumplido.** 2/2 tests verdes (principal + secundario), 3 ejecuciones consecutivas estables. Todas las transacciones son reales (`waitForTransactionReceipt` con `status: "success"` verificado explícitamente en los votos y en la reclamación retroactiva) contra el nodo Hardhat de `newsera-hardhat` ya desplegado con `NewsEraModule`. |
| 2 | Cada aserción compara el estado on-chain (lectura directa del contrato) contra el estado del backend (vía API) | **Cumplido.** Cada verificación clave (consenso, reputación de votantes, reputación del autor, ronda tras reapertura, reclamación retroactiva) lee el contrato directamente vía `publicClient.readContract`/`getReputation`/`rounds`/`currentRound` y lo compara explícitamente contra la respuesta HTTP del backend real — no se acepta ninguna de las dos fuentes de forma aislada. |
| 3 | Tiempo de ejecución razonable para CI/desarrollo local; si supera unos pocos minutos, documentarlo | **Cumplido.** ~1.3–2.5 s (principal) + ~24 s (secundario) ≈ 25–28 s en total, muy por debajo del umbral de "unos pocos minutos" — no requiere justificación adicional, pero se documenta igualmente el porqué del tiempo del escenario secundario en §3. |
| 4 | Se documenta explícitamente qué queda fuera (UI de navegador real) y por qué | **Cumplido.** Ver §4. |

## 6. Archivos modificados/creados

- `backend/test/system.test.ts` (nuevo) — 2 tests (`describe("sistema E2E — ...")`), ~420
  líneas, sin dependencias nuevas (usa `viem`, ya presente en `dependencies`).
- `backend/package.json` — nuevo script `"test:system": "vitest run test/system.test.ts"`
  (aditivo; no se tocó ningún script existente).
- `docs/test/sistema/informe-resultados.md` (este archivo).

No se modificó `backend/test/integration.test.ts` ni ningún archivo bajo `backend/test/unit/`
(Fases 1 y 2, respetadas sin tocar conforme a lo indicado).

## 7. Estado del entorno al finalizar

El stack Docker completo (`newsera-backend`, `newsera-db`, `newsera-hardhat`,
`newsera-frontend`) se dejó **levantado y healthy**, en el mismo estado en que se encontró.
El único contenedor detenido durante el trabajo fue `newsera-backend`, y solo de forma
temporal para (a) confirmar que `system.test.ts` depende realmente de él (ver §2) y (b)
re-ejecutar la suite completa de Fases 1+2 sin la condición de carrera ya documentada en
`docs/test/integracion/informe-resultados.md` §3 — se reinició con `docker start
newsera-backend` en ambos casos y se esperó a que su healthcheck volviera a `healthy` antes de
continuar.
