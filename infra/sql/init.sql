-- ==============================================================================
-- TimescaleDB Initialization Script
-- ==============================================================================
-- This script sets up the database schema for the trading platform including:
-- - Time-series tables with hypertables
-- - Indexes for optimal query performance
-- - Compression policies
-- - Continuous aggregates for OHLC data
-- ==============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==============================================================================
-- Market Data Tables
-- ==============================================================================

-- Raw tick data
CREATE TABLE IF NOT EXISTS market_ticks (
    time TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    price NUMERIC(12, 4) NOT NULL,
    volume BIGINT,
    bid NUMERIC(12, 4),
    ask NUMERIC(12, 4),
    spread NUMERIC(12, 4),
    exchange TEXT,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('market_ticks', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_time 
    ON market_ticks (symbol, time DESC);
CREATE INDEX IF NOT EXISTS idx_market_ticks_time 
    ON market_ticks (time DESC);

-- Enable compression
ALTER TABLE market_ticks SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'symbol',
    timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('market_ticks', INTERVAL '7 days', if_not_exists => TRUE);

-- ==============================================================================
-- OHLC Data (Continuous Aggregate)
-- ==============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS ohlc_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close,
    sum(volume) AS volume,
    count(*) AS tick_count
FROM market_ticks
GROUP BY bucket, symbol
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('ohlc_1min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_ohlc_1min_symbol_bucket 
    ON ohlc_1min (symbol, bucket DESC);

-- ==============================================================================
-- Trading Signals
-- ==============================================================================

CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence NUMERIC(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    price NUMERIC(12, 4) NOT NULL,
    model_id TEXT NOT NULL,
    model_version TEXT NOT NULL,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('trading_signals', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_signals_symbol_time 
    ON trading_signals (symbol, time DESC);
CREATE INDEX IF NOT EXISTS idx_signals_model 
    ON trading_signals (model_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_signals_action 
    ON trading_signals (action, time DESC) WHERE action != 'HOLD';

-- ==============================================================================
-- Orders
-- ==============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    client_order_id TEXT,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity NUMERIC(18, 8) NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    limit_price NUMERIC(12, 4),
    stop_price NUMERIC(12, 4),
    status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'filled', 'partially_filled', 'cancelled', 'rejected')),
    filled_quantity NUMERIC(18, 8) DEFAULT 0,
    filled_avg_price NUMERIC(12, 4),
    time_in_force TEXT DEFAULT 'day',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    latency_ms INTEGER,
    idempotency_key TEXT UNIQUE,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('orders', 'created_at', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_time 
    ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_symbol_time 
    ON orders (symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_id 
    ON orders (order_id);

-- ==============================================================================
-- Portfolio Positions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    avg_cost NUMERIC(12, 4) NOT NULL,
    current_price NUMERIC(12, 4),
    market_value NUMERIC(18, 2),
    pnl NUMERIC(18, 2),
    pnl_percent NUMERIC(8, 4),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_positions_user 
    ON positions (user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol 
    ON positions (symbol);

-- ==============================================================================
-- Backtest Results
-- ==============================================================================

CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    backtest_id TEXT UNIQUE NOT NULL,
    strategy TEXT NOT NULL,
    model_id TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital NUMERIC(18, 2) NOT NULL,
    final_value NUMERIC(18, 2) NOT NULL,
    total_return NUMERIC(8, 4),
    sharpe_ratio NUMERIC(8, 4),
    max_drawdown NUMERIC(8, 4),
    cagr NUMERIC(8, 4),
    win_rate NUMERIC(8, 4),
    profit_factor NUMERIC(8, 4),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    config JSONB,
    metrics JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_strategy 
    ON backtest_results (strategy, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_model 
    ON backtest_results (model_id, created_at DESC);

-- ==============================================================================
-- MLflow Tables (for MLflow backend store)
-- ==============================================================================

-- MLflow database (separate database)
CREATE DATABASE IF NOT EXISTS mlflow;

-- ==============================================================================
-- Performance Metrics
-- ==============================================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC(12, 4) NOT NULL,
    service TEXT NOT NULL,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('performance_metrics', 'time', if_not_exists => TRUE);

-- Create index
CREATE INDEX IF NOT EXISTS idx_metrics_name_time 
    ON performance_metrics (metric_name, time DESC);

-- ==============================================================================
-- Data Retention Policies
-- ==============================================================================

-- Drop raw ticks older than 90 days
SELECT add_retention_policy('market_ticks', INTERVAL '90 days', if_not_exists => TRUE);

-- Drop old performance metrics after 30 days
SELECT add_retention_policy('performance_metrics', INTERVAL '30 days', if_not_exists => TRUE);

-- Keep signals for 1 year
SELECT add_retention_policy('trading_signals', INTERVAL '1 year', if_not_exists => TRUE);

-- Keep orders indefinitely (for compliance)
-- No retention policy on orders table

-- ==============================================================================
-- Utility Functions
-- ==============================================================================

-- Function to update position from order
CREATE OR REPLACE FUNCTION update_position_from_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'filled' AND OLD.status != 'filled' THEN
        -- Update or insert position
        INSERT INTO positions (user_id, symbol, quantity, avg_cost, updated_at)
        VALUES (
            NEW.user_id,
            NEW.symbol,
            CASE WHEN NEW.side = 'buy' THEN NEW.filled_quantity ELSE -NEW.filled_quantity END,
            NEW.filled_avg_price,
            NEW.filled_at
        )
        ON CONFLICT (user_id, symbol) DO UPDATE
        SET
            quantity = positions.quantity + CASE WHEN NEW.side = 'buy' THEN NEW.filled_quantity ELSE -NEW.filled_quantity END,
            avg_cost = CASE
                WHEN NEW.side = 'buy' THEN
                    (positions.quantity * positions.avg_cost + NEW.filled_quantity * NEW.filled_avg_price) / (positions.quantity + NEW.filled_quantity)
                ELSE positions.avg_cost
            END,
            updated_at = NEW.filled_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update positions
CREATE TRIGGER trigger_update_position
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_position_from_order();

-- ==============================================================================
-- Grants and Permissions
-- ==============================================================================

-- Grant permissions (adjust as needed for production)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ==============================================================================
-- Initial Data / Seed Data
-- ==============================================================================

-- Insert sample user positions for testing
INSERT INTO positions (user_id, symbol, quantity, avg_cost, current_price, market_value, pnl, pnl_percent)
VALUES
    ('user_1', 'AAPL', 100, 150.00, 155.00, 15500.00, 500.00, 0.0333),
    ('user_1', 'GOOGL', 50, 2800.00, 2850.00, 142500.00, 2500.00, 0.0179),
    ('user_1', 'MSFT', 75, 320.00, 330.00, 24750.00, 750.00, 0.0313)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- Vacuum and Analyze
-- ==============================================================================

VACUUM ANALYZE market_ticks;
VACUUM ANALYZE trading_signals;
VACUUM ANALYZE orders;
VACUUM ANALYZE positions;
VACUUM ANALYZE backtest_results;
VACUUM ANALYZE performance_metrics;
