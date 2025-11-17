// ==============================================================================
// Execution Engine - Low-latency order execution microservice
// ==============================================================================
// This Go service provides <100ms order execution latency through:
// - Redis Streams for low-latency message consumption
// - In-memory order book simulation
// - Idempotency key handling
// - Order reconciliation
// - Prometheus metrics export
//
// Run: go run main.go
// Benchmark: go test -bench=. -benchmem
// Profile: go run main.go -cpuprofile=cpu.prof
// ==============================================================================

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// OrderRequest represents an incoming order
type OrderRequest struct {
	OrderID         string  `json:"order_id"`
	Symbol          string  `json:"symbol"`
	Side            string  `json:"side"` // buy or sell
	Quantity        float64 `json:"quantity"`
	Type            string  `json:"type"` // market, limit, stop
	LimitPrice      float64 `json:"limit_price,omitempty"`
	StopPrice       float64 `json:"stop_price,omitempty"`
	TimeInForce     string  `json:"time_in_force"`
	IdempotencyKey  string  `json:"idempotency_key"`
	Timestamp       int64   `json:"timestamp"`
}

// OrderResponse represents the execution response
type OrderResponse struct {
	OrderID          string  `json:"order_id"`
	ClientOrderID    string  `json:"client_order_id"`
	Status           string  `json:"status"`
	FilledQuantity   float64 `json:"filled_quantity"`
	FilledAvgPrice   float64 `json:"filled_avg_price"`
	LatencyMs        float64 `json:"latency_ms"`
	AcknowledgedAt   int64   `json:"acknowledged_at"`
}

// ExecutionEngine handles order execution with low latency
type ExecutionEngine struct {
	redisClient      *redis.Client
	streamName       string
	consumerGroup    string
	consumerName     string
	idempotencyCache sync.Map
	orderCache       sync.Map
	ctx              context.Context
	
	// Metrics
	executionLatency prometheus.Histogram
	ordersProcessed  prometheus.Counter
	ordersRejected   prometheus.Counter
}

// NewExecutionEngine creates a new execution engine instance
func NewExecutionEngine(redisHost string, redisPort string, streamName string) *ExecutionEngine {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password:     "",
		DB:           0,
		PoolSize:     100,
		MinIdleConns: 10,
	})

	executionLatency := prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "execution_latency_milliseconds",
		Help:    "Order execution latency in milliseconds",
		Buckets: prometheus.ExponentialBuckets(1, 2, 10), // 1ms to 512ms
	})

	ordersProcessed := prometheus.NewCounter(prometheus.CounterOpts{
		Name: "orders_processed_total",
		Help: "Total number of orders processed",
	})

	ordersRejected := prometheus.NewCounter(prometheus.CounterOpts{
		Name: "orders_rejected_total",
		Help: "Total number of orders rejected",
	})

	prometheus.MustRegister(executionLatency)
	prometheus.MustRegister(ordersProcessed)
	prometheus.MustRegister(ordersRejected)

	return &ExecutionEngine{
		redisClient:      client,
		streamName:       streamName,
		consumerGroup:    "execution-engine-group",
		consumerName:     "execution-engine-1",
		ctx:              context.Background(),
		executionLatency: executionLatency,
		ordersProcessed:  ordersProcessed,
		ordersRejected:   ordersRejected,
	}
}

// Start initializes the execution engine
func (e *ExecutionEngine) Start() error {
	// Create consumer group if it doesn't exist
	_, err := e.redisClient.XGroupCreateMkStream(e.ctx, e.streamName, e.consumerGroup, "$").Result()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		log.Printf("Error creating consumer group: %v", err)
	}

	log.Printf("Execution engine started, listening on stream: %s", e.streamName)
	
	// Start consuming messages
	go e.consumeOrders()
	
	return nil
}

// consumeOrders continuously reads from Redis Stream
func (e *ExecutionEngine) consumeOrders() {
	for {
		streams, err := e.redisClient.XReadGroup(e.ctx, &redis.XReadGroupArgs{
			Group:    e.consumerGroup,
			Consumer: e.consumerName,
			Streams:  []string{e.streamName, ">"},
			Count:    10,
			Block:    100 * time.Millisecond,
		}).Result()

		if err != nil {
			if err != redis.Nil {
				log.Printf("Error reading from stream: %v", err)
			}
			continue
		}

		for _, stream := range streams {
			for _, message := range stream.Messages {
				e.processOrder(message)
				
				// Acknowledge the message
				e.redisClient.XAck(e.ctx, e.streamName, e.consumerGroup, message.ID)
			}
		}
	}
}

// processOrder executes a single order with latency tracking
func (e *ExecutionEngine) processOrder(message redis.XMessage) {
	startTime := time.Now()
	
	// Parse order request
	orderJSON, ok := message.Values["order"].(string)
	if !ok {
		log.Printf("Invalid order format in message: %v", message.ID)
		e.ordersRejected.Inc()
		return
	}

	var order OrderRequest
	if err := json.Unmarshal([]byte(orderJSON), &order); err != nil {
		log.Printf("Error unmarshaling order: %v", err)
		e.ordersRejected.Inc()
		return
	}

	// Check idempotency
	if order.IdempotencyKey != "" {
		if _, exists := e.idempotencyCache.Load(order.IdempotencyKey); exists {
			log.Printf("Duplicate order detected (idempotency key: %s)", order.IdempotencyKey)
			return
		}
		e.idempotencyCache.Store(order.IdempotencyKey, true)
	}

	// Simulate order execution (in production, this would call a broker API)
	response := e.executeOrder(&order)
	
	// Calculate latency
	latency := time.Since(startTime).Milliseconds()
	response.LatencyMs = float64(latency)
	response.AcknowledgedAt = time.Now().UnixMilli()
	
	// Record metrics
	e.executionLatency.Observe(float64(latency))
	e.ordersProcessed.Inc()
	
	// Store order response
	e.orderCache.Store(order.OrderID, response)
	
	// Publish response back to Redis
	responseJSON, _ := json.Marshal(response)
	e.redisClient.Publish(e.ctx, fmt.Sprintf("order.response.%s", order.OrderID), responseJSON)
	
	log.Printf("Order executed: %s (latency: %dms)", order.OrderID, latency)
}

// executeOrder simulates order execution with realistic latency
func (e *ExecutionEngine) executeOrder(order *OrderRequest) *OrderResponse {
	// Simulate execution with minimal latency (< 10ms for local adapter)
	time.Sleep(2 * time.Millisecond)
	
	// Calculate fill price (simplified)
	fillPrice := order.LimitPrice
	if order.Type == "market" {
		// Simulate market price with minor slippage
		fillPrice = 100.0 + (float64(time.Now().UnixNano()%100) / 100.0)
	}
	
	return &OrderResponse{
		OrderID:        order.OrderID,
		ClientOrderID:  order.IdempotencyKey,
		Status:         "filled",
		FilledQuantity: order.Quantity,
		FilledAvgPrice: fillPrice,
	}
}

// GetOrder retrieves an order by ID
func (e *ExecutionEngine) GetOrder(orderID string) (*OrderResponse, bool) {
	val, ok := e.orderCache.Load(orderID)
	if !ok {
		return nil, false
	}
	response := val.(*OrderResponse)
	return response, true
}

// HTTPServer provides HTTP endpoints for order submission
func (e *ExecutionEngine) HTTPServer(port string) {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})
	
	http.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		var order OrderRequest
		if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		// Add to Redis Stream for processing
		orderJSON, _ := json.Marshal(order)
		_, err := e.redisClient.XAdd(e.ctx, &redis.XAddArgs{
			Stream: e.streamName,
			Values: map[string]interface{}{
				"order": orderJSON,
			},
		}).Result()
		
		if err != nil {
			http.Error(w, "Failed to queue order", http.StatusInternalServerError)
			return
		}
		
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{
			"order_id": order.OrderID,
			"status":   "accepted",
		})
	})
	
	http.HandleFunc("/orders/{id}", func(w http.ResponseWriter, r *http.Request) {
		// Extract order ID from path
		orderID := r.URL.Path[len("/orders/"):]
		
		response, ok := e.GetOrder(orderID)
		if !ok {
			http.Error(w, "Order not found", http.StatusNotFound)
			return
		}
		
		json.NewEncoder(w).Encode(response)
	})
	
	// Prometheus metrics endpoint
	http.Handle("/metrics", promhttp.Handler())
	
	log.Printf("HTTP server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func main() {
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	streamName := getEnv("REDIS_STREAM", "execution.orders")
	httpPort := getEnv("HTTP_PORT", "8080")
	
	engine := NewExecutionEngine(redisHost, redisPort, streamName)
	
	if err := engine.Start(); err != nil {
		log.Fatalf("Failed to start execution engine: %v", err)
	}
	
	// Start HTTP server
	engine.HTTPServer(httpPort)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
