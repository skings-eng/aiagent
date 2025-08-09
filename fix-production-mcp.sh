#!/bin/bash

# Fix Production MCP Configuration Script
# This script fixes MCP service configuration issues in production environment

set -e

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

echo "🔧 Starting MCP production environment fix..."

# Configuration
PROJECT_DIR="/root/aiagent"
LOCAL_PROJECT_DIR="/Users/sking/aiagent"
PRODUCTION_ENV_FILE="backend/api/.env.production"

# Check if we're running locally or on production server
if [[ -d "$PROJECT_DIR" ]]; then
    WORKING_DIR="$PROJECT_DIR"
    log_info "Running on production server: $PROJECT_DIR"
else
    WORKING_DIR="$LOCAL_PROJECT_DIR"
    log_info "Running locally: $LOCAL_PROJECT_DIR"
fi

cd "$WORKING_DIR" || {
    log_error "Failed to change to working directory: $WORKING_DIR"
    exit 1
}

# Step 1: Add MCP configuration to production environment file
log_info "Adding MCP configuration to production environment..."

if [[ ! -f "$PRODUCTION_ENV_FILE" ]]; then
    log_error "Production environment file not found: $PRODUCTION_ENV_FILE"
    exit 1
fi

# Check if MCP configuration already exists
if grep -q "MCP_PYTHON_PATH" "$PRODUCTION_ENV_FILE"; then
    log_info "MCP configuration already exists in production environment"
else
    log_info "Adding MCP configuration to production environment file..."
    cat >> "$PRODUCTION_ENV_FILE" << 'EOF'

# MCP Stock Data Service Configuration
MCP_PYTHON_PATH=/root/aiagent/backend/api/mcp-yfinance-server/venv/bin/python
MCP_SERVER_PATH=/root/aiagent/backend/api/mcp-yfinance-server/simple_stock_server.py
MCP_TIMEOUT=30000
MCP_RETRY_COUNT=3
MCP_CACHE_TTL=300
EOF
    log_info "MCP configuration added to production environment"
fi

# Step 2: Check MCP directory and virtual environment
MCP_DIR="backend/api/mcp-yfinance-server"
log_info "Checking MCP directory: $MCP_DIR"

if [[ ! -d "$MCP_DIR" ]]; then
    log_error "MCP directory not found: $MCP_DIR"
    log_info "This needs to be fixed during deployment. The MCP directory should be copied to production."
else
    log_info "MCP directory exists: $MCP_DIR"
    
    # Check virtual environment
    if [[ ! -f "$MCP_DIR/venv/bin/python" ]]; then
        log_warn "MCP virtual environment not found. Attempting to create..."
        
        cd "$MCP_DIR" || {
            log_error "Failed to change to MCP directory"
            exit 1
        }
        
        # Create virtual environment
        log_info "Creating Python virtual environment..."
        python3 -m venv venv || {
            log_error "Failed to create virtual environment"
            exit 1
        }
        
        # Activate and install dependencies
        log_info "Installing MCP dependencies..."
        source venv/bin/activate
        
        if [[ -f "requirements.txt" ]]; then
            pip install -r requirements.txt || {
                log_warn "Failed to install from requirements.txt, trying basic dependencies"
                pip install yfinance mcp || {
                    log_error "Failed to install basic MCP dependencies"
                    exit 1
                }
            }
        else
            pip install yfinance mcp || {
                log_error "Failed to install MCP dependencies"
                exit 1
            }
        fi
        
        deactivate
        cd "$WORKING_DIR"
        log_info "MCP virtual environment created and configured"
    else
        log_info "MCP virtual environment exists"
    fi
fi

# Step 3: Test MCP configuration
log_info "Testing MCP configuration..."

if [[ -f "$MCP_DIR/venv/bin/python" && -f "$MCP_DIR/simple_stock_server.py" ]]; then
    log_info "Testing MCP server script..."
    timeout 10 "$MCP_DIR/venv/bin/python" "$MCP_DIR/simple_stock_server.py" --help > /dev/null 2>&1 && {
        log_info "MCP server script test passed"
    } || {
        log_warn "MCP server script test failed or timed out"
    }
else
    log_warn "MCP components missing, cannot test"
fi

# Step 4: Restart services if on production
if [[ "$WORKING_DIR" == "$PROJECT_DIR" ]]; then
    log_info "Restarting production services..."
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        log_info "Restarting aiagent-api service..."
        pm2 restart aiagent-api || {
            log_warn "Failed to restart aiagent-api, trying to start..."
            pm2 start aiagent-api || log_error "Failed to start aiagent-api"
        }
        
        # Wait a moment and check status
        sleep 3
        pm2 status aiagent-api
        
        log_info "Checking recent logs..."
        pm2 logs aiagent-api --lines 10
    else
        log_warn "PM2 not found, cannot restart services automatically"
    fi
else
    log_info "Running locally, skipping service restart"
fi

# Step 5: Provide debugging commands
log_info "\n📋 Debugging commands:"
echo "1. Check MCP configuration:"
echo "   grep MCP_ $PRODUCTION_ENV_FILE"
echo "\n2. Test MCP Python path:"
echo "   $WORKING_DIR/$MCP_DIR/venv/bin/python --version"
echo "\n3. Test MCP server:"
echo "   $WORKING_DIR/$MCP_DIR/venv/bin/python $WORKING_DIR/$MCP_DIR/simple_stock_server.py --help"
echo "\n4. Check PM2 logs:"
echo "   pm2 logs aiagent-api --lines 20"
echo "\n5. Check PM2 status:"
echo "   pm2 status"

log_info "\n✅ MCP production fix completed!"
log_info "If issues persist, check the debugging commands above."