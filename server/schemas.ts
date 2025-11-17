"""
==============================================================================
API Server Routes - Enhanced with all trading endpoints
==============================================================================
This module adds the following endpoints:
- POST /api/signals - Generate trading signals
- GET /api/signals - Retrieve signals
- POST /api/backtest - Run backtest
- GET /api/backtest/:id - Get backtest results
- POST /api/orders - Submit order
- GET /api/orders - Get order history
- GET /api/metrics - System metrics
- POST /api/portfolio/:userId/rebalance - Rebalance portfolio
==============================================================================
"""

from typing import TypeScript types and schemas
import { z } from 'zod';

// ==============================================================================
// Zod Validation Schemas
// ==============================================================================

export const TradingSignalSchema = z.object({
  symbol: z.string().min(1).max(10),
  timestamp: z.string().datetime(),
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  confidence: z.number().min(0).max(1),
  price: z.number().positive(),
  model_version: z.string(),
  model_id: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const SignalGenerationSchema = z.object({
  symbol: z.string().min(1).max(10),
  model_id: z.string(),
  market_data: z.record(z.any()).optional(),
});

export const BacktestRequestSchema = z.object({
  strategy: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initial_capital: z.number().positive(),
  symbols: z.array(z.string()).optional(),
  slippage_bps: z.number().min(0).default(10),
  commission_bps: z.number().min(0).default(5),
  config: z.record(z.any()).optional(),
});

export const OrderRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  limit_price: z.number().positive().optional(),
  stop_price: z.number().positive().optional(),
  time_in_force: z.enum(['day', 'gtc', 'ioc', 'fok']).default('day'),
  idempotency_key: z.string().optional(),
});

export const RebalanceRequestSchema = z.object({
  target_allocation: z.record(z.number().min(0).max(1)),
  strategy: z.enum(['baseline', 'optimized']).default('optimized'),
});

export type TradingSignal = z.infer<typeof TradingSignalSchema>;
export type SignalGeneration = z.infer<typeof SignalGenerationSchema>;
export type BacktestRequest = z.infer<typeof BacktestRequestSchema>;
export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type RebalanceRequest = z.infer<typeof RebalanceRequestSchema>;
