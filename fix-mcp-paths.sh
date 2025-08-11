#!/bin/bash

# 快速修复MCP路径问题的脚本
# 用于修复远程服务器上的路径配置问题

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

# 检查当前用户和路径
check_environment() {
    log_info "检查当前环境..."
    
    CURRENT_USER=$(whoami)
    CURRENT_PATH=$(pwd)
    
    log_info "当前用户: $CURRENT_USER"
    log_info "当前路径: $CURRENT_PATH"
    
    # 统一使用 /root/aiagent 作为部署路径
    CORRECT_DEPLOY_PATH="/root/aiagent"
    
    log_info "正确的部署路径应该是: $CORRECT_DEPLOY_PATH"
}

# 修复环境变量文件
fix_env_files() {
    log_info "修复环境变量文件..."
    
    # 修复API服务的.env文件
    if [ -f "backend/api/.env" ]; then
        log_info "备份并修复 backend/api/.env"
        cp backend/api/.env backend/api/.env.backup.$(date +%Y%m%d_%H%M%S)
        
        # 更新MCP相关路径
        sed -i "s|MCP_PYTHON_PATH=.*|MCP_PYTHON_PATH=$CORRECT_DEPLOY_PATH/backend/api/mcp-yfinance-server/venv/bin/python|" backend/api/.env
        sed -i "s|MCP_SERVER_PATH=.*|MCP_SERVER_PATH=$CORRECT_DEPLOY_PATH/backend/api/mcp-yfinance-server/standard_mcp_server.py|" backend/api/.env
        
        log_success "backend/api/.env 修复完成"
    else
        log_warning "backend/api/.env 文件不存在"
    fi
    
    # 修复后端服务的.env-server文件
    if [ -f "backend/.env-server" ]; then
        log_info "备份并修复 backend/.env-server"
        cp backend/.env-server backend/.env-server.backup.$(date +%Y%m%d_%H%M%S)
        
        # 更新MCP相关路径
        sed -i "s|MCP_PYTHON_PATH=.*|MCP_PYTHON_PATH=$CORRECT_DEPLOY_PATH/backend/api/mcp-yfinance-server/venv/bin/python|" backend/.env-server
        sed -i "s|MCP_SERVER_PATH=.*|MCP_SERVER_PATH=$CORRECT_DEPLOY_PATH/backend/api/mcp-yfinance-server/standard_mcp_server.py|" backend/.env-server
        
        log_success "backend/.env-server 修复完成"
    else
        log_warning "backend/.env-server 文件不存在"
    fi
}

# 检查并修复MCP虚拟环境
fix_mcp_venv() {
    log_info "检查MCP虚拟环境..."
    
    MCP_DIR="backend/api/mcp-yfinance-server"
    
    if [ -d "$MCP_DIR" ]; then
        cd "$MCP_DIR"
        
        # 检查虚拟环境是否存在
        if [ ! -d "venv" ]; then
            log_warning "虚拟环境不存在，创建新的虚拟环境"
            python3 -m venv venv
        fi
        
        # 激活虚拟环境并安装依赖
        source venv/bin/activate
        
        # 更新pip
        pip install --upgrade pip
        
        # 安装依赖
        if [ -f "pyproject.toml" ]; then
            pip install -e .
            log_success "MCP依赖安装完成"
        else
            log_error "pyproject.toml 文件不存在"
        fi
        
        # 测试MCP服务器
        if [ -f "standard_mcp_server.py" ]; then
            log_info "测试MCP服务器..."
            if python standard_mcp_server.py --help >/dev/null 2>&1; then
                log_success "MCP服务器测试通过"
            else
                log_warning "MCP服务器测试失败，但继续执行"
            fi
        else
            log_error "standard_mcp_server.py 文件不存在"
        fi
        
        deactivate
        cd ../../..
    else
        log_error "MCP目录不存在: $MCP_DIR"
    fi
}

# 重启服务
restart_services() {
    log_info "重启相关服务..."
    
    # 停止服务
    pm2 stop aiagent-api 2>/dev/null || log_warning "API服务未在运行"
    
    # 等待一下
    sleep 2
    
    # 重启服务
    pm2 start aiagent-api 2>/dev/null || {
        log_warning "API服务启动失败，尝试重新配置"
        pm2 delete aiagent-api 2>/dev/null || true
        
        # 检查是否有ecosystem.config.js
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --only aiagent-api
        else
            log_error "ecosystem.config.js 文件不存在"
        fi
    }
    
    # 检查服务状态
    sleep 5
    if pm2 list | grep -q "aiagent-api.*online"; then
        log_success "API服务启动成功"
    else
        log_error "API服务启动失败"
        pm2 logs aiagent-api --lines 10
    fi
}

# 显示当前配置
show_current_config() {
    log_info "当前MCP配置:"
    
    if [ -f "backend/api/.env" ]; then
        echo "=== backend/api/.env ==="
        grep -E "MCP_" backend/api/.env || log_warning "未找到MCP配置"
    fi
    
    if [ -f "backend/.env-server" ]; then
        echo "=== backend/.env-server ==="
        grep -E "MCP_" backend/.env-server || log_warning "未找到MCP配置"
    fi
    
    echo "=== 虚拟环境检查 ==="
    if [ -f "backend/api/mcp-yfinance-server/venv/bin/python" ]; then
        log_success "虚拟环境存在: backend/api/mcp-yfinance-server/venv/bin/python"
    else
        log_error "虚拟环境不存在: backend/api/mcp-yfinance-server/venv/bin/python"
    fi
    
    echo "=== MCP服务器文件检查 ==="
    if [ -f "backend/api/mcp-yfinance-server/standard_mcp_server.py" ]; then
        log_success "MCP服务器文件存在: backend/api/mcp-yfinance-server/standard_mcp_server.py"
    else
        log_error "MCP服务器文件不存在: backend/api/mcp-yfinance-server/standard_mcp_server.py"
    fi
}

# 主函数
main() {
    log_info "开始修复MCP路径问题..."
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -d "backend/api/mcp-yfinance-server" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    check_environment
    fix_env_files
    fix_mcp_venv
    show_current_config
    restart_services
    
    log_success "MCP路径修复完成！"
    log_info "如果仍有问题，请检查日志：pm2 logs aiagent-api"
}

# 运行主函数
main "$@"