#!/bin/bash

# 智能投资助手 - 部署诊断脚本
# 用于快速检测公网部署问题

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

echo "======================================"
echo "    智能投资助手 - 部署诊断工具"
echo "======================================"
echo

# 1. 检查基本环境
log_info "1. 检查基本环境..."
echo "操作系统: $(uname -a)"
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "NPM版本: $(npm --version 2>/dev/null || echo '未安装')"
echo "PM2版本: $(pm2 --version 2>/dev/null || echo '未安装')"
echo

# 2. 检查服务状态
log_info "2. 检查PM2服务状态..."
if command -v pm2 &> /dev/null; then
    pm2 status
else
    log_error "PM2未安装"
fi
echo

# 3. 检查端口监听
log_info "3. 检查端口监听状态..."
echo "端口监听情况:"
if command -v netstat &> /dev/null; then
    netstat -tlnp | grep -E ':(3000|3001|3002|8000|8001)' || echo "未发现相关端口监听"
elif command -v ss &> /dev/null; then
    ss -tlnp | grep -E ':(3000|3001|3002|8000|8001)' || echo "未发现相关端口监听"
else
    log_warning "netstat和ss命令都不可用"
fi
echo

# 4. 检查防火墙状态
log_info "4. 检查防火墙状态..."
if command -v ufw &> /dev/null; then
    echo "UFW状态:"
    sudo ufw status 2>/dev/null || log_warning "无法获取UFW状态"
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld状态:"
    sudo firewall-cmd --list-all 2>/dev/null || log_warning "无法获取Firewalld状态"
else
    log_warning "未检测到UFW或Firewalld"
fi
echo

# 5. 检查环境变量文件
log_info "5. 检查环境变量文件..."
if [ -f "backend/api/.env" ]; then
    log_success "后端API环境变量文件存在"
    if grep -q "^GOOGLE_AI_API_KEY=.\+" backend/api/.env; then
        log_success "GOOGLE_AI_API_KEY已配置"
    else
        log_error "GOOGLE_AI_API_KEY未配置或为空"
    fi
    
    if grep -q "^PORT=" backend/api/.env; then
        API_PORT=$(grep "^PORT=" backend/api/.env | cut -d'=' -f2)
        echo "API端口配置: $API_PORT"
    else
        log_warning "API端口未在.env中配置，使用默认值"
    fi
else
    log_error "后端API环境变量文件不存在: backend/api/.env"
fi

if [ -f "backend/line/.env" ]; then
    log_success "LINE Bot环境变量文件存在"
else
    log_warning "LINE Bot环境变量文件不存在"
fi
echo

# 6. 检查构建文件
log_info "6. 检查构建文件..."
build_dirs=("backend/api/dist" "backend/line/dist" "frontend/b-end/dist" "shared/dist")
for dir in "${build_dirs[@]}"; do
    if [ -d "$dir" ]; then
        log_success "$dir 存在"
    else
        log_error "$dir 不存在"
    fi
done
echo

# 7. 本地连接测试
log_info "7. 本地连接测试..."
test_url() {
    local url=$1
    local name=$2
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" | grep -q "200\|404\|302"; then
        local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url")
        log_success "$name: HTTP $status"
    else
        log_error "$name: 连接失败"
    fi
}

test_url "http://localhost:3000" "前端服务(3000)"
test_url "http://localhost:3001" "API服务(3001)"
test_url "http://localhost:3001/health" "API健康检查"
test_url "http://localhost:3002" "LINE Bot(3002)"
test_url "http://localhost:8000" "API服务(8000)"
test_url "http://localhost:8001" "API服务(8001)"
echo

# 8. 外网连接测试
log_info "8. 外网连接测试..."
SERVER_IP="172.237.20.24"
test_url "http://$SERVER_IP:3000" "外网前端"
test_url "http://$SERVER_IP:3001" "外网API"
test_url "http://$SERVER_IP:3001/health" "外网API健康检查"
echo

# 9. 检查数据库连接
log_info "9. 检查数据库服务..."
if command -v systemctl &> /dev/null; then
    echo "MongoDB状态:"
    sudo systemctl is-active mongod 2>/dev/null || echo "MongoDB服务未运行或未安装"
    echo "Redis状态:"
    sudo systemctl is-active redis 2>/dev/null || sudo systemctl is-active redis-server 2>/dev/null || echo "Redis服务未运行或未安装"
else
    log_warning "systemctl不可用，无法检查数据库服务状态"
fi
echo

# 10. 检查进程信息
log_info "10. 检查相关进程..."
echo "Node.js进程:"
ps aux | grep -E '(node|pm2)' | grep -v grep || echo "未发现Node.js相关进程"
echo

# 11. 检查日志文件
log_info "11. 检查日志文件..."
if [ -d "logs" ]; then
    echo "日志目录存在，最近的日志文件:"
    ls -la logs/ | head -10
else
    log_warning "日志目录不存在"
fi
echo

# 12. 前端配置检查
log_info "12. 检查前端配置..."
if [ -f "frontend/b-end/vite.config.ts" ]; then
    echo "前端代理配置:"
    grep -A 10 "proxy:" frontend/b-end/vite.config.ts || echo "未找到代理配置"
else
    log_error "前端配置文件不存在"
fi
echo

# 13. 生成修复建议
log_info "13. 修复建议..."
echo "基于诊断结果，建议按以下顺序检查:"
echo
echo "🔧 常见问题修复:"
echo "1. 端口配置不一致:"
echo "   - 检查 backend/api/.env 中的 PORT 设置"
echo "   - 检查 frontend/b-end/vite.config.ts 中的代理配置"
echo "   - 确保前后端端口配置一致"
echo
echo "2. 防火墙配置:"
echo "   sudo ufw allow 3000"
echo "   sudo ufw allow 3001"
echo "   sudo ufw allow 3002"
echo
echo "3. 服务重启:"
echo "   ./stop-services.sh"
echo "   ./start-services.sh --with-frontend"
echo
echo "4. 外网访问配置:"
echo "   - 确保云服务商安全组开放相应端口"
echo "   - 检查服务器网络配置"
echo "   - 考虑使用Nginx反向代理"
echo
echo "📋 详细故障排除指南: DEPLOYMENT_TROUBLESHOOTING.md"
echo
echo "======================================"
log_success "诊断完成！"
echo "======================================"