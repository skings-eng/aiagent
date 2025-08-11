#!/bin/bash

# 修复MCP服务器路径配置脚本
# 将所有配置从 standard_mcp_server.py 更新为 simple_stock_server.py

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

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

log_info "开始修复MCP服务器路径配置..."

# 1. 更新环境变量文件
log_info "更新环境变量文件..."

if [ -f "backend/api/.env" ]; then
    log_info "更新 backend/api/.env"
    sed -i.bak 's|standard_mcp_server\.py|simple_stock_server.py|g' backend/api/.env
    log_success "backend/api/.env 更新完成"
else
    log_warning "backend/api/.env 文件不存在"
fi

if [ -f "backend/.env-server" ]; then
    log_info "更新 backend/.env-server"
    sed -i.bak 's|standard_mcp_server\.py|simple_stock_server.py|g' backend/.env-server
    log_success "backend/.env-server 更新完成"
else
    log_warning "backend/.env-server 文件不存在"
fi

# 2. 检查MCP服务器文件
log_info "检查MCP服务器文件..."

MCP_DIR="backend/api/mcp-yfinance-server"
if [ -f "$MCP_DIR/simple_stock_server.py" ]; then
    log_success "simple_stock_server.py 文件存在"
else
    log_error "simple_stock_server.py 文件不存在"
    exit 1
fi

# 3. 检查启动脚本
if [ -f "$MCP_DIR/start_mcp.sh" ]; then
    if grep -q "simple_stock_server.py" "$MCP_DIR/start_mcp.sh"; then
        log_success "start_mcp.sh 已正确配置"
    else
        log_warning "start_mcp.sh 可能需要更新"
    fi
else
    log_error "start_mcp.sh 文件不存在"
fi

# 4. 重启相关服务
log_info "重启相关服务..."

# 停止MCP相关服务
pm2 stop aiagent-mcp 2>/dev/null || log_warning "aiagent-mcp 服务未运行"
pm2 stop aiagent-api 2>/dev/null || log_warning "aiagent-api 服务未运行"

# 等待服务停止
sleep 2

# 重启服务
pm2 start aiagent-mcp || log_error "启动 aiagent-mcp 失败"
pm2 start aiagent-api || log_error "启动 aiagent-api 失败"

log_success "服务重启完成"

# 5. 验证服务状态
log_info "验证服务状态..."
pm2 status

log_success "MCP服务器路径修复完成！"
log_info "如果问题仍然存在，请检查远程服务器的环境变量配置"