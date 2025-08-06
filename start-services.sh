#!/bin/bash

# 智能投资助手 - 一键启动脚本
# 用于在Ubuntu服务器上启动所有服务

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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warning "不建议使用root用户运行此脚本"
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检查必要的命令
check_dependencies() {
    log_info "检查系统依赖..."
    
    local deps=("node" "npm" "pm2" "python3")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        log_info "请先安装缺少的依赖，参考 DEPLOYMENT.md"
        exit 1
    fi
    
    log_success "所有依赖检查通过"
}

# 检查环境变量文件
check_env_files() {
    log_info "检查环境变量文件..."
    
    # 检查必需的API环境变量文件
    if [ ! -f "backend/api/.env" ]; then
        log_error "缺少后端API环境变量文件: backend/api/.env"
        log_info "请运行: cp backend/api/.env.example backend/api/.env"
        log_info "然后编辑 backend/api/.env 文件，填写你的 GOOGLE_AI_API_KEY"
        exit 1
    fi
    
    # 检查LINE环境变量文件（可选）
    if [ ! -f "backend/line/.env" ]; then
        log_warning "LINE环境变量文件不存在，将自动创建默认配置"
        cp backend/line/.env.example backend/line/.env
        log_info "已创建 backend/line/.env，如需使用LINE Bot功能，请编辑此文件"
    fi
    
    # 检查API密钥是否配置
    if ! grep -q "^GOOGLE_AI_API_KEY=.\+" backend/api/.env; then
        log_error "请在 backend/api/.env 文件中配置你的 GOOGLE_AI_API_KEY"
        log_info "编辑命令: nano backend/api/.env"
        log_info "请在 .env 文件中添加: GOOGLE_AI_API_KEY=你的API密钥"
        exit 1
    fi
    
    log_success "环境变量文件检查通过"
}

# 检查构建文件
check_build_files() {
    log_info "检查构建文件..."
    
    local build_dirs=(
        "backend/api/dist"
        "backend/line/dist"
        "frontend/b-end/dist"
        "shared/dist"
    )
    
    local missing_builds=()
    
    for dir in "${build_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_builds+=("$dir")
        fi
    done
    
    if [ ${#missing_builds[@]} -ne 0 ]; then
        log_warning "以下构建目录不存在: ${missing_builds[*]}"
        log_info "将自动执行构建..."
        build_project
    else
        log_success "构建文件检查通过"
    fi
}

# 构建项目
build_project() {
    log_info "开始构建项目..."
    
    # 构建共享模块
    log_info "构建共享模块..."
    cd shared
    npm run build
    cd ..
    
    # 构建后端API
    log_info "构建后端API..."
    cd backend/api
    npm run build
    cd ../..
    
    # 构建LINE Bot
    log_info "构建LINE Bot..."
    cd backend/line
    npm run build
    cd ../..
    
    # 构建前端
    log_info "构建前端..."
    cd frontend/b-end
    npm run build
    cd ../..
    
    log_success "项目构建完成"
}

# 启动MCP服务器
start_mcp_server() {
    log_info "启动MCP服务器..."
    
    cd backend/api/mcp-yfinance-server
    
    # 检查虚拟环境
    if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
        log_info "创建Python虚拟环境..."
        rm -rf venv 2>/dev/null || true
        python3 -m venv venv
        
        # 激活虚拟环境并安装依赖
        if [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
            # 升级pip
            pip install --upgrade pip
            # 安装项目依赖（使用pyproject.toml）
            if [ -f "pyproject.toml" ]; then
                pip install -e .
            elif [ -f "requirements.txt" ]; then
                pip install -r requirements.txt
            else
                log_warning "未找到依赖文件，跳过依赖安装"
            fi
        else
            log_error "虚拟环境创建失败"
            cd ../../..
            return 1
        fi
    else
        source venv/bin/activate
    fi
    
    # 使用PM2启动MCP服务器
    pm2 start demo_stock_price_server.py --name "aiagent-mcp" --interpreter python3 --cwd "$(pwd)" || log_warning "MCP服务器可能已在运行"
    
    cd ../../..
    log_success "MCP服务器启动完成"
}

# 启动后端API服务
start_api_server() {
    log_info "启动后端API服务..."
    
    cd backend/api
    pm2 start dist/index.js --name "aiagent-api" --env production || log_warning "API服务器可能已在运行"
    cd ../..
    
    log_success "后端API服务启动完成"
}

# 启动LINE Bot服务
start_line_server() {
    log_info "启动LINE Bot服务..."
    
    # 检查是否配置了LINE token
    if grep -q "^LINE_CHANNEL_ACCESS_TOKEN=.\+" backend/line/.env && 
       grep -q "^LINE_CHANNEL_SECRET=.\+" backend/line/.env; then
        cd backend/line
        pm2 start dist/index.js --name "aiagent-line" --env production || log_warning "LINE Bot服务器可能已在运行"
        cd ../..
        log_success "LINE Bot服务启动完成"
    else
        log_warning "LINE Bot配置未完成，跳过LINE服务启动"
        log_info "如需使用LINE Bot，请编辑 backend/line/.env 文件并重新启动"
    fi
}

# 启动前端服务 (可选，如果不使用Nginx)
start_frontend_server() {
    if [ "$1" = "--with-frontend" ]; then
        log_info "启动前端服务..."
        
        cd frontend/b-end
        pm2 serve dist 3000 --name "aiagent-frontend" --spa || log_warning "前端服务器可能已在运行"
        cd ../..
        
        log_success "前端服务启动完成"
    fi
}

# 显示服务状态
show_status() {
    echo
    echo "====================================="
    log_success "✅ 智能投资助手启动完成！"
    echo "====================================="
    echo
    
    log_info "📊 服务状态:"
    pm2 status
    
    echo
    log_info "🌐 访问地址:"
    echo "  📱 网页版: http://localhost:3000 (如果启用了前端服务)"
    echo "  🔌 API接口: http://localhost:3001"
    echo "  💬 LINE Bot: http://localhost:3002 (如果已配置)"
    echo
    
    log_info "🔧 常用命令:"
    echo "  查看日志: pm2 logs"
    echo "  重启服务: pm2 restart all"
    echo "  停止服务: ./stop-services.sh"
    echo "  查看状态: pm2 status"
    echo
    
    log_info "🎯 快速测试:"
    echo "  1. 浏览器访问: http://你的服务器IP:3000"
    echo "  2. API健康检查: curl http://localhost:3001/health"
    echo "  3. 在网页上发送消息测试AI功能"
    echo
    
    if ! grep -q "^LINE_CHANNEL_ACCESS_TOKEN=.\+" backend/line/.env; then
        log_warning "💡 提示: LINE Bot未配置，只能使用网页版功能"
        log_info "如需配置LINE Bot，请编辑 backend/line/.env 文件"
    fi
}

# 主函数
main() {
    echo "======================================"
    echo "    智能投资助手 - 一键启动脚本"
    echo "======================================"
    echo
    
    # 检查当前目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    check_root
    check_dependencies
    check_env_files
    check_build_files
    
    log_info "🚀 开始启动所有服务..."
    echo
    
    # 停止可能已运行的服务
    log_info "清理旧服务..."
    pm2 delete aiagent-api aiagent-line aiagent-mcp aiagent-frontend 2>/dev/null || true
    
    # 启动服务
    start_mcp_server
    sleep 2
    start_api_server
    sleep 2
    start_line_server
    start_frontend_server "$1"
    
    # 保存PM2配置
    pm2 save
    
    show_status
}

# 处理脚本参数
case "$1" in
    --help|-h)
        echo "用法: $0 [选项]"
        echo "选项:"
        echo "  --with-frontend    同时启动前端服务 (如果不使用Nginx)"
        echo "  --help, -h         显示此帮助信息"
        echo "  --status           显示服务状态"
        echo "  --stop             停止所有服务"
        echo "  --restart          重启所有服务"
        echo "  --logs             查看服务日志"
        exit 0
        ;;
    --status)
        pm2 status
        exit 0
        ;;
    --stop)
        log_info "停止所有服务..."
        pm2 stop all
        log_success "所有服务已停止"
        exit 0
        ;;
    --restart)
        log_info "重启所有服务..."
        pm2 restart all
        log_success "所有服务已重启"
        exit 0
        ;;
    --logs)
        pm2 logs
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac