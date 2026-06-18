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
├── frontend/     → Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui
│                   + wagmi v2 + viem + RainbowKit
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
npm run dev          # next dev
npm run build        # next build
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
| Base de datos | PostgreSQL | 16 |
| Blockchain client | viem | ^2.x |
| Frontend | Next.js 15 (App Router) | 15.x |
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
| Almacenar texto completo on-chain | Solo hashes `keccak256` |
| El backend firma transacciones en nombre del usuario | El usuario firma con su cartera |
| `localStorage` para claves privadas | Cartera del usuario (MetaMask / WalletConnect) |
| Lógica de negocio en la capa de enrutamiento Hono | Mover a Services |
| Workspaces / monorepo | Las 3 carpetas son proyectos independientes |
| Structs sin Tight Variable Packing | Ordenar `address + uint96` en un slot |
| `"use client"` en componentes que no usan cartera ni estado interactivo | Server Components por defecto |

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
- Gestiona votos (`VoteType { TRUE, FALSE, UNVERIFIABLE }`).
- Interactúa con `ReputationSystem` via `REPUTATION_UPDATER_ROLE`.
- `submitValidation(bytes32 contentHash, uint8 vote)`: verifica reputación → registra → comprueba quórum → actualiza reputaciones.
- Parámetros de gobernanza en constructor: `quorumThreshold`, `minReputationToValidate`.

### ReputationSystem
- Solo `ValidationRegistry` puede modificar reputaciones (`AccessControl`).
- Constantes: `MIN_REPUTATION_TO_VALIDATE=10`, `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`.
- `registerValidator(address, uint256 initialReputation)` para bootstrapping manual.
- Resistencia Sybil: cuenta nueva = reputación 0 < umbral mínimo.
