#!/bin/bash

# Gemini API Key 快速修复脚本
# 用于快速解决Ubuntu环境中最常见的配置问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，某些操作可能需要调整权限"
    fi
}

# 检查并启动MongoDB
fix_mongodb() {
    log_info "检查MongoDB服务..."
    
    if ! systemctl is-active --quiet mongod; then
        log_warning "MongoDB未运行，尝试启动..."
        
        if sudo systemctl start mongod 2>/dev/null; then
            sudo systemctl enable mongod
            log_success "MongoDB已启动并设置为开机自启"
        else
            log_error "MongoDB启动失败，请检查安装状态"
            return 1
        fi
    else
        log_success "MongoDB运行正常"
    fi
}

# 检查并启动Redis
fix_redis() {
    log_info "检查Redis服务..."
    
    # 尝试不同的Redis服务名
    for service in redis redis-server; do
        if systemctl list-unit-files | grep -q "^$service"; then
            if ! systemctl is-active --quiet $service; then
                log_warning "$service未运行，尝试启动..."
                
                if sudo systemctl start $service 2>/dev/null; then
                    sudo systemctl enable $service
                    log_success "$service已启动并设置为开机自启"
                    return 0
                fi
            else
                log_success "$service运行正常"
                return 0
            fi
        fi
    done
    
    log_error "Redis服务启动失败或未安装"
    return 1
}

# 创建或修复环境变量文件
fix_env_file() {
    log_info "检查环境变量文件..."
    
    local env_file="backend/api/.env"
    
    if [[ ! -f "$env_file" ]]; then
        log_warning "环境变量文件不存在，创建默认配置..."
        
        # 确保目录存在
        mkdir -p "$(dirname "$env_file")"
        
        # 获取服务器IP
        local server_ip
        server_ip=$(hostname -I | awk '{print $1}' || echo "localhost")
        
        cat > "$env_file" << EOF
# 生产环境配置
NODE_ENV=production
PORT=3001
SERVER_HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/aiagent_prod
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置
FRONTEND_URL=http://${server_ip}:4173
ALLOWED_ORIGINS=http://${server_ip}:4173,http://localhost:4173

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-$(date +%s)
JWT_EXPIRES_IN=7d

# AI API密钥 - 请替换为您的实际API Key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# 日志配置
LOG_LEVEL=info
EOF
        
        log_success "环境变量文件已创建: $env_file"
        log_warning "请编辑 $env_file 文件，设置正确的 GOOGLE_AI_API_KEY"
    else
        log_success "环境变量文件已存在"
        
        # 检查API Key是否设置
        if grep -q "GOOGLE_AI_API_KEY=your-" "$env_file" || ! grep -q "GOOGLE_AI_API_KEY=" "$env_file"; then
            log_warning "API Key未正确设置，请编辑 $env_file 文件"
        fi
    fi
}

# 安装依赖并构建项目
build_project() {
    log_info "检查项目构建状态..."
    
    if [[ ! -d "backend/api/dist" ]]; then
        log_warning "项目未构建，开始构建..."
        
        cd backend/api
        
        log_info "安装依赖..."
        npm install
        
        log_info "构建项目..."
        npm run build
        
        cd ../..
        
        log_success "项目构建完成"
    else
        log_success "项目已构建"
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    local ports=(3001 3003 4173 27017 6379)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=("$port")
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        log_info "以下端口已被占用: ${occupied_ports[*]}"
    else
        log_warning "所有必需端口都未被占用，可能服务未启动"
    fi
}

# 测试数据库连接
test_database() {
    log_info "测试数据库连接..."
    
    if command -v mongosh >/dev/null 2>&1; then
        if mongosh --eval "db.adminCommand('ping')" --quiet aiagent_prod >/dev/null 2>&1; then
            log_success "MongoDB连接正常"
        else
            log_error "MongoDB连接失败"
            return 1
        fi
    elif command -v mongo >/dev/null 2>&1; then
        if mongo --eval "db.adminCommand('ping')" --quiet aiagent_prod >/dev/null 2>&1; then
            log_success "MongoDB连接正常"
        else
            log_error "MongoDB连接失败"
            return 1
        fi
    else
        log_warning "未找到MongoDB客户端，跳过连接测试"
    fi
    
    # 测试Redis连接
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            log_success "Redis连接正常"
        else
            log_error "Redis连接失败"
            return 1
        fi
    else
        log_warning "未找到Redis客户端，跳过连接测试"
    fi
}

# 重启服务
restart_services() {
    log_info "重启PM2服务..."
    
    # 停止现有服务
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # 启动服务
    if [[ -x "./start-services.sh" ]]; then
        ./start-services.sh
        log_success "服务已重启"
        
        # 等待服务启动
        sleep 3
        
        # 显示服务状态
        pm2 status
    else
        log_error "start-services.sh脚本不存在或不可执行"
        return 1
    fi
}

# 显示使用说明
show_usage() {
    echo "Gemini API Key 快速修复脚本"
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h     显示此帮助信息"
    echo "  --check-only   仅检查状态，不执行修复"
    echo "  --no-restart   不重启服务"
    echo ""
    echo "示例:"
    echo "  $0                # 执行完整修复"
    echo "  $0 --check-only  # 仅检查状态"
    echo "  $0 --no-restart  # 修复但不重启服务"
}

# 主函数
main() {
    local check_only=false
    local no_restart=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_usage
                exit 0
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            --no-restart)
                no_restart=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    echo "🔧 Gemini API Key 快速修复脚本"
    echo "=============================="
    
    check_root
    
    # 检查当前目录
    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
        log_error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    # 执行检查
    check_ports
    
    if [[ "$check_only" == "true" ]]; then
        log_info "仅执行状态检查..."
        test_database
        exit 0
    fi
    
    # 执行修复
    local failed_steps=()
    
    if ! fix_mongodb; then
        failed_steps+=("MongoDB")
    fi
    
    if ! fix_redis; then
        failed_steps+=("Redis")
    fi
    
    fix_env_file
    
    if ! build_project; then
        failed_steps+=("项目构建")
    fi
    
    if ! test_database; then
        failed_steps+=("数据库连接")
    fi
    
    if [[ "$no_restart" != "true" ]]; then
        if ! restart_services; then
            failed_steps+=("服务重启")
        fi
    fi
    
    # 显示结果
    echo ""
    echo "=============================="
    if [[ ${#failed_steps[@]} -eq 0 ]]; then
        log_success "所有修复步骤完成！"
    else
        log_warning "以下步骤失败: ${failed_steps[*]}"
    fi
    
    echo ""
    log_info "接下来的步骤:"
    echo "1. 编辑 backend/api/.env 文件，设置正确的 GOOGLE_AI_API_KEY"
    echo "2. 运行: node diagnose-gemini-issue.js (详细诊断)"
    echo "3. 运行: pm2 logs (查看服务日志)"
    echo "4. 测试API: curl http://localhost:3001/api/ai-models/gemini/status"
}

# 运行主函数
main "$@"