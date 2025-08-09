#!/bin/bash

# Production MCP Setup Script (to be run on production server)

set -e

log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[1;33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

echo "🔧 Setting up MCP service in production..."

PROJECT_DIR="/root/aiagent"
MCP_DIR="$PROJECT_DIR/backend/api/mcp-yfinance-server"

cd "$PROJECT_DIR" || {
    log_error "Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

# Check if MCP directory exists
if [[ ! -d "$MCP_DIR" ]]; then
    log_error "MCP directory not found: $MCP_DIR"
    log_error "Please ensure the MCP directory is properly copied during deployment"
    exit 1
fi

cd "$MCP_DIR" || {
    log_error "Failed to change to MCP directory"
    exit 1
}

# Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv || {
        log_error "Failed to create virtual environment"
        exit 1
    }
fi

# Activate virtual environment and install dependencies
log_info "Installing MCP dependencies..."
source venv/bin/activate

# Upgrade pip
log_info "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
if [[ -f "requirements.txt" ]]; then
    log_info "Installing from requirements.txt..."
    pip install -r requirements.txt --timeout 60 || {
        log_warn "Failed to install from requirements.txt, trying basic dependencies"
        pip install yfinance mcp --timeout 60 || {
            log_error "Failed to install basic MCP dependencies"
            exit 1
        }
    }
else
    log_info "Installing basic MCP dependencies..."
    pip install yfinance mcp --timeout 60 || {
        log_error "Failed to install MCP dependencies"
        exit 1
    }
fi

deactivate

# Test the installation
log_info "Testing MCP installation..."
if ./venv/bin/python --version > /dev/null 2>&1; then
    log_info "Python virtual environment is working"
else
    log_error "Python virtual environment test failed"
    exit 1
fi

# Test MCP server script
if [[ -f "simple_stock_server.py" ]]; then
    log_info "Testing MCP server script..."
    timeout 10 ./venv/bin/python simple_stock_server.py --help > /dev/null 2>&1 && {
        log_info "MCP server script test passed"
    } || {
        log_warn "MCP server script test failed or timed out, but continuing..."
    }
else
    log_warn "MCP server script not found: simple_stock_server.py"
fi

log_info "✅ MCP production setup completed!"
