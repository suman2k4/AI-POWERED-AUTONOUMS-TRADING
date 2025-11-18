"""
==============================================================================
ML Inference Server - FastAPI service for model predictions
==============================================================================
Provides REST API for real-time model inference with:
- Model loading from MLflow registry
- Inference caching in Redis
- Prometheus metrics
- Request/response validation

Run: uvicorn inference_server:app --host 0.0.0.0 --port 8000
==============================================================================
"""

import os
import json
import hashlib
import logging
from typing import Dict, List, Optional
from datetime import datetime

# FastAPI
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ML
import numpy as np
import pandas as pd
import mlflow
import mlflow.sklearn
import mlflow.xgboost
import mlflow.lightgbm

# Redis
import redis

# Prometheus
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
MODEL_CACHE_TTL = int(os.getenv('MODEL_CACHE_TTL_SECONDS', '60'))

# Initialize FastAPI
app = FastAPI(
    title="ML Inference Service",
    description="Real-time model inference for trading signals",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MLflow setup
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

# Redis client
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    redis_client.ping()
    logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None

# Prometheus metrics
inference_counter = Counter('inference_requests_total', 'Total inference requests')
inference_latency = Histogram('inference_latency_seconds', 'Inference latency')
cache_hits = Counter('cache_hits_total', 'Total cache hits')
cache_misses = Counter('cache_misses_total', 'Total cache misses')

# Global model cache
model_cache: Dict[str, any] = {}


# ==============================================================================
# Request/Response Models
# ==============================================================================

class InferenceRequest(BaseModel):
    """Request schema for inference"""
    symbol: str = Field(..., description="Stock symbol")
    model_id: str = Field(..., description="Model identifier")
    features: Dict[str, float] = Field(..., description="Feature values")
    
    class Config:
        schema_extra = {
            "example": {
                "symbol": "AAPL",
                "model_id": "xgboost-momentum-v1",
                "features": {
                    "close": 150.0,
                    "rsi": 65.5,
                    "macd": 2.3,
                    "volume": 1000000
                }
            }
        }


class InferenceResponse(BaseModel):
    """Response schema for inference"""
    symbol: str
    timestamp: str
    action: str = Field(..., description="BUY, SELL, or HOLD")
    confidence: float = Field(..., ge=0.0, le=1.0)
    price: float
    model_version: str
    model_id: str
    cached: bool = False
    inference_time_ms: float


# ==============================================================================
# Helper Functions
# ==============================================================================

def load_model(model_id: str, version: Optional[str] = None):
    """Load model from MLflow registry or cache"""
    cache_key = f"{model_id}:{version or 'latest'}"
    
    if cache_key in model_cache:
        logger.info(f"Using cached model: {cache_key}")
        return model_cache[cache_key]
    
    try:
        if version:
            model_uri = f"models:/{model_id}/{version}"
        else:
            model_uri = f"models:/{model_id}/latest"
        
        logger.info(f"Loading model from MLflow: {model_uri}")
        model = mlflow.sklearn.load_model(model_uri)
        
        model_cache[cache_key] = model
        return model
        
    except Exception as e:
        logger.error(f"Failed to load model {model_id}: {e}")
        raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")


def get_cache_key(request: InferenceRequest) -> str:
    """Generate cache key for inference request"""
    # Create deterministic hash from request
    request_str = json.dumps({
        'symbol': request.symbol,
        'model_id': request.model_id,
        'features': dict(sorted(request.features.items()))
    }, sort_keys=True)
    
    return f"inference:{hashlib.md5(request_str.encode()).hexdigest()}"


def check_cache(cache_key: str) -> Optional[Dict]:
    """Check Redis cache for cached prediction"""
    if redis_client is None:
        return None
    
    try:
        cached = redis_client.get(cache_key)
        if cached:
            cache_hits.inc()
            return json.loads(cached)
        cache_misses.inc()
        return None
    except Exception as e:
        logger.warning(f"Cache check failed: {e}")
        return None


def set_cache(cache_key: str, result: Dict, ttl: int = MODEL_CACHE_TTL):
    """Store prediction in Redis cache"""
    if redis_client is None:
        return
    
    try:
        redis_client.setex(cache_key, ttl, json.dumps(result))
    except Exception as e:
        logger.warning(f"Cache set failed: {e}")


# ==============================================================================
# API Endpoints
# ==============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mlflow_uri": MLFLOW_TRACKING_URI,
        "redis_connected": redis_client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/predict", response_model=InferenceResponse)
async def predict(request: InferenceRequest):
    """
    Generate trading signal prediction
    """
    start_time = datetime.now()
    inference_counter.inc()
    
    # Check cache
    cache_key = get_cache_key(request)
    cached_result = check_cache(cache_key)
    
    if cached_result:
        logger.info(f"Cache hit for {request.symbol}")
        return InferenceResponse(**cached_result)
    
    try:
        # Load model
        model = load_model(request.model_id)
        
        # Prepare features
        feature_df = pd.DataFrame([request.features])
        
        # Make prediction
        prediction = model.predict(feature_df)[0]
        
        # Get prediction probabilities if available
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(feature_df)[0]
            confidence = float(np.max(probabilities))
        else:
            confidence = 0.8  # Default confidence
        
        # Map prediction to action
        action_map = {0: 'HOLD', 1: 'BUY', 2: 'SELL'}
        action = action_map.get(int(prediction), 'HOLD')
        
        # Calculate latency
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
        inference_latency.observe(latency_ms / 1000)
        
        # Prepare response
        response = InferenceResponse(
            symbol=request.symbol,
            timestamp=datetime.utcnow().isoformat() + 'Z',
            action=action,
            confidence=confidence,
            price=request.features.get('close', 0.0),
            model_version='1.0.0',
            model_id=request.model_id,
            cached=False,
            inference_time_ms=latency_ms
        )
        
        # Cache result
        set_cache(cache_key, response.dict())
        
        logger.info(f"Prediction for {request.symbol}: {action} (confidence: {confidence:.2f})")
        
        return response
        
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@app.get("/models")
async def list_models():
    """List available models"""
    try:
        client = mlflow.tracking.MlflowClient()
        models = client.list_registered_models()
        
        return {
            "models": [
                {
                    "name": model.name,
                    "latest_version": model.latest_versions[0].version if model.latest_versions else None,
                    "description": model.description
                }
                for model in models
            ]
        }
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
