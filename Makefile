# ==============================================================================
# Makefile - Convenient commands for AI-Powered Trading Platform
# ==============================================================================

.PHONY: help install dev build test perf clean docker-up docker-down

# Default target
help:
	@echo "AI-Powered Autonomous Trading Platform - Available Commands"
	@echo "==========================================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install        - Install all dependencies (Node, Python, Go)"
	@echo "  make install-node   - Install Node.js dependencies"
	@echo "  make install-python - Install Python dependencies"
	@echo "  make install-go     - Install Go dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start development server"
	@echo "  make dev-all        - Start all services (API, Execution, ML)"
	@echo "  make docker-up      - Start infrastructure with Docker Compose"
	@echo "  make docker-down    - Stop Docker Compose services"
	@echo ""
	@echo "Building:"
	@echo "  make build          - Build all services"
	@echo "  make build-docker   - Build Docker images"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-node      - Run Node.js tests"
	@echo "  make test-python    - Run Python tests"
	@echo "  make test-go        - Run Go tests"
	@echo "  make test-integration - Run integration tests"
	@echo ""
	@echo "Performance:"
	@echo "  make perf           - Run all performance benchmarks"
	@echo "  make perf-latency   - Test execution latency (<100ms target)"
	@echo "  make perf-e2e       - Test end-to-end latency"
	@echo "  make perf-rebalance - Test rebalancing speedup (>=25% target)"
	@echo ""
	@echo "ML Training:"
	@echo "  make train-xgboost  - Train XGBoost model"
	@echo "  make train-lightgbm - Train LightGBM model"
	@echo "  make train-lstm     - Train LSTM model"
	@echo "  make train-all      - Train all models"
	@echo "  make backtest       - Run backtest"
	@echo ""
	@echo "Quality:"
	@echo "  make lint           - Run linters"
	@echo "  make typecheck      - Run TypeScript type checking"
	@echo "  make format         - Format code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make clean-all      - Deep clean (including node_modules)"
	@echo ""

# ==============================================================================
# Installation
# ==============================================================================

install: install-node install-python install-go
	@echo "✓ All dependencies installed"

install-node:
	@echo "Installing Node.js dependencies..."
	npm install

install-python:
	@echo "Installing Python dependencies..."
	cd ml && pip install -r requirements.txt

install-go:
	@echo "Installing Go dependencies..."
	cd execution && go mod download

# ==============================================================================
# Development
# ==============================================================================

dev:
	npm run dev

dev-all:
	@echo "Starting all services..."
	@echo "Terminal 1: API Server"
	npm run dev &
	@echo "Terminal 2: Execution Engine"
	cd execution && go run main.go &
	@echo "Terminal 3: ML Service"
	cd ml && uvicorn src.inference_server:app --reload &
	@echo "All services started in background"

docker-up:
	docker-compose up -d
	@echo "✓ Infrastructure started"
	@echo "  - Redis: localhost:6379"
	@echo "  - TimescaleDB: localhost:5432"
	@echo "  - Kafka: localhost:9092"
	@echo "  - MLflow: http://localhost:5000"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Grafana: http://localhost:3000"

docker-down:
	docker-compose down
	@echo "✓ Infrastructure stopped"

# ==============================================================================
# Building
# ==============================================================================

build: build-node build-go build-python
	@echo "✓ All services built"

build-node:
	npm run build

build-go:
	cd execution && go build -o bin/execution-engine main.go

build-python:
	@echo "Python services don't require build step"

build-docker:
	docker-compose build

# ==============================================================================
# Testing
# ==============================================================================

test: test-node test-python test-go
	@echo "✓ All tests completed"

test-node:
	npm test

test-python:
	cd ml && pytest tests/ -v

test-go:
	cd execution && go test -v ./...

test-integration:
	npm run test:integration

# ==============================================================================
# Performance Testing
# ==============================================================================

perf: perf-latency perf-e2e perf-rebalance
	@echo "✓ All performance tests completed"

perf-latency:
	npm run perf:latency

perf-e2e:
	npm run perf:e2e

perf-rebalance:
	npm run perf:rebalance

# ==============================================================================
# ML Training
# ==============================================================================

train-xgboost:
	cd ml && python src/trainer.py --model xgboost --samples 10000

train-lightgbm:
	cd ml && python src/trainer.py --model lightgbm --samples 10000

train-lstm:
	cd ml && python src/trainer.py --model lstm --samples 10000

train-all: train-xgboost train-lightgbm train-lstm
	@echo "✓ All models trained"

backtest:
	cd ml && python src/backtest.py --strategy momentum --start 2023-01-01 --end 2023-12-31

# ==============================================================================
# Code Quality
# ==============================================================================

lint:
	@echo "Linting Node.js code..."
	npm run lint || true
	@echo "Linting Python code..."
	cd ml && flake8 src --count --show-source --statistics || true

typecheck:
	npm run check

format:
	@echo "Formatting code..."
	npx prettier --write "**/*.{ts,tsx,js,json}"
	cd ml && black src/ tests/ || true

# ==============================================================================
# Cleanup
# ==============================================================================

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf build/
	rm -rf ml/models/*.pkl
	rm -rf execution/bin/
	rm -rf **/__pycache__/
	rm -rf **/*.pyc
	@echo "✓ Clean complete"

clean-all: clean
	@echo "Deep cleaning..."
	rm -rf node_modules/
	rm -rf ml/.pytest_cache/
	rm -rf ml/mlruns/
	@echo "✓ Deep clean complete"

# ==============================================================================
# Quick Start
# ==============================================================================

quickstart: install docker-up
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════╗"
	@echo "║  Quick Start Complete!                                    ║"
	@echo "╚══════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Start services: make dev-all"
	@echo "  2. Train models: make train-all"
	@echo "  3. Run tests: make test"
	@echo "  4. Run performance tests: make perf"
	@echo ""
	@echo "Access the application:"
	@echo "  - Dashboard: http://localhost:5001"
	@echo "  - MLflow: http://localhost:5000"
	@echo "  - Grafana: http://localhost:3000"
	@echo ""
