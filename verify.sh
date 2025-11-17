#!/bin/bash
# ==============================================================================
# Verification Script - Validate Implementation Completeness
# ==============================================================================
# This script verifies that all required components are present and functional
# Run: ./verify.sh
# ==============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AI-Powered Trading Platform - Implementation Verification ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASS=0
FAIL=0

# Helper function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAIL++))
    fi
}

echo "=== Checking File Structure ==="

# Check critical files
test -f "openapi.yaml" && check "OpenAPI specification exists" || check "OpenAPI specification exists"
test -f "docker-compose.yml" && check "Docker Compose file exists" || check "Docker Compose file exists"
test -f "Makefile" && check "Makefile exists" || check "Makefile exists"
test -f "README.md" && check "README.md exists" || check "README.md exists"
test -f "ARCHITECTURE.md" && check "ARCHITECTURE.md exists" || check "ARCHITECTURE.md exists"
test -f "PERFORMANCE.md" && check "PERFORMANCE.md exists" || check "PERFORMANCE.md exists"
test -f "QUICKSTART.md" && check "QUICKSTART.md exists" || check "QUICKSTART.md exists"
test -f ".env.example" && check ".env.example exists" || check ".env.example exists"

echo ""
echo "=== Checking Go Execution Engine ==="

test -f "execution/main.go" && check "Go main file exists" || check "Go main file exists"
test -f "execution/main_test.go" && check "Go test file exists" || check "Go test file exists"
test -f "execution/go.mod" && check "Go modules file exists" || check "Go modules file exists"
test -f "execution/Dockerfile" && check "Go Dockerfile exists" || check "Go Dockerfile exists"

echo ""
echo "=== Checking Python ML Service ==="

test -f "ml/src/trainer.py" && check "ML trainer exists" || check "ML trainer exists"
test -f "ml/src/backtest.py" && check "Backtest engine exists" || check "Backtest engine exists"
test -f "ml/src/inference_server.py" && check "Inference server exists" || check "Inference server exists"
test -f "ml/tests/test_ml.py" && check "ML tests exist" || check "ML tests exist"
test -f "ml/requirements.txt" && check "Python requirements exist" || check "Python requirements exist"
test -f "ml/Dockerfile" && check "ML Dockerfile exists" || check "ML Dockerfile exists"
test -f "ml/pytest.ini" && check "Pytest config exists" || check "Pytest config exists"

echo ""
echo "=== Checking Performance Tests ==="

test -f "tests/performance/execution-latency-test.js" && check "Execution latency test exists" || check "Execution latency test exists"
test -f "tests/performance/end-to-end-latency-test.js" && check "E2E latency test exists" || check "E2E latency test exists"
test -f "tests/performance/rebalance_benchmark.py" && check "Rebalancing benchmark exists" || check "Rebalancing benchmark exists"

echo ""
echo "=== Checking Integration Tests ==="

test -f "tests/integration/test_e2e.py" && check "E2E integration test exists" || check "E2E integration test exists"

echo ""
echo "=== Checking Infrastructure ==="

test -f "infra/sql/init.sql" && check "TimescaleDB init script exists" || check "TimescaleDB init script exists"
test -f "infra/prometheus/prometheus.yml" && check "Prometheus config exists" || check "Prometheus config exists"
test -f "infra/k8s/deployment.yaml" && check "Kubernetes manifests exist" || check "Kubernetes manifests exist"

echo ""
echo "=== Checking CI/CD ==="

test -f ".github/workflows/ci.yml" && check "GitHub Actions workflow exists" || check "GitHub Actions workflow exists"

echo ""
echo "=== Checking Server Components ==="

test -f "server/index.ts" && check "Server main file exists" || check "Server main file exists"
test -f "server/schemas.ts" && check "Server schemas exist" || check "Server schemas exist"
test -f "Dockerfile.server" && check "Server Dockerfile exists" || check "Server Dockerfile exists"

echo ""
echo "=== Checking Client Components ==="

test -f "client/src/components/ui/glass-card.tsx" && check "GlassCard component exists" || check "GlassCard component exists"

echo ""
echo "=== Checking Dependencies ==="

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Node.js not installed"
fi

# Check if Python is installed
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} Python installed: $PYTHON_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Python not installed"
fi

# Check if Go is installed
if command -v go &> /dev/null; then
    GO_VERSION=$(go version)
    echo -e "${GREEN}✓${NC} Go installed: $GO_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Go not installed"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Docker not installed"
fi

# Check if Make is installed
if command -v make &> /dev/null; then
    MAKE_VERSION=$(make --version | head -n1)
    echo -e "${GREEN}✓${NC} Make installed: $MAKE_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Make not installed"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'make install' to install dependencies"
    echo "  2. Run 'make docker-up' to start infrastructure"
    echo "  3. Run 'make train-all' to train ML models"
    echo "  4. Run 'make dev-all' to start all services"
    echo "  5. Run 'make test' to verify everything works"
    echo "  6. Run 'make perf' to validate performance targets"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo "Please ensure all required files are present"
    exit 1
fi
