#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for the optimized project structure

set -e  # Exit on any error

echo "🛠️ Setting up development environment..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first"
    exit 1
fi

log_info "Node.js version: $(node --version)"
log_info "NPM version: $(npm --version)"

# Install dependencies
log_info "Installing dependencies..."
npm install

# Create development environment files if they don't exist
log_info "Setting up environment files..."

# Backend API environment
if [ ! -f "backend/api/.env" ]; then
    log_info "Creating backend API .env file..."
    cat > backend/api/.env << EOF
NODE_ENV=development
PORT=8001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aiagent_dev
REDIS_URL=redis://localhost:6379

# CORS Configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key
JWT_EXPIRES_IN=7d

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key

# Logging
LOG_LEVEL=debug
EOF
else
    log_info "Backend API .env file already exists"
fi

# Frontend environment (already created)
if [ -f "frontend/c-end/.env" ]; then
    log_info "Frontend .env file already exists"
else
    log_warn "Frontend .env file not found, this might cause issues"
fi

# Build shared modules if they exist
if [ -d "shared" ]; then
    log_info "Building shared modules..."
    cd shared && npm install && npm run build && cd ..
fi

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep mongod > /dev/null; then
        log_info "✅ MongoDB is running"
    else
        log_warn "⚠️ MongoDB is not running. Start it with: brew services start mongodb/brew/mongodb-community"
    fi
else
    log_warn "⚠️ MongoDB is not installed. Install it with: brew install mongodb/brew/mongodb-community"
fi

# Check if Redis is running (optional)
if command -v redis-server &> /dev/null; then
    if pgrep redis-server > /dev/null; then
        log_info "✅ Redis is running"
    else
        log_warn "⚠️ Redis is not running. Start it with: brew services start redis"
    fi
else
    log_warn "⚠️ Redis is not installed. Install it with: brew install redis"
fi

log_info "🎉 Development environment setup completed!"

echo ""
log_info "Available commands:"
echo "  npm run dev                - Start both frontend and API in development mode"
echo "  npm run dev:frontend       - Start only frontend (c-end)"
echo "  npm run dev:api            - Start only API backend"
echo "  npm run build              - Build all components for production"
echo "  npm run test               - Run all tests"
echo "  npm run lint               - Run linting"
echo "  npm run start:prod         - Start production build locally"

echo ""
log_info "Development URLs:"
echo "  Frontend: http://localhost:5173"
echo "  API: http://localhost:8001"
echo "  API Health: http://localhost:8001/api/v1/health"

echo ""
log_warn "Next steps:"
echo "  1. Update GEMINI_API_KEY in backend/api/.env"
echo "  2. Ensure MongoDB and Redis are running"
echo "  3. Run 'npm run dev' to start development servers"