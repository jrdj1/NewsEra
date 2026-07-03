# Sprint 8 — Frontend completo

Prompt generado a partir del ERS completo de la memoria del TFG
(`D:\TFG-NewsEra\TFG-TFM_EPS`, Capítulo 4 §4.1 y Anexo A — 42 casos de uso),
listo para pegar en el proyecto Claude dedicado a este repositorio.

Requiere Sprints 0–7 completos (contratos ampliados en Sprint 6, backend del
Sprint 7 operativo).

---

```
Implementa el Sprint 8 de NewsEra: completa las páginas del frontend React +
Vite que hoy son placeholders, conectándolas a la blockchain (wagmi/viem) y
al backend del Sprint 7, cubriendo el ERS completo de la memoria.

## Contexto del proyecto

Repo: `D:\TFG-NewsEra\NewsEra\frontend\`. Stack: React 18 + Vite + TS, wagmi
v2, viem, @tanstack/react-query, RainbowKit, react-router-dom, Tailwind v4,
shadcn/ui.

Estado actual:
- `Feed.tsx` (97 líneas) y `About.tsx` (128 líneas) ya tienen contenido real — no tocar salvo que necesiten un botón de favorito por tarjeta (opcional, UC~31).
- `Layout.tsx`/`Header.tsx` ya implementan el layout raíz con `ConnectButton` — HU-8.1 ya está hecho, verificar que sigue funcionando. `Header.tsx` sí se amplía en la Tarea 5 de este sprint (notificaciones).
- `Article.tsx`, `Profile.tsx`, `Publish.tsx`, `Validators.tsx`, `ValidatorProfile.tsx` son placeholders de 8-20 líneas con comentarios TODO — hay que implementarlos por completo.

El backend del Sprint 7 debe estar corriendo en `localhost:3001` con los
endpoints descritos en CLAUDE.md §Sprint 7. El frontend NUNCA firma
transacciones que no inicie el propio usuario; toda escritura on-chain pasa
por `useWriteContract` + confirmación explícita en la cartera.

Los errores de revert conocidos (`InsufficientReputation`, `AlreadyValidated`,
`VotingNotOpen`, `ReopenNotAvailable`, `AlreadyRequestedReopen`,
`NothingToClaim`, `PublicationAlreadyExists`, `NotEligibleForPrediction`)
deben traducirse a mensajes en lenguaje natural — nunca mostrar el error
crudo de Solidity.

---

## Tarea 1 — Cliente API y hooks compartidos

Crear `frontend/src/lib/api.ts`: cliente `fetch` tipado contra
`VITE_BACKEND_URL`, con manejo uniforme de `{ error: { code, message } }`.

Crear `frontend/src/hooks/`:
- `usePublications(filters)` — react-query sobre `GET /api/v1/publications`
- `usePublication(hash)` — `GET /api/v1/publications/:hash`
- `useValidators(page)` — `GET /api/v1/validators`
- `useValidatorProfile(address)` — `GET /api/v1/validators/:address` +
  `GET /api/v1/validators/:address/history`
- `useTransactionState()` — envuelve `useWriteContract` +
  `useWaitForTransactionReceipt`, exponiendo los 5 estados documentados en
  `desarrollo.tex` (Idle, Pending, Confirming, Confirmed, Failed) y traduce
  los errores de revert conocidos a texto

Commit: `feat(frontend): cliente API y hooks compartidos con react-query`

---

## Tarea 2 — HU-8.3: Publish.tsx completo

Formulario con plantilla estándar de redacción:
1. Campos: título, cuerpo (textarea/editor), etiquetas (tags libres, UC~14),
   enlaces internos a otros artículos vía `/article/:hash` (UC~15),
   referencias bibliográficas (UC~16)
2. "Guardar borrador" → `localStorage`, sin subir a IPFS ni firmar (UC~13);
   recuperar automáticamente al reabrir `/publish`
3. "Vista previa" → renderiza el artículo con el formato final (UC~17)
4. Calcular `contentHash = keccak256(toBytes(body))` con viem y mostrarlo
   antes del botón de confirmar (UC~18)
5. Al confirmar:
   - Subir `body` a IPFS vía Pinata → `ipfsCid`
   - `useWriteContract` → `PublicationRegistry.registerPublication(contentHash)`
   - Esperar confirmación con `useTransactionState`
   - Si revierte con `PublicationAlreadyExists`, mostrar error sin perder el borrador
   - Tras confirmar: `POST /api/v1/publications` con `{contentHash, ipfsCid, title, body, tags}`
   - Limpiar el borrador local y redirigir a `/article/:contentHash`
6. Informar en la interfaz (por ejemplo, en la vista previa o como nota
   junto al botón de confirmar) que la publicación puede ganar o perder
   reputación según el consenso final (recompensa por publicación, Sprint 6):
   `+8` si el artículo se confirma `TRUE`, `−8` si resuelve `UNVERIFIABLE`,
   `−15` si resuelve `FALSE`.

Commit: `feat(frontend): formulario de publicación completo — borrador, vista previa, hash, IPFS, on-chain`

---

## Tarea 3 — HU-8.4: Article.tsx completo

- Cargar artículo con `usePublication(hash)`: cuerpo, autor, tags, estado de
  consenso, historial de rondas
- Bibliografía y enlaces internos citados, con navegación directa (UC~32)
- Sección "Artículos relacionados": `usePublications({ tags: [...] })`
  excluyendo el propio (UC~33)
- Progreso de quórum: `useReadContract` → `ValidationRegistry.roundVoteCount(contentHash, currentRound)`
  frente a `quorumThreshold` (UC~38)
- Lista de votantes de la ronda actual: `useReadContract` →
  `getRoundVoters(contentHash, currentRound)` (UC~39)
- Si `consensusState === "PENDING"`:
  - `useReadContract` → `ReputationSystem.canValidate(address)`
  - Si `true` y el usuario no ha votado: tres botones TRUE/FALSE/UNVERIFIABLE,
    cada uno mostrando el efecto reputacional estimado (`+REPUTATION_REWARD`
    si acierta, `-REPUTATION_PENALTY` si falla, `0` si `DISPUTED`, UC~40)
  - Al confirmar voto: `submitValidation(contentHash, vote)` vía
    `useTransactionState`; traducir `VotingNotOpen`/`AlreadyValidated`
  - Si `false` (reputación insuficiente): mostrar en su lugar un aviso con
    los tres botones TRUE/FALSE/UNVERIFIABLE en modo "predicción de práctica"
    (Sprint 6, `submitPrediction`), explicando que no cuenta para el
    consenso pero permite acumular reputación hasta poder votar de verdad
- Si `consensusState` es `DEFINITIVE` o `DISPUTED` y el usuario no ha votado
  ni solicitado ya reapertura: botón "Solicitar reapertura" →
  `requestReopen(contentHash)`; mostrar `reopenRequestCount` actual
- Botón de favorito: `POST`/`DELETE /api/v1/favorites/:hash` (UC~31)
- Botón de seguir: `POST`/`DELETE /api/v1/publications/:hash/follow` (UC~29)
- Botón de compartir: copia `${origin}/article/${hash}` al portapapeles (UC~30)

Commit: `feat(frontend): página de detalle de artículo — votación, predicción, reapertura, favoritos, seguimiento`

---

## Tarea 4 — HU-8.5 y HU-8.6: Validators.tsx y ValidatorProfile.tsx

`Validators.tsx`: `useValidators`, tabla ordenable (UC~28) por reputación,
paginación.

`ValidatorProfile.tsx`: `useValidatorProfile(address)` — reputación, %
aciertos, historial por ronda; `displayName`/`avatarUrl` desde
`GET /api/v1/profile/:address` si existen; listado de artículos publicados
por esa dirección (`usePublications({ author: address })`, UC~26).

Commit: `feat(frontend): ranking de validadores y perfil público completos`

---

## Tarea 5 — HU-8.10: Notificaciones en Header.tsx

Modificar `frontend/src/components/layout/Header.tsx` (ya existente, no
reescribir desde cero):

1. Añadir un icono de campana junto al `ConnectButton`, visible solo si hay
   cartera conectada.
2. `useNotifications(address)` (nuevo hook en `frontend/src/hooks/`) — react-query
   sobre `GET /api/v1/profile/:address/notifications`, con refetch periódico
   (p. ej. cada 30s) o al reconectar.
3. Contador de no leídas (`read: false`) como badge sobre el icono.
4. Al pulsar el icono, despliega un panel/dropdown (`components/notifications/NotificationPanel.tsx`,
   nuevo) con el listado: tipo de notificación traducido a lenguaje natural
   (`REOPENED` → "Se ha reabierto la votación de...", `CONSENSUS_REACHED` →
   "Se alcanzó consenso en...", `RETROACTIVE_APPLIED` → "Se aplicó un ajuste
   retroactivo de reputación en..."), con enlace directo a `/article/:hash`.
5. Al abrir una notificación o pulsar "Marcar como leída", invoca
   `PATCH /api/v1/notifications/:id/read` y actualiza el contador
   optimísticamente.
6. Estado vacío: "No tienes notificaciones nuevas" si la lista está vacía.

Sin cartera conectada, el icono no se muestra (coherente con que
notificaciones es una funcionalidad de FEAT~1, que requiere cartera).

Commit: `feat(frontend): panel de notificaciones en Header.tsx con contador de no leídas`

---

## Tarea 6 — HU-8.7 a HU-8.9: Profile.tsx completo

- Reputación propia: `useReadContract` → `ReputationSystem.getReputation(address)`
- Evolución de reputación: `GET /api/v1/validators/:address/reputation-history`,
  gráfico o listado cronológico (UC~7)
- Historial de validaciones: `GET /api/v1/validators/:address/history`,
  clasificado en pestañas ganadas/perdidas/sin resolver, con % de aciertos
- Reclamaciones retroactivas pendientes: para cada artículo votado con
  `currentRound` mayor que la ronda del usuario y sin reclamación previa,
  botón "Reclamar" → `claimRetroactiveReputation(contentHash)`, mostrando el
  delta neto estimado antes de confirmar
- Solicitudes de reapertura propias: `GET` sobre las `ReopenRequest` del
  usuario (requiere exponer este listado desde el backend si no existe aún
  un endpoint específico — usar `GET /api/v1/profile/:address` ampliado o
  añadir uno nuevo si es necesario; documentar la decisión)
- Artículos publicados propios: `usePublications({ author: address })`
- Pestaña "Editar perfil": formulario `displayName`/`avatarUrl`/`email`; al
  guardar, `signMessageAsync` de wagmi sobre un mensaje determinista (p. ej.
  `JSON.stringify({ displayName, avatarUrl, email, timestamp })`) y
  `PUT /api/v1/profile/:address` con `{ ...datos, signature, message }`
- Pestaña "Favoritos": `GET /api/v1/profile/:address/favorites`, listado con
  acceso directo y opción de quitar

Commit: `feat(frontend): panel de perfil completo — reputación, historial, reclamaciones, edición, favoritos`

---

## Criterio de éxito

- Todas las rutas renderizan sin errores con Hardhat Network local
- Flujo de publicación E2E funcional (borrador → vista previa → hash → IPFS → on-chain → backend)
- Flujo de validación E2E funcional (votar → quórum → consenso → reputación)
- Flujo de predicción funcional para direcciones sin reputación suficiente
- Favoritos, seguimiento y notificaciones funcionan end-to-end contra el backend del Sprint 7
- Edición de perfil enriquecido verifica la firma antes de persistir
- Todo estado de carga y error se comunica explícitamente (sin pantallas en blanco)
- Legible en móvil
```
