#!/bin/bash

# 智能投资助手 - 停止服务脚本

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

# 停止所有服务
stop_all_services() {
    log_info "停止所有智能投资助手服务..."
    
    # 停止PM2管理的服务
    pm2 stop aiagent-api aiagent-line aiagent-mcp aiagent-frontend 2>/dev/null || log_warning "某些服务可能未运行"
    
    log_success "所有服务已停止"
}

# 删除所有服务
delete_all_services() {
    log_info "删除所有智能投资助手服务..."
    
    # 删除PM2管理的服务
    pm2 delete aiagent-api aiagent-line aiagent-mcp aiagent-frontend 2>/dev/null || log_warning "某些服务可能未运行"
    
    log_success "所有服务已删除"
}

# 显示服务状态
show_status() {
    log_info "当前服务状态:"
    pm2 status
}

# 主函数
main() {
    echo "======================================"
    echo "    智能投资助手 - 停止服务脚本"
    echo "======================================"
    echo
    
    case "$1" in
        --delete|-d)
            delete_all_services
            ;;
        --status|-s)
            show_status
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --delete, -d       停止并删除所有服务"
            echo "  --status, -s       显示服务状态"
            echo "  --help, -h         显示此帮助信息"
            echo "  (无参数)           仅停止服务，不删除"
            ;;
        *)
            stop_all_services
            ;;
    esac
    
    echo
    log_info "提示:"
    echo "  重新启动服务: ./start-services.sh"
    echo "  查看服务状态: pm2 status"
    echo "  查看日志: pm2 logs"
}

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 未安装，请先安装 PM2: npm install -g pm2"
    exit 1
fi

main "$@"