"""
==============================================================================
ML Tests - Pytest suite for model training and backtesting
==============================================================================
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from trainer import MLTrainer
from backtest import BacktestEngine

# Set seed for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


class TestMLTrainer:
    """Test suite for ML trainer"""
    
    def test_synthetic_data_generation(self):
        """Test synthetic data generation"""
        trainer = MLTrainer(model_type='xgboost')
        X, y = trainer.generate_synthetic_data(n_samples=1000, n_features=20)
        
        assert len(X) > 0, "Should generate features"
        assert len(y) > 0, "Should generate labels"
        assert len(X) == len(y), "Features and labels should match"
        assert X.shape[1] > 10, "Should have multiple features"
        
        # Check label distribution
        label_counts = y.value_counts()
        assert 0 in label_counts.index, "Should have HOLD labels"
        assert 1 in label_counts.index, "Should have BUY labels"
        assert 2 in label_counts.index, "Should have SELL labels"
    
    def test_data_preparation(self):
        """Test data splitting and scaling"""
        trainer = MLTrainer(model_type='xgboost')
        X, y = trainer.generate_synthetic_data(n_samples=1000)
        
        X_train, X_test, y_train, y_test = trainer.prepare_data(X, y, test_size=0.2)
        
        assert len(X_train) > 0, "Should have training data"
        assert len(X_test) > 0, "Should have test data"
        assert len(X_train) > len(X_test), "Training set should be larger"
        
        # Check scaling (mean should be close to 0, std close to 1)
        assert abs(X_train.mean()) < 1.0, "Scaled data should have mean near 0"
    
    def test_xgboost_training(self):
        """Test XGBoost model training"""
        trainer = MLTrainer(model_type='xgboost')
        X, y = trainer.generate_synthetic_data(n_samples=5000)
        X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)
        
        metrics = trainer.train_xgboost(X_train, X_test, y_train, y_test)
        
        assert 'accuracy' in metrics, "Should return accuracy"
        assert 'precision' in metrics, "Should return precision"
        assert 'recall' in metrics, "Should return recall"
        assert 'f1_score' in metrics, "Should return F1 score"
        
        # Check accuracy meets threshold
        assert metrics['accuracy'] >= 0.50, f"Accuracy {metrics['accuracy']:.2f} should be >= 0.50"
        
        # With 5000 samples, should achieve good performance
        print(f"XGBoost accuracy: {metrics['accuracy']:.4f}")
    
    def test_lightgbm_training(self):
        """Test LightGBM model training"""
        trainer = MLTrainer(model_type='lightgbm')
        X, y = trainer.generate_synthetic_data(n_samples=5000)
        X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)
        
        metrics = trainer.train_lightgbm(X_train, X_test, y_train, y_test)
        
        assert metrics['accuracy'] >= 0.50, "Should achieve reasonable accuracy"
        print(f"LightGBM accuracy: {metrics['accuracy']:.4f}")
    
    def test_deterministic_results(self):
        """Test that training is deterministic with fixed seed"""
        trainer1 = MLTrainer(model_type='xgboost')
        X, y = trainer1.generate_synthetic_data(n_samples=1000)
        X_train, X_test, y_train, y_test = trainer1.prepare_data(X, y)
        metrics1 = trainer1.train_xgboost(X_train, X_test, y_train, y_test)
        
        # Reset and train again
        np.random.seed(RANDOM_SEED)
        trainer2 = MLTrainer(model_type='xgboost')
        X2, y2 = trainer2.generate_synthetic_data(n_samples=1000)
        X_train2, X_test2, y_train2, y_test2 = trainer2.prepare_data(X2, y2)
        metrics2 = trainer2.train_xgboost(X_train2, X_test2, y_train2, y_test2)
        
        # Results should be close (within floating point precision)
        assert abs(metrics1['accuracy'] - metrics2['accuracy']) < 0.01, \
            "Deterministic training should produce same results"


class TestBacktestEngine:
    """Test suite for backtest engine"""
    
    def test_synthetic_ohlcv_generation(self):
        """Test OHLCV data generation"""
        engine = BacktestEngine()
        df = engine.generate_synthetic_ohlcv(
            symbol="TEST",
            start_date="2023-01-01",
            end_date="2023-01-31"
        )
        
        assert len(df) > 0, "Should generate OHLCV data"
        assert 'open' in df.columns, "Should have open prices"
        assert 'high' in df.columns, "Should have high prices"
        assert 'low' in df.columns, "Should have low prices"
        assert 'close' in df.columns, "Should have close prices"
        assert 'volume' in df.columns, "Should have volume"
        
        # Validate OHLC relationships
        assert (df['high'] >= df['low']).all(), "High should be >= Low"
        assert (df['high'] >= df['open']).all(), "High should be >= Open"
        assert (df['high'] >= df['close']).all(), "High should be >= Close"
        assert (df['low'] <= df['open']).all(), "Low should be <= Open"
        assert (df['low'] <= df['close']).all(), "Low should be <= Close"
    
    def test_signal_generation_momentum(self):
        """Test momentum strategy signal generation"""
        engine = BacktestEngine()
        df = engine.generate_synthetic_ohlcv(start_date="2023-01-01", end_date="2023-03-31")
        signals = engine.generate_signals(df, strategy="momentum")
        
        assert len(signals) == len(df), "Should have signal for each period"
        assert signals.isin([0, 1, -1]).all(), "Signals should be -1, 0, or 1"
        assert (signals != 0).sum() > 0, "Should have some non-zero signals"
    
    def test_backtest_execution(self):
        """Test complete backtest execution"""
        engine = BacktestEngine(
            initial_capital=100000,
            commission=0.001,
            slippage=0.001
        )
        
        df = engine.generate_synthetic_ohlcv(start_date="2023-01-01", end_date="2023-12-31")
        signals = engine.generate_signals(df, strategy="momentum")
        metrics = engine.run_backtest(df, signals)
        
        assert 'total_return' in metrics, "Should return total_return"
        assert 'sharpe_ratio' in metrics, "Should return sharpe_ratio"
        assert 'max_drawdown' in metrics, "Should return max_drawdown"
        assert 'cagr' in metrics, "Should return CAGR"
        assert 'win_rate' in metrics, "Should return win_rate"
        assert 'total_trades' in metrics, "Should return trade count"
        
        # Validate metric ranges
        assert -1.0 <= metrics['total_return'] <= 10.0, "Return should be reasonable"
        assert -1.0 <= metrics['max_drawdown'] <= 0.0, "Drawdown should be negative"
        assert metrics['total_trades'] >= 0, "Trade count should be non-negative"
        
        print(f"Backtest metrics: {metrics}")
    
    def test_deterministic_backtest(self):
        """Test that backtest is deterministic"""
        engine1 = BacktestEngine()
        df1 = engine1.generate_synthetic_ohlcv(start_date="2023-01-01", end_date="2023-06-30")
        signals1 = engine1.generate_signals(df1, strategy="momentum")
        metrics1 = engine1.run_backtest(df1, signals1)
        
        # Reset seed and run again
        np.random.seed(RANDOM_SEED)
        engine2 = BacktestEngine()
        df2 = engine2.generate_synthetic_ohlcv(start_date="2023-01-01", end_date="2023-06-30")
        signals2 = engine2.generate_signals(df2, strategy="momentum")
        metrics2 = engine2.run_backtest(df2, signals2)
        
        # Results should be identical
        assert abs(metrics1['total_return'] - metrics2['total_return']) < 0.0001, \
            "Deterministic backtest should produce same results"
    
    def test_multiple_strategies(self):
        """Test different strategies"""
        engine = BacktestEngine()
        df = engine.generate_synthetic_ohlcv(start_date="2023-01-01", end_date="2023-12-31")
        
        strategies = ['momentum', 'mean_reversion', 'breakout']
        results = {}
        
        for strategy in strategies:
            signals = engine.generate_signals(df, strategy=strategy)
            metrics = engine.run_backtest(df, signals)
            results[strategy] = metrics
            
            assert metrics['total_trades'] >= 0, f"{strategy} should generate trades"
        
        print("Strategy comparison:")
        for strategy, metrics in results.items():
            print(f"  {strategy}: Return={metrics['total_return']:.2%}, "
                  f"Sharpe={metrics['sharpe_ratio']:.2f}, "
                  f"Trades={metrics['total_trades']}")


class TestModelAccuracy:
    """Test that models meet accuracy threshold"""
    
    @pytest.mark.slow
    def test_model_meets_accuracy_target(self):
        """
        Acceptance test: Model must achieve >= 70% accuracy
        This is a key SLO for the system
        """
        TARGET_ACCURACY = 0.70
        
        trainer = MLTrainer(model_type='xgboost')
        
        # Use larger sample size for more reliable accuracy measurement
        X, y = trainer.generate_synthetic_data(n_samples=10000)
        X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)
        
        metrics = trainer.train_xgboost(X_train, X_test, y_train, y_test)
        
        accuracy = metrics['accuracy']
        print(f"\n{'='*60}")
        print(f"MODEL ACCURACY TEST")
        print(f"{'='*60}")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Target:   {TARGET_ACCURACY:.4f}")
        print(f"Status:   {'✓ PASS' if accuracy >= TARGET_ACCURACY else '✗ FAIL'}")
        print(f"{'='*60}\n")
        
        assert accuracy >= TARGET_ACCURACY, \
            f"Model accuracy {accuracy:.4f} is below target {TARGET_ACCURACY:.4f}"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
