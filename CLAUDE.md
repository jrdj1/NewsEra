# NewsEra — Guía de desarrollo para Claude

## 1. Descripción del proyecto

**NewsEra** es una plataforma descentralizada para la validación y difusión de información veraz.
Es el prototipo del TFG de **Jorge Rafael de Julián Vicedo**, Grado en Ingeniería Informática (EPS,
Universidad de Alicante), tutorizado por el **Dr. Higinio Mora Mora** (Departamento de Tecnología
Informática y Computación), año 2026.

La premisa central: el problema de la desinformación no se resuelve mejorando los mecanismos de
verificación sobre los sistemas actuales, sino construyendo una infraestructura **alternativa**
estructuralmente resistente a la captura por cualquier grupo de poder (económico, político o
institucional). Esta resistencia se logra trasladando las reglas de publicación, verificación y
gobernanza desde entidades controlables hacia **contratos inteligentes** desplegados en una
blockchain pública que ningún actor puede modificar unilateralmente.

**Repo hermano (memoria LaTeX):** `github.com/jrdj1/TFG-NewsEra-memoria`
La comunicación es unidireccional: este repo → memoria, via `repository_dispatch`.
El repo de memoria NO puede interactuar con este.

---

## 2. Estructura del repositorio

```
NewsEra/
├── blockchain/   → Solidity + Hardhat + OpenZeppelin
├── backend/      → Node.js + TypeScript + Hono + Prisma + PostgreSQL
├── frontend/     → React + Vite (SPA) + TypeScript + Tailwind CSS v4 + shadcn/ui
│                   + wagmi v2 + viem + RainbowKit + React Router v6
├── docs/         → metricas.json (auto-generado), ERS.md, casos-de-uso.md, abis/, prompts/
├── scripts/      → generar-metricas.js y utilidades de automatización
└── .github/      → GitHub Actions workflows
```

Cada carpeta es un proyecto Node.js **independiente** con su propio `package.json`.
**NO hay workspaces ni monorepo.**

---

## 3. Comandos por capa

### blockchain/
```bash
npx hardhat compile                                        # compilar contratos
npx hardhat test                                           # ejecutar tests
REPORT_GAS=true npx hardhat test                          # tests con gas report
npx hardhat coverage                                       # cobertura (objetivo mínimo: 80%)
npx hardhat run scripts/deploy.ts --network sepolia        # desplegar en Sepolia
npx slither contracts/                                     # análisis estático de seguridad
```

### backend/
```bash
npm run dev          # tsx watch src/index.ts
npm run build        # tsc --noEmit && ...
npm test             # vitest
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

### frontend/
```bash
npm run dev          # vite dev
npm run build        # vite build
npm test             # vitest
```

### raíz
```bash
node scripts/generar-metricas.js   # genera docs/metricas.json
```

---

## 4. Stack tecnológico exacto

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Contratos | Solidity | ^0.8.20 |
| Contratos | Hardhat | ^2.22 |
| Contratos | OpenZeppelin Contracts | ^5.x |
| Red local | Hardhat Network | — |
| Testnet | Ethereum Sepolia | — |
| Producción futura | Polygon PoS o Arbitrum One | (a decidir en Sprint 9) |
| Runtime | Node.js | 20 LTS |
| Lenguaje | TypeScript | ^5.x (strict mode, ESM nativo) |
| Backend | Hono | ^4.x |
| ORM | Prisma | ^6.x |
| Base de datos | PostgreSQL 16 (Docker) | — |
| Blockchain client | viem | ^2.x |
| Frontend | React + Vite (SPA) | — |
| Enrutamiento frontend | React Router | v6 |
| Almacenamiento descentralizado | IPFS vía Pinata | free tier |
| Web3 React | wagmi | ^2.x |
| Wallet UI | RainbowKit | ^2.x |
| Estilos | Tailwind CSS | v4 |
| Componentes | shadcn/ui (sobre Radix UI) | — |
| Tests contratos | Chai | ^4.x |
| Tests backend/frontend | Vitest | ^2.x |
| Cliente HTTP manual | Bruno | — |
| Análisis estático | Slither | — |

---

## 5. Convenciones de código

### Solidity
- `SPDX-License-Identifier` en todos los archivos
- `pragma solidity ^0.8.20`
- **Tight Variable Packing:** agrupar `address` (20 b) + `uint96` (12 b) en un slot de 32 b
- `AccessControl` de OpenZeppelin para control de roles
- Emitir eventos para toda escritura de estado relevante
- Nombres: contratos `PascalCase`, funciones `camelCase`, constantes `UPPER_SNAKE_CASE`, eventos `PascalCase`

### TypeScript (backend y frontend)
- ESM nativo (`"module": "NodeNext"` en tsconfig), sin CommonJS
- `strict: true`, `noImplicitAny: true`
- Nombres de archivos: `kebab-case`
- Importar de `viem` para toda interacción con blockchain (nunca `ethers.js`)
- **Estructura backend:**
  ```
  Router (Hono) → Services → Repositories (Prisma)
  ```
  - El router NO accede directamente a Prisma
  - Los servicios NO acceden directamente a Prisma
  - Los repositorios encapsulan TODOS los accesos a PostgreSQL

---

## 6. Antipatrones — qué NO hacer

| ❌ Prohibido | ✅ Usar en su lugar |
|-------------|-------------------|
| `ethers.js` | `viem` |
| `Express` | `Hono` |
| `Jest` | `Vitest` |
| `Postman` | `Bruno` |
| `Foundry` | `Hardhat` (coherencia con stack TS) |
| `Next.js` / SSR / Server Components | React + Vite SPA (decisión KISS) |
| Almacenar texto completo on-chain | Solo hashes `keccak256` |
| El backend firma transacciones en nombre del usuario | El usuario firma con su cartera |
| `localStorage` para claves privadas | Cartera del usuario (MetaMask / WalletConnect) |
| Lógica de negocio en la capa de enrutamiento Hono | Mover a Services |
| Workspaces / monorepo | Las 3 carpetas son proyectos independientes |
| Structs sin Tight Variable Packing | Ordenar `address + uint96` en un slot |
| Kubernetes u orquestación compleja | `docker-compose.yml` es suficiente para el prototipo |

---

## 7. Sincronización con el repo de memoria

Este repo notifica al repo de memoria (`jrdj1/TFG-NewsEra-memoria`) cuando se completa un sprint
o se despliegan contratos. La comunicación es **unidireccional**: este repo → memoria.

**Mecanismo:** `repository_dispatch` con event-types:
- `sprint-completado`
- `contrato-desplegado`
- `metricas-actualizadas`

**Payload:** `{"sprint": "Sprint N", "ref": "main"}`

**Secret requerido:** `MEMORIA_PAT` — Personal Access Token con `contents:write` sobre
`jrdj1/TFG-NewsEra-memoria`.

---

## 8. Schema de docs/metricas.json

```json
{
  "fecha": "YYYY-MM-DD",
  "red": "Sepolia",
  "sprint": "Sprint N",
  "bloque_despliegue": "<number|null>",
  "contratos": {
    "addresses": {
      "PublicationRegistry": "0x...",
      "ValidationRegistry":  "0x...",
      "ReputationSystem":    "0x..."
    },
    "gas": {
      "registerPublication":        "<number|null>",
      "submitValidation":           "<number|null>",
      "requestReopen":              "<number|null>",
      "claimRetroactiveReputation": "<number|null>",
      "submitPrediction":           "<number|null>",
      "increaseReputation":         "<number|null>",
      "decreaseReputation":         "<number|null>",
      "media":                      "<number|null>"
    },
    "cobertura": "<number|null>"
  },
  "tests": {
    "pasados": "<number|null>",
    "totales": "<number|null>"
  },
  "loc": {
    "solidity": "<number|null>",
    "backend":  "<number|null>",
    "frontend": "<number|null>"
  }
}
```

---

## 9. Diagnóstico de errores

| Error | Causa probable | Solución |
|-------|---------------|---------|
| `Compilation failed` (Solidity) | Sintaxis o versión | `npx hardhat compile -v` |
| `Test failed con revert` | Condición de contrato | `--reporter verbose` |
| Gas excesivo | Struct no empaquetado | Tight Variable Packing |
| Type error TS | strict mode | `tsc --noEmit` primero |
| `PrismaClientKnownRequestError P2002` | unique constraint violation | `@@unique` en modelo |
| `"use client"` en Server Component | Prop no serializable | Mover a Client Component |

---

## 10. Diseño de contratos (referencia rápida)

### PublicationRegistry
- Registro inmutable de hashes. Abierto a cualquier dirección.
- `registerPublication(bytes32 contentHash)` → revierte si ya existe
- Evento: `PublicationRegistered(bytes32 indexed, address indexed, uint256)`
- Struct packed: `address author` + `uint96 timestamp` + `bool exists` en un slot

### ValidationRegistry
- Gestiona votos (`VoteType { TRUE, FALSE, UNVERIFIABLE }`). **UNVERIFIABLE es veredicto de primera clase**, no abstención.
- **Importante:** los contratos NO verifican la veracidad del contenido automáticamente. Solo agregan votos humanos y aplican las reglas de consenso de forma determinista. La extensión zkML (trabajo futuro) añadiría un cuarto tipo de voto automatizado verificable; no implementar en este TFG.
- Estado de consenso: `ConsensusState { PENDING, DEFINITIVE, DISPUTED, PENDING_REOPEN }`.
  - `PENDING`: votación activa en la ronda actual.
  - `DEFINITIVE`: quórum alcanzado Y opción ganadora ≥ `superMajorityBps` (ej. 6667 = 66,67%). Efectos reputacionales inmediatos para la ronda.
  - `DISPUTED`: quórum alcanzado pero ninguna opción alcanza supermayoría. Sin efectos reputacionales.
  - `PENDING_REOPEN`: estado transitorio interno cuando se alcanza `reopenThreshold` solicitudes; pasa a `PENDING` de inmediato.
- **Sistema multironda:** cada ronda tiene su propio `RoundInfo { result, state, completed }` y los datos de votos son independientes por ronda. Los votos son inmutables una vez emitidos.
- **Mecanismo de reapertura:** `requestReopen(bytes32 contentHash)` — solo validadores que aún no han votado en ese artículo y tienen reputación suficiente. Al acumular `reopenThreshold` solicitudes se abre una nueva ronda. Solicitudes por artículo se reinician a 0 tras cada reapertura. Sin límite de rondas.
- Parámetros de gobernanza en constructor: `quorumThreshold`, `superMajorityBps`, `reopenThreshold`.
- Mappings clave: `currentRound(bytes32)`, `rounds(bytes32 → uint256 → RoundInfo)`, `roundVoteCount(bytes32 → uint256 → uint256)`, `voterRound(bytes32 → address → uint256)`.
- `submitValidation(bytes32 contentHash, uint8 vote)`: verifica reputación → voto inmutable → evalúa quórum → si DEFINITIVE aplica rep. inmediata a votantes de esta ronda.
- **Efectos reputacionales de ronda propia (solo en DEFINITIVE):**
  - Votó la opción ganadora: `+REPUTATION_REWARD` (+5)
  - Votó cualquier otra opción: `−REPUTATION_PENALTY` (−3)
- **Reputación retroactiva (pull model):** `claimRetroactiveReputation(bytes32)` — aplica ±`RETROACTIVE_DELTA` (+1) por cada ronda DEFINITIVE posterior a la del votante que confirma/contradice el resultado de su ronda. Cap total: ±`RETROACTIVE_CAP` (±3) por artículo. El votante paga el gas (O(rondas desde su última reclamación)).
  - Ronda posterior confirma tu ronda → acertaste: +1 / fallaste: −1
  - Ronda posterior contradice tu ronda → acertaste: −1 / fallaste: +1
- **Recompensa por publicación (Sprint 6):** la primera vez que la ronda de un artículo alcanza `DEFINITIVE`, el autor (leído de `PublicationRegistry.getPublication(contentHash).author`) recibe un efecto reputacional. Se aplica una sola vez por artículo (reaperturas posteriores no lo reevalúan) y en el mismo punto donde ya se resuelven los efectos de los votantes — sin recorrido adicional, coste de gas constante.
  - `TRUE` → `+PUBLISH_REPUTATION_REWARD` (+8)
  - `UNVERIFIABLE` → `-PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE` (−8)
  - `FALSE` → `-PUBLISH_REPUTATION_PENALTY_FALSE` (−15)
  - `DISPUTED` → sin efecto
- **Predicciones — acceso meritocrático sin publicar (Sprint 6):** `submitPrediction(bytes32 contentHash, uint8 vote)` — solo si `canValidate(msg.sender) == false`; estado `PENDING`; una dirección no puede predecir ni votar dos veces el mismo artículo. No cuenta para `roundVoteCount` ni para el quórum/supermayoría. Se resuelve **automáticamente** (no *pull*) en el mismo momento en que la ronda alcanza `DEFINITIVE`, junto con los votantes reales: acierto `+PREDICTION_REWARD` (+1), fallo `-PREDICTION_PENALTY` (−1), `DISPUTED` sin efecto.
  - **Por qué no es *pull* como lo retroactivo:** si el propio predictor decidiera cuándo reclamar, nunca reclamaría sus fallos (el suelo en 0 ya lo protege de perder lo que no tiene), convirtiendo el ±1 simétrico en una recompensa unilateral. Al resolverse junto con los votantes de la misma ronda —conjunto acotado, del orden de `quorumThreshold`— se cierra esa vía sin reintroducir el coste de gas no acotado que motivó el modelo *pull* para lo retroactivo.
- Constantes: `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`, `RETROACTIVE_DELTA=1`, `RETROACTIVE_CAP=3`, `PUBLISH_REPUTATION_REWARD=8`, `PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE=8`, `PUBLISH_REPUTATION_PENALTY_FALSE=15`, `PREDICTION_REWARD=1`, `PREDICTION_PENALTY=1`.
- Eventos: `ValidationSubmitted(..., uint256 round)`, `ConsensusReached(..., uint256 round)`, `ReopenRequested(...)`, `VotingReopened(..., uint256 newRound)`, `RetroactiveClaimed(..., int256 netDelta)`, `PredictionSubmitted(bytes32 indexed contentHash, address indexed predictor, uint8 vote, uint256 round)`.
- Interactúa con `ReputationSystem` via interfaz `IReputationSystem`, y con `PublicationRegistry` (lectura del autor, única dependencia de solo lectura).

### ReputationSystem
- Solo `ValidationRegistry` puede modificar reputaciones (`AccessControl`).
- Constantes: `MIN_REPUTATION_TO_VALIDATE=10`, `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`.
- `registerValidator(address, uint256 initialReputation)` para bootstrapping manual.
- Resistencia Sybil: cuenta nueva = reputación 0 < umbral mínimo.

---

## 11. Flujo de publicación (6 pasos)

1. Usuario escribe título y cuerpo en el formulario.
2. Frontend calcula `keccak256(body)` con viem → `contentHash`.
3. Frontend sube el cuerpo a IPFS vía API de Pinata → obtiene `ipfsCid`.
4. Usuario firma y envía `PublicationRegistry.registerPublication(contentHash)` desde su cartera.
5. Tras confirmación on-chain, frontend envía `POST /api/v1/publications` con `{contentHash, ipfsCid}` al backend → PostgreSQL.
6. Indexador detecta evento `PublicationRegistered` y actualiza la réplica off-chain.

**Verificación de integridad:** `keccak256(contenido_IPFS) == contentHash_on-chain`.

---

## 12. Rutas del frontend (React Router v6)

| Ruta | Vista |
|------|-------|
| `/` | Feed de publicaciones recientes |
| `/publish` | Formulario de publicación |
| `/article/:hash` | Detalle de artículo + votos |
| `/validators` | Ranking de validadores por reputación |
| `/validators/:address` | Perfil público de un validador |
| `/profile` | Panel personal: reputación propia, historial de validaciones, perfil enriquecido, favoritos y solicitudes de reapertura |
| `/about` | Información sobre el proyecto y enlace a la memoria del TFG |

---

## 13. Filosofía de desarrollo

- **KISS** — si una tecnología añade complejidad sin aportar valor concreto al prototipo, se descarta.
- **DRY** — no duplicar lógica entre capas.
- **Separación de responsabilidades** — on-chain solo lo que requiere inmutabilidad; off-chain el resto.

## 14. Trabajo futuro identificado (fuera del alcance del TFG)

**The Graph Protocol**: migración del indexador del backend a un subgrafo descentralizado,
eliminando la dependencia del servidor off-chain. No implementar durante el TFG.

**Veredicto automatizado verificable on-chain (zkML + oráculos)**: extensión del diseño
de `ValidationRegistry` para admitir un cuarto tipo de voto emitido por un modelo de IA
verificado criptográficamente. El mecanismo previsto es:
- Un oracle descentralizado (Chainlink Functions) o una prueba zkML (EZKL, Modulus Labs,
  Ora Protocol) ejecuta un clasificador de desinformación off-chain sobre el contenido del
  artículo y genera una prueba criptográfica de que ese resultado es correcto.
- El contrato verifica la prueba y registra el resultado como `AI_VERDICT` (cuarto valor de
  `VoteType`), con peso ponderado configurable en el cómputo del consenso.
- El modelo utilizado es público y su hash forma parte del protocolo; cambiarlo requeriría
  el mismo consenso explícito que cualquier modificación de los contratos.

```solidity
// Extensión futura — NO implementar en el TFG
enum VoteType { TRUE, FALSE, UNVERIFIABLE, AI_VERDICT }
```

Esta línea está documentada en la memoria como ítem 7 del capítulo de Trabajo futuro.

---

## Backlog de sprints

> Sprints 0–1 (fundamentos y diseño de arquitectura) completados en la memoria del TFG.
> Sprint 10 (evaluación y memoria) no produce código en este repositorio.
> Este backlog cubre los sprints de implementación: 2–9.

---

### Sprint 2 — PublicationRegistry (OE3) `[DONE]`

**Objetivo:** contrato de registro inmutable de publicaciones funcionando con tests en red local.

**HU-2.1** — Como cualquier usuario, quiero registrar una publicación con su hash keccak256 para que quede registrada de forma inmutable en la blockchain.
- `registerPublication(bytes32 contentHash) external`
- Revierte con `PublicationAlreadyExists` si el hash ya existe
- Emite `PublicationRegistered(bytes32 indexed contentHash, address indexed author, uint256 timestamp)`

**HU-2.2** — Como usuario, quiero consultar los datos de una publicación por su hash para verificar autoría y timestamp.
- `getPublication(bytes32 contentHash) external view returns (Publication memory)`
- Revierte con `PublicationNotFound` si no existe

Struct on-chain:
```solidity
struct Publication {
    address author;    // 20 bytes — packed con timestamp en el mismo slot
    uint96  timestamp; // 12 bytes
    bool    exists;
}
mapping(bytes32 => Publication) public publications;
```

**HU-2.3** — Como visitante, quiero ver una landing page con la propuesta de valor del proyecto y poder conectar mi cartera MetaMask, así como acceder a una página "Sobre el proyecto" con el resumen de la plataforma, descripción de la DAO y enlace público a la memoria del TFG (whitepaper).
- Layout global: cabecera fija con logo, navegación y `ConnectButton` de RainbowKit
- `/` — Hero + tres pilares (Inmutabilidad, Validación colectiva, Resistencia a la captura)
- `/about` — Resumen del proyecto, cómo funciona, quién lo construye y enlace a la memoria

Definition of done:
- [x] Contrato compilado sin warnings
- [x] Tests: registro exitoso, duplicado (revert), consulta existente, consulta inexistente, evento emitido
- [x] Cobertura ≥ 80%
- [x] `npx hardhat ignition deploy` exitoso en red local Hardhat
- [x] Landing page `/` con hero y tres pilares, visible sin cartera conectada
- [x] Página `/about` con resumen del proyecto y enlace a la memoria
- [x] `ConnectButton` funcional con MetaMask en red local

---

### Sprint 3 — ValidationRegistry (OE3) `[DONE]`

**Objetivo:** contrato de validación multironda con quórum, supermayoría, reapertura y reputación retroactiva.

**HU-3.1** — Como validador con reputación suficiente, quiero emitir un voto sobre una publicación (TRUE / FALSE / UNVERIFIABLE) en la ronda activa.
- `submitValidation(bytes32 contentHash, uint8 vote) external`
- vote: 0=TRUE, 1=FALSE, 2=UNVERIFIABLE
- Verifica `ReputationSystem.canValidate(msg.sender)` → revert `InsufficientReputation` si no cumple
- Revert `AlreadyValidated` si el validador ya votó ese artículo (en cualquier ronda)
- Revert `VotingNotOpen` si el estado actual no es PENDING
- Emite `ValidationSubmitted(bytes32 indexed contentHash, address indexed validator, uint8 vote, uint256 round)`

**HU-3.2** — Cuando se alcanza el quórum, el contrato evalúa supermayoría y cierra la ronda.
- Si opción ganadora ≥ `superMajorityBps` → ronda `DEFINITIVE`:
  - Emite `ConsensusReached(..., uint256 round)` con state=DEFINITIVE
  - Votantes de la opción ganadora: `increaseReputation` (+5)
  - Resto de votantes de esa ronda: `decreaseReputation` (−3)
- Si quórum pero ninguna opción ≥ `superMajorityBps` → ronda `DISPUTED`:
  - Emite `ConsensusReached(..., uint256 round)` con state=DISPUTED
  - Sin efectos reputacionales

**HU-3.3** — Como validador que aún no ha votado un artículo concluido, quiero solicitar su reapertura.
- `requestReopen(bytes32 contentHash) external`
- Revert `ReopenNotAvailable` si el estado no es DEFINITIVE ni DISPUTED
- Revert `AlreadyValidated` si ya votó; revert `AlreadyRequestedReopen` si ya solicitó
- Revert `InsufficientReputation` si no cumple el umbral
- Al acumular `reopenThreshold` solicitudes: abre nueva ronda, emite `VotingReopened(..., uint256 newRound)`
- Emite `ReopenRequested(bytes32 indexed, address indexed, uint256 count)`

**HU-3.4** — Como validador con rondas posteriores a la mía sobre un artículo, quiero reclamar ajustes retroactivos de reputación.
- `claimRetroactiveReputation(bytes32 contentHash) external`
- Revert `NothingToClaim` si no votó o no hay rondas nuevas
- Por cada ronda DEFINITIVE posterior: ±`RETROACTIVE_DELTA` (1) según confirme o contradiga mi ronda; cap ±`RETROACTIVE_CAP` (3)
- Emite `RetroactiveClaimed(bytes32 indexed, address indexed, int256 netDelta)`

**HU-3.5** — Consultas públicas:
- `hasVoted(bytes32, address) external view returns (bool)`
- `getVote(bytes32, address) external view returns (VoteType, uint256 round)`
- `getRoundVoters(bytes32, uint256) external view returns (address[])`
- `rounds(bytes32, uint256) public` → `RoundInfo { result, state, completed }`
- `currentRound(bytes32) public`, `roundVoteCount(bytes32, uint256) public`

Parámetros de gobernanza (constructor):
- `address reputationSystem_`
- `uint256 quorumThreshold_`
- `uint256 superMajorityBps_` (6667 = 66,67%)
- `uint256 reopenThreshold_` (3)

Constantes: `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`, `RETROACTIVE_DELTA=1`, `RETROACTIVE_CAP=3`

Definition of done:
- [x] Tests: voto exitoso, duplicado (revert), sin reputación (revert), VotingNotOpen (revert)
- [x] Tests DEFINITIVE: supermayoría → efectos reputacionales +5/−3 correctos
- [x] Tests DISPUTED: quórum sin supermayoría → sin efectos reputacionales
- [x] Tests PENDING: votos < quórum → sin consenso
- [x] Tests requestReopen: acumula hasta threshold → nueva ronda; falla si ya votó / ya solicitó / estado PENDING
- [x] Tests claimRetroactiveReputation: +1 confirmatoria, −1 contradictoria, cap ±3 respetado
- [x] Tests E2E multironda: ronda 1 → reapertura → ronda 2 → claim retroactivo
- [x] 32 tests, 96.25% de cobertura
- [x] Módulo Ignition con 4 parámetros (incluyendo reopenThreshold=3)

---

### Sprint 4 — ReputationSystem (OE4) `[DONE]`

**Objetivo:** contrato de reputación con control de acceso por roles (OpenZeppelin AccessControl).

**HU-4.1** — Como ValidationRegistry, quiero aumentar la reputación de un validador que acertó.
- `increaseReputation(address validator, uint256 amount) external onlyRole(VALIDATOR_ROLE)`
- Emite `ReputationUpdated(address indexed validator, uint256 newScore, bool increased)`

**HU-4.2** — Como ValidationRegistry, quiero disminuir la reputación de un validador que falló.
- `decreaseReputation(address validator, uint256 amount) external onlyRole(VALIDATOR_ROLE)`
- No reduce por debajo de 0

**HU-4.3** — Como administrador, quiero registrar una dirección como validador con una reputación inicial configurable (útil para bootstrapping y testing).
- `registerValidator(address validator, uint256 initialReputation) external onlyRole(DEFAULT_ADMIN_ROLE)`

**HU-4.4** — Consultas públicas:
- `getReputation(address) external view returns (uint256)`
- `canValidate(address) external view returns (bool)` — true si reputación ≥ MIN_REPUTATION_TO_VALIDATE
- `isRegisteredValidator(address) public`

Constantes:
```solidity
uint256 public constant MIN_REPUTATION_TO_VALIDATE = 10;
uint256 public constant REPUTATION_REWARD           = 5;
uint256 public constant REPUTATION_PENALTY          = 3;
bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
```

Definition of done:
- [x] Tests: incremento, decremento, suelo en 0, registro, consultas, acceso denegado sin rol (revert)
- [x] Escenario Sybil: dirección nueva sin reputación no puede validar
- [x] 22 tests, 100% de cobertura
- [x] VALIDATOR_ROLE asignado a ValidationRegistry en el script de deploy

---

### Sprint 5 — Integración y auditoría de contratos (OE4) `[DONE]`

**Objetivo:** los 3 contratos integrados y testeados exhaustivamente en red local; auditoría estática superada; ABIs listos para backend y frontend.

**HU-5.0** — Corrección de bug en `claimRetroactiveReputation` (detectado en revisión Sprint 3):
- En `ValidationRegistry.sol`, cambiar `_retroLastRound[contentHash][msg.sender] = latestRound;`
  por `_retroLastRound[contentHash][msg.sender] = latestRound + 1;` para que la siguiente
  reclamación arranque en la ronda genuinamente nueva y no re-procese la última ya contabilizada.
- Actualizar el test «segunda reclamación procesa solo las rondas nuevas» en
  `test/ValidationRegistry.ts`: el `netDelta` esperado pasa de 2 a 1 (solo la ronda nueva).

**HU-5.1** — Módulo Ignition unificado: un solo `deploy` levanta los 3 contratos en el orden correcto y configura el `VALIDATOR_ROLE`.
- `blockchain/ignition/modules/NewsEra.ts` despliega PublicationRegistry → ReputationSystem → ValidationRegistry y llama `grantRole(VALIDATOR_ROLE, validationRegistry.address)`

**HU-5.2** — Flujo E2E on-chain en Hardhat Network: publicar → N validadores votan → quórum → consenso DEFINITIVE → reputación actualizada correctamente.

**HU-5.3** — Flujo E2E multironda: ronda 1 DEFINITIVE → requestReopen × `reopenThreshold` → ronda 2 → claimRetroactiveReputation → delta correcto.

**HU-5.4** — Escenarios de ataque:
- Sybil: 5 direcciones nuevas intentan validar sin reputación → todas revierten con `InsufficientReputation`
- Whitewashing: validador penalizado abandona dirección → nueva dirección empieza en 0, no puede validar

**HU-5.5** — Análisis estático: `slither blockchain/contracts/ --exclude-dependencies` sin findings High/Critical.

**HU-5.6** — ABIs exportados a `blockchain/artifacts/` en formato JSON consumible por el backend y el frontend.

Definition of done:
- [x] Módulo Ignition unificado funcional en red local
- [x] Tests E2E flujo básico (publicar → votar → consenso → reputación)
- [x] Tests E2E flujo multironda (requestReopen → nueva ronda → claimRetroactiveReputation)
- [x] Tests de ataque Sybil y whitewashing
- [x] Cobertura global contratos ≥ 80% (`npx hardhat coverage`) — 75 tests pasando en total
- [x] Workflow de Slither configurado en CI (`.github/workflows/slither.yml`)
- [x] Script `export-abis` disponible (`npm run export-abis`)

---

### Sprint 6 — Reputación (II): recompensa por publicación y acceso meritocrático (OE3/OE4) `[DONE]`

**Objetivo:** ampliar `ValidationRegistry` para que la reputación también se gane publicando contenido veraz, y ofrecer una vía de acceso a validador sin necesidad de publicar ni de bootstrapping manual del administrador.

**HU-6.1** — Recompensa/penalización por publicación:
- En el mismo punto donde `_checkConsensus` resuelve `DEFINITIVE`, si es la primera vez que ese `contentHash` lo alcanza, leer el autor con `PublicationRegistry.getPublication(contentHash).author` y aplicar:
  - `TRUE` → `increaseReputation(author, PUBLISH_REPUTATION_REWARD)` (+8)
  - `UNVERIFIABLE` → `decreaseReputation(author, PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE)` (−8)
  - `FALSE` → `decreaseReputation(author, PUBLISH_REPUTATION_PENALTY_FALSE)` (−15)
  - `DISPUTED` → sin efecto
- Nuevo flag `mapping(bytes32 => bool) private _authorRewarded` para que reaperturas posteriores no reevalúen el efecto.
- `ValidationRegistry` necesita una nueva dependencia de solo lectura hacia `PublicationRegistry` (parámetro adicional en el constructor).

**HU-6.2** — Predicciones (acceso meritocrático sin publicar):
- `submitPrediction(bytes32 contentHash, uint8 vote) external` — revert `NotEligibleForPrediction` si `canValidate(msg.sender) == true`; revert `VotingNotOpen` si el estado no es `PENDING`; revert `AlreadyValidated` si ya predijo o votó ese artículo.
- No incrementa `roundVoteCount` ni participa en el cálculo de quórum/supermayoría.
- Emite `PredictionSubmitted(bytes32 indexed contentHash, address indexed predictor, uint8 vote, uint256 round)`.
- Se resuelve **automáticamente** (no *pull*) en el mismo bloque en que su ronda alcanza `DEFINITIVE`, junto con los votantes reales: acierto `+PREDICTION_REWARD` (+1), fallo `-PREDICTION_PENALTY` (−1), `DISPUTED` sin efecto. Ver razonamiento de por qué no es *pull* en la memoria (§ValidationRegistry) — evita que el predictor solo reclame sus aciertos.

**HU-6.3** — Nuevas constantes: `PUBLISH_REPUTATION_REWARD=8`, `PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE=8`, `PUBLISH_REPUTATION_PENALTY_FALSE=15`, `PREDICTION_REWARD=1`, `PREDICTION_PENALTY=1`.

**HU-6.4** — Actualizar el módulo Ignition (`NewsEra.ts`) para pasar la dirección de `PublicationRegistry` al constructor de `ValidationRegistry`.

Definition of done:
- [x] Tests: recompensa `+8` al autor cuando la ronda resuelve `TRUE`
- [x] Tests: penalización `−8` al autor cuando resuelve `UNVERIFIABLE`
- [x] Tests: penalización `−15` al autor cuando resuelve `FALSE`
- [x] Tests: sin efecto sobre el autor cuando resuelve `DISPUTED`
- [x] Tests: la recompensa/penalización no se reaplica en una reapertura posterior del mismo artículo
- [x] Tests: `submitPrediction` revierte si el predictor ya puede votar (`canValidate == true`)
- [x] Tests: predicción resuelta automáticamente al alcanzar `DEFINITIVE`, con efecto simétrico ±1
- [x] Tests: una dirección que solo predice puede acumular reputación hasta alcanzar `MIN_REPUTATION_TO_VALIDATE` y pasar a `submitValidation`
- [x] Cobertura ≥ 80% mantenida tras la ampliación — 96.97% statements / 88.46% branch tras la ampliación (91 tests, 0 fallos)
- [x] Módulo Ignition actualizado con la nueva dependencia entre contratos — desplegado en Docker (`make hardhat && make deploy-local`)

**Nota de implementación:** también se añadió el guard simétrico `_hasPredicted` en
`submitValidation` (no solo en `submitPrediction`), de modo que una dirección que ya
predijo un artículo tampoco pueda votarlo después — coherente con la invariante ya
existente de que `_hasVoted` es global por artículo, no por ronda.
Se eliminó `ignition/modules/ValidationRegistry.ts` (módulo Sprint 3, ya no compilable
tras el 5º parámetro del constructor y completamente sustituido por `NewsEra.ts` desde
el Sprint 5).

---

### Sprint 7 — Backend: API REST + indexador (OE2) `[DONE]`

**Objetivo:** API Hono + Prisma + PostgreSQL en Docker con indexador de eventos on-chain,
con la superficie completa definida en el ERS de la memoria (Capítulo 4, §4.1 y
Anexo A — 42 casos de uso).

**HU-7.0** — Corrección y ampliación del schema Prisma (alinear con el ERS):
- `Publication`: añadir `consensusState` (`"PENDING"|"DEFINITIVE"|"DISPUTED"`,
  default `"PENDING"`), `currentRound` (default `1`), `reopenRequestCount`
  (default `0`), relación `rounds Round[]`
- `Validator`: añadir `registeredAt DateTime @default(now())`
- Nuevo modelo `Round` — historial de rondas por publicación
- Nuevo modelo `UserProfile` — perfil enriquecido, sin contraseña
- Nuevo modelo `Favorite` — artículos guardados por el usuario
- Nuevo modelo `Follow` — artículos seguidos para recibir notificaciones (distinto
  de `Favorite`: seguir no implica guardar como favorito ni viceversa)
- Nuevo modelo `Notification` — generada por el indexador (HU-7.3)
- El bloque de esquema de HU-7.1 sustituye por completo al anterior; no mantener
  los campos `ReopenRequest.count` ni `RetroactiveClaim.claimedAt` que aparecían
  en versiones previas de este documento — no existían en el `schema.prisma` real
  y han quedado eliminados de la definición.

**HU-7.1** — Infraestructura base:
- `docker-compose.yml` con PostgreSQL 16
- `prisma/schema.prisma` con el esquema completo (tras HU-7.0)
- Servidor Hono arrancando en `localhost:3001`

Schema Prisma objetivo (tras HU-7.0):
```prisma
model Publication {
  id                 Int             @id @default(autoincrement())
  contentHash        String          @unique
  title              String
  body               String
  authorAddress      String
  tags               String[]
  ipfsCid            String?
  consensusState     String          @default("PENDING")
  currentRound       Int             @default(1)
  reopenRequestCount Int             @default(0)
  createdAt          DateTime        @default(now())
  validations        Validation[]
  reopenRequests     ReopenRequest[]
  rounds             Round[]
  favorites          Favorite[]
  follows            Follow[]
  @@map("publications")
}
// Nota de implementación: currentRound se crea en 0 (no en el default de
// esquema 1) para los registros generados por el indexador o por POST
// /publications — las rondas on-chain (ValidationRegistry.currentRound)
// empiezan en 0, no en 1.

model Round {
  id          Int         @id @default(autoincrement())
  contentHash String
  round       Int
  state       String      @default("PENDING")
  result      String?
  completed   Boolean     @default(false)
  publication Publication @relation(fields: [contentHash], references: [contentHash])
  @@unique([contentHash, round])
  @@map("rounds")
}

model Validation {
  id               Int         @id @default(autoincrement())
  contentHash      String
  validatorAddress String
  vote             String      // "TRUE" | "FALSE" | "UNVERIFIABLE"
  round            Int         @default(0)
  txHash           String?
  createdAt        DateTime    @default(now())
  publication      Publication @relation(fields: [contentHash], references: [contentHash])
  @@unique([contentHash, validatorAddress])
  @@map("validations")
}

model Validator {
  address         String   @id
  reputationScore Int      @default(0)
  lastSyncBlock   BigInt   @default(0)
  registeredAt    DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@map("validators")
}

model ReopenRequest {
  id               Int         @id @default(autoincrement())
  contentHash      String
  requesterAddress String
  txHash           String?
  createdAt        DateTime    @default(now())
  publication      Publication @relation(fields: [contentHash], references: [contentHash])
  @@unique([contentHash, requesterAddress])
  @@map("reopen_requests")
}

model RetroactiveClaim {
  id               Int      @id @default(autoincrement())
  contentHash      String
  validatorAddress String
  netDelta         Int
  txHash           String?
  createdAt        DateTime @default(now())
  @@unique([contentHash, validatorAddress, txHash])
  @@map("retroactive_claims")
}

model UserProfile {
  address     String   @id
  displayName String?
  avatarUrl   String?
  email       String?
  updatedAt   DateTime @updatedAt
  @@map("user_profiles")
}

model Favorite {
  id          Int      @id @default(autoincrement())
  userAddress String
  contentHash String
  createdAt   DateTime @default(now())
  @@unique([userAddress, contentHash])
  @@map("favorites")
}

model Follow {
  id          Int      @id @default(autoincrement())
  userAddress String
  contentHash String
  createdAt   DateTime @default(now())
  @@unique([userAddress, contentHash])
  @@map("follows")
}

model Notification {
  id          Int      @id @default(autoincrement())
  userAddress String
  contentHash String
  type        String   // "REOPENED" | "CONSENSUS_REACHED" | "RETROACTIVE_APPLIED"
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  @@map("notifications")
}

// Bookkeeping interno del indexador (no forma parte del catálogo de datos
// del ERS): último bloque procesado, para reanudar en vez de reprocesar
// el historial completo en cada reinicio del backend.
model IndexerState {
  id                 Int    @id @default(1)
  lastProcessedBlock BigInt @default(0)
  @@map("indexer_state")
}
```

**HU-7.2** — Endpoints núcleo de publicaciones y validadores:
- `GET /api/v1/publications` — lista con paginación (`page`, `limit`) y filtros
  opcionales `state` (consensusState), `tags`, `author`, `sort` (`recent`|`votes`|`state`)
- `GET /api/v1/publications/:hash` — detalle con historial de rondas (`rounds`)
  y validaciones agrupadas por ronda
- `POST /api/v1/publications` — registra contenido + `ipfsCid`; verifica que el
  hash existe on-chain
- `GET /api/v1/validators` — ranking por reputación descendente
- `GET /api/v1/validators/:address` — perfil: reputación, nº validaciones, % aciertos
- `GET /api/v1/validators/:address/history` — historial de validaciones con ronda,
  clasificado en ganada/perdida/sin resolver (DISPUTED nunca cuenta como ganada
  ni perdida)
- `GET /api/v1/validators/:address/reputation-history` — serie temporal de
  variaciones de reputación (evento `ReputationUpdated` con bloque y delta)
- `POST /api/v1/publications/:hash/reopen-request` — registra solicitud de reapertura
- `POST /api/v1/publications/:hash/claim-retroactive` — registra reclamación retroactiva

**HU-7.3** — Indexador de eventos (viem `watchContractEvent`):
- `PublicationRegistered` → upsert en publications
- `ValidationSubmitted` → insert en validations (incluye `round`)
- `ConsensusReached` → update `consensusState`/crea o cierra fila en `rounds`
  (incluye `round`); genera `Notification` (`type: "CONSENSUS_REACHED"`) para
  cada dirección con `Follow` o `Validation` sobre ese `contentHash`
- `ReputationUpdated` → update reputationScore en validators
- `ReopenRequested` → insert en reopen_requests; actualiza `reopenRequestCount`
- `VotingReopened` → update `currentRound` en publications, abre nueva fila en
  `rounds`; genera `Notification` (`type: "REOPENED"`) para cada dirección con
  `Follow` o `Validation` sobre ese `contentHash`
- `RetroactiveClaimed` → insert en retroactive_claims; genera `Notification`
  (`type: "RETROACTIVE_APPLIED"`) para el validador que reclamó
- Al arrancar: procesa eventos históricos desde `deployBlock`

**HU-7.4** — IPFS/Pinata: `POST /api/v1/publications` acepta `ipfsCid` opcional.

**HU-7.6** — Re-sincronización manual del indexador (uso interno, protegido):
- `POST /api/v1/sync/events` — dispara una re-indexación desde `lastSyncBlock` hasta el bloque actual; requiere `Authorization: Bearer <SERVICE_TOKEN>`. Uso interno (no expuesto en el cliente).

**HU-7.5** — Perfil enriquecido, favoritos, notificaciones y seguimiento:
- `GET /api/v1/profile/:address` — perfil enriquecido público (`displayName`,
  `avatarUrl`; el `email` nunca se expone en lectura pública)
- `PUT /api/v1/profile/:address` — actualiza `displayName`/`avatarUrl`/`email`;
  requiere `{ signature, message }` firmado con `personal_sign` por la propia
  dirección; responde `403 FORBIDDEN` si la firma no corresponde
- `GET /api/v1/profile/:address/favorites` — lista de artículos favoritos
- `POST /api/v1/favorites/:hash` — añade a favoritos (`{ userAddress }`)
- `DELETE /api/v1/favorites/:hash` — quita de favoritos (`{ userAddress }`)
- `POST /api/v1/publications/:hash/follow` — sigue un artículo (`{ userAddress }`)
- `DELETE /api/v1/publications/:hash/follow` — deja de seguir un artículo
- `GET /api/v1/profile/:address/notifications` — lista de notificaciones
- `PATCH /api/v1/notifications/:id/read` — marca una notificación como leída

> **Crítico:** el backend NO firma transacciones. Las escrituras on-chain las ejecuta el frontend con la cartera del usuario.

Definition of done:
- [x] `docker compose up -d && npm run dev` sin errores — `make postgres && make hardhat && make deploy-local`, backend vía `make backend` (Docker) o `npm run dev` en host
- [x] `prisma migrate dev` aplica el esquema de HU-7.0 sin errores
- [x] Todos los endpoints (HU-7.2 y HU-7.5) responden con datos reales de Hardhat Network local
- [x] Indexador procesa eventos históricos desde `deployBlock` al arrancar, incluyendo generación de notificaciones
- [x] `PUT /api/v1/profile/:address` rechaza firmas inválidas o de otra dirección
- [x] Tests de integración con base de datos real (no mocks) — 9 tests, `make test-backend`

**Notas de implementación (desviaciones respecto al prompt original, documentadas para trazabilidad):**
- Capa de **servicios** añadida entre routers y repositorios (`src/services/*.service.ts`), conforme a la arquitectura de 3 capas de CLAUDE.md §5 (Router → Services → Repositories) — el prompt de sprint la omitía por brevedad, pero el router nunca debe acceder a Prisma directamente.
- `docker-compose.yml`: el servicio `backend` usa **la raíz del repo como build context** (`context: ., dockerfile: backend/Dockerfile`), porque el backend depende de `docs/abis/` que vive fuera de `backend/`. Se añadió un `.dockerignore` en la raíz para no copiar `node_modules` del host (Windows) sobre los instalados en el contenedor (linux-musl), y un `RUN npx prisma generate` dentro del Dockerfile para regenerar el motor de Prisma con la plataforma correcta.
- PostgreSQL de Docker remapeado a **puerto 5433** en el host (`5433:5432`) — puerto 5432 ya estaba ocupado por una instancia nativa de PostgreSQL preexistente en la máquina de desarrollo; el puerto interno del contenedor y las conexiones backend↔postgres dentro de la red Docker siguen siendo 5432.
- `lib/viem.ts` corregido (D4): ahora soporta `NETWORK=local` (Hardhat, vía `RPC_URL_LOCAL`) además de `NETWORK=sepolia` (vía `RPC_URL_SEPOLIA`); antes solo configuraba Sepolia y con una variable de entorno con nombre distinto al documentado (`SEPOLIA_RPC_URL` en vez de `RPC_URL_SEPOLIA`).
- Nuevo modelo `IndexerState` (bookkeeping interno, no forma parte del catálogo de datos del ERS): persiste el último bloque procesado para que un reinicio del backend reanude en vez de reprocesar el historial completo desde `DEPLOY_BLOCK` — sin esto, cada reinicio duplicaba las notificaciones generadas por el indexador.
- El indexador se suscribe/consulta **por contrato** (todo el ABI), no por nombre de evento por separado: eventos relacionados emitidos en la misma transacción (p.ej. `ReopenRequested` + `VotingReopened`) deben procesarse en el orden de `logIndex` real; separarlos en watches/queries independientes por evento rompía ese orden causal y corrompía `reopenRequestCount`.
- `handleReopenRequested` fija el valor **absoluto** de `count` emitido por el evento en vez de incrementar de forma relativa, e inserciones de `ReopenRequest`/`RetroactiveClaim` desde el indexador usan `upsert` — necesario para que el reprocesado (reinicio, `POST /sync/events`) sea idempotente.
- `notificationRepository.createMany` no crea una notificación duplicada si ya existe una sin leer para el mismo `(userAddress, contentHash, type)` — red de seguridad adicional, ya que el modelo `Notification` no distingue de qué ronda proviene (RD-20).
- Todas las direcciones Ethereum se normalizan a checksum EIP-55 (`lib/address.ts`) en el límite de los servicios: las direcciones son case-insensitive pero PostgreSQL compara texto exacto, y sin esto la misma dirección en distinto casing se trataba como dos entidades distintas.
- `validators.list`/`getByAddress` excluyen `lastSyncBlock` de la respuesta pública: es un `BigInt` de Prisma (no serializable en `JSON.stringify`) y un campo de bookkeeping interno (RD-13), no parte de la API pública.
- Manejo de errores centralizado con `app.onError(...)` (patrón idiomático de Hono), no con `app.use(middleware)` — un middleware normal con `try/await next()/catch` no envuelve de forma fiable las rutas montadas vía `app.route()`.

---

### Sprint 8 — Frontend: SPA React + Vite (OE5) `[ TODO ]`

**Objetivo:** interfaz SPA funcional conectada a la blockchain y al backend.

Setup: React 18 + Vite + TypeScript, wagmi v2, viem, @tanstack/react-query, @rainbow-me/rainbowkit, react-router-dom, tailwindcss, shadcn/ui.

**HU-8.1** — Layout raíz: RainbowKit `ConnectButton` + React Router `<Outlet>`. wagmi config con Hardhat Network local (se actualizará a Sepolia en Sprint 9). Dirección activa disponible en toda la app via `useAccount()`.

**HU-8.2** — Ruta `/` — Feed: lista de publicaciones del backend, paginación, estado de consenso y nº de votos por tarjeta.

**HU-8.3** — Ruta `/publish` — Formulario de publicación (requiere cartera), plantilla
estándar de redacción (UC~12):
1. Campos: título, cuerpo, etiquetas libres (UC~14), enlaces internos a otros
   artículos de NewsEra (UC~15), referencias bibliográficas (UC~16)
2. Guardar borrador localmente sin publicar (UC~13); recuperarlo al reabrir la ruta
3. Vista previa con el formato final antes de confirmar (UC~17)
4. Calcular `keccak256(body)` con viem y mostrarlo al usuario antes de firmar (UC~18)
5. Subir cuerpo a IPFS via Pinata → obtener `ipfsCid`
6. `useWriteContract` → `PublicationRegistry.registerPublication(contentHash)`
7. `useWaitForTransactionReceipt` espera confirmación on-chain; si revierte con
   `PublicationAlreadyExists`, informar sin perder el borrador
8. `POST /api/v1/publications` con `{contentHash, ipfsCid, title, body, tags}`

**HU-8.4** — Ruta `/article/:hash` — Detalle, validación multironda y herramientas
de verificación:
- Carga artículo del backend con historial de rondas (resultado y estado de cada una)
- Bibliografía y enlaces internos citados, con acceso directo (UC~32)
- Artículos relacionados por etiqueta compartida (UC~33)
- Progreso hacia el quórum: votos emitidos / `quorumThreshold` (UC~38)
- Lista de validadores que ya han votado en la ronda actual, sin revelar el
  sentido del voto (`getRoundVoters`, UC~39)
- Si estado es PENDING y `canValidate(address)` y no ha votado: botones TRUE / FALSE / UNVERIFIABLE,
  con el efecto reputacional estimado antes de confirmar (UC~40)
- `useWriteContract` → `ValidationRegistry.submitValidation(contentHash, vote)`; maneja error `VotingNotOpen`
- Si estado es DEFINITIVE o DISPUTED y no ha votado ni solicitado reapertura: botón "Solicitar reapertura"
- `useWriteContract` → `ValidationRegistry.requestReopen(contentHash)`; muestra contador de solicitudes acumuladas
- Botón de favorito (`POST`/`DELETE /api/v1/favorites/:hash`, UC~31) y de
  seguir artículo (`POST`/`DELETE /api/v1/publications/:hash/follow`, UC~29)
- Botón de compartir enlace directo (UC~30)

**HU-8.5** — Ruta `/validators` — Ranking por reputación, con ordenación (UC~28) y
búsqueda/filtro básico.

**HU-8.6** — Ruta `/validators/:address` — Perfil público: reputación, nº validaciones,
% aciertos, historial por ronda, `displayName`/`avatarUrl` del perfil enriquecido
(si existe) y artículos publicados por esa dirección (UC~26).

**HU-8.7** — Ruta `/profile` — Panel personal (requiere cartera):
- Reputación propia y su evolución histórica (gráfico o listado cronológico, UC~6, UC~7)
- Historial de validaciones por ronda, clasificado en ganadas/perdidas/sin resolver
  (las rondas DISPUTED no cuentan como ganada ni perdida), con métricas de acierto (UC~5)
- Botón "Reclamar reputación retroactiva" para artículos con rondas posteriores no
  reclamadas; `useWriteContract` → `ValidationRegistry.claimRetroactiveReputation(contentHash)`;
  muestra el delta neto estimado antes de reclamar (UC~8, UC~37)
- Listado de solicitudes de reapertura realizadas y su estado (UC~9)
- Listado de artículos publicados propios (UC~4)

**HU-8.8** — Edición de perfil enriquecido (dentro de `/profile`, UC~2):
- Formulario de `displayName`, `avatarUrl`, `email` (opcional)
- Al guardar, solicita firma `personal_sign` de un mensaje que incluye los datos
  a actualizar; envía `{ signature, message }` a
  `PUT /api/v1/profile/:address`. Sin contraseña, sin transacción on-chain

**HU-8.9** — Favoritos (dentro de `/profile`, UC~3): listado paginado de artículos
guardados vía `GET /api/v1/profile/:address/favorites`, con acceso directo a cada
uno y opción de quitarlos.

**HU-8.10** — Notificaciones (UC~10): panel accesible desde la cabecera con
`GET /api/v1/profile/:address/notifications`; marcar como leída con
`PATCH /api/v1/notifications/:id/read`. Estado vacío si no hay notificaciones.

Definition of done:
- [ ] Todas las rutas renderizan sin errores con Hardhat Network local
- [ ] Flujo de publicación E2E funcional, incluyendo borrador y vista previa
- [ ] Flujo de validación E2E funcional
- [ ] Favoritos, seguimiento y notificaciones funcionales end-to-end contra el backend
- [ ] Edición de perfil enriquecido verifica la firma antes de persistir
- [ ] Estados de carga y error manejados (no pantallas en blanco)
- [ ] Legible en móvil

---

### Sprint 9 — Integración, despliegue Sepolia y métricas (OE7) `[ TODO ]`

**Objetivo:** sistema completo integrado y verificable en Sepolia; métricas reales listas para la memoria del TFG.

**HU-9.1** — Despliegue en Sepolia con Hardhat Ignition. Guardar en `blockchain/deployments/sepolia.json`:
```json
{
  "PublicationRegistry": "0x...",
  "ValidationRegistry":  "0x...",
  "ReputationSystem":    "0x...",
  "deployBlock":         0,
  "network":             "sepolia"
}
```
Verificar los contratos en Etherscan Sepolia. Actualizar wagmi config del frontend para apuntar a Sepolia.

**HU-9.2** — Flujo E2E completo verificado manualmente sobre Sepolia: publicar → IPFS → on-chain → visible en feed → validar → reputación actualizada.

**HU-9.3** — Exportar `docs/metricas.json` con valores reales (generado con `node scripts/generar-metricas.js`):
```json
{
  "fecha": "YYYY-MM-DD",
  "red": "Sepolia",
  "sprint": "Sprint 9",
  "bloque_despliegue": 0,
  "contratos": {
    "addresses": {
      "PublicationRegistry": "0x...",
      "ValidationRegistry":  "0x...",
      "ReputationSystem":    "0x..."
    },
    "gas": {
      "registerPublication":          0,
      "submitValidation":             0,
      "requestReopen":                0,
      "claimRetroactiveReputation":   0,
      "submitPrediction":             0,
      "increaseReputation":           0,
      "decreaseReputation":           0,
      "media":                        0
    },
    "cobertura": 0
  },
  "tests": {
    "pasados": 0,
    "totales": 0
  },
  "loc": {
    "solidity": 0,
    "backend":  0,
    "frontend": 0
  }
}
```

**HU-9.4** — `hardhat-gas-reporter` configurado; costes de cada función capturados en `docs/metricas.json`.

**HU-9.5** — `README.md` con instrucciones de arranque local y de Sepolia + `.env.example` con todas las variables.

Definition of done:
- [ ] 3 contratos desplegados y verificados en Etherscan Sepolia
- [ ] `blockchain/deployments/sepolia.json` actualizado con addresses y deployBlock reales
- [ ] Flujo E2E completo sin errores sobre Sepolia
- [ ] `metricas.json` relleno con valores reales de Sepolia
- [ ] `README.md` operativo (instrucciones local + Sepolia)
- [ ] `.env.example` completo

---

### Variables de entorno (`.env.example`)

```bash
# backend
DATABASE_URL="postgresql://newsera:newsera@localhost:5432/newsera"
PUBLICATION_REGISTRY_ADDRESS=0x...
VALIDATION_REGISTRY_ADDRESS=0x...
REPUTATION_SYSTEM_ADDRESS=0x...
RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/TU_KEY

# frontend
VITE_PUBLICATION_REGISTRY_ADDRESS=0x...
VITE_VALIDATION_REGISTRY_ADDRESS=0x...
VITE_REPUTATION_SYSTEM_ADDRESS=0x...
VITE_BACKEND_URL=http://localhost:3001
VITE_PINATA_JWT=...

# contracts / Hardhat
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_KEY
ETHERSCAN_API_KEY=...
```

---

### Trabajo futuro (fuera del alcance del TFG)

- **The Graph Protocol** — sustituir el indexador centralizado por un subgrafo descentralizado
- **DIDs / VCs W3C** — resistencia Sybil de nivel producción
- **Layer 2 (Arbitrum / Polygon)** — reducir costes de gas en uno o dos órdenes de magnitud
- **Rotación de quórum / decaimiento de reputación** — mitigar concentración de poder por validadores con alta reputación coordinados
- **zkML / oracle veredicto automatizado** — `AI_VERDICT` como cuarto tipo de voto verificado on-chain; ver Sección 14

---

## 15. ERS y catálogo de casos de uso

Los documentos formales de requisitos derivados de la memoria del TFG (Capítulo 4, §4.1 y Anexo A) se encuentran en:

- **`docs/ERS.md`** — Especificación de Requisitos de Software: RNF 1–27, RD 1–24, RI 1–12, tabla de discrepancias detectadas.
- **`docs/casos-de-uso.md`** — Catálogo completo de los 42 casos de uso (UC 1–42) con actor, precondiciones, flujo principal, flujos alternativos y postcondiciones.

### Resumen de requisitos clave para el desarrollo

**Seguridad (no negociable):**
- RNF 3/4: ningún componente almacena claves privadas; el backend nunca firma transacciones.
- RNF 5: Slither sin findings High/Critical.
- RNF 6: control de acceso siempre mediante `AccessControl` (roles), nunca ad-hoc.
- RNF 8: datos on-chain son inmutables; los contratos no exponen funciones de borrado ni edición.

**UX (obligatorio, Sprint 8):**
- RNF 14/RI 5: todo estado de carga y error explícito, sin pantallas en blanco.
- RI 7: errores de revert conocidos traducidos a lenguaje natural.
- RI 6: toda operación que requiera firma muestra el hash de transacción y su estado mediante `useWaitForTransactionReceipt`.

**Datos (invariantes de diseño):**
- RD 1: PostgreSQL es réplica de solo lectura; la blockchain es la fuente de verdad.
- RD 6: `keccak256(body) == contentHash`; cualquier discrepancia invalida el registro.
- RD 18: UserProfile sin contraseña — toda modificación requiere firma `personal_sign`.

### Discrepancias identificadas (ver `docs/ERS.md` §5)

| # | Área | Estado |
|---|------|--------|
| D1 | `generar-metricas.js` no extraía gas de `requestReopen`, `claimRetroactiveReputation`, `submitPrediction` | Resuelto |
| D2 | `POST /api/v1/sync/events` (re-sincronización manual del indexador) en la memoria pero ausente de HU-7.x | Resuelto — HU-7.6 |
| D3 | `submitPrediction` + recompensa/penalización por publicación no implementados aún | Resuelto — Sprint 6 |
| D4 | `backend/src/lib/viem.ts` solo configuraba Sepolia; falta modo Hardhat Network local | Resuelto — Sprint 7 |
