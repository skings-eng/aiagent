#!/bin/bash

# Fix Frontend API Configuration for Remote Server
# This script ensures frontend uses correct API endpoint on remote server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log "🔧 Starting Frontend API Configuration Fix..."

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "172.237.20.24")
log "📍 Detected server IP: $SERVER_IP"

# Stop existing frontend service
log "🛑 Stopping existing frontend services..."
pm2 stop aiagent-frontend 2>/dev/null || true
pm2 delete aiagent-frontend 2>/dev/null || true

# Navigate to frontend directory
cd frontend/b-end

# Check current API configuration
log "🔍 Checking current API configuration..."
if [ -f "src/services/api.ts" ]; then
    log "Current API configuration:"
    grep -A 3 -B 3 "API_BASE_URL" src/services/api.ts || true
else
    log_error "API configuration file not found"
    exit 1
fi

# Create or update .env file for frontend
log "⚙️  Configuring frontend environment variables..."
cat > .env << EOF
VITE_API_BASE_URL=http://$SERVER_IP:8001
VITE_NODE_ENV=production
VITE_SERVER_IP=$SERVER_IP
EOF

log_success "Frontend environment variables configured"

# Install dependencies
log "📦 Installing frontend dependencies..."
npm install

# Build the frontend for production
log "🏗️  Building frontend for production..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    log_success "Frontend build completed successfully"
    log "Build output size: $(du -sh dist | cut -f1)"
else
    log_error "Frontend build failed - dist directory not found"
    exit 1
fi

# Check if the API configuration is correct in the built files
log "🔍 Verifying API configuration in built files..."
if grep -r "localhost:8001" dist/ 2>/dev/null; then
    log_warning "Found localhost:8001 references in built files - this might cause issues"
else
    log_success "No localhost:8001 references found in built files"
fi

# Start frontend service with PM2
log "🚀 Starting frontend service..."
# Use npm run preview for production-like serving
pm2 start --name "aiagent-frontend" npm -- run preview -- --port 3000 --host 0.0.0.0

# Wait for service to start
sleep 5

# Check if frontend is running
log "🔍 Checking frontend service status..."
if pm2 list | grep -q "aiagent-frontend.*online"; then
    log_success "Frontend service is running"
else
    log_error "Frontend service failed to start"
    pm2 logs aiagent-frontend --lines 20
    exit 1
fi

# Test frontend endpoint
log "🧪 Testing frontend endpoint..."
if curl -s "http://localhost:3000" > /dev/null; then
    log_success "Frontend endpoint is responding"
else
    log_warning "Frontend endpoint test failed, but service might still be starting"
fi

# Test API configuration by checking the built JavaScript files
log "🧪 Testing API configuration in frontend..."
API_CONFIG_TEST=$(curl -s "http://localhost:3000" | grep -o "http://[^:]*:8001" | head -1 || echo "")
if [ -n "$API_CONFIG_TEST" ]; then
    log_success "Frontend is configured to use API at: $API_CONFIG_TEST"
else
    log_warning "Could not detect API configuration in frontend"
fi

# Save PM2 configuration
pm2 save

log_success "🎉 Frontend API configuration fix completed!"
log "📋 Summary:"
log "   • Frontend running on: http://$SERVER_IP:3000"
log "   • API endpoint configured: http://$SERVER_IP:8001"
log "   • PM2 service name: aiagent-frontend"
log "   • Build output: $(pwd)/dist"
log ""
log "🔧 Next steps:"
log "   1. Test frontend access: http://$SERVER_IP:3000"
log "   2. Test Gemini page: http://$SERVER_IP:3000/gemini"
log "   3. Verify API calls use correct endpoint"
log "   4. Clear browser cache if needed"
log ""
log "🚨 If API calls still use localhost:8001:"
log "   • Clear browser cache and cookies"
log "   • Check browser developer tools Network tab"
log "   • Verify .env file: cat .env"
log "   • Check built files: grep -r 'localhost' dist/"
log "   • View frontend logs: pm2 logs aiagent-frontend"
log ""
log "🔍 Debug commands:"
log "   • Check PM2 status: pm2 list"
log "   • View frontend logs: pm2 logs aiagent-frontend --lines 50"
log "   • Test API directly: curl http://$SERVER_IP:8001/api/v1/health"
log "   • Check environment: cat .env"