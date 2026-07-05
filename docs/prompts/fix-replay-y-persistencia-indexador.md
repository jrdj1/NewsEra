# Fix — Protección anti-replay en edición de perfil + persistencia del indexador en vivo

Prompt de corrección de dos bugs detectados en revisión de código de los
Sprints 7-8, ya documentados en `docs/ERS.md` §5 (discrepancias) como D6 y D7.
No es un sprint nuevo — son correcciones puntuales sobre código ya entregado.

---

```
Corrige dos bugs en el backend de NewsEra detectados en revisión de código.
No son features nuevas, son correcciones sobre código ya implementado en
Sprint 7.

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\backend\`. Sprints 0-8 completos.

---

## Bug 1 — La protección anti-replay del perfil es solo apariencia

**Síntoma:** al editar el perfil, el frontend firma
`JSON.stringify({ displayName, avatarUrl, email, timestamp: Date.now() })`
con `personal_sign` (`Profile.tsx`, función `handleSave`). El campo
`timestamp` sugiere que se pensó en evitar ataques de repetición, pero el
backend (`src/services/profile.service.ts`, método `update`) solo verifica
que la firma corresponda a la dirección — nunca parsea ni valida el
`timestamp` del mensaje.

**Consecuencia:** cualquiera que capture una petición
`PUT /api/v1/profile/:address` válida antigua (firma + mensaje) puede
reenviarla en cualquier momento posterior y el backend la aceptará como si
fuera una edición nueva, revirtiendo el perfil a esos valores antiguos.

### Corrección

En `src/services/profile.service.ts`, método `update`:

1. Tras verificar la firma con `verifyProfileSignature`, parsear `message`
   como JSON y extraer `timestamp`.
2. Definir una ventana de frescura razonable — usar `PROFILE_SIGNATURE_MAX_AGE_MS`
   (constante, 5 minutos = `5 * 60 * 1000`) en un archivo de constantes
   compartido o directamente en el servicio.
3. Rechazar con `AppError("FORBIDDEN", "La firma ha caducado, vuelve a
   firmar")` si:
   - `message` no es JSON válido o no tiene campo `timestamp` numérico
   - `Date.now() - timestamp > PROFILE_SIGNATURE_MAX_AGE_MS` (mensaje demasiado antiguo)
   - `timestamp - Date.now() > 60_000` (mensaje con fecha futura más allá de
     un margen de 1 minuto para tolerar desfases de reloj del cliente)
4. Reutilizar el código de error `FORBIDDEN` (403) ya existente — no añadir
   un código nuevo (evitar repetir la discrepancia D5 de `UNAUTHORIZED`).

No cambiar nada en el frontend: `Profile.tsx` ya envía `timestamp`, el
problema es exclusivamente que el backend no lo usa.

### Tests (`backend/test/integration.test.ts` o archivo nuevo)

- Firma válida con `timestamp` de hace 10 minutos → rechazada con 403
- Firma válida con `timestamp` de hace 2 minutos → aceptada
- Firma válida con `timestamp` 2 minutos en el futuro → rechazada con 403
- Firma válida con `timestamp` dentro del margen de tolerancia de reloj
  (30 segundos en el futuro) → aceptada
- `message` sin campo `timestamp` o no parseable como JSON → rechazada con 403
- Reenviar exactamente la misma petición (firma + mensaje) que ya se aceptó
  hace más de 5 minutos → rechazada (regresión del bug original)

Commit: `fix(backend): valida frescura del timestamp en la firma de edición de perfil`

---

## Bug 4 — El indexador no persiste su progreso mientras escucha eventos en vivo

**Síntoma:** `src/services/indexer.ts` mantiene `lastProcessedBlock` como
variable en memoria. `processHistoricalEvents` sí lo persiste en
`IndexerState` al terminar el procesado histórico inicial, pero
`watchLiveEvents` → `processLogs` solo actualiza la variable en memoria, sin
escribir nunca en `IndexerState` mientras el proceso sigue vivo escuchando
eventos nuevos.

**Consecuencia:** si el backend se reinicia tras llevar un tiempo en marcha,
`loadLastProcessedBlock()` lee un valor persistido desactualizado (el de la
última vez que se hizo el catch-up histórico) y reprocesa un tramo de
eventos que ya se habían procesado en vivo. No es incorrecto — todas las
escrituras del indexador ya son idempotentes (`upsert`, ver comentarios
existentes en los repositorios) — pero es trabajo repetido innecesario, y en
Sepolia (donde la cadena no se resetea nunca, a diferencia de Hardhat
Network local) ese tramo puede ser arbitrariamente grande.

### Corrección

En `src/services/indexer.ts`, función `processLogs`:

1. Mover la persistencia de `lastProcessedBlock` desde el final de
   `processHistoricalEvents` a dentro de `processLogs` mismo, para que se
   ejecute tanto en el catch-up histórico como en cada lote de eventos en
   vivo.
2. Al final de `processLogs`, si `lastProcessedBlock` avanzó respecto al
   valor con el que empezó la función, llamar a
   `indexerStateRepository.setLastProcessedBlock(lastProcessedBlock)`.
3. `processHistoricalEvents` puede seguir llamando a
   `indexerStateRepository.setLastProcessedBlock` al final por claridad, pero
   ya no es la única vía — no debe romper nada si se llama dos veces con el
   mismo valor (la escritura es idempotente por naturaleza, es un `UPDATE`
   simple sobre una fila con `id: 1`).
4. No añadir *debounce* ni limitar la frecuencia de escritura — con el
   volumen de eventos esperado en este prototipo, escribir una fila tras
   cada lote no supone un problema de rendimiento; prioriza la corrección
   sobre la optimización prematura.

### Tests

- Simular un evento en vivo (`watchContractEvent` o invocar `processLogs`
  directamente con un log de prueba) y comprobar que
  `indexerStateRepository.getLastProcessedBlock()` refleja el bloque de ese
  evento inmediatamente después, sin esperar a un reinicio
- Verificar que `processHistoricalEvents` seguido de `processLogs` (simulando
  un evento en vivo posterior) deja `IndexerState.lastProcessedBlock` en el
  bloque más reciente de los dos, no en el del catch-up histórico

Commit: `fix(backend): persiste lastProcessedBlock en cada lote de eventos, no solo en el catch-up histórico`

---

## Criterio de éxito

- Ambos bugs cubiertos con tests que fallarían sin la corrección (verificar
  primero que fallan contra el código actual, si es posible, antes de aplicar
  el fix)
- `npm test` pasa completo (requiere `make postgres` y `make hardhat` +
  `make deploy-local` corriendo, ver nota sobre el entorno local más abajo)
- `npx tsc --noEmit` sin errores
- Actualizar `docs/ERS.md` §5: marcar D6 y D7 como **Resuelto** (añadir estas
  dos entradas si no existen aún con esos números) y replicar en `CLAUDE.md`

## Nota sobre el entorno local

Antes de ejecutar `npm test`, comprobar que el nodo Hardhat de Docker tiene
los contratos realmente desplegados (`eth_getCode` sobre las direcciones de
`backend/.env` no debe devolver `0x`). Si el contenedor se reinició sin
volver a desplegar, ejecutar `make deploy-local` primero y actualizar
`backend/.env` si las direcciones cambiaron.
```
