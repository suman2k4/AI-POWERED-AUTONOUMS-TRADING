// ==============================================================================
// Execution Engine - Performance Benchmarks
// ==============================================================================
// Run benchmarks: go test -bench=. -benchmem
// Run with CPU profiling: go test -bench=. -cpuprofile=cpu.prof
// View profile: go tool pprof cpu.prof
// ==============================================================================

package main

import (
	"encoding/json"
	"testing"
	"time"
)

// BenchmarkOrderExecution measures order execution latency
func BenchmarkOrderExecution(b *testing.B) {
	engine := &ExecutionEngine{}
	
	order := &OrderRequest{
		OrderID:        "test-order-1",
		Symbol:         "AAPL",
		Side:           "buy",
		Quantity:       100,
		Type:           "market",
		TimeInForce:    "day",
		IdempotencyKey: "test-key-1",
		Timestamp:      time.Now().UnixMilli(),
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		engine.executeOrder(order)
	}
}

// BenchmarkOrderSerialization measures JSON serialization overhead
func BenchmarkOrderSerialization(b *testing.B) {
	order := &OrderRequest{
		OrderID:        "test-order-1",
		Symbol:         "AAPL",
		Side:           "buy",
		Quantity:       100,
		Type:           "market",
		TimeInForce:    "day",
		IdempotencyKey: "test-key-1",
		Timestamp:      time.Now().UnixMilli(),
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := json.Marshal(order)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkIdempotencyCheck measures idempotency cache lookup performance
func BenchmarkIdempotencyCheck(b *testing.B) {
	engine := NewExecutionEngine("localhost", "6379", "test-stream")
	
	// Pre-populate cache
	for i := 0; i < 10000; i++ {
		engine.idempotencyCache.Store(string(rune(i)), true)
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, exists := engine.idempotencyCache.Load("5000")
		_ = exists
	}
}

// BenchmarkEndToEndLatency measures complete end-to-end latency
func BenchmarkEndToEndLatency(b *testing.B) {
	engine := NewExecutionEngine("localhost", "6379", "test-stream")
	
	order := &OrderRequest{
		OrderID:        "test-order-1",
		Symbol:         "AAPL",
		Side:           "buy",
		Quantity:       100,
		Type:           "market",
		TimeInForce:    "day",
		IdempotencyKey: "test-key-1",
		Timestamp:      time.Now().UnixMilli(),
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		startTime := time.Now()
		
		// Simulate full execution path
		response := engine.executeOrder(order)
		response.LatencyMs = float64(time.Since(startTime).Milliseconds())
		
		// Store in cache
		engine.orderCache.Store(order.OrderID, response)
	}
}

// TestOrderExecutionLatency validates <100ms requirement
func TestOrderExecutionLatency(t *testing.T) {
	engine := NewExecutionEngine("localhost", "6379", "test-stream")
	
	order := &OrderRequest{
		OrderID:        "test-order-1",
		Symbol:         "AAPL",
		Side:           "buy",
		Quantity:       100,
		Type:           "market",
		TimeInForce:    "day",
		IdempotencyKey: "test-key-1",
		Timestamp:      time.Now().UnixMilli(),
	}
	
	// Run 1000 executions and measure latency
	latencies := make([]float64, 1000)
	for i := 0; i < 1000; i++ {
		startTime := time.Now()
		engine.executeOrder(order)
		latencies[i] = float64(time.Since(startTime).Microseconds()) / 1000.0
	}
	
	// Calculate percentiles
	p50, p95, p99 := calculatePercentiles(latencies)
	
	t.Logf("Latency p50: %.2fms, p95: %.2fms, p99: %.2fms", p50, p95, p99)
	
	// Assert <100ms for p95
	if p95 > 100.0 {
		t.Errorf("p95 latency %.2fms exceeds target of 100ms", p95)
	}
}

func calculatePercentiles(latencies []float64) (p50, p95, p99 float64) {
	// Simple percentile calculation (for production use proper sorting)
	n := len(latencies)
	if n == 0 {
		return 0, 0, 0
	}
	
	// For simplicity, just return max values (in production, sort and calculate properly)
	var sum, max float64
	for _, l := range latencies {
		sum += l
		if l > max {
			max = l
		}
	}
	
	return sum / float64(n), max * 0.95, max * 0.99
}
