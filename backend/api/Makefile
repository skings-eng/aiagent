# AI Agent Backend API Makefile

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
NODE_VERSION = 18
APP_NAME = aiagent-api

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

.PHONY: help install dev build start stop restart logs clean test lint format docker-build docker-dev docker-prod setup-env migrate seed backup restore

# Default target
help: ## Show this help message
	@echo "$(BLUE)AI Agent Backend API - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development Commands
install: ## Install dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

dev: ## Start development server
	@echo "$(YELLOW)Starting development server...$(NC)"
	npm run dev

build: ## Build the application
	@echo "$(YELLOW)Building application...$(NC)"
	npm run build
	@echo "$(GREEN)Build completed successfully!$(NC)"

start: ## Start production server
	@echo "$(YELLOW)Starting production server...$(NC)"
	npm start

test: ## Run tests
	@echo "$(YELLOW)Running tests...$(NC)"
	npm test

test-watch: ## Run tests in watch mode
	@echo "$(YELLOW)Running tests in watch mode...$(NC)"
	npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "$(YELLOW)Running tests with coverage...$(NC)"
	npm run test:coverage

lint: ## Run linter
	@echo "$(YELLOW)Running linter...$(NC)"
	npm run lint

lint-fix: ## Fix linting issues
	@echo "$(YELLOW)Fixing linting issues...$(NC)"
	npm run lint:fix

format: ## Format code
	@echo "$(YELLOW)Formatting code...$(NC)"
	npm run format

typecheck: ## Run TypeScript type checking
	@echo "$(YELLOW)Running TypeScript type checking...$(NC)"
	npm run typecheck

# Docker Commands
docker-build: ## Build Docker image
	@echo "$(YELLOW)Building Docker image...$(NC)"
	docker build -t $(APP_NAME):latest .
	@echo "$(GREEN)Docker image built successfully!$(NC)"

docker-dev: ## Start development environment with Docker
	@echo "$(YELLOW)Starting development environment...$(NC)"
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "$(BLUE)API: http://localhost:3000$(NC)"
	@echo "$(BLUE)MongoDB Express: http://localhost:8081$(NC)"
	@echo "$(BLUE)Redis Commander: http://localhost:8082$(NC)"

docker-prod: ## Start production environment with Docker
	@echo "$(YELLOW)Starting production environment...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "$(BLUE)API: http://localhost:3000$(NC)"

docker-stop: ## Stop Docker containers
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)Docker containers stopped!$(NC)"

docker-restart: ## Restart Docker containers
	@echo "$(YELLOW)Restarting Docker containers...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)Docker containers restarted!$(NC)"

docker-logs: ## Show Docker logs
	@echo "$(YELLOW)Showing Docker logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

docker-logs-dev: ## Show development Docker logs
	@echo "$(YELLOW)Showing development Docker logs...$(NC)"
	$(DOCKER_COMPOSE_DEV) logs -f

docker-clean: ## Clean Docker containers and volumes
	@echo "$(YELLOW)Cleaning Docker containers and volumes...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Docker cleanup completed!$(NC)"

# Database Commands
migrate: ## Run database migrations
	@echo "$(YELLOW)Running database migrations...$(NC)"
	npm run migrate
	@echo "$(GREEN)Migrations completed!$(NC)"

seed: ## Seed database with sample data
	@echo "$(YELLOW)Seeding database...$(NC)"
	npm run seed
	@echo "$(GREEN)Database seeded successfully!$(NC)"

backup: ## Backup database
	@echo "$(YELLOW)Creating database backup...$(NC)"
	@mkdir -p backups
	@docker exec $$(docker-compose ps -q mongo) mongodump --db aiagent --out /tmp/backup
	@docker cp $$(docker-compose ps -q mongo):/tmp/backup ./backups/backup-$$(date +%Y%m%d-%H%M%S)
	@echo "$(GREEN)Database backup created!$(NC)"

restore: ## Restore database from backup (usage: make restore BACKUP=backup-20231201-120000)
	@echo "$(YELLOW)Restoring database from backup...$(NC)"
	@if [ -z "$(BACKUP)" ]; then echo "$(RED)Please specify BACKUP parameter$(NC)"; exit 1; fi
	@docker cp ./backups/$(BACKUP) $$(docker-compose ps -q mongo):/tmp/restore
	@docker exec $$(docker-compose ps -q mongo) mongorestore --db aiagent --drop /tmp/restore/aiagent
	@echo "$(GREEN)Database restored successfully!$(NC)"

# Environment Setup
setup-env: ## Setup environment file
	@echo "$(YELLOW)Setting up environment file...$(NC)"
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(GREEN).env file created from .env.example$(NC)"; else echo "$(BLUE).env file already exists$(NC)"; fi
	@echo "$(YELLOW)Please edit .env file with your configuration$(NC)"

setup: ## Complete setup for development
	@echo "$(YELLOW)Setting up development environment...$(NC)"
	make setup-env
	make install
	make docker-dev
	@echo "$(GREEN)Development environment setup completed!$(NC)"
	@echo "$(BLUE)Run 'make logs-dev' to see the logs$(NC)"

# Utility Commands
clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist build coverage node_modules/.cache
	@echo "$(GREEN)Cleanup completed!$(NC)"

clean-all: ## Clean everything including node_modules
	@echo "$(YELLOW)Cleaning everything...$(NC)"
	rm -rf dist build coverage node_modules
	@echo "$(GREEN)Complete cleanup finished!$(NC)"

reset: ## Reset development environment
	@echo "$(YELLOW)Resetting development environment...$(NC)"
	make docker-clean
	make clean-all
	make setup
	@echo "$(GREEN)Development environment reset completed!$(NC)"

# Health Checks
health: ## Check application health
	@echo "$(YELLOW)Checking application health...$(NC)"
	@curl -f http://localhost:3000/health || echo "$(RED)Application is not healthy$(NC)"

status: ## Show application status
	@echo "$(YELLOW)Application Status:$(NC)"
	@echo "$(BLUE)Docker Containers:$(NC)"
	@docker-compose ps
	@echo "$(BLUE)\nNode.js Processes:$(NC)"
	@ps aux | grep node | grep -v grep || echo "No Node.js processes running"

# Documentation
docs: ## Generate API documentation
	@echo "$(YELLOW)Generating API documentation...$(NC)"
	@echo "$(BLUE)API documentation available at: http://localhost:3000/docs$(NC)"

# Security
security-audit: ## Run security audit
	@echo "$(YELLOW)Running security audit...$(NC)"
	npm audit
	npm audit fix
	@echo "$(GREEN)Security audit completed!$(NC)"

# Performance
benchmark: ## Run performance benchmarks
	@echo "$(YELLOW)Running performance benchmarks...$(NC)"
	@echo "$(BLUE)Implement benchmark tests here$(NC)"

# Deployment
deploy-staging: ## Deploy to staging environment
	@echo "$(YELLOW)Deploying to staging...$(NC)"
	@echo "$(BLUE)Implement staging deployment here$(NC)"

deploy-prod: ## Deploy to production environment
	@echo "$(YELLOW)Deploying to production...$(NC)"
	@echo "$(BLUE)Implement production deployment here$(NC)"