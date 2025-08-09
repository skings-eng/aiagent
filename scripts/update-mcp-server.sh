#!/bin/bash

# 更新MCP服务器脚本
# 用于在远程服务器上更新MCP服务器到新的标准实现

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

# 检查是否在正确的目录
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "backend/api/mcp-yfinance-server" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 更新代码
update_code() {
    log_info "更新代码..."
    git pull origin main
    log_success "代码更新完成"
}

# 停止MCP相关服务
stop_mcp_services() {
    log_info "停止MCP相关服务..."
    
    # 停止PM2中的MCP服务
    pm2 stop mcp-server 2>/dev/null || log_warning "MCP服务未在运行"
    
    # 停止API服务（因为它依赖MCP）
    pm2 stop aiagent-api 2>/dev/null || log_warning "API服务未在运行"
    
    log_success "服务停止完成"
}

# 更新MCP服务器
update_mcp_server() {
    log_info "更新MCP服务器..."
    
    cd backend/api/mcp-yfinance-server
    
    # 激活虚拟环境
    if [ -d "venv" ]; then
        source venv/bin/activate
        
        # 更新依赖
        log_info "更新Python依赖..."
        pip install --upgrade pip
        pip install -e .
        
        # 测试新的MCP服务器
        log_info "测试新的MCP服务器..."
        if python standard_mcp_server.py --help >/dev/null 2>&1; then
            log_success "新的MCP服务器可以正常启动"
        else
            log_warning "MCP服务器测试失败，但继续部署"
        fi
        
        deactivate
    else
        log_error "虚拟环境不存在，请先运行部署脚本"
        exit 1
    fi
    
    cd ../../..
    log_success "MCP服务器更新完成"
}

# 更新环境变量
update_env_vars() {
    log_info "更新环境变量..."
    
    # 更新API服务的环境变量
    if [ -f "backend/api/.env" ]; then
        # 备份原文件
        cp backend/api/.env backend/api/.env.backup
        
        # 统一使用 /root/aiagent 作为部署路径
        CORRECT_PATH="/root/aiagent"
        sed -i "s|MCP_SERVER_PATH=.*|MCP_SERVER_PATH=$CORRECT_PATH/backend/api/mcp-yfinance-server/standard_mcp_server.py|" backend/api/.env
        
        log_success "环境变量更新完成"
    else
        log_warning "环境变量文件不存在"
    fi
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 重启API服务
    pm2 start aiagent-api 2>/dev/null || {
        log_warning "API服务启动失败，尝试重新配置"
        pm2 delete aiagent-api 2>/dev/null || true
        pm2 start ecosystem.config.js --only aiagent-api
    }
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if pm2 list | grep -q "aiagent-api.*online"; then
        log_success "API服务启动成功"
    else
        log_error "API服务启动失败"
        pm2 logs aiagent-api --lines 20
        exit 1
    fi
    
    log_success "服务重启完成"
}

# 测试MCP功能
test_mcp_function() {
    log_info "测试MCP功能..."
    
    # 等待服务完全启动
    sleep 10
    
    # 简单的健康检查
    if curl -s http://localhost:3001/health >/dev/null; then
        log_success "API服务健康检查通过"
    else
        log_warning "API服务健康检查失败"
    fi
    
    log_info "请手动测试MCP功能是否正常工作"
}

# 主函数
main() {
    log_info "开始更新MCP服务器..."
    
    check_directory
    update_code
    stop_mcp_services
    update_mcp_server
    update_env_vars
    restart_services
    test_mcp_function
    
    log_success "MCP服务器更新完成！"
    log_info "如果仍有问题，请检查日志：pm2 logs aiagent-api"
}

# 运行主函数
main "$@"