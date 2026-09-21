SHELL   := /bin/bash

COMPOSE := docker compose
BACKEND := $(COMPOSE) exec -T backend
SHOP    := http://localhost:3000

NVM := [ -s "$${NVM_DIR:-$$HOME/.nvm}/nvm.sh" ] \
       && . "$${NVM_DIR:-$$HOME/.nvm}/nvm.sh" >/dev/null \
       && nvm use >/dev/null 2>&1 || true

REQUIRE_NODE_20 := node -e 'if (+process.versions.node.split(".")[0] < 20) { \
	console.error("\n  Node " + process.versions.node + " is too old.\n  .nvmrc asks for v26 — run `nvm install` and try again.\n"); \
	process.exit(1); }'

.DEFAULT_GOAL := help
.PHONY: help install up up_local down_local reset seed test psql studio

help: ## List the available targets
	@echo 'Teehaus Lindner returns — make targets:'
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-9s\033[0m %s\n", $$1, $$2}'

# Only needed to work on the code outside Docker — the images install their own
# dependencies at build time. `npm ci` rather than `npm install` so both apps
# install exactly what the committed lockfiles pin.
install: ## Install dependencies for both apps, for local (non-Docker) work
	@$(NVM); $(REQUIRE_NODE_20)
	@[ -f backend/.env ] || (cp backend/.env.example backend/.env && echo 'created backend/.env from .env.example')
	@$(NVM); cd backend && npm ci && npm run prisma:generate
	@$(NVM); cd frontend && npm ci

up: ## Build and start everything, then wait until the API answers
	$(COMPOSE) up --build -d
	@printf 'waiting for the API'
	@until curl -sf $(SHOP)/api/health >/dev/null 2>&1; do printf '.'; sleep 1; done
	@echo ' ready.'
	@echo '  customer  $(SHOP)/return-flow'
	@echo '  owner     $(SHOP)/owner-list'

reset: ## Stop the stack and DROP the database volume, then start clean
	$(COMPOSE) down -v
	@$(MAKE) --no-print-directory up

seed: ## Rebuild the five demo orders — destructive, wipes registered returns
	$(BACKEND) npx tsx db/seed.ts

test: ## Run the return-rule tests inside the backend container
	$(BACKEND) npm test

psql: ## Open a psql shell on the database
	$(COMPOSE) exec postgres psql -U postgres -d shop_187_db

studio: ## Browse the data in Prisma Studio (http://localhost:5555)
	$(BACKEND) npx prisma studio --schema=db/schema.prisma

up_local: ## Postgres in Docker, both dev servers on the host (logs in /tmp)
	$(COMPOSE) up postgres -d --wait
	@$(NVM); $(REQUIRE_NODE_20)
	@$(NVM); echo "  node $$(node -v)"
	@# Same as the container entrypoint: a fresh volume has no tables otherwise.
	@$(NVM); cd backend && npx prisma migrate deploy --schema=db/schema.prisma && npm run seed
	@$(NVM); cd backend  && nohup npm run dev > /tmp/teehaus-backend.log  2>&1 &
	@$(NVM); cd frontend && nohup npm run dev > /tmp/teehaus-frontend.log 2>&1 &
	@echo '  api  http://localhost:4000   log /tmp/teehaus-backend.log'
	@echo '  web  http://localhost:3000   log /tmp/teehaus-frontend.log'

down_local: ## Stop the dev servers started by up_local (Postgres keeps running)
	-@pkill -f '[t]sx watch src/server.ts' && echo '  stopped api' || true
	-@pkill -f 'frontend/node_modules/.bin/[v]ite' && echo '  stopped web' || true
