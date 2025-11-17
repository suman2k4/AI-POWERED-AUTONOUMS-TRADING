"""
==============================================================================
Backtest Engine - Deterministic backtesting with vectorbt
==============================================================================
This module provides:
- Deterministic backtesting with fixed seeds
- Performance metrics (Sharpe, drawdown, CAGR, win rate)
- Trade analysis and equity curves
- Config-driven scenarios with slippage modeling

Run: python backtest.py --strategy momentum --start 2023-01-01 --end 2023-12-31
==============================================================================
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import click

# Backtesting
import vectorbt as vbt

# MLflow
import mlflow
import mlflow.log_artifact

# Set deterministic seed
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Configuration
DEFAULT_INITIAL_CAPITAL = 100000
DEFAULT_COMMISSION = 0.001  # 0.1% = 10 bps / 10000
DEFAULT_SLIPPAGE = 0.001    # 0.1% = 10 bps / 10000


class BacktestEngine:
    """Vectorized backtesting engine with comprehensive metrics"""
    
    def __init__(self, initial_capital: float = DEFAULT_INITIAL_CAPITAL,
                 commission: float = DEFAULT_COMMISSION,
                 slippage: float = DEFAULT_SLIPPAGE):
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage
        self.results = None
        
    def generate_synthetic_ohlcv(self, symbol: str = "SYNTHETIC",
                                 start_date: str = "2023-01-01",
                                 end_date: str = "2023-12-31",
                                 initial_price: float = 100.0) -> pd.DataFrame:
        """
        Generate synthetic OHLCV data with realistic price movements
        Uses geometric Brownian motion for price simulation
        """
        print(f"Generating synthetic OHLCV data for {symbol}...")
        
        # Generate date range
        dates = pd.date_range(start=start_date, end=end_date, freq='1H')
        n_periods = len(dates)
        
        # Geometric Brownian Motion parameters
        mu = 0.0001  # drift (slight upward trend)
        sigma = 0.02  # volatility
        
        # Generate price series
        dt = 1.0
        prices = [initial_price]
        
        for i in range(1, n_periods):
            drift = mu * dt
            shock = sigma * np.sqrt(dt) * np.random.randn()
            price = prices[-1] * np.exp(drift + shock)
            prices.append(max(price, 1.0))  # Ensure positive prices
        
        # Create OHLCV dataframe
        df = pd.DataFrame(index=dates)
        df['close'] = prices
        
        # Generate OHLC from close prices with realistic spreads
        df['open'] = df['close'].shift(1).fillna(df['close'].iloc[0]) * (1 + np.random.uniform(-0.005, 0.005, n_periods))
        df['high'] = df[['open', 'close']].max(axis=1) * (1 + np.random.uniform(0, 0.01, n_periods))
        df['low'] = df[['open', 'close']].min(axis=1) * (1 - np.random.uniform(0, 0.01, n_periods))
        df['volume'] = np.random.randint(100000, 1000000, n_periods)
        
        print(f"Generated {len(df)} periods from {start_date} to {end_date}")
        print(f"Price range: ${df['close'].min():.2f} - ${df['close'].max():.2f}")
        
        return df
    
    def generate_signals(self, ohlcv: pd.DataFrame, 
                        strategy: str = "momentum") -> pd.Series:
        """
        Generate trading signals based on strategy
        Returns: Series of 1 (buy), -1 (sell), 0 (hold)
        """
        print(f"Generating signals for strategy: {strategy}")
        
        if strategy == "momentum":
            # Simple momentum strategy: buy when price > SMA, sell when below
            sma_short = ohlcv['close'].rolling(window=20).mean()
            sma_long = ohlcv['close'].rolling(window=50).mean()
            
            signals = pd.Series(0, index=ohlcv.index)
            signals[sma_short > sma_long] = 1
            signals[sma_short < sma_long] = -1
            
        elif strategy == "mean_reversion":
            # Mean reversion: buy when price is below lower Bollinger Band
            sma = ohlcv['close'].rolling(window=20).mean()
            std = ohlcv['close'].rolling(window=20).std()
            
            upper_band = sma + (2 * std)
            lower_band = sma - (2 * std)
            
            signals = pd.Series(0, index=ohlcv.index)
            signals[ohlcv['close'] < lower_band] = 1
            signals[ohlcv['close'] > upper_band] = -1
            
        elif strategy == "breakout":
            # Breakout strategy: buy on new highs
            rolling_max = ohlcv['high'].rolling(window=50).max()
            rolling_min = ohlcv['low'].rolling(window=50).min()
            
            signals = pd.Series(0, index=ohlcv.index)
            signals[ohlcv['close'] > rolling_max.shift(1)] = 1
            signals[ohlcv['close'] < rolling_min.shift(1)] = -1
            
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
        
        # Forward fill NaN values
        signals = signals.fillna(0)
        
        print(f"Generated {len(signals[signals != 0])} signals")
        return signals
    
    def run_backtest(self, ohlcv: pd.DataFrame, signals: pd.Series) -> Dict:
        """
        Run vectorized backtest with vectorbt
        Returns comprehensive performance metrics
        """
        print("\nRunning backtest...")
        
        # Convert signals to entries and exits
        entries = signals == 1
        exits = signals == -1
        
        # Run portfolio simulation
        portfolio = vbt.Portfolio.from_signals(
            close=ohlcv['close'],
            entries=entries,
            exits=exits,
            init_cash=self.initial_capital,
            fees=self.commission,
            slippage=self.slippage,
            freq='1H'
        )
        
        # Calculate metrics
        total_return = portfolio.total_return()
        sharpe_ratio = portfolio.sharpe_ratio()
        max_drawdown = portfolio.max_drawdown()
        
        # Calculate CAGR
        start_value = self.initial_capital
        end_value = portfolio.total_value()[-1]
        n_years = len(ohlcv) / (252 * 6.5)  # Trading hours per year
        cagr = (end_value / start_value) ** (1 / n_years) - 1 if n_years > 0 else 0
        
        # Trade statistics
        trades = portfolio.trades.records_readable
        if len(trades) > 0:
            winning_trades = trades[trades['PnL'] > 0]
            losing_trades = trades[trades['PnL'] < 0]
            
            win_rate = len(winning_trades) / len(trades) if len(trades) > 0 else 0
            avg_win = winning_trades['PnL'].mean() if len(winning_trades) > 0 else 0
            avg_loss = losing_trades['PnL'].mean() if len(losing_trades) > 0 else 0
            profit_factor = abs(winning_trades['PnL'].sum() / losing_trades['PnL'].sum()) if len(losing_trades) > 0 and losing_trades['PnL'].sum() != 0 else 0
        else:
            win_rate = 0
            avg_win = 0
            avg_loss = 0
            profit_factor = 0
        
        # Equity curve
        equity_curve = portfolio.total_value()
        
        metrics = {
            'total_return': float(total_return),
            'sharpe_ratio': float(sharpe_ratio) if not np.isnan(sharpe_ratio) else 0.0,
            'max_drawdown': float(max_drawdown),
            'cagr': float(cagr),
            'win_rate': float(win_rate),
            'profit_factor': float(profit_factor),
            'total_trades': int(len(trades)),
            'winning_trades': int(len(winning_trades)) if len(trades) > 0 else 0,
            'losing_trades': int(len(losing_trades)) if len(trades) > 0 else 0,
            'avg_win': float(avg_win),
            'avg_loss': float(avg_loss),
            'final_value': float(end_value),
            'total_fees': float(portfolio.total_fees()),
        }
        
        self.results = {
            'metrics': metrics,
            'equity_curve': equity_curve.to_dict(),
            'trades': trades.to_dict() if len(trades) > 0 else {},
            'config': {
                'initial_capital': self.initial_capital,
                'commission_bps': self.commission * 10000,
                'slippage_bps': self.slippage * 10000,
                'random_seed': RANDOM_SEED,
            }
        }
        
        return metrics
    
    def print_results(self, metrics: Dict):
        """Print backtest results in a formatted way"""
        print("\n" + "="*60)
        print("BACKTEST RESULTS")
        print("="*60)
        print(f"Initial Capital:    ${self.initial_capital:,.2f}")
        print(f"Final Value:        ${metrics['final_value']:,.2f}")
        print(f"Total Return:       {metrics['total_return']*100:.2f}%")
        print(f"CAGR:               {metrics['cagr']*100:.2f}%")
        print(f"Sharpe Ratio:       {metrics['sharpe_ratio']:.2f}")
        print(f"Max Drawdown:       {metrics['max_drawdown']*100:.2f}%")
        print(f"\nTrade Statistics:")
        print(f"  Total Trades:     {metrics['total_trades']}")
        print(f"  Winning Trades:   {metrics['winning_trades']}")
        print(f"  Losing Trades:    {metrics['losing_trades']}")
        print(f"  Win Rate:         {metrics['win_rate']*100:.2f}%")
        print(f"  Profit Factor:    {metrics['profit_factor']:.2f}")
        print(f"  Avg Win:          ${metrics['avg_win']:.2f}")
        print(f"  Avg Loss:         ${metrics['avg_loss']:.2f}")
        print(f"  Total Fees:       ${metrics['total_fees']:.2f}")
        print("="*60 + "\n")
    
    def save_results(self, output_path: str = "backtest_results.json"):
        """Save backtest results to JSON file"""
        if self.results is None:
            print("No results to save. Run backtest first.")
            return
        
        with open(output_path, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"Results saved to {output_path}")
        
        # Log to MLflow if available
        try:
            mlflow.log_artifact(output_path)
            mlflow.log_metrics(self.results['metrics'])
        except Exception as e:
            print(f"Warning: Could not log to MLflow: {e}")


@click.command()
@click.option('--strategy', type=click.Choice(['momentum', 'mean_reversion', 'breakout']),
              default='momentum', help='Trading strategy')
@click.option('--start', default='2023-01-01', help='Start date (YYYY-MM-DD)')
@click.option('--end', default='2023-12-31', help='End date (YYYY-MM-DD)')
@click.option('--capital', default=100000.0, help='Initial capital')
@click.option('--commission', default=10.0, help='Commission in basis points')
@click.option('--slippage', default=10.0, help='Slippage in basis points')
@click.option('--output', default='backtest_results.json', help='Output file')
def main(strategy: str, start: str, end: str, capital: float,
         commission: float, slippage: float, output: str):
    """Run backtest with specified parameters"""
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║  AI-Powered Trading Platform - Backtest Engine           ║
    ║  Strategy: {strategy.upper().ljust(46)} ║
    ║  Period: {start} to {end.ljust(29)} ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Initialize backtest engine
    engine = BacktestEngine(
        initial_capital=capital,
        commission=commission / 10000,  # Convert bps to decimal
        slippage=slippage / 10000
    )
    
    # Generate synthetic data
    ohlcv = engine.generate_synthetic_ohlcv(
        symbol="SYNTHETIC",
        start_date=start,
        end_date=end
    )
    
    # Generate signals
    signals = engine.generate_signals(ohlcv, strategy=strategy)
    
    # Run backtest
    metrics = engine.run_backtest(ohlcv, signals)
    
    # Print results
    engine.print_results(metrics)
    
    # Save results
    engine.save_results(output)
    
    print(f"\n✓ Backtest complete!")


if __name__ == '__main__':
    main()
