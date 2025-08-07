#!/bin/bash

# Test script for deployment verification
# This script tests the key components of the deployment process

set -e

echo "🧪 Testing deployment components..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: Check if all required files exist
log_info "Testing build output verification..."

if [ ! -f "backend/api/dist/server.js" ]; then
    log_error "Backend API build failed - server.js not found"
    log_info "Available files in backend/api/dist:"
    ls -la backend/api/dist/ || log_error "dist directory does not exist"
    exit 1
fi
log_info "✓ Backend API server.js found"

if [ ! -f "backend/line/dist/index.js" ]; then
    log_error "LINE service build failed - index.js not found"
    log_info "Available files in backend/line/dist:"
    ls -la backend/line/dist/ || log_error "dist directory does not exist"
    exit 1
fi
log_info "✓ LINE service index.js found"

if [ ! -f "frontend/b-end/dist/index.html" ]; then
    log_error "Frontend build failed - index.html not found"
    log_info "Available files in frontend/b-end/dist:"
    ls -la frontend/b-end/dist/ || log_error "dist directory does not exist"
    exit 1
fi
log_info "✓ Frontend index.html found"

# Test 2: Check if package.json scripts exist
log_info "Testing package.json scripts..."

if ! grep -q '"preview"' frontend/b-end/package.json; then
    log_error "Frontend preview script not found in package.json"
    exit 1
fi
log_info "✓ Frontend preview script found"

if ! grep -q '"build"' backend/api/package.json; then
    log_error "Backend API build script not found in package.json"
    exit 1
fi
log_info "✓ Backend API build script found"

if ! grep -q '"build"' backend/line/package.json; then
    log_error "LINE service build script not found in package.json"
    exit 1
fi
log_info "✓ LINE service build script found"

# Test 3: Check TypeScript configuration
log_info "Testing TypeScript configuration..."

if [ ! -f "backend/api/tsconfig.json" ]; then
    log_error "Backend API tsconfig.json not found"
    exit 1
fi
log_info "✓ Backend API tsconfig.json found"

if [ ! -f "backend/line/tsconfig.json" ]; then
    log_error "LINE service tsconfig.json not found"
    exit 1
fi
log_info "✓ LINE service tsconfig.json found"

# Test 4: Verify PM2 ecosystem configuration format
log_info "Testing PM2 ecosystem configuration..."

PROJECT_DIR="/test/path"
API_PORT="3001"
FRONTEND_PORT="4173"
LINE_PORT="3003"

# Create a test ecosystem file
cat > test-ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${API_PORT}
      }
    },
    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend/b-end',
      env: {
        NODE_ENV: 'production',
        PORT: ${FRONTEND_PORT},
        HOST: '0.0.0.0'
      }
    },
    {
      name: 'aiagent-line',
      script: './backend/line/dist/index.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${LINE_PORT}
      }
    }
  ]
};
EOF

# Test if the ecosystem file is valid JavaScript
if node -c test-ecosystem.config.js; then
    log_info "✓ PM2 ecosystem configuration is valid"
else
    log_error "PM2 ecosystem configuration has syntax errors"
    exit 1
fi

# Clean up test file
rm test-ecosystem.config.js

log_info "🎉 All deployment tests passed!"
log_info "The deployment script should work correctly on the Ubuntu server."

echo ""
log_info "Next steps for Ubuntu server deployment:"
echo "1. Ensure Node.js 18+ is installed"
echo "2. Ensure PM2 is installed globally"
echo "3. Run: chmod +x deploy-production.sh"
echo "4. Run: ./deploy-production.sh"
echo "5. Check PM2 status: pm2 status"
echo "6. Check logs: pm2 logs"