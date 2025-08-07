#!/bin/bash

# 修复502错误 - 前端页面无法访问
# 解决Nginx反向代理和前端服务配置问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "开始修复502错误..."
log_info "问题：http://172.237.20.24:3000/home 返回502 Bad Gateway"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查Nginx状态
log_info "=== 1. 检查Nginx状态 ==="
if command -v nginx >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx 2>/dev/null; then
        log_warning "Nginx正在运行，这可能导致端口冲突"
        log_info "Nginx配置可能指向错误的后端服务"
        
        # 检查Nginx配置
        if [ -f "/etc/nginx/sites-enabled/aiagent" ]; then
            log_info "发现aiagent Nginx配置文件"
            log_info "检查配置内容:"
            grep -n "proxy_pass\|listen\|server_name" /etc/nginx/sites-enabled/aiagent || true
        fi
        
        log_warning "建议临时停止Nginx以直接测试前端服务:"
        log_warning "  sudo systemctl stop nginx"
        echo ""
    else
        log_info "Nginx未运行"
    fi
else
    log_info "Nginx未安装"
fi
echo ""

# 2. 停止所有现有服务
log_info "=== 2. 停止现有服务 ==="
pm2 stop all 2>/dev/null || log_warning "PM2服务可能未运行"
pm2 delete all 2>/dev/null || log_warning "PM2服务可能未配置"
echo ""

# 3. 启动后端API服务
log_info "=== 3. 启动后端API服务 ==="
cd backend/api

# 检查后端环境配置
if [ ! -f ".env" ]; then
    log_warning "后端.env文件不存在，创建基本配置..."
    cat > .env << EOF
PORT=8001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aiagent
DB_USER=aiagent
DB_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
EOF
    log_warning "请编辑 backend/api/.env 文件，填入正确的配置"
fi

# 安装依赖并启动后端
log_info "安装后端依赖..."
npm install

log_info "启动后端API服务..."
pm2 start --name "aiagent-api" npm -- run start

# 等待后端启动
sleep 5

# 检查后端是否启动成功
if pm2 list | grep -q "aiagent-api.*online"; then
    log_success "后端API服务启动成功"
else
    log_error "后端API服务启动失败"
    log_error "查看日志: pm2 logs aiagent-api"
    exit 1
fi

cd ../..
echo ""

# 4. 启动前端服务
log_info "=== 4. 启动前端服务 ==="
cd frontend/b-end

# 检查前端环境配置
if [ ! -f ".env" ]; then
    log_info "创建前端环境配置文件..."
    cat > .env << EOF
VITE_API_BASE_URL=http://172.237.20.24:8001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EOF
    log_warning "请编辑 frontend/b-end/.env 文件，填入您的Gemini API密钥"
else
    log_info "更新前端API地址..."
    sed -i 's|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://172.237.20.24:8001|' .env
fi

# 安装依赖并构建
log_info "安装前端依赖..."
npm install

log_info "构建前端项目..."
npm run build

# 启动前端服务
log_info "启动前端服务..."
pm2 start --name "aiagent-frontend" npm -- run preview -- --port 3000 --host 0.0.0.0

# 等待前端启动
sleep 3

# 检查前端是否启动成功
if pm2 list | grep -q "aiagent-frontend.*online"; then
    log_success "前端服务启动成功"
else
    log_error "前端服务启动失败"
    log_error "查看日志: pm2 logs aiagent-frontend"
    exit 1
fi

cd ../..
echo ""

# 5. 保存PM2配置
pm2 save

# 6. 测试服务连接
log_info "=== 5. 测试服务连接 ==="

# 测试后端API
log_info "测试后端API (8001端口)..."
if curl -s -f http://localhost:8001/api/v1/health >/dev/null 2>&1; then
    log_success "后端API本地访问正常"
else
    log_warning "后端API本地访问失败"
fi

if curl -s -f http://172.237.20.24:8001/api/v1/health >/dev/null 2>&1; then
    log_success "后端API外部访问正常"
else
    log_warning "后端API外部访问失败（可能是防火墙问题）"
fi

# 测试前端页面
log_info "测试前端页面 (3000端口)..."
if curl -s -f http://localhost:3000/ >/dev/null 2>&1; then
    log_success "前端页面本地访问正常"
else
    log_warning "前端页面本地访问失败"
fi

if curl -s -f http://172.237.20.24:3000/ >/dev/null 2>&1; then
    log_success "前端页面外部访问正常"
else
    log_warning "前端页面外部访问失败（可能是防火墙问题）"
fi

echo ""
log_success "502错误修复完成！"
log_info ""
log_info "服务状态:"
pm2 status
log_info ""
log_info "访问地址:"
log_info "  - 前端页面: http://172.237.20.24:3000/home"
log_info "  - 后端API: http://172.237.20.24:8001/api/v1/health"
log_info ""
log_info "如果仍有问题，请检查:"
log_info "  1. 防火墙设置: sudo ufw status"
log_info "  2. 端口占用: netstat -tlnp | grep -E ':(3000|8001)'"
log_info "  3. 服务日志: pm2 logs"
log_info "  4. Nginx配置: sudo nginx -t (如果使用Nginx)"
log_info ""
log_warning "注意: 如果使用Nginx反向代理，请确保配置正确指向localhost:3000"