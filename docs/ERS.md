# ERS — Especificación de Requisitos de Software
## NewsEra · Sprint 1 · Versión 1.1

> Fuente canónica: Capítulo 4, §4.1 de la memoria del TFG (Jorge Rafael de Julián Vicedo, UA 2026).
> Los casos de uso detallados se encuentran en [`docs/casos-de-uso.md`](casos-de-uso.md).

---

## 1. Catálogo de casos de uso (STQR 1)

Sistema temático único: **STQR 1 — Sistema de publicación y verificación de contenidos**.

| FEAT | Nombre | Casos de uso |
|------|--------|-------------|
| FEAT 1 | Gestión de cuenta | UC 1–11 |
| FEAT 2 | Publicar artículo | UC 12–19 |
| FEAT 3 | Explorar contenido | UC 20–31 |
| FEAT 4 | Verificar artículo | UC 32–40 |
| FEAT 5 | Información institucional | UC 41–42 |

Los seis casos de uso de mayor complejidad (transacción on-chain o verificación criptográfica):
**UC 1** (conectar cartera), **UC 2** (perfil con `personal_sign`), **UC 19** (publicar on-chain), **UC 35** (votar), **UC 36** (solicitar reapertura), **UC 37** (reclamar reputación retroactiva).

---

## 2. Requisitos no funcionales (RNF)

### Rendimiento
- **RNF 1.** El coste de gas de `registerPublication`, `submitValidation`, `requestReopen`, `claimRetroactiveReputation` debe mantenerse dentro de límites razonables mediante Tight Variable Packing (verificación empírica: Sprint 9).
- **RNF 2.** El tiempo de confirmación de transacción está condicionado por el tiempo de bloque (~12 s en Sepolia); la interfaz debe reflejar estados de espera sin bloquear la interacción.

### Seguridad
- **RNF 3.** Ningún componente almacena ni gestiona claves privadas del usuario; toda firma se realiza desde su cartera (wagmi + RainbowKit).
- **RNF 4.** El backend no firma transacciones en nombre de ningún usuario.
- **RNF 5.** Los contratos deben superar análisis estático (Slither) sin findings de severidad High/Critical.
- **RNF 6.** El control de acceso a funciones sensibles se implementa mediante `AccessControl` (roles), nunca mediante comprobaciones ad-hoc.
- **RNF 7.** Transparencia: las reglas de publicación, validación y reputación están codificadas en contratos públicos verificables en Etherscan.
- **RNF 8.** Inmutabilidad: una vez registrado un `contentHash` o emitido un voto, no puede alterarse ni eliminarse.
- **RNF 9.** Descentralización: ningún actor único controla el resultado del consenso; el backend nunca firma transacciones y la lógica de consenso reside íntegramente en los contratos.
- **RNF 10.** Resistencia a la captura: los parámetros de gobernanza (`quorumThreshold`, `superMajorityBps`, `reopenThreshold`) se fijan en el constructor sin funciones de modificación posterior al despliegue.
- **RNF 11.** Auditabilidad: toda acción relevante emite un evento on-chain que permite reconstruir el historial completo sin acceso privilegiado.
- **RNF 12.** Trazabilidad: toda acción queda vinculada a una dirección pública y a un bloque con marca de tiempo verificable.

### Usabilidad
- **RNF 13.** La interfaz debe ser legible y funcional en dispositivos móviles.
- **RNF 14.** Todo estado de carga y error debe comunicarse explícitamente al usuario, sin pantallas en blanco.
- **RNF 15.** El perfil enriquecido (UC 2) no exige contraseña; la propiedad de la dirección se verifica mediante `personal_sign`.

### Mantenibilidad
- **RNF 16.** Separación estricta de capas en el backend: enrutador → servicio → repositorio; el enrutador no accede directamente a Prisma.
- **RNF 17.** Las carpetas `blockchain/`, `backend/` y `frontend/` son proyectos independientes, sin workspaces ni monorepo.
- **RNF 18.** Toda interacción con la blockchain, en backend y frontend, se realiza mediante `viem` — nunca `ethers.js`.
- **RNF 19.** El backend se implementa con Hono, TypeScript en modo estricto y módulos ESM nativos, sin CommonJS.
- **RNF 20.** Las pruebas manuales de la API se realizan con Bruno, no con Postman.

### Portabilidad / compatibilidad
- **RNF 21.** El backend requiere Node.js 20 LTS y PostgreSQL 16 vía Docker, con Prisma como ORM.
- **RNF 22.** El frontend debe operar contra red local (Hardhat Network) y Sepolia sin cambios de código, solo de configuración wagmi.
- **RNF 23.** Los contratos deben ser compatibles con Solidity ^0.8.20, Hardhat ^2.22 y OpenZeppelin ^5.x, desplegables en Hardhat Network y Ethereum Sepolia.
- **RNF 24.** El frontend se implementa como SPA con React + Vite, React Router v6, Tailwind CSS v4 y shadcn/ui.

### Escalabilidad
- **RNF 25.** El diseño prioriza KISS frente a escalabilidad de producción: `docker-compose` es suficiente para el prototipo; no se requiere Kubernetes.

### Cumplimiento / privacidad
- **RNF 26.** El email opcional del perfil enriquecido (UC 2) es un dato personal; su almacenamiento debe ser opt-in explícito y no condicionar el acceso a ninguna funcionalidad.

### Cobertura de pruebas
- **RNF 27.** Cobertura de tests de contratos inteligentes ≥ 80% (`npx hardhat coverage`), con Chai para contratos y Vitest para backend y frontend.

---

## 3. Requisitos de datos (RD)

### Principios generales
- **RD 1.** La blockchain es la única fuente de verdad para autoría, `contentHash`, votos, estado de consenso por ronda y reputación. PostgreSQL almacena una réplica de solo lectura poblada por el indexador, nunca al revés.
- **RD 2.** El `contentHash` vincula la entidad on-chain con su réplica off-chain y con el contenido en IPFS.
- **RD 3.** Toda escritura on-chain debe reflejarse en PostgreSQL a través del indexador, no mediante escritura directa del frontend a la base de datos.

### Publicación (Publication)
- **RD 4.** On-chain: `author`, `timestamp`, `exists` — inmutable, indexado por `contentHash`.
- **RD 5.** Off-chain: `title`, `body`, `authorAddress`, `tags[]`, `ipfsCid`, `consensusState`, `currentRound`, `reopenRequestCount`, `createdAt`.
- **RD 6.** El `body` almacenado en PostgreSQL debe satisfacer `keccak256(body) == contentHash`; cualquier discrepancia invalida el registro como corrupto.
- **RD 7.** `tags` es una lista de cadenas libres definida por el autor al publicar (UC 14).

### Rondas de validación (Round)
- **RD 8.** Cada publicación tiene N rondas, cada una con `round`, `state`, `result`, `completed`.
- **RD 9.** Una vez `completed = true`, los campos `state` y `result` de esa ronda son inmutables.

### Validaciones (Validation)
- **RD 10.** Cada voto: `contentHash`, `validatorAddress`, `vote`, `round`, `txHash`, `createdAt`.
- **RD 11.** Restricción de unicidad: un `validatorAddress` solo puede votar una vez por artículo, independientemente de la ronda; el voto es vinculante para las rondas posteriores salvo reclamación retroactiva (UC 37).

### Validador / reputación (Validator)
- **RD 12.** On-chain: reputación y estado de registro, gestionados exclusivamente por `ReputationSystem`.
- **RD 13.** Off-chain: `address` (clave primaria), `reputationScore`, `lastSyncBlock`, `registeredAt`, `updatedAt`.
- **RD 14.** `reputationScore` off-chain debe ser réplica exacta del valor on-chain; cualquier desincronización se resuelve reindexando desde `lastSyncBlock`.

### Reapertura y reclamación retroactiva
- **RD 15.** `ReopenRequest`: `contentHash`, `requesterAddress`, `txHash`, `createdAt` — único por `(contentHash, requesterAddress)`.
- **RD 16.** `RetroactiveClaim`: `contentHash`, `validatorAddress`, `netDelta`, `txHash`, `createdAt` — único por `(contentHash, validatorAddress, txHash)`.

### Perfil enriquecido (UserProfile) — solo off-chain
- **RD 17.** `address` (clave primaria), `displayName`, `avatarUrl`, `email` (opcional, opt-in), `updatedAt`.
- **RD 18.** No existe contraseña ni credencial almacenada; toda modificación requiere una firma válida (`personal_sign`) de la dirección propietaria.

### Favoritos (Favorite) — solo off-chain
- **RD 19.** `userAddress`, `contentHash`, `createdAt` — único por `(userAddress, contentHash)`, sin contrapartida on-chain.

### Notificaciones (Notification) — solo off-chain
- **RD 20.** `userAddress`, `contentHash`, `type` (`REOPENED` / `CONSENSUS_REACHED` / `RETROACTIVE_APPLIED`), `read` (false por defecto), `createdAt`.
- **RD 21.** Poblada por el indexador de eventos cuando procesa `VotingReopened`, `ConsensusReached` y `RetroactiveClaimed` para artículos que el usuario sigue o votó; no se calcula bajo demanda.
- **RD 22.** Sin contrapartida on-chain; editable por su propietario (marcar como leída). Se recomienda purgar notificaciones leídas con antigüedad superior a un umbral razonable.

### Retención e integridad
- **RD 23.** Ningún dato on-chain puede eliminarse ni editarse una vez confirmado (RNF 8).
- **RD 24.** Los datos exclusivamente off-chain (perfil enriquecido, favoritos, notificaciones) sí son editables o eliminables por su propietario, ya que no forman parte del protocolo de consenso.

---

## 4. Requisitos de interfaz (RI)

### Interfaz de usuario
- **RI 1.** Navegación mediante rutas SPA (React Router v6): `/`, `/publish`, `/article/:hash`, `/validators`, `/validators/:address`, `/profile`, `/about`.
- **RI 2.** Cabecera fija global con logo, navegación y `ConnectButton` de RainbowKit, visible en todas las rutas.
- **RI 3.** Plantilla estándar de redacción para artículos (UC 12): todos los artículos se renderizan con el mismo formato visual.
- **RI 4.** Diseño responsive, legible en dispositivos móviles (RNF 13).
- **RI 5.** Estados de carga y error explícitos en toda vista que dependa de datos remotos (backend o blockchain).
- **RI 6.** Toda acción que requiera firma de cartera muestra el hash de transacción y su estado (pendiente / confirmada / fallida) mediante `useWaitForTransactionReceipt`.
- **RI 7.** Los errores de revert conocidos (`InsufficientReputation`, `AlreadyValidated`, `VotingNotOpen`, `ReopenNotAvailable`, `AlreadyRequestedReopen`, `NothingToClaim`) se traducen a mensajes en lenguaje natural; nunca se muestra el error crudo de Solidity al usuario.

### Interfaces externas
- **RI 8.** Interfaz con la cartera del usuario vía wagmi + RainbowKit (MetaMask, WalletConnect).
- **RI 9.** Interfaz con la blockchain vía viem, contra Hardhat Network o Ethereum Sepolia según la configuración de red activa.
- **RI 10.** Interfaz con IPFS a través de la API de Pinata, para subida y recuperación del contenido de los artículos.
- **RI 11.** Interfaz REST entre frontend y backend bajo `/api/v1`, formato JSON, con estructura de error uniforme `{"error": {"code", "message"}}`.
- **RI 12.** Interfaz de verificación pública de los contratos desplegados en Etherscan (Sepolia).

---

## 5. Discrepancias detectadas entre diseño y estado actual

| # | Área | Discrepancia | Acción |
|---|------|-------------|--------|
| D1 | `scripts/generar-metricas.js` | No extraía gas de `requestReopen`, `claimRetroactiveReputation` ni `submitPrediction` | **Resuelto** — extracción añadida |
| D2 | Backend REST API | `POST /api/v1/sync/events` (re-sincronización manual del indexador) existe en §4.5.2 de la memoria pero no en el Sprint 7 HU list de CLAUDE.md | **Resuelto** — añadido como HU-7.6 |
| D3 | Sprint 6 | `submitPrediction` y recompensa/penalización por publicación no estaban implementados en `ValidationRegistry.sol` | **Resuelto** — Sprint 6 completo, 91 tests, cobertura 96.97% |
| D4 | `backend/src/lib/viem.ts` | Solo configuraba Sepolia (y con una variable de entorno de nombre distinto al documentado); faltaba modo Hardhat Network para desarrollo local | **Resuelto** — Sprint 7, `NETWORK=local\|sepolia` |
| D6 | `backend/src/services/profile.service.ts` | `PUT /api/v1/profile/:address` verificaba la firma pero nunca validaba el `timestamp` del mensaje firmado, pese a que `Profile.tsx` ya lo incluía — una firma+mensaje capturados podían reenviarse (replay) en cualquier momento posterior y se aceptaban como edición nueva | **Resuelto** — `assertFreshSignature` valida ventana de frescura de 5 min (± 1 min de tolerancia de reloj), rechazo con `FORBIDDEN` (403) |
| D7 | `backend/src/services/indexer.ts` | `processLogs` solo avanzaba `lastProcessedBlock` en memoria; `watchLiveEvents` (eventos en vivo) nunca persistía en `IndexerState`, solo `processHistoricalEvents` al terminar el catch-up — un reinicio del backend reprocesaba el tramo ya procesado en vivo | **Resuelto** — `processLogs` persiste `lastProcessedBlock` en cada lote, tanto histórico como en vivo |
