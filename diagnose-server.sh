#!/bin/bash

# 服务器状态诊断脚本
# 用于快速检查前端和后端服务状态

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

log_info "开始诊断服务器状态..."
log_info "服务器地址: 172.237.20.24"
log_info "前端端口: 3000"
log_info "后端端口: 8001"
echo ""

# 1. 检查PM2服务状态
log_info "=== 1. PM2服务状态 ==="
if command -v pm2 >/dev/null 2>&1; then
    pm2 status
else
    log_error "PM2未安装"
fi
echo ""

# 2. 检查端口占用
log_info "=== 2. 端口占用检查 ==="
log_info "检查3000端口:"
if netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000; then
    log_success "3000端口有服务运行"
else
    log_error "3000端口无服务运行"
fi

log_info "检查8001端口:"
if netstat -tlnp 2>/dev/null | grep :8001 || ss -tlnp 2>/dev/null | grep :8001; then
    log_success "8001端口有服务运行"
else
    log_error "8001端口无服务运行"
fi
echo ""

# 3. 检查API健康状态
log_info "=== 3. API健康检查 ==="
log_info "测试后端API连接..."
if curl -s -f http://172.237.20.24:8001/api/v1/health >/dev/null 2>&1; then
    log_success "后端API响应正常"
    curl -s http://172.237.20.24:8001/api/v1/health | head -3
else
    log_error "后端API无响应"
    log_info "尝试本地API..."
    if curl -s -f http://localhost:8001/api/v1/health >/dev/null 2>&1; then
        log_warning "本地API正常，但外部访问失败（可能是防火墙问题）"
    else
        log_error "本地API也无响应"
    fi
fi
echo ""

# 4. 检查前端页面
log_info "=== 4. 前端页面检查 ==="
log_info "测试前端页面连接..."
if curl -s -f http://172.237.20.24:3000/ >/dev/null 2>&1; then
    log_success "前端页面响应正常"
else
    log_error "前端页面无响应"
    log_info "尝试本地前端..."
    if curl -s -f http://localhost:3000/ >/dev/null 2>&1; then
        log_warning "本地前端正常，但外部访问失败（可能是防火墙问题）"
    else
        log_error "本地前端也无响应"
    fi
fi
echo ""

# 5. 检查防火墙状态
log_info "=== 5. 防火墙状态 ==="
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status
else
    log_warning "UFW防火墙未安装"
fi
echo ""

# 6. 检查环境配置
log_info "=== 6. 环境配置检查 ==="
if [ -f "frontend/b-end/.env" ]; then
    log_success "找到b-end环境配置文件"
    log_info "API配置:"
    grep "VITE_API_BASE_URL" frontend/b-end/.env || log_warning "未找到API配置"
else
    log_error "未找到b-end环境配置文件"
fi

if [ -f "frontend/c-end/.env" ]; then
    log_warning "发现c-end环境配置文件（可能导致混淆）"
fi
echo ""

# 7. 检查最近的日志
log_info "=== 7. 最近的服务日志 ==="
if command -v pm2 >/dev/null 2>&1; then
    log_info "前端服务日志（最近10行）:"
    pm2 logs aiagent-frontend --lines 10 --nostream 2>/dev/null || log_warning "无前端服务日志"
    echo ""
    log_info "后端服务日志（最近10行）:"
    pm2 logs aiagent-api --lines 10 --nostream 2>/dev/null || log_warning "无后端服务日志"
fi
echo ""

log_info "=== 诊断完成 ==="
log_info "如果发现问题，请运行相应的修复脚本："
log_info "  - 前端问题: ./fix-frontend-deployment.sh"
log_info "  - 完整重启: ./start-services.sh --with-frontend"
log_info "  - 生产环境: ./fix-production.sh"