# Sprint 6 — Reputación (II): recompensa por publicación y acceso meritocrático

Prompt generado a partir del diseño acordado con el autor del TFG y documentado
en `CLAUDE.md` (§Sprint 6) y en la memoria
(`D:\TFG-NewsEra\TFG-TFM_EPS\contenido\capitulos\desarrollo.tex`, subsecciones
"Recompensa por publicación" y "Predicciones: acceso meritocrático sin
publicar", dentro de `ValidationRegistry`).

Sprints 0–5 ya completos (contratos, tests, Ignition, Slither, ABIs
exportados). Este sprint amplía `ValidationRegistry` — no lo reescribe — antes
de pasar al backend (Sprint 7).

---

```
Implementa el Sprint 6 de NewsEra: amplía ValidationRegistry para que la
reputación también se gane publicando contenido veraz, y añade una vía de
acceso a validador sin necesidad de publicar ni de bootstrapping manual del
administrador.

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\blockchain\`. Sprints 0-5 completos:
PublicationRegistry, ValidationRegistry (multironda, reapertura, reputación
retroactiva) y ReputationSystem (AccessControl, VALIDATOR_ROLE) ya
implementados y testeados (75 tests pasando). Este sprint NO reescribe estos
contratos, los amplía.

## Diseño acordado (no reabrir esta discusión, solo implementar)

**Recompensa por publicación:** la primera vez que la ronda de un artículo
alcanza DEFINITIVE, el autor (leído de
`PublicationRegistry.getPublication(contentHash).author`) recibe un efecto
reputacional:
- `TRUE` → `+PUBLISH_REPUTATION_REWARD` (+8)
- `UNVERIFIABLE` → `-PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE` (−8)
- `FALSE` → `-PUBLISH_REPUTATION_PENALTY_FALSE` (−15)
- `DISPUTED` → sin efecto

Se aplica una sola vez por artículo (reaperturas posteriores no lo
reevalúan) y en el mismo punto donde ya se resuelven los efectos de los
votantes — sin recorrido adicional, coste de gas constante (un único autor).

**Predicciones (acceso meritocrático sin publicar):** dirección con
`canValidate(msg.sender) == false` puede predecir el resultado de un
artículo `PENDING` sin que cuente para el quórum. Se resuelve
**automáticamente** (no *pull*, a diferencia de la reputación retroactiva) en
el mismo momento en que su ronda alcanza DEFINITIVE, junto con los votantes
reales: acierto `+PREDICTION_REWARD` (+1), fallo `-PREDICTION_PENALTY` (−1),
`DISPUTED` sin efecto.

**Por qué la resolución de predicciones es automática y no `pull`:** si el
propio predictor decidiera cuándo reclamar, nunca reclamaría sus fallos (el
suelo de reputación en 0 ya protege a las cuentas nuevas de perder lo que no
tienen), convirtiendo el ±1 simétrico en una recompensa unilateral y
reabriendo el problema de adivinar sin coste que el umbral mínimo de
reputación existe para impedir. Al resolverse junto con los votantes reales
de la misma ronda —conjunto acotado, del mismo orden que `quorumThreshold`—
se cierra esa vía sin reintroducir el coste de gas no acotado que motivó el
modelo `pull` para la reputación retroactiva multironda.

---

## Tarea 1 — HU-6.1: Recompensa/penalización por publicación

En `ValidationRegistry.sol`:

1. Añadir dependencia de solo lectura hacia `PublicationRegistry`: nuevo
   parámetro `address publicationRegistry_` en el constructor, guardado como
   `IPublicationRegistry public immutable publicationRegistry` (definir la
   interfaz mínima `IPublicationRegistry { function getPublication(bytes32) external view returns (Publication memory); }`
   si no existe ya, o reutilizar el struct expuesto por `PublicationRegistry`).
2. Nuevo `mapping(bytes32 => bool) private _authorRewarded`.
3. En `_checkConsensus` (o donde se resuelve `DEFINITIVE`), tras aplicar los
   efectos de los votantes: si `!_authorRewarded[contentHash]`, marcar
   `_authorRewarded[contentHash] = true`, leer el autor con
   `publicationRegistry.getPublication(contentHash).author` y aplicar la
   recompensa/penalización según el `result` de la ronda (ver tabla arriba).
   `DISPUTED` no debe marcar `_authorRewarded` como `true` (para que si una
   ronda posterior sí alcanza `DEFINITIVE`, el autor reciba su efecto
   entonces).
4. Nuevas constantes: `PUBLISH_REPUTATION_REWARD = 8`,
   `PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE = 8`,
   `PUBLISH_REPUTATION_PENALTY_FALSE = 15`.

Commit: `feat(blockchain): recompensa/penalización de reputación por publicación`

---

## Tarea 2 — HU-6.2: Predicciones

En `ValidationRegistry.sol`:

1. Nuevo `submitPrediction(bytes32 contentHash, uint8 vote) external`:
   - Revert `NotEligibleForPrediction` si `reputationSystem.canValidate(msg.sender) == true`
   - Revert `VotingNotOpen` si el estado no es `PENDING`
   - Revert `AlreadyValidated` si la dirección ya predijo o votó ese
     `contentHash` (reutilizar el mismo mapping de control que `AlreadyValidated`,
     o uno paralelo si la separación de responsabilidades lo hace más claro)
   - Guardar la predicción y la ronda asociada; **no** incrementar
     `roundVoteCount` ni ningún contador usado en el cálculo de quórum/supermayoría
   - Emitir `PredictionSubmitted(bytes32 indexed contentHash, address indexed predictor, uint8 vote, uint256 round)`
2. En el mismo punto donde se resuelven los votantes reales de una ronda que
   alcanza `DEFINITIVE`, recorrer también los predictores de esa ronda
   (requiere una lista/array de predictores por `(contentHash, round)`,
   análoga a `getRoundVoters`) y aplicar:
   - Predicción coincide con `result` → `increaseReputation(predictor, PREDICTION_REWARD)` (+1)
   - No coincide → `decreaseReputation(predictor, PREDICTION_PENALTY)` (−1)
   - Si la ronda resuelve `DISPUTED`, sin efecto sobre los predictores
3. Nuevas constantes: `PREDICTION_REWARD = 1`, `PREDICTION_PENALTY = 1`.
4. Nuevo error `NotEligibleForPrediction`.

Commit: `feat(blockchain): submitPrediction — acceso meritocrático sin publicar`

---

## Tarea 3 — Actualizar módulo Ignition

En `ignition/modules/NewsEra.ts`, pasar la dirección desplegada de
`PublicationRegistry` como argumento adicional del constructor de
`ValidationRegistry` (el orden de despliegue ya es
PublicationRegistry → ReputationSystem → ValidationRegistry, así que la
dirección ya está disponible en ese punto del módulo).

Commit: `feat(blockchain): módulo Ignition pasa PublicationRegistry a ValidationRegistry`

---

## Tarea 4 — Tests

En `test/ValidationRegistry.ts` (o un archivo nuevo `test/ValidationRegistryReputacionII.ts`
si prefieres no mezclar con los tests existentes):

- Recompensa `+8` al autor cuando la ronda resuelve `TRUE`
- Penalización `−8` al autor cuando resuelve `UNVERIFIABLE`
- Penalización `−15` al autor cuando resuelve `FALSE`
- Sin efecto sobre el autor cuando resuelve `DISPUTED`
- La recompensa/penalización no se reaplica en una reapertura posterior del
  mismo artículo (votar de nuevo en la ronda 2 y comprobar que el autor no
  recibe un segundo efecto)
- `submitPrediction` revierte con `NotEligibleForPrediction` si el predictor
  ya tiene `canValidate == true`
- `submitPrediction` revierte con `VotingNotOpen` si el artículo no está `PENDING`
- `submitPrediction` revierte con `AlreadyValidated` si la dirección ya
  predijo o votó ese artículo
- Predicción correcta resuelta automáticamente al alcanzar `DEFINITIVE`, con
  `+1` de reputación, sin que el predictor tenga que llamar a ninguna función
  adicional
- Predicción incorrecta resuelta automáticamente con `−1`, igualmente sin
  intervención del predictor (verificar explícitamente que el efecto se
  aplica en la misma transacción que cierra la ronda, no requiere una
  llamada posterior)
- Una dirección que solo predice (nunca publica ni vota) puede acumular
  reputación a través de varios artículos hasta alcanzar
  `MIN_REPUTATION_TO_VALIDATE` y a partir de ahí usar `submitValidation`
  con normalidad
- Predicción sin efecto si la ronda resuelve `DISPUTED`
- Cobertura ≥ 80% mantenida tras la ampliación (`npx hardhat coverage`)

Commit: `test(blockchain): cobertura completa de recompensa por publicación y predicciones`

---

## Criterio de éxito

- Todos los tests nuevos y existentes pasan (`npx hardhat test`)
- Cobertura ≥ 80% mantenida
- Módulo Ignition actualizado y desplegable en red local
  (`npx hardhat ignition deploy ignition/modules/NewsEra.ts --network localhost`)
- `slither contracts/ --exclude-dependencies` sin *findings* High/Critical
  sobre el código ampliado

## Nota para el siguiente sprint

El evento `PredictionSubmitted` queda disponible pero el backend (Sprint 7)
no tiene por qué indexarlo en esta fase — las predicciones son un mecanismo
puramente on-chain y no forman parte del catálogo de datos (RD) definido en
la memoria. Indexarlo para mostrar un historial de predicciones en el
frontend es una posible extensión futura, no un requisito de este sprint.
```
