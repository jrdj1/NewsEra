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
├── docs/         → metricas.json (auto-generado), documentación técnica
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
| Producción futura | Polygon PoS o Arbitrum One | (a decidir en Sprint 8) |
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
      "registerPublication": "<number|null>",
      "submitValidation":    "<number|null>",
      "increaseReputation":  "<number|null>",
      "decreaseReputation":  "<number|null>",
      "media":               "<number|null>"
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
- Estado de consenso: `ConsensusState { PENDING, DEFINITIVE, DISPUTED }`.
  - `PENDING`: votos < `quorumThreshold`. Sigue abierto.
  - `DEFINITIVE`: quórum alcanzado Y opción ganadora ≥ `superMajorityBps` (ej. 6667 = 66,67%). Efectos reputacionales completos.
  - `DISPUTED`: quórum alcanzado pero ninguna opción alcanza supermayoría. Sin efectos reputacionales.
- Parámetros de gobernanza en constructor: `quorumThreshold`, `superMajorityBps`, `minReputationToValidate`.
- Mappings: `consensusState(bytes32 → ConsensusState)`, `consensusResult(bytes32 → VoteType)`.
- `submitValidation(bytes32 contentHash, uint8 vote)`: verifica reputación → registra → evalúa quórum → si DEFINITIVE: actualiza reputaciones simétricamente.
- **Efectos reputacionales simétricos (solo en DEFINITIVE):**
  - Votó la opción ganadora (TRUE, FALSE o UNVERIFIABLE): `+REPUTATION_REWARD`
  - Votó cualquier otra opción (incluido UNVERIFIABLE cuando gana TRUE o FALSE): `−REPUTATION_PENALTY`
- Evento: `ConsensusReached(bytes32 indexed contentHash, uint8 result, uint8 state)`.
- Interactúa con `ReputationSystem` via `VALIDATOR_ROLE`.

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
| `/profile` | Panel personal: reputación propia + historial de validaciones |

---

## 13. Filosofía de desarrollo

- **KISS** — si una tecnología añade complejidad sin aportar valor concreto al prototipo, se descarta.
- **DRY** — no duplicar lógica entre capas.
- **Separación de responsabilidades** — on-chain solo lo que requiere inmutabilidad; off-chain el resto.

## 14. Trabajo futuro identificado (fuera del alcance del TFG)

**The Graph Protocol**: migración del indexador del backend a un subgrafo descentralizado,
eliminando la dependencia del servidor off-chain. No implementar durante el TFG.

---

## Backlog de sprints

> Sprints 0–1 (fundamentos y diseño de arquitectura) completados en la memoria del TFG.
> Sprint 9 (evaluación y memoria) no produce código en este repositorio.
> Este backlog cubre los sprints de implementación: 2–8.

---

### Sprint 2 — PublicationRegistry (OE3) `[ TODO ]`

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
- [ ] Landing page `/` con hero y tres pilares, visible sin cartera conectada
- [ ] Página `/about` con resumen del proyecto y enlace a la memoria
- [ ] `ConnectButton` funcional con MetaMask en red local

---

### Sprint 3 — ValidationRegistry (OE3) `[ TODO ]`

**Objetivo:** contrato de validación con quórum y actualización de reputación.

**HU-3.1** — Como validador con reputación suficiente, quiero emitir un voto sobre una publicación (TRUE / FALSE / UNVERIFIABLE).
- `submitValidation(bytes32 contentHash, uint8 vote) external`
- vote: 0=TRUE, 1=FALSE, 2=UNVERIFIABLE
- Verifica `ReputationSystem.canValidate(msg.sender)` → revert si no cumple
- Revert `AlreadyValidated` si el validador ya votó esa publicación
- Revert `ConsensusAlreadyReached` si el consenso está cerrado
- Emite `ValidationSubmitted(bytes32 indexed contentHash, address indexed validator, uint8 vote)`

**HU-3.2** — Cuando se alcanza el quórum, el contrato evalúa si hay supermayoría y actúa según el estado resultante.
- Si opción ganadora ≥ `superMajorityBps` → consenso `DEFINITIVE`:
  - Emite `ConsensusReached(bytes32 indexed contentHash, uint8 result, uint8 state)`
  - Todos los que votaron la opción ganadora: `increaseReputation` (+REWARD)
  - Todos los que votaron cualquier otra opción (incluido UNVERIFIABLE): `decreaseReputation` (−PENALTY)
- Si quórum alcanzado pero ninguna opción ≥ `superMajorityBps` → consenso `DISPUTED`:
  - Emite `ConsensusReached(bytes32 indexed contentHash, uint8 result, uint8 state)` con state=DISPUTED
  - Sin efectos reputacionales para nadie

**HU-3.3** — Consultas públicas:
- `getValidations(bytes32 contentHash) external view returns (Validation[] memory)`
- `consensusReached(bytes32) public` y `consensusResult(bytes32) public`

Parámetros de gobernanza (configurables en constructor):
- `uint256 public quorumThreshold`
- `uint256 public superMajorityBps` (ej. 6667 = 66,67%)
- `uint256 public minReputationToValidate`

Definition of done:
- [ ] Tests: voto exitoso, duplicado (revert), sin reputación (revert)
- [ ] Tests DEFINITIVE: supermayoría TRUE → TRUE voters +rep, FALSE/UNVERIFIABLE voters −rep
- [ ] Tests DEFINITIVE: supermayoría UNVERIFIABLE → UNVERIFIABLE voters +rep, TRUE/FALSE voters −rep
- [ ] Tests DISPUTED: quórum sin supermayoría → ningún cambio de reputación
- [ ] Tests PENDING: votos < quórum → sin consenso
- [ ] Tests de integración con ReputationSystem desplegado localmente
- [ ] Cobertura ≥ 80%
- [ ] Deploy en red local con los 3 contratos interconectados

---

### Sprint 4 — ReputationSystem (OE4) `[ TODO ]`

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
- [ ] Tests: incremento, decremento, suelo en 0, registro, consultas, acceso denegado sin rol (revert)
- [ ] Escenario Sybil: dirección nueva sin reputación no puede validar
- [ ] Cobertura ≥ 80%
- [ ] VALIDATOR_ROLE asignado a ValidationRegistry en el script de deploy

---

### Sprint 5 — Integración de contratos + auditoría (OE4) `[ TODO ]`

**Objetivo:** los 3 contratos integrados, testeados exhaustivamente y desplegados en Sepolia.

**HU-5.1** — Flujo E2E on-chain: publicar → 3 validadores votan TRUE → consenso → reputación actualizada, verificable en Sepolia.

**HU-5.2** — Ataque Sybil: 5 direcciones nuevas intentan validar sin reputación → todas revierten.

**HU-5.3** — Whitewashing: validador penalizado abandona dirección → nueva dirección empieza en 0, no puede validar hasta acumular 10 puntos.

**HU-5.4** — Análisis estático: `slither blockchain/contracts/ --exclude-dependencies` sin findings High/Critical.

**HU-5.5** — Deploy en Sepolia con Hardhat Ignition. Guardar en `blockchain/deployments/sepolia.json`:
```json
{
  "PublicationRegistry": "0x...",
  "ValidationRegistry":  "0x...",
  "ReputationSystem":    "0x...",
  "deployBlock":         0,
  "network":             "sepolia"
}
```

Definition of done:
- [ ] Cobertura global contratos ≥ 80% (`npx hardhat coverage`)
- [ ] Slither sin findings High/Critical
- [ ] 3 contratos desplegados y verificados en Etherscan Sepolia
- [ ] `blockchain/deployments/sepolia.json` actualizado
- [ ] ABIs exportados a `blockchain/artifacts/` para el backend y el frontend

---

### Sprint 6 — Backend: API REST + indexador (OE2) `[ TODO ]`

**Objetivo:** API Hono + Prisma + PostgreSQL en Docker con indexador de eventos on-chain.

**HU-6.1** — Infraestructura base:
- `docker-compose.yml` con PostgreSQL 16
- `prisma/schema.prisma` con modelos Publication, Validation, Validator
- Servidor Hono arrancando en `localhost:3001`

Schema Prisma:
```prisma
model Publication {
  id            Int          @id @default(autoincrement())
  contentHash   String       @unique
  title         String
  body          String
  authorAddress String
  tags          String[]
  ipfsCid       String?
  createdAt     DateTime     @default(now())
  validations   Validation[]
  @@map("publications")
}

model Validation {
  id               Int         @id @default(autoincrement())
  contentHash      String
  validatorAddress String
  vote             String      // "TRUE" | "FALSE" | "UNVERIFIABLE"
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
  updatedAt       DateTime @updatedAt
  @@map("validators")
}
```

**HU-6.2** — Endpoints:
- `GET /api/v1/publications` — lista con paginación (`page`, `limit`)
- `GET /api/v1/publications/:hash` — detalle con validaciones
- `POST /api/v1/publications` — registra contenido + `ipfsCid`; verifica que el hash existe on-chain
- `GET /api/v1/validators` — ranking por reputación descendente
- `GET /api/v1/validators/:address` — perfil: reputación, nº validaciones, % aciertos
- `GET /api/v1/validators/:address/history` — historial de validaciones

**HU-6.3** — Indexador de eventos (viem `watchContractEvent`):
- `PublicationRegistered` → upsert en publications
- `ValidationSubmitted` → insert en validations
- `ReputationUpdated` → update reputationScore en validators
- Al arrancar: procesa eventos históricos desde `deployBlock`

**HU-6.4** — IPFS/Pinata: `POST /api/v1/publications` acepta `ipfsCid` opcional.

> **Crítico:** el backend NO firma transacciones. Las escrituras on-chain las ejecuta el frontend con la cartera del usuario.

Definition of done:
- [ ] `docker compose up -d && npm run dev` sin errores
- [ ] Todos los endpoints responden con datos reales de Sepolia
- [ ] Indexador procesa eventos históricos desde `deployBlock` al arrancar
- [ ] Tests de integración con base de datos real (no mocks)

---

### Sprint 7 — Frontend: SPA React + Vite (OE5) `[ TODO ]`

**Objetivo:** interfaz SPA funcional conectada a la blockchain y al backend.

Setup: React 18 + Vite + TypeScript, wagmi v2, viem, @tanstack/react-query, @rainbow-me/rainbowkit, react-router-dom, tailwindcss, shadcn/ui.

**HU-7.1** — Layout raíz: RainbowKit `ConnectButton` + React Router `<Outlet>`. wagmi config con Sepolia. Dirección activa disponible en toda la app via `useAccount()`.

**HU-7.2** — Ruta `/` — Feed: lista de publicaciones del backend, paginación, estado de consenso y nº de votos por tarjeta.

**HU-7.3** — Ruta `/publish` — Formulario de publicación (requiere cartera):
1. Calcular `keccak256(body)` con viem
2. Subir cuerpo a IPFS via Pinata → obtener `ipfsCid`
3. `useWriteContract` → `PublicationRegistry.registerPublication(contentHash)`
4. `useWaitForTransactionReceipt` espera confirmación on-chain
5. `POST /api/v1/publications` con `{contentHash, ipfsCid, title, body, tags}`

**HU-7.4** — Ruta `/article/:hash` — Detalle y validación:
- Carga artículo del backend
- Si `canValidate(address)` es true: botones TRUE / FALSE / UNVERIFIABLE
- `useWriteContract` → `ValidationRegistry.submitValidation(contentHash, vote)`

**HU-7.5** — Ruta `/validators` — Ranking por reputación.

**HU-7.6** — Ruta `/validators/:address` — Perfil público: reputación, nº validaciones, % aciertos, historial.

**HU-7.7** — Ruta `/profile` — Panel personal (requiere cartera): reputación propia, historial de validaciones.

Definition of done:
- [ ] Todas las rutas renderizan sin errores con Sepolia conectado
- [ ] Flujo de publicación E2E funcional
- [ ] Flujo de validación E2E funcional
- [ ] Estados de carga y error manejados (no pantallas en blanco)
- [ ] Legible en móvil

---

### Sprint 8 — Integración y métricas (OE7) `[ TODO ]`

**Objetivo:** sistema integrado en Sepolia con métricas listas para la memoria del TFG.

**HU-8.1** — Flujo E2E completo verificado manualmente: publicar → IPFS → on-chain → visible en feed → validar → reputación actualizada.

**HU-8.2** — Exportar `docs/metricas.json` con valores reales (generado con `node scripts/generar-metricas.js`):
```json
{
  "fecha": "YYYY-MM-DD",
  "red": "Sepolia",
  "sprint": "Sprint 8",
  "bloque_despliegue": 0,
  "contratos": {
    "addresses": {
      "PublicationRegistry": "0x...",
      "ValidationRegistry":  "0x...",
      "ReputationSystem":    "0x..."
    },
    "gas": {
      "registerPublication": 0,
      "submitValidation":    0,
      "increaseReputation":  0,
      "decreaseReputation":  0,
      "media":               0
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

**HU-8.3** — `hardhat-gas-reporter` configurado; costes de cada función capturados en `docs/metricas.json`.

**HU-8.4** — `README.md` con instrucciones de arranque + `.env.example` con todas las variables.

Definition of done:
- [ ] Flujo E2E sin errores en Sepolia
- [ ] `metricas.json` relleno con valores reales
- [ ] `README.md` operativo
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
- **Layer 2 (Optimism / Arbitrum)** — reducir costes de gas en uno o dos órdenes de magnitud
- **Rotación de quórum / decaimiento de reputación** — mitigar concentración de poder por validadores con alta reputación coordinados
