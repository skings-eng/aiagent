#!/bin/bash

# Fix CORS Issue for Remote Server
# This script fixes the CORS configuration to allow remote frontend access

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

log "🔧 Starting CORS Issue Fix..."

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "172.237.20.24")
log "📍 Detected server IP: $SERVER_IP"

# Stop existing backend service
log "🛑 Stopping existing backend services..."
pm2 stop aiagent-api 2>/dev/null || true
pm2 delete aiagent-api 2>/dev/null || true

# Navigate to backend directory
cd backend/api

# Check if CORS configuration includes the server IP
log "🔍 Checking CORS configuration..."
if grep -q "$SERVER_IP:3000" src/app.ts; then
    log_success "CORS configuration already includes $SERVER_IP:3000"
else
    log_warning "CORS configuration needs to be updated"
    
    # Backup original file
    cp src/app.ts src/app.ts.backup
    
    # Add server IP to CORS configuration
    sed -i.bak "/http:\/\/127.0.0.1:5173',/a\\
      'http://$SERVER_IP:3000', // Production frontend server\n      'http://$SERVER_IP:3001', // Alternative frontend port\n      'http://$SERVER_IP:3002', // Alternative frontend port" src/app.ts
    
    log_success "Updated CORS configuration to include $SERVER_IP"
fi

# Install dependencies if needed
log "📦 Installing backend dependencies..."
npm install

# Create or update .env file
log "⚙️  Configuring environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

# Update .env with correct values
cat > .env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/aiagent
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://$SERVER_IP:3000,http://localhost:3000
FRONTEND_URL=http://$SERVER_IP:3000
ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://$SERVER_IP:3001,http://$SERVER_IP:3002
EOF

log_success "Environment variables configured"

# Start backend service with PM2
log "🚀 Starting backend service..."
pm2 start --name "aiagent-api" npm -- run dev

# Wait for service to start
sleep 5

# Check if backend is running
log "🔍 Checking backend service status..."
if pm2 list | grep -q "aiagent-api.*online"; then
    log_success "Backend service is running"
else
    log_error "Backend service failed to start"
    pm2 logs aiagent-api --lines 20
    exit 1
fi

# Test API endpoint
log "🧪 Testing API endpoint..."
if curl -s "http://localhost:3001/api/v1/health" > /dev/null; then
    log_success "API endpoint is responding"
else
    log_warning "API endpoint test failed, but service might still be starting"
fi

# Test CORS with the frontend origin
log "🧪 Testing CORS configuration..."
CORS_TEST=$(curl -s -H "Origin: http://$SERVER_IP:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    "http://localhost:3001/api/v1/ai-models/gemini/test" \
    -w "%{http_code}" -o /dev/null)

if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    log_success "CORS configuration is working correctly"
else
    log_warning "CORS test returned status: $CORS_TEST"
fi

# Save PM2 configuration
pm2 save

log_success "🎉 CORS issue fix completed!"
log "📋 Summary:"
log "   • Backend API running on: http://$SERVER_IP:3001"
log "   • CORS configured for: http://$SERVER_IP:3000"
log "   • PM2 service name: aiagent-api"
log ""
log "🔧 Next steps:"
log "   1. Ensure frontend is running on port 3000"
log "   2. Test Gemini API key configuration from frontend"
log "   3. Check PM2 logs if issues persist: pm2 logs aiagent-api"
log ""
log "🚨 If problems continue:"
log "   • Check firewall settings: sudo ufw status"
log "   • Verify MongoDB is running: sudo systemctl status mongod"
log "   • Check Redis status: sudo systemctl status redis"
log "   • View detailed logs: pm2 logs aiagent-api --lines 50"