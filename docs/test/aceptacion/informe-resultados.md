# Fase 4 — Pruebas de Aceptación (RNF y Estrés) — Informe de Resultados

**Fecha de ejecución:** 2026-07-13
**Rama:** `develop`
**Alcance:** ver `docs/test/aceptacion/informe.md`. No se han tocado archivos de las Fases 1–3.

---

## 1. RNF 3/4 — Sin claves privadas fuera de la cartera del usuario / el backend no firma transacciones

**Procedimiento:** grep de patrones de manejo/firma de clave privada en el runtime de producción (`backend/src`, `frontend/src`).

```bash
# backend/src
grep -rn "privateKey|PRIVATE_KEY|signTransaction|createWalletClient.*account|toAccount(|privateKeyToAccount" backend/src
→ No matches found

# frontend/src
grep -rn "privateKey|PRIVATE_KEY|signTransaction|privateKeyToAccount" frontend/src
→ No matches found
```

**Verificación adicional (lectura del cliente viem del backend):** `backend/src/lib/viem.ts` solo instancia
`createPublicClient` (viem, cliente de solo lectura). No existe ningún `createWalletClient`, `account` ni
mecanismo de firma en todo `backend/src`.

```ts
export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
  cacheTime: 0,
});
```

**Único hallazgo de `PRIVATE_KEY` en el repo:** `blockchain/hardhat.config.ts` (variable de entorno para firmar
despliegues en Sepolia) y `blockchain/scripts/seed.ts` (siembra de datos de desarrollo vía cuentas del mnemonic
de Hardhat). Ambos son infraestructura de desarrollo/despliegue, no runtime de producción — explícitamente
fuera del alcance de esta verificación (igual que indica `docs/test/aceptacion/informe.md`).

**Resultado: CUMPLE.** 0 coincidencias de manejo/firma de clave privada en `backend/src` y `frontend/src`. El
backend es estructuralmente incapaz de firmar transacciones (no tiene wallet client ni cuenta configurada).

---

## 2. RNF 5 — Slither sin findings High/Critical

**Procedimiento:** lectura de `docs/reports/slither-report.md` (generado automáticamente por
`.github/workflows/slither.yml` en cada push a `main`/`develop` que toque `blockchain/contracts/**`).

**Estado del informe:** commit `testsha123`, fecha `2026-07-04T11:31:30Z`. Resumen de severidades reportadas:

| Severidad | Nº hallazgos | Categorías |
|---|---|---|
| High/Critical | **0** | — |
| Medium | 1 | `reentrancy-no-eth` (`claimRetroactiveReputation`) |
| Low | 8 | `calls-loop` (6), `reentrancy-benign` (1), `reentrancy-events` (1) |
| Informational | 4 | `pragma`, `solc-version`, `missing-inheritance` (×2) |

El único finding Medium (`reentrancy-no-eth` en `claimRetroactiveReputation`) es un patrón conocido y mitigado:
las llamadas externas son a `ReputationSystem` (mismo sistema, protegido por `AccessControl`/`VALIDATOR_ROLE`,
sin lógica de fallback ni ETH transferido), y la escritura de estado que Slither señala como posterior a la
llamada (`_retroLastRound`, `_retroNegative`, `_retroPositive`) ya fue corregida en Sprint 5 (HU-5.0) para usar
`latestRound + 1`; no hay una superficie de reentrancy explotable con transferencia de fondos, coherente con
el nombre de la categoría (`-no-eth`).

**Nota sobre vigencia:** el informe es del `2026-07-04`, y el árbol de contratos no ha cambiado desde entonces
(`git log -- blockchain/contracts` no muestra commits posteriores a esa fecha en esta rama en el momento de
esta verificación). El informe sigue siendo representativo del estado actual de los contratos.

**Resultado: CUMPLE.** 0 findings High/Critical, confirmado por lectura directa del informe versionado.

---

## 3. RNF 6 — Control de acceso siempre vía `AccessControl`

**Procedimiento:** nuevo archivo de test `blockchain/test/AccessControl.acceptance.ts` (no se ha tocado
`blockchain/test/ReputationSystem.ts` de Fase 1, que ya cubre el caso de forma genérica con `.to.be.reverted`).
Este archivo añade una verificación explícita: confirma que el revert es específicamente el error propio de
OpenZeppelin AccessControl (`AccessControlUnauthorizedAccount`) con la dirección y el rol exactos codificados
en los argumentos del error — evidencia de que el control de acceso es el mecanismo de roles de AccessControl
y no una comprobación ad-hoc que por casualidad también revierte.

```bash
cd blockchain && npx hardhat test test/AccessControl.acceptance.ts
```

```
  RNF 6 — control de acceso via AccessControl (ReputationSystem)
    ✔ una direccion sin VALIDATOR_ROLE no puede llamar a increaseReputation (revierte con AccessControlUnauthorizedAccount)
    ✔ una direccion sin VALIDATOR_ROLE no puede llamar a decreaseReputation (revierte con AccessControlUnauthorizedAccount)
    ✔ tras concederle VALIDATOR_ROLE, la misma direccion si puede llamar a increaseReputation/decreaseReputation
    ✔ una direccion sin DEFAULT_ADMIN_ROLE no puede conceder VALIDATOR_ROLE a si misma

  4 passing (1s)
```

Suite completa de blockchain tras la incorporación (confirmando que no se rompió nada de fases previas):

```bash
cd blockchain && npx hardhat test
```

```
  97 passing (4s)
```

(93 tests preexistentes de Fase 1 + 4 tests nuevos de esta fase = 97.)

**Resultado: CUMPLE**, con evidencia de test automatizado explícito y reproducible.

---

## 4. RNF 8 — Inmutabilidad (sin funciones de borrado/edición)

**Procedimiento:** auditoría manual de las interfaces públicas de los 3 contratos
(`blockchain/contracts/PublicationRegistry.sol`, `ReputationSystem.sol`, `ValidationRegistry.sol`), buscando
cualquier función `delete*`/`update*`/`edit*` sobre datos ya registrados.

```bash
grep -n "function " blockchain/contracts/*.sol
```

**`PublicationRegistry.sol`** — 2 funciones públicas:
- `registerPublication(bytes32)` — solo inserta si no existe (`revert PublicationAlreadyExists` si ya existe); no hay ruta de reescritura.
- `getPublication(bytes32)` — `view`, solo lectura.

**`ReputationSystem.sol`** — 5 funciones públicas:
- `registerValidator(address, uint256)` — solo inserta si no está registrado (`revert ValidatorAlreadyRegistered`).
- `increaseReputation` / `decreaseReputation` — modifican un contador agregado (`_reputation[validator]`), no un registro histórico; no hay función para alterar un evento o voto ya emitido.
- `getReputation` / `canValidate` / `isRegisteredValidator` — `view`, solo lectura.

**`ValidationRegistry.sol`** — funciones públicas relevantes: `submitValidation`, `submitPrediction`,
`requestReopen`, `claimRetroactiveReputation`, y consultas `view` (`getVote`, `getRoundVoters`, `hasVoted`,
`hasPredicted`). Ninguna permite alterar un voto ya emitido (`AlreadyValidated`/`AlreadyPredicted` lo impiden
explícitamente) ni borrar una ronda ya `completed`. `requestReopen` **no edita** la ronda existente: abre una
**ronda nueva** (`currentRound` se incrementa, `RoundInfo` de la ronda anterior queda inmutable con
`completed = true`), coherente con RD 9 del ERS ("Una vez `completed = true`, los campos `state` y `result` de
esa ronda son inmutables").

**Ningún `grep` de `function delete|function update|function edit` (case-insensitive) devuelve resultados** en
los 3 archivos:

```bash
grep -inE "function (delete|update|edit)" blockchain/contracts/*.sol
→ (sin resultados)
```

**Resultado: CUMPLE.** No existe ninguna función de borrado o edición sobre datos ya registrados en los 3
contratos; toda "corrección" de estado pasa por mecanismos aditivos explícitos ya diseñados (nueva ronda,
reclamación retroactiva con cap), nunca por mutación directa de un registro pasado.

---

## 5. RNF 14 / RI 5 — Estados de carga y error explícitos (checklist manual, no automatizable sin Playwright)

**Procedimiento:** lectura directa del código de 4 páginas principales de `frontend/src/pages/`, buscando
patrones ya establecidos en el proyecto (`isLoading`, `isError`, `LoadingState`, `ErrorState`, `EmptyState`,
estado de transacción `tx.status`). No se han generado capturas (sin navegador real en este agente, según lo
indicado en el encargo).

### `Feed.tsx` (`/noticias`)
```
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
const { data, isLoading, isError, refetch } = usePublications({ ... });
...
{isLoading && page === 1 && <LoadingState label="Cargando artículos..." />}
{isError && <ErrorState onRetry={() => refetch()} />}
{!isLoading && !isError && items.length === 0 && (
  <EmptyState message="No hay artículos que coincidan con este filtro todavía." />
)}
```
Los 3 estados (carga, error con reintento, vacío) están explícitos y son mutuamente excluyentes. **Cumple.**

### `Article.tsx` (`/article/:hash`)
```
const { data: publication, isLoading, isError, refetch } = usePublication(hash);
if (isLoading) return <LoadingState label="Cargando artículo..." />;
if (isError || !publication) {
  return <ErrorState message="No se encontró el artículo solicitado." onRetry={() => refetch()} />;
}
```
Guard temprano: nunca se renderiza el cuerpo de la página sin datos válidos. **Cumple.**

### `Publish.tsx` (`/publish`)
No depende de una consulta remota tipo lista (es un formulario con estado local + escritura on-chain), por lo
que el patrón relevante aquí es el estado de la transacción (RI 6) y el error de envío al backend, ambos
explícitos:
```
{tx.status !== "idle" && (
  <>
    {tx.status === "pending" && "Confirma la transacción en tu cartera..."}
    {tx.status === "confirming" && "Esperando confirmación en la blockchain..."}
    {tx.status === "confirmed" && !posting && "Transacción confirmada. Guardando en el servidor..."}
    {tx.status === "failed" && <span className="text-red-600...">{tx.errorMessage}</span>}
  </>
)}
{postError && <p className="text-sm text-red-600...">{postError}</p>}
```
Cubre los 4 estados de la transacción (pendiente/confirmando/confirmada/fallida) más el error de persistencia
en el backend tras la confirmación on-chain. Sin cartera conectada, la página muestra un estado explícito
("Conecta tu cartera para publicar contenido...") en vez de un formulario roto. **Cumple.**

### `Profile.tsx` (`/profile`)
Guard de conexión explícito:
```
if (!isConnected || !address) {
  return (<div>... Conecta tu cartera para ver tu perfil. <ConnectButton /></div>);
}
```
Las listas paginadas (validaciones, reaperturas, publicaciones, favoritos, reclamaciones retroactivas) usan
`EmptyState` con mensaje específico por pestaña:
```
<EmptyState message="No tienes reclamaciones retroactivas pendientes." />
<EmptyState message="Todavía no has votado ningún artículo." />
<EmptyState message="No has solicitado ninguna reapertura." />
<EmptyState message="Todavía no has publicado ningún artículo." />
<EmptyState message="No tienes artículos guardados en favoritos." />
```
**Hallazgo (no bloqueante, corregido posteriormente):** los hooks de datos remotos usados en `Profile.tsx`
(`useReputationHistory`, `useValidatorHistory`, `useReopenRequests`, `useActivity`, `usePublications`,
`useFavorites`) se desestructuraban solo por `data`, sin capturar ni renderizar `isLoading`/`isError` de cada
uno individualmente — inconsistencia de patrón frente a `Feed.tsx`/`Article.tsx`. No llegaba a incumplir RNF 14
en sentido estricto (nunca hubo pantalla en blanco), pero se documentó como hallazgo real.

**Corrección aplicada (fuera de Fase 4, a petición explícita tras el cierre de esta fase):** cada pestaña de
`Profile.tsx` (y el componente `RetroactiveClaims`) ahora desestructura también `isLoading`/`isError`/`refetch`
de su hook y renderiza `<LoadingState>`/`<ErrorState onRetry={...}>` antes de caer al `<EmptyState>` o al
listado, igual que `Feed.tsx`/`Article.tsx`. Verificado: `npx tsc -b` limpio, `npx vitest run` sigue en
25/25, `npm run build` correcto.

**Resultado global RNF 14 / RI 5: CUMPLE en las 4 páginas auditadas con el patrón completo
(loading + error + empty).**

---

## 6. RI 7 — Errores de revert traducidos a lenguaje natural

**Procedimiento:** comparación exhaustiva entre los `error X(...)` realmente declarados en los `.sol` de
`blockchain/contracts/` y las claves de `REVERT_MESSAGES` en `frontend/src/lib/errors.ts`.

**Errores declarados en los contratos:**
```bash
grep -n "error \w+(" blockchain/contracts/*.sol
```
```
ValidationRegistry.sol:   InsufficientReputation, AlreadyValidated, VotingNotOpen, ReopenNotAvailable,
                          AlreadyRequestedReopen, NothingToClaim, NotEligibleForPrediction,
                          PredictionTargetNotDefinitive, AlreadyPredicted
ReputationSystem.sol:     ValidatorAlreadyRegistered, ValidatorNotRegistered
PublicationRegistry.sol:  PublicationAlreadyExists, PublicationNotFound
```

**Comparación contra `REVERT_MESSAGES` (estado ANTES de esta fase):**

| Error del contrato | ¿Traducido? |
|---|---|
| `InsufficientReputation` | Sí |
| `AlreadyValidated` | Sí |
| `VotingNotOpen` | Sí |
| `ReopenNotAvailable` | Sí |
| `AlreadyRequestedReopen` | Sí |
| `NothingToClaim` | Sí |
| `NotEligibleForPrediction` | Sí |
| `PublicationAlreadyExists` | Sí |
| `PublicationNotFound` | Sí |
| **`PredictionTargetNotDefinitive`** | **No — hueco encontrado** |
| **`AlreadyPredicted`** | **No — hueco encontrado** |
| `ValidatorAlreadyRegistered` | No — pero es un error de `registerValidator`, función de administración manual (`onlyRole(DEFAULT_ADMIN_ROLE)`) sin superficie de UI en el frontend; no hay flujo de usuario final que pueda disparar este revert. |
| `ValidatorNotRegistered` | No declarado como revert alcanzable actualmente (no se encontró ningún `revert ValidatorNotRegistered(...)` en el cuerpo de `ReputationSystem.sol`; el error está definido pero no usado) — no es un hueco de traducción real. |

**Hallazgo real:** `PredictionTargetNotDefinitive` (revierte en `submitPrediction` si el artículo objetivo no
está `DEFINITIVE`) y `AlreadyPredicted` (revierte si la misma dirección predice dos veces sobre el mismo
artículo) son errores alcanzables desde la UI de predicción (`/validate`, `hideConsensus` mode) y no tenían
traducción — el usuario habría visto el mensaje crudo de Solidity vía el fallback genérico de
`translateError` ("Ha ocurrido un error inesperado..."), que aunque no es el revert crudo tampoco es
informativo sobre la causa real. Esto contradice el propósito de RI 7 más allá de su enumeración literal (que
tampoco los incluye — ver nota siguiente).

**Nota sobre el propio RI 7 del ERS:** la lista de "errores de revert conocidos" en `docs/ERS.md` (RI 7) —
`InsufficientReputation, AlreadyValidated, VotingNotOpen, ReopenNotAvailable, AlreadyRequestedReopen,
NothingToClaim` — es anterior a Sprint 6 (predicciones) y tampoco enumera `PredictionTargetNotDefinitive`,
`AlreadyPredicted`, `NotEligibleForPrediction`, `PublicationAlreadyExists` ni `PublicationNotFound`. La
especificación de RI 7 en el ERS está desactualizada respecto al código real desde Sprint 6; no se corrige el
ERS en esta fase (fuera de alcance de Fase 4), pero se deja constancia del hallazgo para el informe final.

**Corrección aplicada:** se añadieron las 2 traducciones que faltaban a
`frontend/src/lib/errors.ts`:
```ts
PredictionTargetNotDefinitive: "Todavía no puedes predecir sobre este artículo: su resultado no está fijado.",
AlreadyPredicted: "Ya has predicho sobre este artículo — no puedes hacerlo de nuevo.",
```
Verificado que el test de Fase 1 (`frontend/src/lib/errors.test.ts`, no modificado) sigue en verde tras el
cambio:
```bash
cd frontend && npx vitest run src/lib/errors.test.ts
```
```
✓ src/lib/errors.test.ts (4 tests)
Test Files  1 passed (1)
     Tests  4 passed (4)
```

**Resultado: HUECO ENCONTRADO Y CORREGIDO.** 2 de 13 errores personalizados alcanzables carecían de
traducción antes de esta fase; corregido sin tocar el test de Fase 1.

---

## 7. Prueba de estrés (`autocannon`)

**Umbral definido ANTES de ejecutar la prueba** (según `docs/test/aceptacion/informe.md`):
- **p95 de latencia < 500 ms**
- **0 errores 5xx** (y 0 timeouts)
- Carga: 50 conexiones concurrentes, 10 segundos, `GET /api/v1/publications?page=1&limit=10`

**Infraestructura:** `autocannon` instalado como devDependency de `backend/` (`npm install --save-dev
autocannon`, versión `^8.0.0` en `backend/package.json`). Ejecutado contra el backend real ya corriendo en
Docker (`newsera-backend`, healthy, puerto `3001`), con datos ya sembrados (`GET /api/v1/publications`
devuelve artículos reales — confirmado con `curl` antes de la prueba, ver más abajo).

```bash
curl -s "http://localhost:3001/api/v1/publications?page=1&limit=10"
→ {"items":[{"id":15,"contentHash":"0x90d86f...","title":"Artículo de prueba de reapertura", ...}, ...]}
```

**Comando ejecutado:**
```bash
cd backend && npx autocannon -c 50 -d 10 -m GET --json \
  "http://localhost:3001/api/v1/publications?page=1&limit=10"
```

**Resultado real (salida JSON de autocannon):**

| Métrica | Valor |
|---|---|
| Conexiones | 50 |
| Duración real | 10.11 s |
| Peticiones totales | 4500 |
| Throughput medio | ~450 req/s |
| Latencia p50 | 105 ms |
| Latencia p90 | 127 ms |
| **Latencia p97.5** | **164 ms** |
| Latencia p99 | 186 ms |
| Latencia p99.9 | 1175 ms (cola) |
| Latencia máxima | 1437 ms |
| **Errores** | **0** |
| **Timeouts** | **0** |
| **Respuestas no-2xx** | **0** |
| Respuestas 2xx | 4500 / 4500 |

autocannon no reporta el percentil 95 exacto por defecto (solo `p90` y `p97_5`); dado que `p90 = 127 ms` y
`p97_5 = 164 ms`, el p95 real se encuentra necesariamente entre ambos, muy por debajo del umbral de 500 ms.

**Comparación contra el umbral definido:**

| Umbral | Resultado | ¿Cumple? |
|---|---|---|
| p95 < 500 ms | p95 ∈ (127 ms, 164 ms) | **Sí** |
| 0 errores 5xx | 0 non-2xx, 0 errors | **Sí** |

**Resultado: CUMPLE**, con margen amplio (el percentil más cercano a p95 disponible, p97.5 = 164 ms, es menos
de un tercio del umbral). La cola de latencia (p99.9 = 1175 ms, máximo 1437 ms) sugiere algunas peticiones
puntuales más lentas bajo carga sostenida — posiblemente contención puntual de la pool de conexiones de
Prisma/Postgres — pero no afecta el percentil 95 ni genera errores; no se ajustó el umbral a posteriori.

---

## 8. Comprobación de no regresión (fuera del alcance de Fase 4, pero verificado por seguridad)

Siguiendo el patrón de Fase 2 (parar `newsera-backend` para tests de BD limpia, sin tocar el resto del stack):

```bash
docker stop newsera-backend
cd backend && npx vitest run test/integration.test.ts test/unit
```
```
Test Files  5 passed (5)
     Tests  71 passed (71)
```
```bash
docker start newsera-backend
# esperado hasta health: healthy (24s)
```

Suite completa de blockchain (incluyendo los 4 tests nuevos de RNF 6):
```bash
cd blockchain && npx hardhat test
```
```
97 passing (4s)
```

Frontend (`errors.test.ts`, tras el fix de RI 7):
```bash
cd frontend && npx vitest run src/lib/errors.test.ts
```
```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

Ningún test de fases anteriores se rompió.

---

## Resumen de criterios de éxito (`docs/test/aceptacion/informe.md`)

| Criterio | Estado |
|---|---|
| Cada RNF seleccionado tiene verificación con evidencia real (comando + salida) | **Cumplido** — RNF 3/4 (grep), RNF 5 (lectura de informe versionado), RNF 6 (4 tests nuevos, 97 en total), RNF 8 (auditoría de interfaces + grep), RI 7 (comparación exhaustiva + fix), RNF 14/RI 5 (checklist manual documentado) |
| La prueba de estrés tiene umbrales definidos antes de correrla | **Cumplido** — p95 < 500 ms, 0 errores 5xx, definidos en la sección 7 antes de ejecutar el comando |
| Resultado de estrés documentado con números reales | **Cumplido** — p50 105 ms, p90 127 ms, p97.5 164 ms, p99 186 ms, 4500 peticiones, 0 errores, ~450 req/s |
| RNF no automatizable documentado con procedimiento manual, no omitido | **Cumplido** — RNF 14/RI 5, checklist página por página en la sección 5, incluyendo el hallazgo no bloqueante en `Profile.tsx` |

## Archivos nuevos/modificados en esta fase

- `blockchain/test/AccessControl.acceptance.ts` (nuevo) — 4 tests RNF 6
- `frontend/src/lib/errors.ts` (modificado) — 2 traducciones añadidas (`PredictionTargetNotDefinitive`, `AlreadyPredicted`)
- `backend/package.json` / `backend/package-lock.json` — `autocannon` añadido como devDependency
- `docs/test/aceptacion/informe-resultados.md` (este archivo)

## Estado final del stack Docker

```
NAMES              STATUS
newsera-backend    Up (healthy)
newsera-frontend   Up (healthy)
newsera-db         Up (healthy — sin healthcheck propio, siempre "Up")
newsera-hardhat    Up (healthy)
```

Idéntico al estado de partida (4 contenedores arriba, `newsera-backend` healthy tras el reinicio puntual para
la comprobación de no regresión de la sección 8).
