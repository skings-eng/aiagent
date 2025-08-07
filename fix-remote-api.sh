#!/bin/bash

# Fix Remote API Service Script
# This script fixes common API service issues on remote server

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

log "🔧 Starting Remote API Service Fix..."

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "172.237.20.24")
log "📍 Server IP: $SERVER_IP"

# Stop existing API services
log "🛑 Stopping existing API services..."
pm2 stop aiagent-api 2>/dev/null || true
pm2 delete aiagent-api 2>/dev/null || true

# Kill any processes on API ports
log "🔪 Killing processes on API ports..."
for port in 3001 8001; do
    if lsof -ti:$port >/dev/null 2>&1; then
        log "Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
done

# Navigate to backend API directory
cd backend/api

# Install dependencies
log "📦 Installing API dependencies..."
npm install

# Build the API
log "🏗️  Building API..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    log_success "API build completed successfully"
else
    log_error "API build failed - dist directory not found"
    exit 1
fi

# Create or update .env file
log "⚙️  Configuring environment variables..."
cat > .env << EOF
NODE_ENV=production
PORT=8001
MONGODB_URI=mongodb://localhost:27017/aiagent
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://$SERVER_IP:3000,http://localhost:3000
ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000,http://$SERVER_IP:3002
FRONTEND_URL=http://$SERVER_IP:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GOOGLE_AI_API_KEY=
EOF

log_success "Environment variables configured"

# Start API service with PM2
log "🚀 Starting API service..."
pm2 start --name "aiagent-api" npm -- run start:prod

# Wait for service to start
sleep 10

# Check if API is running
log "🔍 Checking API service status..."
if pm2 list | grep -q "aiagent-api.*online"; then
    log_success "API service is running"
else
    log_error "API service failed to start"
    pm2 logs aiagent-api --lines 20
    exit 1
fi

# Test API endpoints
log "🧪 Testing API endpoints..."

# Test health endpoint
log "Testing health endpoint..."
for i in {1..5}; do
    if curl -s "http://localhost:8001/api/v1/health" >/dev/null 2>&1; then
        log_success "Health endpoint is responding"
        break
    else
        log "Attempt $i/5: Health endpoint not ready, waiting..."
        sleep 5
    fi
done

# Test Gemini endpoint
log "Testing Gemini test endpoint..."
response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"apiKey":"test-key-at-least-20-chars","model":"gemini-2.5-pro"}' \
    "http://localhost:8001/api/v1/ai-models/gemini/test" 2>/dev/null || echo "000")

if [ "$response" != "000" ]; then
    log_success "Gemini test endpoint is responding (HTTP $response)"
else
    log_error "Gemini test endpoint is not responding"
fi

# Test external access
log "🌐 Testing external API access..."
if curl -s --max-time 10 "http://$SERVER_IP:8001/api/v1/health" >/dev/null 2>&1; then
    log_success "External API access is working"
else
    log_warning "External API access may have issues - check firewall"
fi

# Configure firewall
log "🔥 Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 8001 2>/dev/null || true
    sudo ufw allow 3001 2>/dev/null || true
    log_success "Firewall rules updated"
else
    log_warning "UFW not found - please manually configure firewall"
fi

# Save PM2 configuration
pm2 save

log_success "🎉 Remote API service fix completed!"
log "📋 Summary:"
log "   • API service running on port 8001"
log "   • PM2 service name: aiagent-api"
log "   • Health endpoint: http://$SERVER_IP:8001/api/v1/health"
log "   • Gemini test endpoint: http://$SERVER_IP:8001/api/v1/ai-models/gemini/test"
log ""
log "🔧 Next steps:"
log "   1. Test API access: curl http://$SERVER_IP:8001/api/v1/health"
log "   2. Test Gemini endpoint from frontend"
log "   3. Check API logs if issues persist: pm2 logs aiagent-api"
log "   4. Restart frontend service if needed"
log ""
log "🚨 If API still doesn't work:"
log "   • Check MongoDB connection: systemctl status mongod"
log "   • Check Redis connection: systemctl status redis"
log "   • View detailed logs: pm2 logs aiagent-api --lines 50"
log "   • Check network connectivity: netstat -tlnp | grep 8001"
log ""
log "🔍 Debug commands:"
log "   • Check PM2 status: pm2 list"
log "   • View API logs: pm2 logs aiagent-api"
log "   • Test local API: curl http://localhost:8001/api/v1/health"
log "   • Test external API: curl http://$SERVER_IP:8001/api/v1/health"
log "   • Check environment: cat .env"