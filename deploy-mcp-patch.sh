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
