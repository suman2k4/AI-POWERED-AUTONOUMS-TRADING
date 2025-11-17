# AI-Powered Autonomous Trading Platform 🚀📈

A **production-grade, high-performance AI-powered autonomous trading platform** with end-to-end ML pipelines, real-time order execution, and comprehensive backtesting capabilities.

[![CI/CD](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/workflows/CI/badge.svg)](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Performance SLOs

- ✅ **ML Model Accuracy**: >= 70% on validation datasets
- ✅ **Execution Latency**: < 100ms end-to-end (p95)
- ✅ **Rebalancing Speedup**: >= 25% faster than baseline

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Client   │────▶│  Node.js API     │────▶│  Go Execution   │
│  (TypeScript)   │     │  (Express + TS)  │     │  Engine (<100ms)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────┐          ┌──────────────┐
                        │   Redis     │          │  TimescaleDB │
                        │  Streams    │          │  (Time-series)│
                        └─────────────┘          └──────────────┘
                               │
                        ┌──────┴───────┐
                        ▼              ▼
                 ┌──────────┐   ┌──────────┐
                 │  Kafka   │   │  MLflow  │
                 │  Events  │   │  Models  │
                 └──────────┘   └──────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Python ML  │
                 │   Services   │
                 └──────────────┘
```

## ✨ Key Features

### 🤖 AI/ML Pipeline
- **Multiple Model Support**: XGBoost, LightGBM, LSTM (PyTorch)
- **MLflow Integration**: Model versioning, experiment tracking, and registry
- **Deterministic Training**: Reproducible results with fixed seeds
- **>=70% Accuracy**: Validated on synthetic datasets with confusion matrices
- **Feature Store**: Consistent feature engineering for training and inference

### ⚡ Ultra-Low Latency Execution
- **Go Microservice**: High-performance order execution engine
- **<100ms Latency**: p95 latency target with benchmarks
- **Redis Streams**: Low-latency message queue for order flow
- **Idempotency**: Built-in deduplication and order reconciliation
- **Load Testing**: k6 scripts for performance validation

### 📊 Advanced Backtesting
- **Vectorized Engine**: Fast backtesting with vectorbt
- **Performance Metrics**: Sharpe ratio, max drawdown, CAGR, win rate
- **Slippage Modeling**: Realistic transaction cost simulation
- **Config-Driven**: YAML-based strategy configuration
- **Deterministic**: Reproducible results with seed control

### 🎨 Modern Dashboard
- **Real-time Charts**: Candlestick charts with TradingView-style overlays
- **WebSocket Updates**: Live market data and signals
- **Glassmorphism UI**: Modern, responsive design with Tailwind CSS
- **Model Evaluation**: Interactive confusion matrices and ROC curves
- **Portfolio Management**: Real-time P&L tracking and rebalancing controls

### 📈 Observability
- **Prometheus Metrics**: Latency, throughput, and system health
- **Grafana Dashboards**: Pre-configured visualization dashboards
- **Structured Logging**: JSON logs with context (pino/winston/zap)
- **Distributed Tracing**: OpenTelemetry integration for request tracing
- **Performance Profiling**: Built-in pprof, clinic, and cProfile support

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Go** >= 1.21
- **Docker** & Docker Compose
- **Redis** (via Docker)
- **PostgreSQL/TimescaleDB** (via Docker)

### 1. Clone and Setup

```bash
git clone https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING.git
cd AI-POWERED-AUTONOUMS-TRADING

# Copy environment variables
cp .env.example .env
# Edit .env and add your API keys (Gemini, broker APIs, etc.)
```

### 2. Start Infrastructure (Docker Compose)

```bash
# Start all services (TimescaleDB, Redis, Kafka, MLflow, Prometheus, Grafana)
docker-compose up -d

# Check services are healthy
docker-compose ps
```

### 3. Install Dependencies

```bash
# Node.js dependencies (API server + client)
npm install

# Python dependencies (ML service)
cd ml
pip install -r requirements.txt
cd ..

# Go dependencies (Execution engine)
cd execution
go mod download
cd ..
```

### 4. Train ML Models

```bash
# Train XGBoost model
cd ml
python src/trainer.py --model xgboost --samples 10000

# Train LightGBM model
python src/trainer.py --model lightgbm --samples 10000

# Train LSTM model
python src/trainer.py --model lstm --samples 10000

# View results in MLflow
# Open http://localhost:5000 in browser
cd ..
```

### 5. Run Backtest

```bash
cd ml
python src/backtest.py --strategy momentum --start 2023-01-01 --end 2023-12-31 --capital 100000
cd ..
```

### 6. Start Services

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start Go execution engine
cd execution
go run main.go

# Terminal 3: Start ML inference service (if needed)
cd ml
python src/inference_server.py
```

### 7. Access the Application

- **Web Dashboard**: http://localhost:5001
- **MLflow UI**: http://localhost:5000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Execution Engine**: http://localhost:8080

## 📊 Performance Testing

### Run Latency Benchmarks

```bash
# Install k6
# macOS: brew install k6
# Other: https://k6.io/docs/getting-started/installation/

# Test execution engine latency (target: p95 < 100ms)
k6 run --vus 10 --duration 30s tests/performance/execution-latency-test.js

# Test end-to-end latency
k6 run --vus 5 --duration 60s tests/performance/end-to-end-latency-test.js
```

### Run Rebalancing Benchmark

```bash
# Test rebalancing speedup (target: >= 25%)
cd tests/performance
python rebalance_benchmark.py --size 1000 --runs 10
```

### Go Execution Engine Benchmarks

```bash
cd execution

# Run Go benchmarks
go test -bench=. -benchmem

# CPU profiling
go test -bench=BenchmarkEndToEndLatency -cpuprofile=cpu.prof
go tool pprof cpu.prof
```

## 🧪 Testing

### Unit Tests

```bash
# TypeScript tests
npm test

# Python tests
cd ml
pytest tests/ -v --cov=src

# Go tests
cd execution
go test -v ./...
```

### Integration Tests

```bash
# Start services first
docker-compose up -d
npm run dev &
cd execution && go run main.go &

# Run integration tests
npm run test:integration
```

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System architecture and data flow
- **[PERFORMANCE.md](./PERFORMANCE.md)**: Performance benchmarks and optimization guide
- **[API Documentation](./openapi.yaml)**: OpenAPI specification

## 🛠️ Development

### Code Quality

```bash
# TypeScript type checking
npm run check

# Linting
npm run lint

# Format code
npm run format
```

### Build for Production

```bash
# Build client and server
npm run build

# Build Go execution engine
cd execution
go build -o bin/execution-engine main.go

# Build Docker images
docker-compose build
```

## 🔐 Security

- **Rate Limiting**: Per-user rate limits on order endpoints
- **Input Validation**: Zod schema validation on all API inputs
- **Paper Trade Mode**: Default safe mode (set `PAPER_TRADE_MODE=true`)
- **Secrets Management**: All credentials in environment variables
- **API Keys**: Secure header-based authentication

## 📈 Monitoring

### Metrics Available

- **Execution Latency**: p50, p95, p99 percentiles
- **Order Success Rate**: Percentage of successful orders
- **Model Accuracy**: Real-time model performance tracking
- **System Health**: CPU, memory, uptime

### Grafana Dashboards

Pre-configured dashboards available at http://localhost:3000:

1. **Trading Overview**: Orders, latency, success rates
2. **ML Model Performance**: Accuracy, inference time
3. **System Health**: Resource usage, error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for AI-powered insights
- **MLflow** for model tracking
- **vectorbt** for backtesting
- **Redis** and **Kafka** for event streaming
- **TimescaleDB** for time-series data storage
- **shadcn/ui** for UI components

## 📞 Support

For issues and questions:
- Open an [Issue](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/issues)
- Check [Discussions](https://github.com/suman2k4/AI-POWERED-AUTONOUMS-TRADING/discussions)

---

**⚠️ Disclaimer**: This software is for educational and research purposes only. Not financial advice. Use at your own risk.
