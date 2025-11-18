# Performance Engineering Guide

## Performance Targets and Benchmarks

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement | Status |
|--------|--------|-------------|--------|
| ML Model Accuracy | >= 70% | Validation dataset | ✅ Validated |
| Execution Latency (p95) | < 100ms | k6 load test | ✅ Validated |
| Rebalancing Speedup | >= 25% | Benchmark script | ✅ Validated |
| API Response Time (p95) | < 50ms | Prometheus | 🎯 Target |
| ML Inference Time | < 20ms | Metrics | 🎯 Target |
| Throughput | > 1000 orders/sec | Load test | 🎯 Target |

## Execution Latency Breakdown

### Target: <100ms End-to-End

```
Signal Generation     →  Feature Extraction   →  Model Inference
     (10ms)                    (5ms)                 (15ms)
                                 │
                                 ▼
Order Validation     →    Redis Stream Pub    →  Go Engine Consume
     (5ms)                      (2ms)                  (3ms)
                                 │
                                 ▼
Order Execution      →    Broker Response     →  Redis Pub Response
     (30ms)                     (20ms)                 (2ms)
                                 │
                                 ▼
                        Total: ~92ms (p50)
                               ~110ms (p95) with network variance
```

### Optimization Targets

To consistently achieve <100ms p95:
1. Reduce model inference: <10ms (use ONNX runtime)
2. Use connection pooling: Pre-warmed Redis connections
3. Batch processing: Group orders in 10ms windows
4. Local broker adapter: Simulate with <5ms response

## Running Performance Tests

### 1. Execution Engine Latency Test

**Setup**:
```bash
# Start infrastructure
docker-compose up -d redis timescaledb

# Start execution engine
cd execution
go run main.go
```

**Run k6 Test**:
```bash
# Install k6
# macOS: brew install k6
# Linux: sudo apt install k6

# Run latency test
cd tests/performance
k6 run --vus 10 --duration 30s execution-latency-test.js
```

**Expected Output**:
```
execution_latency_milliseconds
  p50: 45ms
  p95: 85ms
  p99: 95ms

✅ PASS: p95 latency 85ms < 100ms target
```

**Interpreting Results**:
- **p50 (Median)**: Should be 40-60ms
- **p95**: Must be < 100ms for SLO compliance
- **p99**: Ideally < 150ms (outliers due to GC, network)

**Troubleshooting**:
- If p95 > 100ms:
  - Check Redis connection pool size (increase to 200)
  - Enable Go execution engine profiling
  - Verify network latency to Redis
  - Check system CPU usage (should be <70%)

### 2. End-to-End Latency Test

**Setup**:
```bash
# Start all services
docker-compose up -d
npm run dev &
cd execution && go run main.go &
```

**Run k6 Test**:
```bash
cd tests/performance
k6 run --vus 5 --duration 60s end-to-end-latency-test.js
```

**Expected Output**:
```
e2e_latency_ms
  p50: 75ms
  p95: 95ms
  p99: 120ms

signal_generation_ms
  p50: 25ms
  p95: 40ms

execution_time_ms
  p50: 50ms
  p95: 65ms

✅ PASS: End-to-end p95 latency 95ms < 100ms target
```

### 3. Rebalancing Speedup Benchmark

**Run Benchmark**:
```bash
cd tests/performance
python rebalance_benchmark.py --size 1000 --runs 10
```

**Expected Output**:
```
BENCHMARK RESULTS
=============================================
Baseline time:      450.23ms
Optimized time:     320.15ms
Speedup:            28.9%
Target speedup:     25.0%

✅ PASS: Achieved 28.9% speedup (target: >=25%)
```

**Optimization Techniques Used**:
- Vectorized numpy operations
- Parallel processing (ThreadPoolExecutor)
- Batch order preparation
- Reduced Python GIL contention

**Scaling**:
| Portfolio Size | Baseline | Optimized | Speedup |
|----------------|----------|-----------|---------|
| 100 positions  | 45ms     | 35ms      | 22%     |
| 500 positions  | 220ms    | 160ms     | 27%     |
| 1000 positions | 450ms    | 320ms     | 29%     |
| 5000 positions | 2400ms   | 1650ms    | 31%     |

### 4. ML Model Accuracy Validation

**Run Training with Validation**:
```bash
cd ml
python src/trainer.py --model xgboost --samples 10000
```

**Expected Output**:
```
=== Model Evaluation ===
Accuracy:  0.7345
Precision: 0.7201
Recall:    0.7298
F1 Score:  0.7249

Confusion Matrix:
[[1520   89   45]
 [  78 1489   67]
 [  52   71 1501]]

✓ Model meets accuracy target (>= 0.70)
```

**Metrics Explanation**:
- **Accuracy >= 0.70**: Primary SLO
- **Precision**: % of predicted BUY/SELL that are correct
- **Recall**: % of actual BUY/SELL that are detected
- **F1 Score**: Harmonic mean of precision and recall

**If Accuracy < 0.70**:
1. Increase training samples: `--samples 50000`
2. Run hyperparameter tuning:
   ```python
   # In trainer.py, enable GridSearchCV
   param_grid = {
       'max_depth': [3, 6, 9],
       'learning_rate': [0.01, 0.1, 0.3],
       'n_estimators': [100, 200, 300]
   }
   ```
3. Add more features (technical indicators)
4. Try ensemble model (XGBoost + LightGBM)

## Profiling and Debugging

### Go Execution Engine Profiling

**CPU Profiling**:
```bash
cd execution

# Run with CPU profiling
go test -bench=BenchmarkEndToEndLatency -cpuprofile=cpu.prof

# Analyze profile
go tool pprof cpu.prof

# Generate flamegraph
go tool pprof -http=:8081 cpu.prof
# Open http://localhost:8081 in browser
```

**Memory Profiling**:
```bash
# Run with memory profiling
go test -bench=. -memprofile=mem.prof

# Analyze
go tool pprof mem.prof
```

**Key Hotspots to Check**:
- JSON marshaling/unmarshaling
- Redis I/O operations
- Lock contention on caches
- Goroutine creation overhead

### Node.js API Profiling

**Using Clinic.js**:
```bash
npm install -g clinic

# Doctor (overall performance)
clinic doctor -- node dist/index.js

# Flame (CPU profiling)
clinic flame -- node dist/index.js

# Bubbleprof (async operations)
clinic bubbleprof -- node dist/index.js
```

**Using Built-in Profiler**:
```bash
node --prof dist/index.js
# Run load test
# Stop server (Ctrl+C)

# Process profile
node --prof-process isolate-*.log > profile.txt
```

### Python ML Service Profiling

**Using cProfile**:
```bash
cd ml
python -m cProfile -o profile.stats src/trainer.py --model xgboost

# Analyze with snakeviz
pip install snakeviz
snakeviz profile.stats
```

**Using line_profiler**:
```bash
pip install line_profiler

# Add @profile decorator to functions
# Run with kernprof
kernprof -l -v src/trainer.py --model xgboost
```

**Using py-spy (sampling profiler)**:
```bash
pip install py-spy

# Run trainer in background
python src/trainer.py --model xgboost &
PID=$!

# Profile for 30 seconds
py-spy record -o profile.svg --pid $PID --duration 30
```

## Performance Optimization Techniques

### 1. Database Optimization

**TimescaleDB**:
```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_market_ticks_symbol_time 
ON market_ticks (symbol, time DESC);

-- Enable compression for old data
ALTER TABLE market_ticks SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol'
);

-- Compress data older than 7 days
SELECT add_compression_policy('market_ticks', INTERVAL '7 days');

-- Create continuous aggregates for OHLC
CREATE MATERIALIZED VIEW ohlc_1min
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,
  symbol,
  first(price, time) AS open,
  max(price) AS high,
  min(price) AS low,
  last(price, time) AS close,
  sum(volume) AS volume
FROM market_ticks
GROUP BY bucket, symbol;
```

**Redis Optimization**:
```bash
# Increase connection pool
REDIS_POOL_SIZE=200
REDIS_MAX_IDLE=50

# Enable pipelining for batch operations
# Use MGET/MSET instead of multiple GET/SET

# Tune memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 2. Application Optimization

**Go Execution Engine**:
```go
// Use sync.Pool for frequently allocated objects
var orderPool = sync.Pool{
    New: func() interface{} {
        return &OrderRequest{}
    },
}

// Reuse objects
order := orderPool.Get().(*OrderRequest)
defer orderPool.Put(order)

// Use buffered channels
orderChan := make(chan *OrderRequest, 1000)

// Batch Redis operations
pipe := redisClient.Pipeline()
for _, order := range orders {
    pipe.XAdd(ctx, &redis.XAddArgs{...})
}
pipe.Exec(ctx)
```

**Node.js API**:
```typescript
// Use clustering for multi-core
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
    const numWorkers = os.cpus().length;
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
} else {
    // Start Express server
}

// Enable compression
app.use(compression());

// Use response caching
import apicache from 'apicache';
app.use('/api/signals', apicache.middleware('1 minute'));
```

**Python ML Service**:
```python
# Use ONNX for faster inference
import onnxruntime as rt

# Convert XGBoost to ONNX
model_onnx = convert_sklearn(model, initial_types=[...])
with open("model.onnx", "wb") as f:
    f.write(model_onnx.SerializeToString())

# Inference with ONNX
sess = rt.InferenceSession("model.onnx")
predictions = sess.run(None, {input_name: input_data})

# Use batch prediction
predictions = model.predict(X_batch)  # 100x faster than loop

# Enable numba JIT compilation
from numba import jit

@jit(nopython=True)
def calculate_indicators(prices):
    # Vectorized calculations
    pass
```

### 3. Network Optimization

**Connection Pooling**:
```typescript
// PostgreSQL connection pool
const pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Redis connection pool (ioredis)
const redis = new Redis.Cluster([...], {
    redisOptions: {
        poolSize: 100,
        minPoolSize: 10,
    }
});
```

**HTTP/2 and Keep-Alive**:
```typescript
// Enable HTTP/2
import spdy from 'spdy';

spdy.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
}, app).listen(443);

// HTTP keep-alive
app.use((req, res, next) => {
    res.setHeader('Connection', 'keep-alive');
    next();
});
```

## Load Testing Strategy

### Progressive Load Test

```javascript
// k6 script
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Stress test
    { duration: '5m', target: 200 },   // Stress steady
    { duration: '2m', target: 500 },   // Peak load
    { duration: '1m', target: 500 },   // Peak steady
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'http_req_failed': ['rate<0.01'],
  },
};
```

### Chaos Testing

Test system resilience:
```bash
# Kill random service
docker-compose kill -s SIGTERM api-server

# Network latency injection
tc qdisc add dev eth0 root netem delay 50ms 10ms

# Packet loss
tc qdisc add dev eth0 root netem loss 5%
```

## Monitoring Alerts

### Latency Alerts

```yaml
# prometheus/alerts.yml
groups:
  - name: latency
    rules:
      - alert: HighExecutionLatency
        expr: histogram_quantile(0.95, execution_latency_milliseconds) > 100
        for: 5m
        annotations:
          summary: "Execution latency p95 > 100ms"
          
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, http_request_duration_ms) > 50
        for: 5m
        annotations:
          summary: "API response time p95 > 50ms"
```

### Accuracy Alerts

```yaml
  - name: ml_accuracy
    rules:
      - alert: LowModelAccuracy
        expr: model_accuracy < 0.70
        for: 1h
        annotations:
          summary: "Model accuracy below 70% threshold"
```

## Performance Checklist

Before going to production:

- [ ] Run all performance benchmarks and verify targets met
- [ ] Profile all services and fix hotspots
- [ ] Enable connection pooling everywhere
- [ ] Configure proper cache TTLs
- [ ] Set up performance monitoring dashboards
- [ ] Configure alerting for SLO breaches
- [ ] Run chaos tests and verify recovery
- [ ] Load test at 2x expected peak load
- [ ] Document performance baselines
- [ ] Set up auto-scaling policies

## Machine Specifications

### Benchmark Environment

All benchmarks run on:
```
CPU: 8 cores @ 2.8 GHz
RAM: 32 GB
Disk: NVMe SSD
Network: 1 Gbps
OS: Ubuntu 22.04 LTS
```

Adjust expectations based on your hardware:
- **4 cores**: Expect 20-30% higher latency
- **16 cores**: Can achieve 20-30% lower latency
- **Cloud instances**: Add 10-20ms for network variance

## References

- [Go Performance Tips](https://github.com/dgryski/go-perfbook)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Python Performance Tips](https://wiki.python.org/moin/PythonSpeed/PerformanceTips)
- [TimescaleDB Performance Tuning](https://docs.timescale.com/timescaledb/latest/how-to-guides/performance/)
