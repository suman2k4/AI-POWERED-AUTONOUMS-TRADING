// ==============================================================================
// k6 Load Test Script - Order Execution Latency
// ==============================================================================
// This script tests the execution engine's ability to handle orders with
// <100ms latency under load.
//
// Run: k6 run --vus 10 --duration 30s execution-latency-test.js
// ==============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const orderLatency = new Trend('order_latency_ms');
const orderSuccess = new Rate('order_success_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp up to 10 VUs
    { duration: '30s', target: 50 },  // Stress test with 50 VUs
    { duration: '10s', target: 100 }, // Peak load
    { duration: '20s', target: 10 },  // Ramp down
  ],
  thresholds: {
    'order_latency_ms': ['p(95)<100'], // 95th percentile must be < 100ms
    'order_success_rate': ['rate>0.99'], // 99% success rate
    'http_req_duration': ['p(95)<100'],
  },
};

const EXECUTION_ENGINE_URL = __ENV.EXECUTION_ENGINE_URL || 'http://localhost:8080';

export default function () {
  const orderID = `order-${Date.now()}-${Math.random()}`;
  const idempotencyKey = `idem-${Date.now()}-${Math.random()}`;
  
  const payload = JSON.stringify({
    order_id: orderID,
    symbol: 'AAPL',
    side: 'buy',
    quantity: 100,
    type: 'market',
    time_in_force: 'day',
    idempotency_key: idempotencyKey,
    timestamp: Date.now(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const response = http.post(`${EXECUTION_ENGINE_URL}/orders`, payload, params);
  const latency = Date.now() - startTime;

  // Record metrics
  orderLatency.add(latency);
  orderSuccess.add(response.status === 202);

  // Assertions
  check(response, {
    'status is 202': (r) => r.status === 202,
    'latency < 100ms': () => latency < 100,
    'has order_id': (r) => JSON.parse(r.body).order_id !== undefined,
  });

  // Small delay between requests
  sleep(0.1);
}

export function handleSummary(data) {
  const p95Latency = data.metrics.order_latency_ms.values['p(95)'];
  const successRate = data.metrics.order_success_rate.values.rate;
  
  console.log(`\n=== Performance Test Results ===`);
  console.log(`P95 Latency: ${p95Latency.toFixed(2)}ms`);
  console.log(`Success Rate: ${(successRate * 100).toFixed(2)}%`);
  console.log(`Target: <100ms (${p95Latency < 100 ? 'PASS' : 'FAIL'})`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data),
  };
}
