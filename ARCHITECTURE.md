# System Architecture

## Overview

The AI-Powered Autonomous Trading Platform is a distributed system designed for high-performance, low-latency trading with ML-powered decision making.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript (Vite)                                    │  │
│  │  • Trading Dashboard (Candlestick charts, signals)           │  │
│  │  • Backtest Evaluation (Confusion matrix, ROC curves)        │  │
│  │  • Portfolio Management (Positions, P&L, rebalancing)        │  │
│  │  • WebSocket client for real-time updates                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS/WSS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express + TypeScript                               │  │
│  │  • REST API (OpenAPI 3.0 spec)                               │  │
│  │  • WebSocket server for real-time data                       │  │
│  │  • Middleware: helmet, cors, rate-limiting, Zod validation   │  │
│  │  • Structured logging (Winston/Pino)                         │  │
│  │  • OpenTelemetry tracing                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───┬────────────────┬──────────────────┬──────────────┬─────────────┘
    │                │                  │              │
    ▼                ▼                  ▼              ▼
┌────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────────┐
│ Redis  │   │   Kafka      │   │ TimescaleDB│   │  Execution   │
│ Cache  │   │  Event Bus   │   │  (Postgres)│   │  Engine (Go) │
└────────┘   └──────────────┘   └──────────┘   └──────────────┘
    │                │                  │              │
    │                │                  │              ▼
    │                │                  │        ┌──────────────┐
    │                │                  │        │ Redis Streams│
    │                │                  │        │ (Order Queue)│
    │                │                  │        └──────────────┘
    │                │                  │              │
    │                ▼                  │              │
    │         ┌──────────────┐          │              │
    │         │   ML Service │◀─────────┴──────────────┘
    │         │   (Python)   │
    │         │              │
    │         │ • XGBoost    │
    │         │ • LightGBM   │
    │         │ • LSTM       │
    │         │ • MLflow     │
    │         └──────────────┘
    │                │
    ▼                ▼
┌─────────────────────────────────────────┐
│      Observability Stack                 │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ Prometheus  │  │  Grafana    │      │
│  │  (Metrics)  │  │ (Dashboard) │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   Jaeger    │  │   Logs      │      │
│  │  (Tracing)  │  │ (Structured)│      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
```

## Component Details

### 1. Client Layer (React + TypeScript)

**Technology Stack**:
- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS + Glassmorphism UI
- Recharts for data visualization
- WebSocket for real-time updates

**Key Features**:
- **Trading View**: Real-time candlestick charts with signal overlays
- **Backtest View**: Model evaluation with confusion matrices, ROC curves
- **Portfolio View**: Live positions, P&L tracking, rebalancing controls
- **Responsive Design**: Mobile-friendly interface

### 2. API Gateway (Node.js + Express)

**Technology Stack**:
- Node.js + TypeScript
- Express.js web framework
- Zod for input validation
- Winston/Pino for structured logging
- OpenTelemetry for distributed tracing

**Middleware Stack**:
```
Request → Helmet (Security Headers)
       → CORS
       → Rate Limiter
       → Body Parser
       → Zod Validation
       → Business Logic
       → Error Handler
       → Response
```

**API Endpoints**:
- `POST /api/signals` - Generate trading signals
- `GET /api/signals` - Retrieve signals
- `POST /api/backtest` - Run backtest
- `GET /api/backtest/:id` - Get backtest results
- `GET /api/portfolio/:userId` - Get portfolio
- `POST /api/portfolio/:userId/rebalance` - Rebalance portfolio
- `POST /api/orders` - Submit order
- `GET /api/orders` - Get order history
- `GET /api/metrics` - System metrics

### 3. Execution Engine (Go)

**Technology Stack**:
- Go 1.21+
- Redis client for Streams
- Prometheus client for metrics
- Standard library HTTP server

**Design Principles**:
- **Low Latency**: Optimized for <100ms execution
- **Concurrency**: Goroutines for parallel processing
- **Idempotency**: Duplicate order prevention
- **Resilience**: Automatic retries and error handling

**Performance Optimizations**:
- Connection pooling (100 Redis connections)
- In-memory caching
- Minimal allocations
- Fast JSON serialization
- Batch processing

**Order Flow**:
```
Signal Generated → Published to Redis Stream
                → Execution Engine Consumes
                → Validates Order (idempotency, risk)
                → Simulates/Executes Order
                → Publishes Response
                → Records Metrics
```

### 4. ML Service (Python)

**Technology Stack**:
- Python 3.10+
- scikit-learn, XGBoost, LightGBM
- PyTorch for deep learning
- MLflow for model tracking
- FastAPI for inference API
- vectorbt for backtesting

**Model Pipeline**:
```
Historical Data → Feature Engineering
              → Model Training (XGBoost/LightGBM/LSTM)
              → Cross-Validation
              → Hyperparameter Tuning
              → Model Evaluation
              → MLflow Registry
              → Deployment
```

**Supported Models**:

1. **XGBoost**:
   - Gradient boosting classifier
   - 200 estimators, max depth 6
   - Targets: BUY/SELL/HOLD

2. **LightGBM**:
   - Fast gradient boosting
   - Optimized for large datasets
   - Lower memory footprint

3. **LSTM (PyTorch)**:
   - Sequence model for time-series
   - 2 layers, 128 hidden units
   - Dropout regularization

**Feature Engineering**:
- Technical indicators (RSI, MACD, Bollinger Bands)
- Moving averages (SMA, EMA)
- Volume indicators (OBV)
- Volatility (ATR)

### 5. Data Layer

#### TimescaleDB (PostgreSQL Extension)

**Use Cases**:
- Historical OHLCV data
- Tick data storage
- Backtest results
- Model training history
- MLflow backend

**Schema Design**:
```sql
-- Time-series table with hypertable
CREATE TABLE market_ticks (
    time TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    price NUMERIC(12,2),
    volume BIGINT,
    metadata JSONB
);

SELECT create_hypertable('market_ticks', 'time');
CREATE INDEX ON market_ticks (symbol, time DESC);
```

#### Redis

**Use Cases**:
- Model inference cache (60s TTL)
- Order deduplication (idempotency keys)
- Redis Streams for order queue
- Session storage
- Rate limiting counters

**Data Structures**:
```
# Cache
KEY: model:inference:{model_id}:{input_hash}
VALUE: {prediction JSON}
TTL: 60 seconds

# Idempotency
KEY: order:idem:{idempotency_key}
VALUE: {order_id}
TTL: 3600 seconds

# Stream
STREAM: execution.orders
FIELDS: {order JSON}
```

#### Kafka

**Topics**:
- `trading.signals` - ML-generated signals
- `market.ticks` - Real-time market data
- `audit.logs` - Audit trail for compliance

### 6. Observability Stack

#### Prometheus Metrics

**Execution Engine Metrics**:
- `execution_latency_milliseconds` (histogram)
- `orders_processed_total` (counter)
- `orders_rejected_total` (counter)

**ML Service Metrics**:
- `model_inference_time_ms` (histogram)
- `model_accuracy` (gauge)
- `predictions_total` (counter)

**API Metrics**:
- `http_request_duration_ms` (histogram)
- `http_requests_total` (counter)
- `http_request_errors_total` (counter)

#### Grafana Dashboards

Pre-configured dashboards:
1. **Trading Overview**: Order flow, latency, success rates
2. **ML Performance**: Model accuracy, inference time, predictions
3. **System Health**: CPU, memory, disk, network
4. **Business Metrics**: Portfolio value, P&L, positions

#### Structured Logging

**Log Format** (JSON):
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "api-server",
  "trace_id": "abc123",
  "message": "Order placed",
  "order_id": "ord_123",
  "symbol": "AAPL",
  "latency_ms": 45
}
```

## Data Flow Diagrams

### Signal to Order Flow

```
┌─────────┐
│ Market  │
│  Data   │
└────┬────┘
     │
     ▼
┌────────────┐     ┌──────────┐
│  Feature   │────▶│   ML     │
│ Pipeline   │     │  Model   │
└────────────┘     └────┬─────┘
                        │
                        ▼
                   ┌─────────┐
                   │ Signal  │
                   │  {BUY}  │
                   └────┬────┘
                        │
                        ▼
                   ┌─────────────┐
                   │ Validation  │
                   │ • Risk check│
                   │ • Position  │
                   └────┬────────┘
                        │
                        ▼
                   ┌─────────────┐
                   │Redis Stream │
                   │execution.   │
                   │   orders    │
                   └────┬────────┘
                        │
                        ▼
                ┌──────────────────┐
                │ Execution Engine │
                │    (Go)          │
                │ • Dedup          │
                │ • Execute        │
                │ • Respond        │
                └────┬─────────────┘
                     │
                     ▼
                ┌─────────┐
                │  Order  │
                │  Filled │
                └─────────┘
```

### Backtest Flow

```
┌──────────────┐
│ Historical   │
│   OHLCV      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────┐
│   Strategy   │────▶│ vectorbt │
│  Signals     │     │  Engine  │
└──────────────┘     └────┬─────┘
                          │
                          ▼
                     ┌──────────┐
                     │ Trades   │
                     │ Executed │
                     └────┬─────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Metrics      │
                  │ • Sharpe      │
                  │ • Drawdown    │
                  │ • CAGR        │
                  │ • Win Rate    │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  MLflow Log   │
                  │  & Report     │
                  └───────────────┘
```

## Deployment Architecture

### Development (Docker Compose)

Single-machine deployment with all services:
- All containers on same bridge network
- Shared volumes for data persistence
- Local ports exposed for debugging

### Production (Kubernetes)

Multi-node deployment:
- **API Gateway**: 3+ replicas with HPA
- **Execution Engine**: 5+ replicas (CPU-optimized)
- **ML Service**: 2+ replicas (GPU-enabled)
- **TimescaleDB**: StatefulSet with replication
- **Redis**: Sentinel mode for HA
- **Kafka**: 3+ broker cluster

**Scaling Strategy**:
- API: Scale on CPU (70% threshold)
- Execution: Scale on request queue depth
- ML: Scale on inference latency

## Security Architecture

### Defense in Depth

1. **Network Layer**:
   - Private VPC/subnet
   - Security groups
   - TLS/SSL everywhere

2. **Application Layer**:
   - Rate limiting (100 req/min per user)
   - Input validation (Zod schemas)
   - CORS restrictions
   - Helmet security headers

3. **Data Layer**:
   - Encrypted at rest
   - Encrypted in transit
   - Database access control

4. **Authentication**:
   - API key authentication
   - JWT tokens
   - Role-based access control (RBAC)

### Paper Trade Mode

Default safe mode for testing:
- Orders not sent to real broker
- Simulated fills with realistic slippage
- All features available for testing
- Set `PAPER_TRADE_MODE=true` in `.env`

## Disaster Recovery

### Backup Strategy

- **Database**: Daily snapshots, PITR enabled
- **Models**: Versioned in MLflow registry
- **Config**: Git-tracked, Infrastructure as Code

### High Availability

- **API**: Multi-AZ deployment, load balanced
- **Database**: Primary-replica with automatic failover
- **Redis**: Sentinel mode with 3+ nodes
- **Execution**: Stateless, can scale horizontally

## Performance Characteristics

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks and optimization guide.

**Key Metrics**:
- API response time: p95 < 50ms
- Execution latency: p95 < 100ms
- ML inference: < 20ms per prediction
- Throughput: 1000+ orders/second
- Uptime: 99.9% SLA
