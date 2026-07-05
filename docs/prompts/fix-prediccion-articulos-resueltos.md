# Fix — Rediseño de `submitPrediction`: predecir sobre artículos ya resueltos

Corrección de diseño sobre `submitPrediction` (Sprint 6), documentada en
`CLAUDE.md` (§10, nota de corrección) y en la memoria
(`desarrollo.tex`, subsección "Predicciones: acceso guiado sin publicar").
No es un sprint nuevo — es una reescritura de una función ya entregada,
motivada por revisar el propósito original del mecanismo.

---

```
Reescribe submitPrediction en ValidationRegistry.sol: en vez de predecir
sobre un artículo PENDING (que se resuelve junto con los votantes reales al
alcanzar DEFINITIVE), ahora se predice sobre un artículo que YA es
DEFINITIVE, con resolución inmediata y síncrona en la misma transacción.

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\blockchain\`. Sprints 0-8 completos.

## Por qué cambia el diseño

El diseño original tenía un problema sin resolver: un predictor cuya ronda
resolvía DISPUTED se quedaba sin ninguna vía para recuperar su predicción,
a diferencia de un votante real (que sí puede beneficiarse después vía
claimRetroactiveReputation si una ronda posterior confirma o contradice su
voto). Al revisar el propósito real del mecanismo —una rampa de acceso
guiada para llegar a MIN_REPUTATION_TO_VALIDATE, no una simulación de voto
real bajo incertidumbre— se decidió que predecir sobre un artículo YA
resuelto (DEFINITIVE) es más simple, elimina el problema de origen (nunca
hay un DISPUTED que gestionar, porque solo se predice sobre lo ya cerrado
con éxito) y es coherente con la idea original: ejemplos ya confirmados,
respuesta inmediata, totalmente asíncrono respecto a cualquier votación real
en curso en la red.

**Importante — no es un fallo de seguridad a mitigar:** como el artículo ya
está resuelto públicamente en el momento de predecir, cualquiera puede
consultar la respuesta correcta antes de responder. Esto es intencional: el
mecanismo es una rampa de acceso deliberadamente accesible, no una prueba de
criterio. No añadas ningún mecanismo para "ocultar" la respuesta ni para
dificultar artificialmente la predicción — no protegería nada real (el dato
sigue siendo legible directamente del contrato) y contradice el propósito
acordado del mecanismo.

---

## Tarea 1 — Reescribir submitPrediction

En `contracts/ValidationRegistry.sol`:

1. Cambiar las precondiciones de `submitPrediction(bytes32 contentHash, uint8 vote)`:
   - Revert `NotEligibleForPrediction(msg.sender)` si `reputationSystem.canValidate(msg.sender) == true` (sin cambios)
   - Revert un nuevo error `PredictionTargetNotDefinitive(contentHash)` si
     `consensusState[contentHash] != ConsensusState.DEFINITIVE` (antes exigía
     `PENDING` — ahora exige justo lo contrario)
   - Revert un nuevo error `AlreadyPredicted(contentHash, msg.sender)` si
     `_hasPredicted[contentHash][msg.sender]` ya es `true` (antes se
     reutilizaba `AlreadyValidated`; usa un error propio porque ahora
     predecir y votar son conceptos completamente desacoplados)

2. Resolución inmediata dentro de la misma función:
   ```solidity
   function submitPrediction(bytes32 contentHash, uint8 vote) external {
       if (reputationSystem.canValidate(msg.sender))
           revert NotEligibleForPrediction(msg.sender);
       if (consensusState[contentHash] != ConsensusState.DEFINITIVE)
           revert PredictionTargetNotDefinitive(contentHash);
       if (_hasPredicted[contentHash][msg.sender])
           revert AlreadyPredicted(contentHash, msg.sender);

       VoteType guess   = VoteType(vote);
       uint256  round   = currentRound[contentHash];
       VoteType correct = rounds[contentHash][round].result;

       _hasPredicted[contentHash][msg.sender] = true;
       _prediction[contentHash][msg.sender]   = guess;

       emit PredictionSubmitted(contentHash, msg.sender, vote, round);

       if (guess == correct) {
           reputationSystem.increaseReputation(msg.sender, PREDICTION_REWARD);
       } else {
           reputationSystem.decreaseReputation(msg.sender, PREDICTION_PENALTY);
       }
   }
   ```

3. Eliminar código ahora muerto:
   - El bucle sobre `_roundPredictors` dentro de `_checkConsensus` (la
     resolución ya no ocurre ahí, ocurre dentro de `submitPrediction` mismo)
   - El mapping `_roundPredictors` completo (ya no se necesita agrupar
     predictores por ronda — cada predicción se resuelve sola, al momento)
   - Cualquier comentario que describa la resolución como "automática junto
     con los votantes reales"

4. Quitar `_hasPredicted` del guard de `submitValidation`:
   ```solidity
   // Antes:
   if (_hasVoted[contentHash][msg.sender] || _hasPredicted[contentHash][msg.sender])
       revert AlreadyValidated(contentHash, msg.sender);

   // Después:
   if (_hasVoted[contentHash][msg.sender])
       revert AlreadyValidated(contentHash, msg.sender);
   ```
   Justificación: predecir y votar ya no comparten ronda ni concepto —
   predecir es sobre algo ya cerrado, votar es sobre algo `PENDING`. Que
   alguien haya predicho sobre una ronda antigua de un artículo no debe
   impedirle votar de verdad si ese artículo se reabre más tarde y esa
   persona ya alcanzó `MIN_REPUTATION_TO_VALIDATE`.

5. Añadir los dos errores nuevos a la sección de `error` del contrato:
   `error PredictionTargetNotDefinitive(bytes32 contentHash);`
   `error AlreadyPredicted(bytes32 contentHash, address predictor);`
   Puedes eliminar `NotEligibleForPrediction` de la lista si prefieres
   consolidar, pero mantenlo — sigue siendo el error correcto para "aún
   puedes votar de verdad, no necesitas predecir".

Commit: `fix(blockchain): submitPrediction ahora predice sobre artículos ya DEFINITIVE, resolución inmediata`

---

## Tarea 2 — Reescribir los tests de predicción

En `test/ValidationRegistry.ts`, sustituir por completo el bloque
`describe("submitPrediction", ...)` existente (los tests actuales asumen el
diseño antiguo y ya no aplican):

- Revierte `NotEligibleForPrediction` si el predictor ya puede votar
  (`canValidate == true`)
- Revierte `PredictionTargetNotDefinitive` si el artículo está `PENDING`
- Revierte `PredictionTargetNotDefinitive` si el artículo está `DISPUTED`
- Predicción correcta sobre un artículo `DEFINITIVE` → `+1` de reputación
  **en la misma transacción** (comprobar el nuevo valor inmediatamente
  después del `await`, sin ninguna acción adicional)
- Predicción incorrecta sobre un artículo `DEFINITIVE` → `−1` de reputación,
  igual de inmediato
- Revierte `AlreadyPredicted` si la misma dirección intenta predecir dos
  veces sobre el mismo artículo
- Una dirección puede predecir sobre varios artículos `DEFINITIVE`
  distintos y acumular reputación en cada uno, hasta alcanzar
  `MIN_REPUTATION_TO_VALIDATE` y pasar a `submitValidation`
- Regresión del bug 3 cerrado: un artículo cuya ronda resolvió `DISPUTED` y
  luego se reabrió y alcanzó `DEFINITIVE` en una ronda posterior **sí**
  admite predicciones sobre esa ronda posterior ya `DEFINITIVE` (el
  problema original —quedarse sin resolución si tocaba una ronda
  `DISPUTED`— ya no puede ocurrir, porque nunca se predice sobre una ronda
  sin cerrar)
- Verificar que alguien que predijo sobre un artículo puede votar
  normalmente si ese artículo se reabre después y esa persona ya tiene
  reputación suficiente (confirma que se quitó correctamente el guard
  cruzado de `submitValidation`)

Eliminar o adaptar cualquier test que verificara la resolución "automática
junto con los votantes reales" o el comportamiento en rondas `DISPUTED`
(ya no aplica, esos escenarios no pueden ocurrir con el nuevo diseño).

Commit: `test(blockchain): reescribe tests de submitPrediction para el nuevo diseño`

---

## Tarea 3 — Frontend: página dedicada para empezar a predecir

El diseño nuevo (predecir sobre artículos ya resueltos) ya no encaja dentro
de `Article.tsx` en modo `PENDING` — necesita su propia entrada directa,
independiente del detalle de un artículo concreto.

### Nueva ruta `/practice`

- `frontend/src/pages/Practice.tsx` (nuevo), registrada en `App.tsx`.
- `usePredictableArticles()` (nuevo hook en `frontend/src/hooks/`): trae
  artículos con `consensusState === "DEFINITIVE"`
  (`usePublications({ state: "DEFINITIVE" })` reutilizando lo ya existente)
  y filtra en el cliente los que el usuario ya predijo (necesita saber qué
  ha predicho ya — si el backend no expone este dato porque las
  predicciones son puramente on-chain y no se indexan (ver nota del Sprint
  6), usa `useReadContract` en bucle o una llamada `multicall` para
  comprobar `hasPredicted(contentHash, address)` por artículo visible en la
  página actual; si ese getter no existe en el contrato, añádelo como
  función de consulta pública `hasPredicted(bytes32, address) external view returns (bool)`
  antes de continuar con el frontend).
- Por cada artículo listado: título, etiquetas, resultado ya fijado (visible
  sin problema, coherente con que no se oculta la respuesta), y tres
  botones TRUE / FALSE / UNVERIFIABLE que llaman a `submitPrediction`.
- Tras confirmar la transacción, mostrar el resultado inmediatamente
  (acertaste / fallaste) comparando en el propio cliente el voto elegido
  contra el `result` del artículo que ya tenías cargado — no hace falta
  esperar a ningún indexador, la respuesta ya la conocías antes de predecir.
- Cabecera de la página: reputación actual y progreso hacia
  `MIN_REPUTATION_TO_VALIDATE` (p. ej. "6 / 10 — te faltan 4 aciertos para
  poder votar de verdad"), usando `ReputationSystem.getReputation(address)`.
- Si la dirección conectada ya tiene `canValidate == true`, sustituir el
  listado por un aviso ("ya puedes votar de verdad en los artículos
  pendientes") en vez de ocultar la página sin más — es información útil,
  no un error.
- Sin cartera conectada: mensaje pidiendo conectar, sin listado (no se puede
  predecir sin dirección).

### Entrada directa (lo que pediste explícitamente)

- Añadir un enlace en `Header.tsx`, visible **solo** cuando hay cartera
  conectada y `canValidate == false`: p. ej. "Practicar predicciones" o
  "Empieza a ganar reputación", con un badge o estilo distintivo para que no
  pase desapercibido frente al resto de la navegación.
- Añadir también una llamada a la acción en `Feed.tsx` o `Profile.tsx` (el
  sitio donde un usuario nuevo con reputación insuficiente aterrizaría antes)
  que enlace a `/practice` — no dejar que dependa solo de que alguien
  descubra el enlace en la cabecera.

Commit: `feat(frontend): página /practice para predicciones sobre artículos resueltos, con entrada directa en Header y Feed`

---

## Tarea 4 — Actualizar documentación derivada

- `docs/ERS.md` — si en algún punto se documentó el comportamiento anterior
  de `submitPrediction` fuera de CLAUDE.md, actualizarlo igual que se hizo
  en la memoria y en CLAUDE.md
- Verificar que `docs/abis/ValidationRegistry.json` se regenera
  (`npm run export-abis`) tras compilar, ya que la firma de errores del
  contrato cambia (nuevos `PredictionTargetNotDefinitive` y
  `AlreadyPredicted`, aunque la firma de `submitPrediction` en sí no cambia)

Commit: `docs(blockchain): regenera ABIs tras el rediseño de submitPrediction`

---

## Criterio de éxito

- `npx hardhat test` pasa completo, sin ningún test del diseño antiguo
  sobreviviendo sin adaptar
- Cobertura ≥ 80% mantenida
- `npx hardhat compile` sin warnings sobre código muerto o mappings sin uso
  (confirmar que `_roundPredictors` se eliminó por completo, no solo su uso)
- `Article.tsx` ya no ofrece "predicción de práctica" en modo `PENDING`
  (ese flujo ya no existe en el contrato) — retirar ese bloque de UI si
  sigue presente
- Ruta `/practice` funcional: lista artículos `DEFINITIVE` no predichos
  aún por la dirección conectada, predice, y muestra acierto/fallo al
  instante
- Enlace directo a `/practice` visible en `Header.tsx` cuando
  `canValidate == false`, y llamada a la acción adicional en
  `Feed.tsx`/`Profile.tsx`
- `npm run build` (frontend) sin errores
```
