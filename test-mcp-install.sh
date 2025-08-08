#!/bin/bash

# MCP Installation Test Script
# This script tests only the MCP server installation part

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🧪 Testing MCP server installation..."

# Change to MCP directory
MCP_DIR="backend/api/mcp-yfinance-server"
if [[ ! -d "$MCP_DIR" ]]; then
    log_error "MCP directory not found: $MCP_DIR"
    exit 1
fi

cd "$MCP_DIR"
log_info "Changed to MCP directory: $(pwd)"

# Check if virtual environment exists
if [[ ! -d "venv" ]]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate || {
    log_error "Failed to activate virtual environment"
    exit 1
}

log_info "Virtual environment activated: $(which python)"
log_info "Python version: $(python --version)"
log_info "Pip version: $(pip --version)"

# Test pip upgrade
log_info "Testing pip upgrade..."
if timeout 60 pip install --upgrade pip --quiet; then
    log_info "Pip upgrade successful"
else
    log_warn "Pip upgrade failed, continuing..."
fi

# Test basic dependency installation
log_info "Testing basic dependency installation..."
if timeout 120 pip install yfinance --timeout 30 --progress-bar off; then
    log_info "yfinance installation successful"
else
    log_error "yfinance installation failed"
    deactivate
    exit 1
fi

if timeout 120 pip install mcp --timeout 30 --progress-bar off; then
    log_info "mcp installation successful"
else
    log_error "mcp installation failed"
    deactivate
    exit 1
fi

# Test Python script
if [[ -f "demo_stock_price_server.py" ]]; then
    log_info "Testing Python script..."
    if timeout 10 python demo_stock_price_server.py --help > /dev/null 2>&1; then
        log_info "Python script test successful"
    else
        log_warn "Python script test failed or timed out"
    fi
else
    log_warn "demo_stock_price_server.py not found"
fi

# Deactivate virtual environment
log_info "Deactivating virtual environment..."
deactivate

log_info "✅ MCP installation test completed successfully!"
echo ""
echo "If this test passes but the main deployment still hangs,"
echo "the issue is likely in a different part of the deployment script."
echo ""
echo "To run the main deployment with debug output:"
echo "DEBUG=1 ./deploy-production.sh"