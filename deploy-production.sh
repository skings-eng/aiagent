#!/bin/bash

# Production Deployment Script for Ubuntu Server
# This script deploys the AI Agent application with only b-end frontend

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Configuration
SERVER_HOST="172.237.20.24"
FRONTEND_PORT="4173"
API_PORT="3001"
LINE_PORT="3003"
PROJECT_DIR="/home/ubuntu/aiagent"
NODE_ENV="production"

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

# Check if running on Ubuntu
if [[ ! -f /etc/lsb-release ]] || ! grep -q "Ubuntu" /etc/lsb-release; then
    log_error "This script is designed for Ubuntu systems"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    log_error "Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or higher"
    exit 1
fi
log_info "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm"
    exit 1
fi
log_info "npm version: $(npm --version)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    npm install -g pm2
fi

# Change to project directory
log_info "Changing to project directory: ${PROJECT_DIR}"
cd "${PROJECT_DIR}" || {
    log_error "Failed to change to project directory: ${PROJECT_DIR}"
    exit 1
}

# Stop existing services
log_info "Stopping existing services..."
pm2 stop aiagent-api || true
pm2 stop aiagent-frontend || true
pm2 stop aiagent-line || true
pm2 delete aiagent-api || true
pm2 delete aiagent-frontend || true
pm2 delete aiagent-line || true

# Kill processes on ports if they exist
log_info "Cleaning up ports..."
sudo fuser -k ${API_PORT}/tcp || true
sudo fuser -k ${FRONTEND_PORT}/tcp || true
sudo fuser -k ${LINE_PORT}/tcp || true

# Install dependencies for all workspaces
log_info "Installing dependencies..."
if ! npm install; then
    log_error "Failed to install root dependencies"
    exit 1
fi

# Install dependencies for each workspace individually
log_info "Installing backend API dependencies..."
cd backend/api
if ! npm install; then
    log_error "Failed to install backend API dependencies"
    exit 1
fi
cd ../..

log_info "Installing backend LINE dependencies..."
cd backend/line
if ! npm install; then
    log_error "Failed to install backend LINE dependencies"
    exit 1
fi
cd ../..

log_info "Installing frontend dependencies..."
cd frontend/b-end
if ! npm install; then
    log_error "Failed to install frontend dependencies"
    exit 1
fi
cd ../..

log_info "Installing shared dependencies..."
cd shared
if ! npm install; then
    log_error "Failed to install shared dependencies"
    exit 1
fi
cd ..

# Clean previous build files and node_modules
log_info "Cleaning previous build files and node_modules..."
rm -rf backend/api/dist
rm -rf backend/line/dist
rm -rf frontend/b-end/dist
rm -rf shared/dist
rm -rf backend/api/node_modules
rm -rf backend/line/node_modules
rm -rf frontend/b-end/node_modules
rm -rf shared/node_modules
rm -rf node_modules
npm cache clean --force
log_info "Previous build files and node_modules cleaned"

# Build the application
log_info "Building shared modules..."
cd shared
if ! npm run build; then
    log_error "Shared build failed"
    exit 1
fi
cd ..

log_info "Reinstalling backend API dependencies (to ensure shared module linking)..."
cd backend/api
npm install
log_info "Building backend API..."
if ! npm run build; then
    log_error "Backend API build failed"
    exit 1
fi
cd ../..

log_info "Reinstalling backend LINE dependencies (to ensure shared module linking)..."
cd backend/line
npm install
log_info "Building backend LINE..."
if ! npm run build; then
    log_error "Backend LINE build failed"
    exit 1
fi
cd ../..

log_info "Reinstalling frontend dependencies (to ensure all packages are available)..."
cd frontend/b-end
npm install
log_info "Building frontend..."
if ! npm run build; then
    log_error "Frontend build failed"
    exit 1
fi
cd ../..

# Setup MCP server
log_info "Setting up MCP server..."
cd backend/api/mcp-yfinance-server

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment for MCP server..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
log_info "Installing MCP server dependencies..."
source venv/bin/activate
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    log_warning "No requirements.txt found for MCP server"
fi

# Make start script executable
chmod +x start_mcp.sh

cd ../../..

# Additional build verification with detailed logging
log_info "Checking build directories..."
ls -la backend/api/ | grep dist || log_info "No dist directory in backend/api"
ls -la backend/line/ | grep dist || log_info "No dist directory in backend/line"

# Verify build outputs
log_info "Verifying build outputs..."

# Check backend API
if [[ ! -f "backend/api/dist/server.js" ]]; then
    log_error "Backend API build failed - server.js not found"
    echo "Available files in backend/api/dist:"
    ls -la backend/api/dist/ 2>/dev/null || echo "Directory does not exist"
    echo "Checking if backend/api/dist directory exists:"
    ls -la backend/api/ 2>/dev/null || echo "backend/api directory does not exist"
    exit 1
fi

# Check backend LINE
if [[ ! -f "backend/line/dist/index.js" ]]; then
    log_error "Backend LINE build failed - index.js not found"
    echo "Available files in backend/line/dist:"
    ls -la backend/line/dist/ 2>/dev/null || echo "Directory does not exist"
    echo "Checking if backend/line/dist directory exists:"
    ls -la backend/line/ 2>/dev/null || echo "backend/line directory does not exist"
    exit 1
fi

# Check frontend
if [[ ! -f "frontend/b-end/dist/index.html" ]]; then
    log_error "Frontend build failed - index.html not found"
    echo "Available files in frontend/b-end/dist:"
    ls -la frontend/b-end/dist/ 2>/dev/null || echo "Directory does not exist"
    echo "Checking if frontend/b-end/dist directory exists:"
    ls -la frontend/b-end/ 2>/dev/null || echo "frontend/b-end directory does not exist"
    exit 1
fi

# Additional verification - check file permissions and absolute paths
log_info "Additional build verification..."
echo "Current working directory: $(pwd)"
echo "Absolute path to API server: $(realpath backend/api/dist/server.js 2>/dev/null || echo 'File not found')"
echo "Absolute path to LINE server: $(realpath backend/line/dist/index.js 2>/dev/null || echo 'File not found')"
echo "Absolute path to frontend: $(realpath frontend/b-end/dist/index.html 2>/dev/null || echo 'File not found')"

# Test if files are executable/readable
if [[ -f "backend/api/dist/server.js" ]]; then
    echo "API server.js permissions: $(ls -l backend/api/dist/server.js)"
fi
if [[ -f "backend/line/dist/index.js" ]]; then
    echo "LINE index.js permissions: $(ls -l backend/line/dist/index.js)"
fi

log_info "Build verification completed successfully"

# Create production environment file for backend
log_info "Creating backend production environment..."
cat > backend/api/.env.production << EOF
NODE_ENV=production
PORT=${API_PORT}
SERVER_HOST=${SERVER_HOST}

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aiagent_prod
REDIS_URL=redis://localhost:6379

# CORS Configuration
FRONTEND_URL=http://${SERVER_HOST}:${FRONTEND_PORT}
ALLOWED_ORIGINS=http://${SERVER_HOST}:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/aiagent/api.log
EOF

# Create production environment file for LINE service
log_info "Creating LINE service production environment..."
cat > backend/line/.env.production << EOF
NODE_ENV=production
PORT=${LINE_PORT}
SERVER_HOST=${SERVER_HOST}

# Redis Configuration
REDIS_URL=redis://localhost:6379

# LINE Bot Configuration (to be configured after deployment)
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# CORS Configuration
CORS_ORIGIN=http://${SERVER_HOST}:${FRONTEND_PORT},http://${SERVER_HOST}:${API_PORT}
ALLOWED_ORIGINS=http://${SERVER_HOST}:${FRONTEND_PORT},http://${SERVER_HOST}:${API_PORT},http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/aiagent/line.log
EOF

# Create log directory
sudo mkdir -p /var/log/aiagent
sudo chown $USER:$USER /var/log/aiagent

# Build backend services
log_info "Building backend services..."

# Build API service
log_info "Building API service..."
cd "${PROJECT_DIR}/backend/api"
npm install
npm run build
if [[ ! -f "dist/server.js" ]]; then
    log_error "API build failed - server.js not found"
    exit 1
fi
log_info "API service built successfully"

# Build LINE service
log_info "Building LINE service..."
cd "${PROJECT_DIR}/backend/line"
npm install
npm run build
if [[ ! -f "dist/index.js" ]]; then
    log_error "LINE service build failed - index.js not found"
    exit 1
fi
log_info "LINE service built successfully"

# Build frontend service
log_info "Building frontend service..."
cd "${PROJECT_DIR}/frontend/b-end"
npm install
npm run build
log_info "Frontend service built successfully"

# Return to project root
cd "${PROJECT_DIR}"

# Create PM2 ecosystem file
log_info "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${API_PORT}
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/aiagent/api-error.log',
      out_file: '/var/log/aiagent/api-out.log',
      log_file: '/var/log/aiagent/api.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '${PROJECT_DIR}/frontend/b-end',
      env: {
        NODE_ENV: 'production',
        PORT: ${FRONTEND_PORT},
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      error_file: '/var/log/aiagent/frontend-error.log',
      out_file: '/var/log/aiagent/frontend-out.log',
      log_file: '/var/log/aiagent/frontend.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-line',
      script: './backend/line/dist/index.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${LINE_PORT}
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/aiagent/line-error.log',
      out_file: '/var/log/aiagent/line-out.log',
      log_file: '/var/log/aiagent/line.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Final verification before PM2 startup
log_info "Final verification before PM2 startup..."
echo "PM2 will use the following paths:"
echo "API script: ${PROJECT_DIR}/backend/api/dist/server.js"
echo "LINE script: ${PROJECT_DIR}/backend/line/dist/index.js"
echo "Frontend working directory: ${PROJECT_DIR}/frontend/b-end"

# Verify absolute paths that PM2 will use
if [[ ! -f "${PROJECT_DIR}/backend/api/dist/server.js" ]]; then
    log_error "PM2 startup will fail - API script not found at absolute path: ${PROJECT_DIR}/backend/api/dist/server.js"
    exit 1
fi

if [[ ! -f "${PROJECT_DIR}/backend/line/dist/index.js" ]]; then
    log_error "PM2 startup will fail - LINE script not found at absolute path: ${PROJECT_DIR}/backend/line/dist/index.js"
    exit 1
fi

if [[ ! -d "${PROJECT_DIR}/frontend/b-end" ]]; then
    log_error "PM2 startup will fail - Frontend directory not found: ${PROJECT_DIR}/frontend/b-end"
    exit 1
fi

if [[ ! -f "${PROJECT_DIR}/frontend/b-end/package.json" ]]; then
    log_error "PM2 startup will fail - Frontend package.json not found: ${PROJECT_DIR}/frontend/b-end/package.json"
    exit 1
fi

# Check if preview script exists in frontend package.json
if ! grep -q '"preview"' "${PROJECT_DIR}/frontend/b-end/package.json"; then
    log_error "PM2 startup will fail - 'preview' script not found in frontend/b-end/package.json"
    exit 1
fi

log_info "All PM2 paths verified successfully"

# Start services with PM2
log_info "Starting services with PM2..."
# Set PROJECT_ROOT environment variable for PM2
export PROJECT_ROOT="${PROJECT_DIR}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    log_info "Configuring firewall..."
    sudo ufw allow ${API_PORT}/tcp
    sudo ufw allow ${FRONTEND_PORT}/tcp
    sudo ufw allow ${LINE_PORT}/tcp
    sudo ufw allow ssh
fi

# Wait for services to start
log_info "Waiting for services to start..."
sleep 10

# Health checks
log_info "Performing health checks..."

# Check API health
if curl -f http://localhost:${API_PORT}/api/v1/health > /dev/null 2>&1; then
    log_info "✅ API service is healthy"
else
    log_error "❌ API service health check failed"
    pm2 logs aiagent-api --lines 20
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
    log_info "✅ Frontend service is healthy"
else
    log_error "❌ Frontend service health check failed"
    pm2 logs aiagent-frontend --lines 20
fi

# Check LINE service health
if curl -f http://localhost:${LINE_PORT}/health > /dev/null 2>&1; then
    log_info "✅ LINE service is healthy"
else
    log_error "❌ LINE service health check failed"
    pm2 logs aiagent-line --lines 20
fi

# Display service status
log_info "Service status:"
pm2 status

log_info "🎉 Deployment completed!"
log_info "Frontend: http://${SERVER_HOST}:${FRONTEND_PORT}"
log_info "API: http://${SERVER_HOST}:${API_PORT}"
log_info "LINE Service: http://${SERVER_HOST}:${LINE_PORT}"
log_info "API Health: http://${SERVER_HOST}:${API_PORT}/api/v1/health"
log_info "LINE Health: http://${SERVER_HOST}:${LINE_PORT}/health"

echo ""
log_info "Useful commands:"
echo "  pm2 status                 - Check service status"
echo "  pm2 logs                   - View all logs"
echo "  pm2 logs aiagent-api       - View API logs"
echo "  pm2 logs aiagent-frontend  - View frontend logs"
echo "  pm2 logs aiagent-line      - View LINE service logs"
echo "  pm2 restart all            - Restart all services"
echo "  pm2 stop all               - Stop all services"
echo "  pm2 monit                  - Monitor services"

log_warn "Remember to:"
echo "  1. Update GEMINI_API_KEY in backend/api/.env.production"
echo "  2. Update JWT_SECRET in backend/api/.env.production"
echo "  3. Configure MongoDB and Redis if not already done"
echo "  4. Set up SSL/HTTPS for production use"