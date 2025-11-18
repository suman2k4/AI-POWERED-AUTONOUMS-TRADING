# Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the AI-Powered Autonomous Trading Platform.

## Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **Python** >= 3.10 ([Download](https://www.python.org/))
- **Go** >= 1.21 ([Download](https://go.dev/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Make** (usually pre-installed on macOS/Linux, for Windows use WSL)

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING.git
cd AI-POWERED-AUTONOUMS-TRADING

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys (optional for local development)
# nano .env  # or use your favorite editor
```

## Step 2: Install Dependencies

**Option A: Using Make (Recommended)**
```bash
make install
```

**Option B: Manual Installation**
```bash
# Node.js dependencies
npm install

# Python dependencies
cd ml
pip install -r requirements.txt
cd ..

# Go dependencies
cd execution
go mod download
cd ..
```

## Step 3: Start Infrastructure

Start all backend services (Redis, TimescaleDB, Kafka, MLflow, Prometheus, Grafana):

```bash
make docker-up

# Or manually:
docker-compose up -d
```

**Verify services are running:**
```bash
docker-compose ps
```

You should see all services in "Up" state.

## Step 4: Train ML Models

Train the machine learning models (this takes 2-5 minutes):

```bash
make train-all

# Or train individually:
make train-xgboost
make train-lightgbm
make train-lstm
```

**Check MLflow UI:**
- Open http://localhost:5000
- You should see your trained models with accuracy metrics

## Step 5: Start Application Services

**Option A: All Services at Once**
```bash
make dev-all
```

**Option B: Individual Terminals** (Recommended for development)

Terminal 1 - API Server:
```bash
npm run dev
```

Terminal 2 - Execution Engine:
```bash
cd execution
go run main.go
```

Terminal 3 - ML Inference Server:
```bash
cd ml
uvicorn src.inference_server:app --host 0.0.0.0 --port 8000 --reload
```

## Step 6: Access the Application

Open your browser and navigate to:

- **Trading Dashboard**: http://localhost:5001
- **MLflow UI**: http://localhost:5000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

## Step 7: Run Tests & Benchmarks

### Run All Tests
```bash
make test
```

### Run Performance Benchmarks

**Execution Latency Test** (Target: <100ms p95):
```bash
make perf-latency
```

**End-to-End Latency Test**:
```bash
make perf-e2e
```

**Rebalancing Speedup Test** (Target: >=25%):
```bash
make perf-rebalance
```

## Troubleshooting

### Services Won't Start

**Check Docker:**
```bash
docker-compose ps
docker-compose logs [service-name]
```

**Check Ports:**
```bash
# Make sure these ports are not in use:
lsof -i :5001  # API Server
lsof -i :8080  # Execution Engine
lsof -i :8000  # ML Service
lsof -i :6379  # Redis
lsof -i :5432  # TimescaleDB
```

### Python Errors

**Missing ta-lib:**
```bash
# macOS
brew install ta-lib

# Ubuntu/Debian
sudo apt-get install libta-lib0-dev

# Then reinstall Python packages
cd ml
pip install -r requirements.txt
```

### Go Build Errors

```bash
cd execution
go clean
go mod tidy
go mod download
go build main.go
```

### Node.js Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Common Commands

```bash
# View all available commands
make help

# Quick start everything
make quickstart

# Stop all services
make docker-down

# Clean build artifacts
make clean

# Deep clean (including dependencies)
make clean-all

# Run backtest
make backtest

# Check code quality
make lint
make typecheck
```

## What's Next?

### 1. Explore the Dashboard
- View real-time trading signals
- Check portfolio performance
- Review backtest results

### 2. Train Custom Models
```bash
cd ml
python src/trainer.py --model xgboost --samples 50000
```

### 3. Run Custom Backtests
```bash
cd ml
python src/backtest.py \
  --strategy momentum \
  --start 2023-01-01 \
  --end 2023-12-31 \
  --capital 100000
```

### 4. Monitor Performance
- Check Grafana dashboards: http://localhost:3000
- View Prometheus metrics: http://localhost:9090
- Check MLflow experiments: http://localhost:5000

### 5. Deploy to Production
```bash
# Build Docker images
make build-docker

# Deploy to Kubernetes
kubectl apply -f infra/k8s/deployment.yaml
```

## Getting Help

- **Documentation**: See [README.md](./README.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [PERFORMANCE.md](./PERFORMANCE.md)
- **Issues**: [GitHub Issues](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/issues)
- **API Docs**: Check [openapi.yaml](./openapi.yaml) or visit http://localhost:5001/docs (when server is running)

## Performance Targets

Make sure your system meets these benchmarks:

- ✅ **ML Model Accuracy**: >= 70% (check with `make test-python`)
- ✅ **Execution Latency**: < 100ms p95 (check with `make perf-latency`)
- ✅ **Rebalancing Speedup**: >= 25% (check with `make perf-rebalance`)

## Development Workflow

1. Make changes to code
2. Run type checking: `make typecheck`
3. Run tests: `make test`
4. Run performance tests: `make perf`
5. Commit and push

## Production Deployment

### Docker Compose (Single Server)
```bash
# Production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes (Multi-Node)
```bash
# Apply manifests
kubectl apply -f infra/k8s/deployment.yaml

# Check status
kubectl get pods -n trading-platform

# View logs
kubectl logs -f deployment/execution-engine -n trading-platform
```

## Support

For questions or issues, please:
1. Check the [documentation](./README.md)
2. Search [existing issues](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/issues)
3. Create a [new issue](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/issues/new)

---

**⚠️ Disclaimer**: This software is for educational and research purposes only. Not financial advice. Trading involves risk.
