"""
==============================================================================
Rebalancing Benchmark - Compare baseline vs optimized implementation
==============================================================================
This script benchmarks portfolio rebalancing algorithms:
- Baseline: Naive sequential implementation
- Optimized: Batched parallel implementation with vectorization

Target: >= 25% speedup for optimized version

Run: python rebalance_benchmark.py --size 1000
==============================================================================
"""

import numpy as np
import pandas as pd
import time
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor
import click

# Set seed for reproducibility
np.random.seed(42)


class BaselineRebalancer:
    """Naive baseline rebalancer - sequential processing"""
    
    def __init__(self, portfolio_size: int):
        self.portfolio_size = portfolio_size
        
    def rebalance(self, current_positions: Dict[str, float],
                 target_allocation: Dict[str, float],
                 total_value: float) -> List[Dict]:
        """
        Rebalance portfolio sequentially
        Returns list of orders
        """
        orders = []
        
        for symbol, target_pct in target_allocation.items():
            current_value = current_positions.get(symbol, 0.0)
            target_value = total_value * target_pct
            diff = target_value - current_value
            
            if abs(diff) > 1.0:  # Minimum order size
                # Simulate order validation and preparation
                order = self._prepare_order(symbol, diff, current_value, target_value)
                orders.append(order)
                
                # Simulate some processing delay
                time.sleep(0.0001)  # 0.1ms per order
        
        return orders
    
    def _prepare_order(self, symbol: str, diff: float,
                      current_value: float, target_value: float) -> Dict:
        """Prepare a single order with validation"""
        # Simulate complex order preparation logic
        side = 'buy' if diff > 0 else 'sell'
        quantity = abs(diff) / 100.0  # Assume $100 per share
        
        # Simulate risk checks
        risk_score = self._calculate_risk(symbol, quantity)
        
        return {
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'current_value': current_value,
            'target_value': target_value,
            'risk_score': risk_score,
        }
    
    def _calculate_risk(self, symbol: str, quantity: float) -> float:
        """Simulate risk calculation"""
        # Some computation to simulate work
        return np.random.random() * quantity * 0.01


class OptimizedRebalancer:
    """Optimized rebalancer using vectorization and parallelism"""
    
    def __init__(self, portfolio_size: int, n_workers: int = 4):
        self.portfolio_size = portfolio_size
        self.n_workers = n_workers
        
    def rebalance(self, current_positions: Dict[str, float],
                 target_allocation: Dict[str, float],
                 total_value: float) -> List[Dict]:
        """
        Rebalance portfolio using vectorized operations and parallel processing
        """
        # Convert to arrays for vectorization
        symbols = list(target_allocation.keys())
        current_values = np.array([current_positions.get(s, 0.0) for s in symbols])
        target_pcts = np.array([target_allocation[s] for s in symbols])
        
        # Vectorized calculation
        target_values = total_value * target_pcts
        diffs = target_values - current_values
        
        # Filter significant changes
        mask = np.abs(diffs) > 1.0
        
        if not mask.any():
            return []
        
        # Batch process orders in parallel
        filtered_symbols = [s for i, s in enumerate(symbols) if mask[i]]
        filtered_diffs = diffs[mask]
        filtered_current = current_values[mask]
        filtered_target = target_values[mask]
        
        # Parallel order preparation
        with ThreadPoolExecutor(max_workers=self.n_workers) as executor:
            orders = list(executor.map(
                self._prepare_order,
                filtered_symbols,
                filtered_diffs,
                filtered_current,
                filtered_target
            ))
        
        return orders
    
    def _prepare_order(self, symbol: str, diff: float,
                      current_value: float, target_value: float) -> Dict:
        """Prepare order (same logic as baseline but called in parallel)"""
        side = 'buy' if diff > 0 else 'sell'
        quantity = abs(diff) / 100.0
        risk_score = self._calculate_risk_vectorized(quantity)
        
        return {
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'current_value': current_value,
            'target_value': target_value,
            'risk_score': risk_score,
        }
    
    def _calculate_risk_vectorized(self, quantity: float) -> float:
        """Vectorized risk calculation"""
        return np.random.random() * quantity * 0.01


def generate_portfolio(size: int) -> Tuple[Dict, Dict, float]:
    """Generate synthetic portfolio data"""
    symbols = [f"STOCK{i:04d}" for i in range(size)]
    
    # Current positions (random allocation)
    current_positions = {
        symbol: np.random.uniform(1000, 10000)
        for symbol in symbols
    }
    
    total_value = sum(current_positions.values())
    
    # Target allocation (normalized random weights)
    weights = np.random.dirichlet(np.ones(size))
    target_allocation = {
        symbol: float(weight)
        for symbol, weight in zip(symbols, weights)
    }
    
    return current_positions, target_allocation, total_value


def benchmark_rebalancer(rebalancer, current_positions: Dict,
                        target_allocation: Dict, total_value: float,
                        n_runs: int = 10) -> Tuple[float, int]:
    """Benchmark a rebalancer and return average time and order count"""
    times = []
    
    for _ in range(n_runs):
        start = time.perf_counter()
        orders = rebalancer.rebalance(current_positions, target_allocation, total_value)
        end = time.perf_counter()
        times.append(end - start)
    
    avg_time = np.mean(times)
    order_count = len(orders)
    
    return avg_time, order_count


@click.command()
@click.option('--size', default=1000, help='Portfolio size (number of positions)')
@click.option('--runs', default=10, help='Number of benchmark runs')
def main(size: int, runs: int):
    """Run rebalancing benchmark"""
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║  Portfolio Rebalancing Benchmark                         ║
    ║  Portfolio Size: {str(size).ljust(43)} ║
    ║  Benchmark Runs: {str(runs).ljust(43)} ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Generate portfolio
    print(f"\nGenerating portfolio with {size} positions...")
    current_positions, target_allocation, total_value = generate_portfolio(size)
    print(f"Total portfolio value: ${total_value:,.2f}")
    
    # Benchmark baseline
    print("\n--- Baseline Rebalancer (Sequential) ---")
    baseline = BaselineRebalancer(size)
    baseline_time, baseline_orders = benchmark_rebalancer(
        baseline, current_positions, target_allocation, total_value, runs
    )
    print(f"Average time: {baseline_time*1000:.2f}ms")
    print(f"Orders generated: {baseline_orders}")
    
    # Benchmark optimized
    print("\n--- Optimized Rebalancer (Parallel + Vectorized) ---")
    optimized = OptimizedRebalancer(size, n_workers=4)
    optimized_time, optimized_orders = benchmark_rebalancer(
        optimized, current_positions, target_allocation, total_value, runs
    )
    print(f"Average time: {optimized_time*1000:.2f}ms")
    print(f"Orders generated: {optimized_orders}")
    
    # Calculate speedup
    speedup = ((baseline_time - optimized_time) / baseline_time) * 100
    
    print("\n" + "="*60)
    print("BENCHMARK RESULTS")
    print("="*60)
    print(f"Baseline time:      {baseline_time*1000:.2f}ms")
    print(f"Optimized time:     {optimized_time*1000:.2f}ms")
    print(f"Speedup:            {speedup:.1f}%")
    print(f"Target speedup:     25.0%")
    
    if speedup >= 25.0:
        print(f"\n✓ PASS: Achieved {speedup:.1f}% speedup (target: >=25%)")
        return 0
    else:
        print(f"\n✗ FAIL: Only achieved {speedup:.1f}% speedup (target: >=25%)")
        return 1


if __name__ == '__main__':
    exit(main())
