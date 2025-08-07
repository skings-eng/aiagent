#!/bin/bash

# Remote API Diagnosis Script
# This script helps diagnose API connectivity issues on remote server

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

log "🔍 Starting Remote API Diagnosis..."

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "172.237.20.24")
log "📍 Server IP: $SERVER_IP"

# Check if we're on the remote server
if [ "$SERVER_IP" != "172.237.20.24" ]; then
    log_warning "This script should be run on the remote server (172.237.20.24)"
    log "Current server IP: $SERVER_IP"
fi

# Check PM2 processes
log "🔍 Checking PM2 processes..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 list
    log "PM2 processes listed above"
else
    log_error "PM2 not found"
fi

# Check running processes on API ports
log "🔍 Checking processes on API ports..."
for port in 3001 8001; do
    log "Checking port $port:"
    if lsof -i :$port 2>/dev/null; then
        log_success "Port $port is in use"
    else
        log_warning "Port $port is not in use"
    fi
done

# Test local API endpoints
log "🧪 Testing local API endpoints..."
for port in 3001 8001; do
    log "Testing localhost:$port/api/v1/health"
    if curl -s --max-time 5 "http://localhost:$port/api/v1/health" >/dev/null 2>&1; then
        log_success "localhost:$port/api/v1/health responds"
        curl -s "http://localhost:$port/api/v1/health" | head -3
    else
        log_error "localhost:$port/api/v1/health does not respond"
    fi
done

# Test external access
log "🌐 Testing external API access..."
for port in 3001 8001; do
    log "Testing $SERVER_IP:$port/api/v1/health"
    if curl -s --max-time 5 "http://$SERVER_IP:$port/api/v1/health" >/dev/null 2>&1; then
        log_success "$SERVER_IP:$port/api/v1/health responds"
    else
        log_error "$SERVER_IP:$port/api/v1/health does not respond"
    fi
done

# Check firewall status
log "🔥 Checking firewall status..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status
else
    log_warning "UFW not found, checking iptables..."
    sudo iptables -L INPUT | grep -E "(3001|8001|ACCEPT|DROP)"
fi

# Check nginx if running
log "🌐 Checking nginx status..."
if systemctl is-active --quiet nginx 2>/dev/null; then
    log_success "Nginx is running"
    sudo nginx -t
else
    log_warning "Nginx is not running or not installed"
fi

# Check API logs
log "📋 Checking API logs..."
if pm2 list | grep -q "aiagent-api"; then
    log "Recent API logs:"
    pm2 logs aiagent-api --lines 10 --nostream
else
    log_warning "aiagent-api process not found in PM2"
fi

# Check system resources
log "💻 Checking system resources..."
log "Memory usage:"
free -h
log "Disk usage:"
df -h | head -5
log "CPU load:"
uptime

# Test Gemini API endpoint specifically
log "🤖 Testing Gemini API endpoint..."
for port in 3001 8001; do
    log "Testing Gemini test endpoint on port $port"
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"apiKey":"test","model":"gemini-2.5-pro"}' \
        "http://localhost:$port/api/v1/ai-models/gemini/test" 2>/dev/null || echo "000")
    
    if [ "$response" = "000" ]; then
        log_error "No response from Gemini endpoint on port $port"
    else
        log "Response code: $response"
    fi
done

log "🔧 Diagnosis complete!"
log ""
log "📋 Summary of findings:"
log "   • Server IP: $SERVER_IP"
log "   • Check the output above for any errors or warnings"
log "   • If API endpoints return empty responses, the service may be crashed"
log "   • If ports are not in use, the API service is not running"
log ""
log "🚨 Common fixes:"
log "   1. Restart API service: pm2 restart aiagent-api"
log "   2. Check API logs: pm2 logs aiagent-api --lines 50"
log "   3. Rebuild and restart: cd backend/api && npm run build && pm2 restart aiagent-api"
log "   4. Check firewall: sudo ufw allow 8001 && sudo ufw allow 3001"
log "   5. Check nginx config if using reverse proxy"
log ""
log "🔍 Next steps:"
log "   • Run this script on the remote server: scp diagnose-remote-api.sh user@172.237.20.24:~ && ssh user@172.237.20.24 './diagnose-remote-api.sh'"
log "   • Check the specific error messages in the output above"
log "   • Verify API service configuration and environment variables"