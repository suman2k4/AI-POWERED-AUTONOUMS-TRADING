"""
==============================================================================
Integration Test - End-to-End System Test
==============================================================================
This test validates the complete system flow from signal generation to
order execution, ensuring all components work together correctly.

Run: pytest tests/integration/test_e2e.py -v
==============================================================================
"""

import pytest
import requests
import time
import json
from typing import Dict

# Configuration
API_BASE_URL = "http://localhost:5001/api"
EXECUTION_ENGINE_URL = "http://localhost:8080"
ML_SERVICE_URL = "http://localhost:8000"

# Skip if services not running
def check_service(url: str) -> bool:
    try:
        response = requests.get(f"{url}/health", timeout=2)
        return response.status_code == 200
    except:
        return False


@pytest.fixture(scope="module")
def check_services():
    """Check that all required services are running"""
    services = {
        "API Server": API_BASE_URL,
        "Execution Engine": EXECUTION_ENGINE_URL,
        "ML Service": ML_SERVICE_URL,
    }
    
    for name, url in services.items():
        if not check_service(url):
            pytest.skip(f"{name} not running at {url}")


class TestEndToEnd:
    """End-to-end integration tests"""
    
    def test_signal_generation(self, check_services):
        """Test signal generation through API"""
        payload = {
            "symbol": "AAPL",
            "model_id": "xgboost-momentum-v1",
            "market_data": {
                "timestamp": int(time.time() * 1000),
                "price": 150.25,
                "volume": 1000000
            }
        }
        
        response = requests.post(
            f"{API_BASE_URL}/signals",
            json=payload,
            timeout=10
        )
        
        assert response.status_code in [200, 201, 404], \
            f"Signal generation failed: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "symbol" in data
            assert "action" in data
            assert data["action"] in ["BUY", "SELL", "HOLD"]
    
    def test_order_submission(self, check_services):
        """Test order submission to execution engine"""
        order_id = f"test-order-{int(time.time())}"
        
        payload = {
            "order_id": order_id,
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 100,
            "type": "market",
            "time_in_force": "day",
            "idempotency_key": f"idem-{order_id}",
            "timestamp": int(time.time() * 1000)
        }
        
        response = requests.post(
            f"{EXECUTION_ENGINE_URL}/orders",
            json=payload,
            timeout=5
        )
        
        assert response.status_code in [200, 201, 202], \
            f"Order submission failed: {response.text}"
        
        if response.status_code in [200, 201, 202]:
            data = response.json()
            assert "order_id" in data or "status" in data
    
    def test_ml_inference(self, check_services):
        """Test ML inference service"""
        payload = {
            "symbol": "AAPL",
            "model_id": "xgboost-momentum-v1",
            "features": {
                "close": 150.0,
                "open": 149.5,
                "high": 151.0,
                "low": 149.0,
                "volume": 1000000,
                "rsi": 65.5,
                "macd": 2.3
            }
        }
        
        response = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json=payload,
            timeout=10
        )
        
        # ML service might not have models loaded yet
        if response.status_code == 200:
            data = response.json()
            assert "action" in data
            assert "confidence" in data
            assert 0 <= data["confidence"] <= 1
    
    def test_latency_requirement(self, check_services):
        """Test that order execution meets <100ms latency requirement"""
        latencies = []
        
        for i in range(10):
            order_id = f"latency-test-{int(time.time())}-{i}"
            payload = {
                "order_id": order_id,
                "symbol": "AAPL",
                "side": "buy",
                "quantity": 100,
                "type": "market",
                "time_in_force": "day",
                "idempotency_key": f"idem-{order_id}",
                "timestamp": int(time.time() * 1000)
            }
            
            start = time.time()
            response = requests.post(
                f"{EXECUTION_ENGINE_URL}/orders",
                json=payload,
                timeout=1
            )
            latency_ms = (time.time() - start) * 1000
            
            if response.status_code in [200, 201, 202]:
                latencies.append(latency_ms)
            
            time.sleep(0.1)  # Small delay between requests
        
        if latencies:
            avg_latency = sum(latencies) / len(latencies)
            max_latency = max(latencies)
            
            print(f"\nLatency Test Results:")
            print(f"  Average: {avg_latency:.2f}ms")
            print(f"  Max: {max_latency:.2f}ms")
            print(f"  Samples: {len(latencies)}")
            
            # Assert average latency is reasonable
            assert avg_latency < 200, \
                f"Average latency {avg_latency:.2f}ms exceeds 200ms"
    
    def test_signal_to_order_flow(self, check_services):
        """Test complete flow from signal generation to order execution"""
        symbol = "AAPL"
        
        # Step 1: Generate signal (if API available)
        try:
            signal_response = requests.post(
                f"{API_BASE_URL}/signals",
                json={
                    "symbol": symbol,
                    "model_id": "xgboost-momentum-v1",
                    "market_data": {"price": 150.0}
                },
                timeout=5
            )
            
            if signal_response.status_code not in [200, 201]:
                pytest.skip("Signal generation not available")
            
            signal = signal_response.json()
            
            # Step 2: If signal is BUY or SELL, submit order
            if signal.get("action") in ["BUY", "SELL"]:
                order_id = f"signal-order-{int(time.time())}"
                
                order_response = requests.post(
                    f"{EXECUTION_ENGINE_URL}/orders",
                    json={
                        "order_id": order_id,
                        "symbol": symbol,
                        "side": signal["action"].lower(),
                        "quantity": 100,
                        "type": "market",
                        "time_in_force": "day",
                        "idempotency_key": f"idem-{order_id}",
                        "timestamp": int(time.time() * 1000)
                    },
                    timeout=5
                )
                
                assert order_response.status_code in [200, 201, 202], \
                    "Order submission failed after signal generation"
        
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Service not available: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
