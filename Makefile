# NewsEra — Makefile
# Uso: make <target>
# Requiere: Docker Desktop, Node.js 20, GNU Make

COMPOSE  := docker compose
HARDHAT  := cd blockchain && npx hardhat

.DEFAULT_GOAL := help

# ─── Ayuda ────────────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo ""
	@echo "NewsEra — comandos disponibles"
	@echo "================================="
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ─── Entorno completo ─────────────────────────────────────────────────────────

.PHONY: up
up: ## Levantar todos los servicios (frontend + hardhat + postgres)
	$(COMPOSE) up -d

.PHONY: down
down: ## Parar todos los servicios
	$(COMPOSE) down

.PHONY: restart
restart: ## Reiniciar todos los servicios
	$(COMPOSE) restart

.PHONY: build
build: ## Reconstruir todas las imagenes Docker
	$(COMPOSE) build

.PHONY: rebuild
rebuild: ## Forzar reconstruccion y arrancar
	$(COMPOSE) up -d --build

# ─── Servicios individuales ───────────────────────────────────────────────────

.PHONY: frontend
frontend: ## Levantar solo el frontend (puerto 5174)
	$(COMPOSE) up frontend -d

.PHONY: hardhat
hardhat: ## Levantar solo el nodo EVM (puerto 8545)
	$(COMPOSE) up hardhat-node -d

.PHONY: postgres
postgres: ## Levantar solo PostgreSQL (puerto 5432)
	$(COMPOSE) up postgres -d

.PHONY: stop-frontend
stop-frontend: ## Parar solo el frontend
	$(COMPOSE) stop frontend

.PHONY: stop-hardhat
stop-hardhat: ## Parar solo el nodo EVM
	$(COMPOSE) stop hardhat-node

# ─── Logs ─────────────────────────────────────────────────────────────────────

.PHONY: logs
logs: ## Ver logs de todos los servicios en tiempo real
	$(COMPOSE) logs -f

.PHONY: logs-frontend
logs-frontend: ## Ver logs del frontend
	$(COMPOSE) logs -f frontend

.PHONY: logs-hardhat
logs-hardhat: ## Ver logs del nodo EVM
	$(COMPOSE) logs -f hardhat-node

.PHONY: logs-postgres
logs-postgres: ## Ver logs de PostgreSQL
	$(COMPOSE) logs -f postgres

# ─── Estado ───────────────────────────────────────────────────────────────────

.PHONY: ps
ps: ## Ver estado de todos los contenedores
	$(COMPOSE) ps

# ─── Blockchain ───────────────────────────────────────────────────────────────

.PHONY: compile
compile: ## Compilar contratos Solidity
	$(HARDHAT) compile

.PHONY: test
test: ## Ejecutar tests de contratos
	$(HARDHAT) test

.PHONY: test-gas
test-gas: ## Tests con gas report (genera blockchain/gas-report.json)
	cd blockchain && REPORT_GAS=true npx hardhat test

.PHONY: coverage
coverage: ## Cobertura de contratos (objetivo >= 80%)
	$(HARDHAT) coverage

.PHONY: deploy-local
deploy-local: ## Desplegar PublicationRegistry en el nodo local Docker
	$(HARDHAT) ignition deploy ignition/modules/PublicationRegistry.ts --network localhost

.PHONY: verify-local
verify-local: ## Verificar contrato en el nodo local (requiere deploy-local previo)
	$(HARDHAT) run scripts/verify.ts --network localhost

.PHONY: deploy-sepolia
deploy-sepolia: ## Desplegar en Sepolia (requiere .env con PRIVATE_KEY y RPC_URL_SEPOLIA)
	$(HARDHAT) ignition deploy ignition/modules/PublicationRegistry.ts --network sepolia

# ─── Frontend (host) ──────────────────────────────────────────────────────────

.PHONY: dev
dev: ## Arrancar frontend en el host (fuera de Docker) en modo dev
	cd frontend && npm run dev -- --port 5174

.PHONY: build-frontend
build-frontend: ## Compilar frontend para produccion
	cd frontend && npm run build

.PHONY: typecheck
typecheck: ## Verificar tipos TypeScript del frontend
	cd frontend && npx tsc -b --noEmit

# ─── Metricas ─────────────────────────────────────────────────────────────────

.PHONY: metricas
metricas: ## Generar docs/metricas.json
	node scripts/generar-metricas.js

# ─── Limpieza ─────────────────────────────────────────────────────────────────

.PHONY: clean
clean: ## Parar contenedores y eliminar volumenes (borra datos de postgres)
	$(COMPOSE) down -v

.PHONY: clean-blockchain
clean-blockchain: ## Borrar artifacts, cache y typings de Hardhat
	cd blockchain && rm -rf artifacts cache typechain-types coverage

.PHONY: clean-frontend
clean-frontend: ## Borrar build del frontend
	cd frontend && rm -rf dist
