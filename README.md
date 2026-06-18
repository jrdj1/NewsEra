# NewsEra

![Notificar memoria](https://github.com/jrdj1/TFG-NewsEra-NewsEra/actions/workflows/notificar-memoria.yml/badge.svg)

Plataforma descentralizada para la validación y difusión de información veraz.

NewsEra construye una infraestructura alternativa estructuralmente resistente a la captura por
cualquier grupo de poder (económico, político o institucional), trasladando las reglas de
publicación, verificación y gobernanza desde entidades controlables hacia contratos inteligentes
desplegados en una blockchain pública.

**TFG** — Jorge Rafael de Julián Vicedo · GII, EPS, Universidad de Alicante · 2026
**Tutor** — Dr. Higinio Mora Mora (DTIC)
**Repo de memoria (LaTeX):** [jrdj1/TFG-NewsEra-memoria](https://github.com/jrdj1/TFG-NewsEra-memoria)

---

## Instalación por capa

### Prerrequisitos
- Node.js 20 LTS
- PostgreSQL 16

### blockchain/

```bash
cd blockchain
npm install
cp .env.example .env   # rellenar SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
npx hardhat compile
npx hardhat test
```

### backend/

```bash
cd backend
npm install
cp .env.example .env   # rellenar DATABASE_URL, PORT
npx prisma migrate dev
npm run dev
```

### frontend/

```bash
cd frontend
npm install
cp .env.example .env   # rellenar NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
npm run dev
```

---

## Variables de entorno

### blockchain/.env
| Variable | Descripción |
|----------|-------------|
| `SEPOLIA_RPC_URL` | URL RPC de Ethereum Sepolia (Alchemy o Infura) |
| `PRIVATE_KEY` | Clave privada de la cuenta de despliegue (sin fondos reales) |
| `ETHERSCAN_API_KEY` | API key de Etherscan para verificación de contratos |

### backend/.env
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `PORT` | Puerto del servidor (por defecto: 3000) |

### frontend/.env
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Project ID de WalletConnect Cloud |

---

## Tests

```bash
# Contratos Solidity
cd blockchain && npx hardhat test
cd blockchain && REPORT_GAS=true npx hardhat test   # con gas report
cd blockchain && npx hardhat coverage               # cobertura (objetivo: ≥ 80%)

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## Arquitectura

```
┌────────────────────────────────────────────────────┐
│ CAPA ON-CHAIN (Ethereum Sepolia)                   │
│  PublicationRegistry · ValidationRegistry          │
│  ReputationSystem                                   │
└────────────────────┬───────────────────────────────┘
                     │ eventos (watchContractEvent)
┌────────────────────▼───────────────────────────────┐
│ CAPA OFF-CHAIN (Hono + PostgreSQL)                 │
│  Indexador de eventos · API REST · Prisma           │
└────────────────────┬───────────────────────────────┘
                     │ HTTP
┌────────────────────▼───────────────────────────────┐
│ CAPA DE PRESENTACIÓN (Next.js 15)                  │
│  Server Components (lectura) · Client Components   │
│  (wagmi + RainbowKit para firma de transacciones)  │
└────────────────────────────────────────────────────┘
```

El **hash keccak256** del contenido es el vínculo entre capas:
la blockchain almacena el hash, el backend almacena el contenido completo.
Cualquier actor puede verificar la integridad comparando ambos.
