# Changelog — NewsEra

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones alineadas con sprints del TFG (Sprint 2 = v0.2.0, etc.).

---

## [Unreleased] — Sprint 5+

### Pendiente
- Módulo Ignition unificado para los 3 contratos (PublicationRegistry + ValidationRegistry + ReputationSystem)
- Análisis estático con Slither (objetivo: sin findings High/Critical)
- Deploy en Sepolia + fichero `blockchain/deployments/sepolia.json`
- ABIs exportados a `blockchain/artifacts/` para backend y frontend
- Backend: API REST con Hono + Prisma + PostgreSQL (Sprint 6)
- Indexador de eventos on-chain con viem `watchContractEvent` (Sprint 6)
- Frontend completo: feed, publicación, detalle, validación, perfiles (Sprint 7)
- `docs/metricas.json` con valores reales + README operativo (Sprint 8)

---

## [0.3.0] — 2026-06-26 — Sprint 3/4 (contratos de validación y reputación)

### Añadido
- `blockchain/contracts/ValidationRegistry.sol` — contrato de validación con gobernanza completa:
  - Enum `ConsensusState { PENDING, DEFINITIVE, DISPUTED }`
  - Enum `VoteType { TRUE, FALSE, UNVERIFIABLE }` — UNVERIFIABLE es veredicto de primera clase
  - Struct `Validation` con tight variable packing (`address` 20b + `VoteType` 1b = 1 slot)
  - Parámetros de gobernanza configurables en constructor: `quorumThreshold`, `superMajorityBps`
  - `submitValidation(bytes32, uint8)` con guards: `ConsensusAlreadyReached`, `InsufficientReputation`, `AlreadyValidated`
  - `_checkConsensus` interno: evalúa quórum → calcula `winnerBps = (winnerVotes * 10000) / total` → DEFINITIVE si ≥ `superMajorityBps`, DISPUTED si no
  - DEFINITIVE: efectos reputacionales simétricos para todos (+REWARD si votó ganador, −PENALTY si no, incluyendo UNVERIFIABLE cuando gana TRUE/FALSE)
  - DISPUTED: quórum alcanzado pero sin supermayoría → sin efectos reputacionales
  - Evento `ConsensusReached(bytes32 indexed, uint8 result, uint8 state)`
  - Consultas: `getValidations`, `hasValidated`, `consensusState`, `consensusResult`
- `blockchain/contracts/ReputationSystem.sol` — contrato de reputación con AccessControl:
  - `VALIDATOR_ROLE` (solo `ValidationRegistry` puede modificar reputaciones)
  - `DEFAULT_ADMIN_ROLE` para `registerValidator` (bootstrapping)
  - Constantes: `MIN_REPUTATION_TO_VALIDATE=10`, `REPUTATION_REWARD=5`, `REPUTATION_PENALTY=3`
  - `increaseReputation` / `decreaseReputation` (suelo en 0, nunca negativo)
  - `canValidate(address)` — resistencia Sybil: cuenta nueva = rep 0 < umbral
  - Evento `ReputationUpdated(address indexed, uint256 newScore, bool increased)`
  - Custom errors: `ValidatorAlreadyRegistered`, `ValidatorNotRegistered`
- `blockchain/test/ValidationRegistry.ts` — 28 tests de integración:
  - `submitValidation`: éxito, AlreadyValidated, InsufficientReputation, ConsensusAlreadyReached (DEFINITIVE y DISPUTED), hashes independientes, `hasValidated`
  - PENDING: sin quórum, sigue abierto
  - DEFINITIVE TRUE/FALSE/UNVERIFIABLE con 3 y 5 votantes; efectos reputacionales verificados
  - UNVERIFIABLE voter penalizado cuando gana TRUE (y viceversa)
  - DISPUTED: 66.6%, 50%, 33.3% — sin cambio de reputación
  - `getValidations`: datos correctos y array vacío
- `blockchain/test/ReputationSystem.ts` — 22 tests unitarios:
  - `registerValidator`: éxito, evento, duplicado (revert), acceso sin rol (revert)
  - `increaseReputation` / `decreaseReputation`: valores exactos, eventos, suelo en 0, acceso sin rol
  - `canValidate`: true/false según umbral, false sin registrar
  - Consultas públicas: `getReputation`, `isRegisteredValidator`
  - Resistencia Sybil: cuenta nueva, penalizado por debajo del umbral, whitewashing
- `blockchain/ignition/modules/ValidationRegistry.ts` — módulo Ignition: despliega ReputationSystem → ValidationRegistry → `grantRole(VALIDATOR_ROLE, validationRegistry)`

### Cambiado
- `blockchain/contracts/ValidationRegistry.sol` — rediseño completo respecto al diseño inicial:
  - `consensusReached: bool` reemplazado por `consensusState: ConsensusState`
  - Lógica de consenso anterior (mayoría simple TRUE vs FALSE, UNVERIFIABLE ignorado) reemplazada por supermayoría configurable con UNVERIFIABLE como opción ganadora
  - Evento `ConsensusReached` añade parámetro `state`
  - Constructor añade parámetro `superMajorityBps_`

### Métricas
- **Total tests:** 50 passing (8 PublicationRegistry + 22 ReputationSystem + 28 ValidationRegistry — 2 integración superpuestos recontados como 50 únicos)
- **Cobertura:** 100% statements / 100% branch / 100% funcs / 100% lines (3 contratos)

---

## [0.2.0] — 2026-06-21/22 — Sprint 2 (PublicationRegistry + frontend base + infra Docker)

### Añadido
- `blockchain/contracts/PublicationRegistry.sol` — registro inmutable de hashes:
  - Struct `Publication` con tight variable packing (`address author` 20b + `uint96 timestamp` 12b = 1 slot, `bool exists` en slot 2)
  - `registerPublication(bytes32)` — revierte con `PublicationAlreadyExists` si hash duplicado
  - `getPublication(bytes32)` — revierte con `PublicationNotFound` si no existe
  - Evento `PublicationRegistered(bytes32 indexed, address indexed, uint256)`
  - Abierto a cualquier dirección (sin control de acceso)
- `blockchain/test/PublicationRegistry.ts` — 8 tests (100% cobertura):
  - Registro exitoso, evento emitido, duplicado (revert), múltiples autores
  - Datos correctos, `author == msg.sender`, not-found para hash inexistente y para hash distinto
- `blockchain/ignition/modules/PublicationRegistry.ts` — módulo Ignition básico
- `blockchain/scripts/verify.ts` — script de verificación manual en red local
- `frontend/src/pages/Feed.tsx` — landing page `/`:
  - Hero con CTA condicional (ConnectButton si desconectado, link a `/publish` si conectado)
  - Tres pilares: Inmutabilidad, Validación colectiva, Resistencia a la captura
- `frontend/src/pages/About.tsx` — página `/about`:
  - Resumen del proyecto, flujo en 3 pasos, tabla de contratos
  - Enlace a la memoria del TFG (`github.com/jrdj1/TFG-NewsEra-memoria`)
  - Sección de autor: Jorge Rafael de Julián Vicedo, Dr. Higinio Mora Mora, UA 2026
- `frontend/src/components/layout/Header.tsx` — cabecera fija con logo, navegación y `ConnectButton` de RainbowKit
- `frontend/src/components/layout/Layout.tsx` — layout raíz con `<Outlet />` y footer
- `frontend/src/App.tsx` — React Router v6 con rutas anidadas bajo `<Layout />`; añadida ruta `/about`
- `frontend/src/lib/wagmi.ts` — wagmi v2 + RainbowKit v2: `chains: [hardhat, sepolia]`, `projectId` con fallback
- `frontend/Dockerfile` — imagen node:20-alpine, puerto 5174
- `blockchain/Dockerfile.node` — imagen node:20-alpine, Hardhat node en 0.0.0.0:8545
- `docker-compose.yml` — tres servicios: `newsera-hardhat` (8545), `newsera-frontend` (5174), `newsera-db` PostgreSQL 16 (5432); healthchecks para los tres
- `Makefile` — 28 targets organizados por categoría: entorno, servicios individuales, logs, blockchain, frontend, métricas, limpieza

### Corregido
- Healthcheck de `hardhat-node`: Alpine busybox wget no soporta `--post-data`; sustituido por request HTTP inline con Node.js
- Healthcheck de `frontend`: busybox resuelve `localhost` como IPv6 `::1` pero Vite solo escucha IPv4; cambiado a `127.0.0.1`
- wagmi config: `chains: [sepolia]` sola no reconoce chainId 31337; añadido `hardhat`
- RainbowKit: `projectId: ""` causa pantalla negra; añadido fallback `"newsera-local-dev"`
- Puerto: movido de 5173 a 5174 (conflicto con otro proyecto)

---

## [0.1.0] — 2026-06-21 — Infraestructura base

### Añadido
- Migración de Next.js a React + Vite SPA (decisión KISS — sin SSR)
- Estructura de directorios: `blockchain/`, `backend/`, `frontend/`, `docs/`, `scripts/`
- `blockchain/hardhat.config.ts` con redes `localhost` (127.0.0.1:8545, chainId 31337) y `sepolia`
- `blockchain/tsconfig.json` con `rootDir: "."` e includes para `ignition/**` y `test/**`
- Stack blockchain: Hardhat ^2.22, OpenZeppelin ^5.x, TypeChain para ethers-v6
- Stack frontend: React 18 + Vite + TypeScript strict, wagmi v2, viem, RainbowKit v2, Tailwind CSS v4, shadcn/ui, React Router v6

---

## [0.0.1] — 2026-06-18 — Inicialización del repositorio

### Añadido
- Estructura vacía del repositorio NewsEra
- `CLAUDE.md` con guía de desarrollo, stack tecnológico, convenciones, backlog de sprints
