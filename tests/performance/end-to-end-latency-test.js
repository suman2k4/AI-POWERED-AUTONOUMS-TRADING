// ==============================================================================
// k6 Load Test Script - End-to-End Signal to Order Latency
// ==============================================================================
// This script measures the complete latency from signal generation to order
// acknowledgment through the entire system.
//
// Run: k6 run --vus 5 --duration 60s end-to-end-latency-test.js
// ==============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom metrics
const e2eLatency = new Trend('e2e_latency_ms');
const signalGenTime = new Trend('signal_generation_ms');
const executionTime = new Trend('execution_time_ms');
const totalSignals = new Counter('signals_generated');

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 5 },
  ],
  thresholds: {
    'e2e_latency_ms': ['p(95)<100'],
    'http_req_duration': ['p(95)<100'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:5001/api';
const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

export default function () {
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const timestamp = Date.now();
  
  // Step 1: Generate signal
  const signalPayload = JSON.stringify({
    symbol: symbol,
    model_id: 'xgboost-momentum-v1',
    market_data: {
      timestamp: timestamp,
      price: 150.0 + Math.random() * 10,
    },
  });

  const signalStart = Date.now();
  const signalResponse = http.post(`${API_URL}/signals`, signalPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const signalDuration = Date.now() - signalStart;
  
  signalGenTime.add(signalDuration);
  totalSignals.add(1);

  if (signalResponse.status !== 201) {
    console.error(`Signal generation failed: ${signalResponse.status}`);
    return;
  }

  const signal = JSON.parse(signalResponse.body);
  
  // Step 2: Execute order based on signal
  if (signal.action !== 'HOLD' && signal.confidence > 0.7) {
    const orderPayload = JSON.stringify({
      order_id: `order-${timestamp}-${Math.random()}`,
      symbol: signal.symbol,
      side: signal.action.toLowerCase(),
      quantity: 100,
      type: 'market',
      time_in_force: 'day',
      idempotency_key: `idem-${timestamp}-${Math.random()}`,
      timestamp: timestamp,
    });

    const orderStart = Date.now();
    const orderResponse = http.post(`${API_URL}/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    const orderDuration = Date.now() - orderStart;
    
    executionTime.add(orderDuration);
    
    // Calculate end-to-end latency
    const totalLatency = Date.now() - timestamp;
    e2eLatency.add(totalLatency);
    
    check(orderResponse, {
      'order placed': (r) => r.status === 201 || r.status === 202,
      'e2e latency < 100ms': () => totalLatency < 100,
    });
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const e2eP95 = data.metrics.e2e_latency_ms?.values['p(95)'] || 0;
  const signalP95 = data.metrics.signal_generation_ms?.values['p(95)'] || 0;
  const execP95 = data.metrics.execution_time_ms?.values['p(95)'] || 0;
  
  console.log(`\n=== End-to-End Latency Results ===`);
  console.log(`Signal Generation P95: ${signalP95.toFixed(2)}ms`);
  console.log(`Order Execution P95: ${execP95.toFixed(2)}ms`);
  console.log(`Total E2E P95: ${e2eP95.toFixed(2)}ms`);
  console.log(`Target: <100ms (${e2eP95 < 100 ? 'PASS' : 'FAIL'})`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'e2e-summary.json': JSON.stringify(data),
  };
}
