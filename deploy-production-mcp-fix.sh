#!/bin/bash

# Production MCP Deployment Fix Script
# This script ensures MCP service is properly deployed in production environment

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

echo "🚀 Starting MCP production deployment fix..."

# Configuration
PRODUCTION_SERVER="172.237.20.24"
PROJECT_DIR="/root/aiagent"
LOCAL_PROJECT_DIR="/Users/sking/aiagent"
MCP_DIR="backend/api/mcp-yfinance-server"

# Step 1: Update production environment configuration locally
log_info "Updating local production environment configuration..."

if [[ ! -f "$LOCAL_PROJECT_DIR/backend/api/.env.production" ]]; then
    log_error "Local production environment file not found"
    exit 1
fi

# Ensure MCP configuration exists in local .env.production
cd "$LOCAL_PROJECT_DIR"
if ! grep -q "MCP_PYTHON_PATH" "backend/api/.env.production"; then
    log_info "Adding MCP configuration to local production environment..."
    cat >> "backend/api/.env.production" << 'EOF'

# MCP Stock Data Service Configuration
MCP_PYTHON_PATH=/root/aiagent/backend/api/mcp-yfinance-server/venv/bin/python
MCP_SERVER_PATH=/root/aiagent/backend/api/mcp-yfinance-server/simple_stock_server.py
MCP_TIMEOUT=30000
MCP_RETRY_COUNT=3
MCP_CACHE_TTL=300
EOF
    log_info "MCP configuration added to local production environment"
else
    log_info "MCP configuration already exists in local production environment"
fi

# Step 2: Create production MCP setup script
log_info "Creating production MCP setup script..."

cat > "setup-production-mcp.sh" << 'EOF'
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
EOF

chmod +x "setup-production-mcp.sh"

# Step 3: Update deployment script to include MCP setup
log_info "Updating deployment script to include MCP setup..."

# Create a patch for the deployment script
cat > "deploy-mcp-patch.sh" << 'EOF'
#!/bin/bash

# Patch to add MCP setup to deployment script

DEPLOY_SCRIPT="deploy-production.sh"

if [[ ! -f "$DEPLOY_SCRIPT" ]]; then
    echo "Deployment script not found: $DEPLOY_SCRIPT"
    exit 1
fi

# Check if MCP setup is already included
if grep -q "setup-production-mcp.sh" "$DEPLOY_SCRIPT"; then
    echo "MCP setup already included in deployment script"
else
    echo "Adding MCP setup to deployment script..."
    
    # Find the line where PM2 ecosystem is created and add MCP setup before it
    sed -i.bak '/# Create PM2 ecosystem file/i\
# Setup MCP service\
log_info "Setting up MCP service..."\
if [[ -f "setup-production-mcp.sh" ]]; then\
    chmod +x setup-production-mcp.sh\
    ./setup-production-mcp.sh || {\
        log_warn "MCP setup failed, but continuing deployment..."\
        touch backend/api/mcp-yfinance-server/.mcp_install_failed\
    }\
else\
    log_warn "MCP setup script not found, skipping MCP setup"\
    touch backend/api/mcp-yfinance-server/.mcp_install_failed\
fi\
' "$DEPLOY_SCRIPT"
    
    echo "MCP setup added to deployment script"
fi
EOF

chmod +x "deploy-mcp-patch.sh"

# Step 4: Provide instructions
log_info "\n📋 Next steps:"
echo "1. Copy the updated files to production server:"
echo "   scp backend/api/.env.production root@$PRODUCTION_SERVER:$PROJECT_DIR/backend/api/"
echo "   scp setup-production-mcp.sh root@$PRODUCTION_SERVER:$PROJECT_DIR/"
echo ""
echo "2. On production server, run:"
echo "   cd $PROJECT_DIR"
echo "   chmod +x setup-production-mcp.sh"
echo "   ./setup-production-mcp.sh"
echo ""
echo "3. Restart the API service:"
echo "   pm2 restart aiagent-api"
echo ""
echo "4. Check the logs:"
echo "   pm2 logs aiagent-api --lines 20"
echo ""
echo "5. Test MCP functionality:"
echo "   # Try using stock analysis features in the application"

log_info "\n✅ MCP production deployment fix completed!"
log_info "Follow the instructions above to apply the fix on the production server."