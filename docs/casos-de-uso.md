# Catálogo de casos de uso detallados — NewsEra
## Anexo A · Versión 1.1

> Fuente canónica: Anexo A de la memoria del TFG (Jorge Rafael de Julián Vicedo, UA 2026).
> Los requisitos formales (RNF, RD, RI) se encuentran en [`docs/ERS.md`](ERS.md).

---

## A.1. FEAT 1. Gestión de cuenta

### UC 1 — Conectar cartera

**Actores:** Visitante.
**Precondiciones:** el actor dispone de una cartera Ethereum compatible (MetaMask u otra soportada por WalletConnect).

**Flujo principal:**
1. El actor pulsa el botón `ConnectButton` de RainbowKit, visible en la cabecera de toda la aplicación.
2. El sistema solicita la conexión a la cartera instalada en el navegador.
3. El actor autoriza la conexión desde su cartera.
4. El sistema obtiene la dirección activa mediante `useAccount()` de wagmi y desbloquea FEAT 1, FEAT 2 y FEAT 4.

**Flujos alternativos:**
- Si el actor no tiene ninguna cartera instalada, RainbowKit ofrece enlaces de instalación de carteras compatibles.
- Si el actor rechaza la conexión, el sistema permanece en el perfil público de solo lectura (FEAT 3).

**Postcondiciones:** la dirección activa queda disponible en toda la aplicación; no se realiza ninguna escritura on-chain.

---

### UC 2 — Actualizar / modificar datos del perfil

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor edita nombre, avatar o email en el formulario de perfil.
2. El sistema solicita al actor que firme un mensaje mediante `personal_sign` para demostrar la propiedad de la dirección.
3. El actor firma el mensaje desde su cartera — sin coste de gas, no es una transacción on-chain.
4. El backend verifica la firma contra la dirección declarada y persiste los cambios en la tabla `UserProfile`.

**Flujos alternativos:**
- Si la firma no corresponde a la dirección activa, el backend rechaza la actualización con error `403 FORBIDDEN`.
- El campo `email` es opcional; si se omite, no se activan notificaciones por correo.

**Postcondiciones:** el perfil enriquecido queda actualizado sin que se haya requerido contraseña ni transacción on-chain.

---

### UC 3 — Revisar artículos favoritos

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a su perfil y selecciona la pestaña de favoritos.
2. El sistema solicita `GET /api/v1/profile/:address/favorites`.
3. El sistema muestra el listado paginado de artículos guardados mediante UC 31.

**Flujos alternativos:** si no hay favoritos guardados, el sistema muestra un estado vacío.
**Postcondiciones:** ninguna escritura; el actor visualiza el listado.

---

### UC 4 — Revisar artículos publicados propios

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a su perfil y selecciona "Mis publicaciones".
2. El sistema solicita `GET /api/v1/publications?author=:address`.
3. El sistema muestra el listado con título, estado de consenso y fecha de cada artículo propio.

**Postcondiciones:** ninguna escritura.

---

### UC 5 — Revisar votaciones anteriores

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a su perfil y selecciona "Mis votaciones".
2. El sistema solicita `GET /api/v1/validators/:address/history`.
3. El sistema clasifica cada voto según el estado de la ronda: ganada (DEFINITIVE, opción coincide con el voto), perdida (DEFINITIVE, opción distinta) o sin resolver (DISPUTED o ronda aún PENDING).
4. El sistema muestra el porcentaje de aciertos (accuracy) junto al listado.

**Postcondiciones:** ninguna escritura; ninguna ronda DISPUTED se contabiliza como ganada ni perdida.

---

### UC 6 — Revisar reputación

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a su perfil.
2. El sistema invoca `ReputationSystem.getReputation(address)` mediante `useReadContract`.
3. El sistema muestra la puntuación actual.

**Postcondiciones:** lectura on-chain directa, sin escritura.

---

### UC 7 — Revisar evolución histórica de la reputación

**Actores:** Usuario con cartera conectada.
**Precondiciones:** el backend ha indexado al menos un evento `ReputationUpdated` para la dirección.

**Flujo principal:**
1. El actor accede a su perfil y selecciona "Evolución de reputación".
2. El sistema solicita `GET /api/v1/validators/:address/reputation-history` (serie temporal de variaciones indexadas por el backend a partir del evento `ReputationUpdated`).
3. El sistema representa la evolución en un gráfico o listado cronológico.

**Postcondiciones:** ninguna escritura.

---

### UC 8 — Reclamar reputación neta (retroactiva)

**Actores:** Usuario con cartera conectada.
**Precondiciones:** idénticas a UC 37 (punto de entrada diferente: listado del perfil en lugar del detalle del artículo).

**Flujo principal:** comparte el flujo íntegro con UC 37.
**Postcondiciones:** ver UC 37.

---

### UC 9 — Revisar solicitudes de reapertura realizadas

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a su perfil y selecciona "Solicitudes de reapertura".
2. El sistema solicita el listado de `ReopenRequest` cuyo `requesterAddress` coincide con la dirección activa.
3. El sistema muestra cada solicitud con el estado del artículo (pendiente de alcanzar el umbral / ronda ya reabierta).

**Postcondiciones:** ninguna escritura.

---

### UC 10 — Consultar notificaciones

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor abre el panel de notificaciones desde la cabecera.
2. El sistema solicita `GET /api/v1/profile/:address/notifications`.
3. El actor puede marcar una notificación como leída (`PATCH /api/v1/notifications/:id/read`).

**Flujos alternativos:** si no hay notificaciones nuevas, el sistema muestra un estado vacío.
**Postcondiciones:** al marcar como leída, `read` pasa a `true`; sin efecto on-chain.

---

### UC 11 — Desconectar cartera

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor pulsa "Desconectar" en el menú de cuenta.
2. El sistema invoca `disconnect()` de wagmi.
3. El sistema vuelve al perfil público (FEAT 3), bloqueando FEAT 1, FEAT 2 y FEAT 4.

**Postcondiciones:** la sesión de cartera se cierra en el cliente; ningún dato on-chain ni off-chain se modifica.

---

## A.2. FEAT 2. Publicar artículo

### UC 12 — Redactar artículo

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 1 completado.

**Flujo principal:**
1. El actor accede a `/publish`.
2. El actor completa el formulario siguiendo la plantilla estándar de redacción: título, cuerpo, etiquetas (UC 14), enlaces internos (UC 15) y referencias bibliográficas (UC 16).

**Postcondiciones:** el contenido queda en el estado del formulario, sin persistir todavía.

---

### UC 13 — Guardar borrador

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 12 en curso.

**Flujo principal:**
1. El actor pulsa "Guardar borrador".
2. El sistema persiste el contenido localmente (`localStorage`), sin subida a IPFS ni transacción on-chain.

**Flujos alternativos:** al reabrir `/publish`, el sistema recupera el último borrador guardado.
**Postcondiciones:** el borrador queda disponible para retomar la redacción; no genera ningún registro on-chain ni off-chain permanente.

---

### UC 14 — Etiquetar artículo por categoría/temática

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 12 en curso.

**Flujo principal:** el actor introduce una o varias etiquetas libres (`tags`) en el formulario de publicación.
**Postcondiciones:** las etiquetas se incluyen en el payload de UC 19 (campo `tags`).

---

### UC 15 — Enlazar otros artículos de NewsEra

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 12 en curso.

**Flujo principal:** el actor inserta un hipervínculo interno (`/article/:hash`) hacia otro artículo de NewsEra dentro del cuerpo del texto.
**Postcondiciones:** el hipervínculo forma parte del `body` y, por tanto, del `contentHash` calculado en UC 18; cualquier edición posterior del enlace altera el hash.

---

### UC 16 — Incluir referencias bibliográficas

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 12 en curso.

**Flujo principal:** el actor añade las fuentes citadas en la sección de referencias de la plantilla.
**Postcondiciones:** las referencias forman parte del `body` y del `contentHash`, igual que UC 15.

---

### UC 17 — Vista previa del artículo antes de confirmar

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 12 completado.

**Flujo principal:**
1. El actor pulsa "Vista previa".
2. El sistema renderiza el artículo con la plantilla final, tal como se mostrará una vez publicado.

**Postcondiciones:** ninguna escritura; el actor puede volver a editar o continuar a UC 18.

---

### UC 18 — Mostrar hash calculado antes de firmar

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 17 completado.

**Flujo principal:**
1. El sistema calcula `contentHash = keccak256(body)` con viem.
2. El sistema muestra el valor al actor antes de solicitar la firma de UC 19.

**Postcondiciones:** ninguna escritura; el hash mostrado debe coincidir con el que se registrará on-chain en UC 19.

---

### UC 19 — Confirmar publicación on-chain

**Actores:** Usuario con cartera conectada.
**Precondiciones:** el artículo ha sido redactado (UC 12), el actor ha revisado la vista previa (UC 17) y el `contentHash` calculado (UC 18).

**Flujo principal:**
1. El frontend calcula `contentHash = keccak256(body)` con viem.
2. El frontend sube el cuerpo del artículo a IPFS mediante la API de Pinata y obtiene el CID.
3. El actor firma la transacción `registerPublication(contentHash)` desde su cartera.
4. El sistema espera la confirmación on-chain mediante `useWaitForTransactionReceipt` y muestra su estado (Idle → Pending → Confirming → Confirmed / Failed).
5. Tras la confirmación, el frontend envía `POST /api/v1/publications` con `{contentHash, ipfsCid, title, body, tags}` al backend.
6. El indexador detecta el evento `PublicationRegistered` y actualiza la réplica off-chain.

**Flujos alternativos:**
- Si el `contentHash` ya existe, la transacción revierte con `PublicationAlreadyExists`; no se publica contenido duplicado, el borrador se conserva.
- Si el actor rechaza la firma, no se produce ningún cambio y el borrador (UC 13) se conserva.

**Postcondiciones:** el artículo queda registrado de forma inmutable on-chain con autoría y fecha asignadas automáticamente, y es visible en el feed (UC 20) tras la sincronización del indexador.

---

## A.3. FEAT 3. Explorar contenido

### UC 20 — Consultar feed de artículos recientes

**Actores:** Visitante o Usuario.
**Precondiciones:** ninguna — accesible sin cartera conectada.

**Flujo principal:**
1. El actor navega a `/`.
2. El sistema solicita `GET /api/v1/publications` (página 1).
3. El sistema muestra una lista paginada con título, autor, estado de consenso y número de votos por artículo.

**Flujos alternativos:** si el backend no responde, el sistema muestra un error con opción de reintentar (RI 5); si no hay publicaciones, muestra un estado vacío.
**Postcondiciones:** ninguna escritura.

---

### UC 21 — Buscar / filtrar artículos

**Actores:** Visitante o Usuario.

**Flujo principal:**
1. El actor introduce un término de búsqueda o selecciona un filtro (estado de consenso, etiqueta, autor).
2. El sistema solicita `GET /api/v1/publications` con los parámetros de filtro correspondientes (`state`, `tags`, `author`).
3. El sistema actualiza el listado.

**Postcondiciones:** ninguna escritura.

---

### UC 22 — Ver detalle de artículo

**Actores:** Visitante o Usuario.

**Flujo principal:**
1. El actor selecciona un artículo del feed o de un resultado de búsqueda.
2. El sistema solicita `GET /api/v1/publications/:hash`.
3. El sistema muestra el contenido completo y los metadatos del artículo.

**Flujos alternativos:** si el hash no existe, el sistema muestra un error 404.
**Postcondiciones:** ninguna escritura.

---

### UC 23 — Ver estado de consenso del artículo

**Actores:** Visitante o Usuario.
**Precondiciones:** UC 22 en curso.

**Flujo principal:** el sistema muestra el campo `consensusState` (PENDING / DEFINITIVE / DISPUTED) obtenido en la respuesta de UC 22.
**Postcondiciones:** ninguna escritura.

---

### UC 24 — Ver recuento de votos del artículo

**Actores:** Visitante o Usuario.
**Precondiciones:** UC 22 en curso.

**Flujo principal:** el sistema muestra, por ronda, el número de votos de cada tipo (TRUE / FALSE / UNVERIFIABLE), obtenido de `roundVoteCount` y de la réplica off-chain.
**Postcondiciones:** ninguna escritura.

---

### UC 25 — Consultar ranking de validadores por reputación

**Actores:** Visitante o Usuario.

**Flujo principal:**
1. El actor navega a `/validators`.
2. El sistema solicita `GET /api/v1/validators`, ordenado por `reputationScore` descendente.
3. El sistema muestra el listado paginado.

**Postcondiciones:** ninguna escritura.

---

### UC 26 — Consultar perfil público de una dirección

**Actores:** Visitante o Usuario.

**Flujo principal:**
1. El actor navega a `/validators/:address` o accede desde el perfil de un autor.
2. El sistema solicita `GET /api/v1/validators/:address` y `GET /api/v1/publications?author=:address`.
3. El sistema muestra reputación, historial de validación y artículos publicados por esa dirección.

**Flujos alternativos:** si la dirección no está registrada como validador, el sistema muestra igualmente sus artículos publicados, sin datos de reputación.
**Postcondiciones:** ninguna escritura.

---

### UC 27 — Acceder a la verificación del artículo

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso.

**Flujo principal:** el actor pulsa el enlace o botón "Verificar" en el detalle del artículo, que navega a las herramientas de FEAT 4.
**Postcondiciones:** ninguna escritura; es un caso de uso de navegación puro.

---

### UC 28 — Ordenar resultados del feed/búsqueda

**Actores:** Visitante o Usuario.
**Precondiciones:** UC 20 o UC 21 en curso.

**Flujo principal:** el actor selecciona un criterio de ordenación (`recent`, `votes`, `state`); el sistema solicita una nueva página con el parámetro `sort` correspondiente.
**Postcondiciones:** ninguna escritura.

---

### UC 29 — Seguir un artículo

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso.

**Flujo principal:**
1. El actor pulsa "Seguir" en el detalle del artículo.
2. El sistema invoca `POST /api/v1/publications/:hash/follow` con `{userAddress}`.
3. A partir de este momento, los cambios de estado del artículo generan una notificación (UC 10), según RD 20–21.

**Postcondiciones:** el actor queda suscrito a las notificaciones de ese artículo.

---

### UC 30 — Compartir artículo

**Actores:** Visitante o Usuario.
**Precondiciones:** UC 22 en curso.

**Flujo principal:** el actor pulsa "Compartir"; el sistema copia o expone el enlace directo `/article/:hash`.
**Postcondiciones:** ninguna escritura.

---

### UC 31 — Guardar / quitar artículo como favorito

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso.

**Flujo principal:**
1. El actor pulsa el icono de favorito en el detalle o en una tarjeta del feed.
2. El sistema invoca `POST /api/v1/favorites/:hash` (guardar) o `DELETE /api/v1/favorites/:hash` (quitar), con `{userAddress}` en el body.

**Postcondiciones:** el artículo aparece o desaparece del listado de UC 3.

---

## A.4. FEAT 4. Verificar artículo

### UC 32 — Consultar bibliografía y enlaces internos citados

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso.

**Flujo principal:** el sistema muestra, dentro del detalle del artículo, las referencias bibliográficas (UC 16) y los hipervínculos internos (UC 15) con acceso directo a cada fuente.
**Postcondiciones:** ninguna escritura.

---

### UC 33 — Comparar con otros artículos de NewsEra sobre el mismo tema

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso; el artículo tiene al menos una etiqueta (UC 14).

**Flujo principal:** el sistema solicita `GET /api/v1/publications?tags=…` y muestra artículos relacionados por etiqueta compartida, para que el actor pueda contrastar la información antes de votar.
**Postcondiciones:** ninguna escritura.

---

### UC 34 — Consultar historial de rondas anteriores y su resultado

**Actores:** Usuario con cartera conectada.
**Precondiciones:** UC 22 en curso; `currentRound > 1`.

**Flujo principal:** el sistema muestra, por cada ronda anterior, su `result` y `state`, obtenidos de `rounds` (on-chain) y de la réplica `Round` (off-chain, `GET /api/v1/publications/:hash`).
**Postcondiciones:** ninguna escritura.

---

### UC 35 — Votar artículo (TRUE / FALSE / UNVERIFIABLE)

**Actores:** Usuario con cartera conectada y reputación ≥ `MIN_REPUTATION_TO_VALIDATE`.
**Precondiciones:** el artículo está en estado PENDING; el actor no ha votado previamente ese artículo en ninguna ronda; `canValidate(address) == true`.

**Flujo principal:**
1. El actor accede al detalle del artículo (UC 22) y selecciona una opción: TRUE, FALSE o UNVERIFIABLE.
2. El sistema invoca `submitValidation(contentHash, vote)` mediante `useWriteContract`.
3. El actor firma la transacción desde su cartera.
4. El sistema espera la confirmación on-chain y muestra su estado.
5. El indexador procesa el evento `ValidationSubmitted` y actualiza la réplica off-chain.
6. Si se alcanza el quórum, el sistema refleja el nuevo estado de consenso (DEFINITIVE o DISPUTED) y el efecto reputacional inmediato sobre los votantes de la ronda.

**Flujos alternativos:**
- Si `canValidate == false`, el control de voto aparece deshabilitado indicando el motivo.
- Si el actor rechaza la firma, no se realiza ningún cambio.
- Si la transacción revierte (`AlreadyValidated`, `VotingNotOpen`), el sistema traduce el error a lenguaje natural (RI 7).

**Postcondiciones:** el voto queda registrado de forma inmutable on-chain; si la ronda alcanzó DEFINITIVE, la reputación de los votantes se actualiza.

---

### UC 36 — Solicitar reapertura de un artículo concluido

**Actores:** Usuario con cartera conectada y reputación suficiente.
**Precondiciones:** el artículo está en estado DEFINITIVE o DISPUTED; el actor no ha votado ese artículo y no ha solicitado ya su reapertura.

**Flujo principal:**
1. El actor solicita la reapertura desde el detalle del artículo.
2. El sistema invoca `requestReopen(contentHash)`.
3. El actor firma la transacción desde su cartera.
4. El contrato incrementa el contador de solicitudes y emite `ReopenRequested`.
5. Si el contador alcanza `reopenThreshold`, el contrato abre una nueva ronda y emite `VotingReopened`; el contador de solicitudes se reinicia a cero.

**Flujos alternativos:**
- Si el estado no es DEFINITIVE ni DISPUTED → revierte con `ReopenNotAvailable`.
- Si el actor ya votó ese artículo → revierte con `AlreadyValidated`.
- Si ya solicitó la reapertura → revierte con `AlreadyRequestedReopen`.
- Si la reputación es insuficiente → revierte con `InsufficientReputation`.

**Postcondiciones:** la solicitud queda registrada permanentemente; si se alcanzó el umbral, el artículo vuelve a estado PENDING en una nueva ronda.

---

### UC 37 — Reclamar reputación retroactiva

**Actores:** Usuario con cartera conectada que votó una ronda anterior a la ronda actual del artículo.
**Precondiciones:** existen rondas DEFINITIVE posteriores a la ronda en la que votó el actor, aún no reclamadas.

**Flujo principal:**
1. El actor solicita la reclamación desde su perfil (UC 8) o desde el detalle del artículo.
2. El sistema invoca `claimRetroactiveReputation(contentHash)`.
3. El actor firma la transacción desde su cartera.
4. El contrato recorre las rondas DEFINITIVE posteriores a la del actor, aplica `RETROACTIVE_DELTA` (±1) por cada una según confirmen o contradigan su voto original, limita el resultado a `RETROACTIVE_CAP` (±3) y emite `RetroactiveClaimed` con el `netDelta` resultante.

**Flujos alternativos:**
- Si el actor no votó ese artículo o no existen rondas nuevas que reclamar → revierte con `NothingToClaim`.

**Postcondiciones:** la reputación del actor se ajusta en `netDelta`; la reclamación queda registrada en `RetroactiveClaim` y no puede repetirse para las mismas rondas ya procesadas.

---

### UC 38 — Ver progreso hacia el quórum

**Actores:** Usuario con cartera conectada.
**Precondiciones:** el artículo está en estado PENDING.

**Flujo principal:** el sistema muestra `roundVoteCount` de la ronda actual frente a `quorumThreshold`, como una barra de progreso o fracción.
**Postcondiciones:** ninguna escritura.

---

### UC 39 — Consultar qué validadores ya han votado en la ronda actual

**Actores:** Usuario con cartera conectada.
**Precondiciones:** el artículo está en estado PENDING.

**Flujo principal:** el sistema invoca `getRoundVoters(contentHash, currentRound)` y muestra el listado de direcciones que ya emitieron su voto en la ronda activa.
**Postcondiciones:** ninguna escritura; no se revela el sentido del voto de cada validador, solo su participación.

---

### UC 40 — Ver el efecto reputacional estimado antes de votar

**Actores:** Usuario con cartera conectada.
**Precondiciones:** el artículo está en estado PENDING.

**Flujo principal:** antes de que el actor confirme su voto en UC 35, el sistema muestra el efecto potencial sobre su reputación: `+REPUTATION_REWARD` (+5) si su opción resulta ganadora, `-REPUTATION_PENALTY` (−3) en caso contrario, `0` si la ronda queda DISPUTED.
**Postcondiciones:** ninguna escritura; es información orientativa, no vinculante hasta que se calcula el consenso real.

---

## A.5. FEAT 5. Información institucional

### UC 41 — Consultar landing page

**Actores:** Visitante.
**Precondiciones:** ninguna.

**Flujo principal:** el actor accede a la landing page del proyecto; el sistema muestra la propuesta de valor y los tres pilares (Inmutabilidad, Validación colectiva, Resistencia a la captura).
**Postcondiciones:** ninguna escritura.

---

### UC 42 — Consultar página "Sobre el proyecto"

**Actores:** Visitante.
**Precondiciones:** ninguna.

**Flujo principal:** el actor navega a `/about`; el sistema muestra el funcionamiento del proyecto, la descripción de la DAO y el enlace público a la memoria del TFG.
**Postcondiciones:** ninguna escritura.
