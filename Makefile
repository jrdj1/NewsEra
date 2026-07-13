# NewsEra — Makefile
# Uso: make <target>
# Requiere: Docker Desktop, Node.js 20, GNU Make
# Ejecutar siempre desde Git Bash en Windows (make usa cmd.exe por defecto,
# que no entiende sintaxis de shell POSIX como rm -rf o until/done).

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

.PHONY: fresh-start
fresh-start: ## Levanta todo, redespliega contratos, siembra estado de prueba y resincroniza el backend
	@echo "Levantando todos los servicios..."
	$(COMPOSE) up -d --build
	@echo "Esperando a que el nodo Hardhat este listo..."
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' newsera-hardhat 2>/dev/null)" = "healthy" ]; do sleep 1; done
	@echo "Redesplegando contratos (el nodo Hardhat es en memoria: pierde el estado en cada reinicio)..."
	rm -rf blockchain/ignition/deployments/chain-31337
	$(HARDHAT) ignition deploy ignition/modules/NewsEra.ts --network localhost
	@echo "Sembrando estado inicial de prueba (transacciones reales sobre los contratos)..."
	$(HARDHAT) run scripts/seed.ts --network localhost
	@echo "Actualizando .env con las direcciones reales desplegadas..."
	node scripts/update-env-addresses.js
	@echo "Parando el backend antes de truncar (evita bloqueos de Postgres por conexiones abiertas)..."
	$(COMPOSE) stop backend
	-docker exec newsera-db psql -U newsera -d newsera -c "TRUNCATE publications, rounds, validations, validators, reopen_requests, retroactive_claims, favorites, follows, notifications, user_profiles, indexer_state, reputation_events, tags, publication_tags, publication_links RESTART IDENTITY CASCADE;" 2>/dev/null
	@echo "Arrancando el backend con la BD limpia y las direcciones correctas..."
	$(COMPOSE) up -d backend
	@echo "Esperando a que el indexador procese el historial sembrado (maximo 30s)..."
	@i=0; \
	while [ "$$(docker exec newsera-db psql -U newsera -d newsera -tAc 'SELECT "lastProcessedBlock" FROM indexer_state WHERE id=1;' 2>/dev/null | tr -d '[:space:]')" = "" ]; do \
		i=$$((i+1)); \
		if [ $$i -ge 30 ]; then echo "Aviso: el indexador no ha terminado tras 30s, se continua igualmente (revisa 'make logs-backend')."; break; fi; \
		sleep 1; \
	done
	@echo "Sembrando datos sin equivalente on-chain (perfiles, favoritos, follows, notificaciones)..."
	cd backend && npm run seed:offchain
	@echo ""
	@echo "Todo listo, con estado de prueba completo cargado:"
	@echo "  Frontend:  http://localhost:8080"
	@echo "  Backend:   http://localhost:3001"
	@echo "  Hardhat:   http://localhost:8545"
	@echo "  Postgres:  localhost:5433 (usuario/clave/bd: newsera)"

# ─── Servicios individuales ───────────────────────────────────────────────────

.PHONY: frontend
frontend: ## Levantar solo el frontend (puerto 8080)
	$(COMPOSE) up frontend -d --build

.PHONY: backend
backend: ## Levantar solo el backend (puerto 3001, requiere: make postgres)
	$(COMPOSE) up backend -d --build

.PHONY: hardhat
hardhat: ## Levantar solo el nodo EVM (puerto 8545)
	$(COMPOSE) up hardhat-node -d

.PHONY: postgres
postgres: ## Levantar solo PostgreSQL (puerto 5432)
	$(COMPOSE) up postgres -d

.PHONY: stop-frontend
stop-frontend: ## Parar solo el frontend
	$(COMPOSE) stop frontend

.PHONY: stop-backend
stop-backend: ## Parar solo el backend
	$(COMPOSE) stop backend

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

.PHONY: logs-backend
logs-backend: ## Ver logs del backend
	$(COMPOSE) logs -f backend

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
deploy-local: ## Desplegar los 3 contratos en el nodo Hardhat Docker (requiere: make hardhat)
	$(HARDHAT) ignition deploy ignition/modules/NewsEra.ts --network localhost

.PHONY: deploy-sepolia
deploy-sepolia: ## Desplegar en Sepolia (requiere .env con PRIVATE_KEY y RPC_URL_SEPOLIA)
	$(HARDHAT) ignition deploy ignition/modules/NewsEra.ts --network sepolia

.PHONY: export-abis
export-abis: ## Exportar ABIs a docs/abis/ (requiere compilacion previa)
	$(HARDHAT) run scripts/export-abis.ts

# ─── Frontend (host) ──────────────────────────────────────────────────────────

.PHONY: dev
dev: ## Arrancar frontend en el host (fuera de Docker) en modo dev
	cd frontend && npm run dev -- --port 8080

.PHONY: build-frontend
build-frontend: ## Compilar frontend para produccion
	cd frontend && npm run build

.PHONY: typecheck
typecheck: ## Verificar tipos TypeScript del frontend
	cd frontend && npx tsc -b --noEmit

.PHONY: test-frontend
test-frontend: ## Ejecutar tests del frontend
	cd frontend && npm test

# ─── Backend ──────────────────────────────────────────────────────────────────
# Prisma CLI corre en el host contra el PostgreSQL de Docker (puerto 5432
# publicado en el host); requiere: make postgres

.PHONY: migrate
migrate: ## Aplicar migraciones Prisma (requiere: make postgres)
	cd backend && npx prisma migrate dev

.PHONY: migrate-deploy
migrate-deploy: ## Aplicar migraciones Prisma en modo no interactivo (CI/producción)
	cd backend && npx prisma migrate deploy

.PHONY: prisma-generate
prisma-generate: ## Regenerar el cliente Prisma tras cambios de schema
	cd backend && npx prisma generate

.PHONY: prisma-studio
prisma-studio: ## Abrir Prisma Studio (requiere: make postgres)
	cd backend && npx prisma studio

.PHONY: test-backend
test-backend: ## Ejecutar tests de integración del backend (requiere: make postgres)
	cd backend && npm test

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
