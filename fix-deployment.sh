#!/bin/bash

# 智能投资助手 - 公网部署修复脚本
# 解决常见的公网访问问题

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
echo "    智能投资助手 - 公网部署修复"
echo "======================================"
echo

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    log_error "请在项目根目录下运行此脚本"
    exit 1
fi

# 1. 停止所有服务
log_info "1. 停止所有服务..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
log_success "服务已停止"

# 2. 检查并修复端口配置
log_info "2. 检查端口配置..."

# 检查后端API端口
if [ -f "backend/api/.env" ]; then
    if grep -q "^PORT=3001" backend/api/.env; then
        log_success "后端API端口配置正确 (3001)"
    else
        log_warning "修复后端API端口配置..."
        sed -i.bak 's/^PORT=.*/PORT=3001/' backend/api/.env
        log_success "后端API端口已设置为3001"
    fi
    
    # 设置为生产环境
    if grep -q "^NODE_ENV=production" backend/api/.env; then
        log_success "环境已设置为生产模式"
    else
        sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=production/' backend/api/.env
        log_success "环境已设置为生产模式"
    fi
else
    log_error "后端API环境变量文件不存在"
    exit 1
fi

# 检查前端代理配置
if [ -f "frontend/b-end/vite.config.ts" ]; then
    if grep -q "host: '0.0.0.0'" frontend/b-end/vite.config.ts; then
        log_success "前端host配置正确"
    else
        log_warning "修复前端host配置..."
        sed -i.bak "s/host: true,/host: '0.0.0.0', \/\/ 允许外网访问/" frontend/b-end/vite.config.ts
        log_success "前端host已设置为0.0.0.0"
    fi
    
    if grep -q "localhost:3001" frontend/b-end/vite.config.ts; then
        log_success "前端代理端口配置正确"
    else
        log_warning "修复前端代理端口..."
        sed -i.bak 's/localhost:8001/localhost:3001/' frontend/b-end/vite.config.ts
        log_success "前端代理端口已设置为3001"
    fi
fi

# 3. 重新构建项目
log_info "3. 重新构建项目..."

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

# 4. 配置防火墙
log_info "4. 配置防火墙..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 3000 2>/dev/null || log_warning "无法配置UFW规则"
    sudo ufw allow 3001 2>/dev/null || log_warning "无法配置UFW规则"
    sudo ufw allow 3002 2>/dev/null || log_warning "无法配置UFW规则"
    log_success "UFW防火墙规则已配置"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || log_warning "无法配置Firewalld规则"
    sudo firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null || log_warning "无法配置Firewalld规则"
    sudo firewall-cmd --permanent --add-port=3002/tcp 2>/dev/null || log_warning "无法配置Firewalld规则"
    sudo firewall-cmd --reload 2>/dev/null || log_warning "无法重载Firewalld"
    log_success "Firewalld防火墙规则已配置"
else
    log_warning "未检测到防火墙，请手动配置云服务商安全组"
fi

# 5. 启动MCP服务器
log_info "5. 启动MCP服务器..."
cd backend/api/mcp-yfinance-server

# 检查虚拟环境
if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
    log_info "创建Python虚拟环境..."
    rm -rf venv 2>/dev/null || true
    python3 -m venv venv
    
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        pip install --upgrade pip
        if [ -f "pyproject.toml" ]; then
            pip install -e .
        elif [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        fi
    fi
else
    source venv/bin/activate
fi

pm2 start demo_stock_price_server.py --name "aiagent-mcp" --interpreter python3 --cwd "$(pwd)" || log_warning "MCP服务器可能已在运行"
cd ../../..
log_success "MCP服务器启动完成"

# 6. 启动后端API服务
log_info "6. 启动后端API服务..."
cd backend/api
pm2 start dist/index.js --name "aiagent-api" --env production || log_warning "API服务器可能已在运行"
cd ../..
log_success "后端API服务启动完成"

# 7. 启动LINE Bot服务
log_info "7. 启动LINE Bot服务..."
if grep -q "^LINE_CHANNEL_ACCESS_TOKEN=.\+" backend/line/.env && 
   grep -q "^LINE_CHANNEL_SECRET=.\+" backend/line/.env; then
    cd backend/line
    pm2 start dist/index.js --name "aiagent-line" --env production || log_warning "LINE Bot服务器可能已在运行"
    cd ../..
    log_success "LINE Bot服务启动完成"
else
    log_warning "LINE Bot配置未完成，跳过LINE服务启动"
fi

# 8. 启动前端服务
log_info "8. 启动前端服务..."
cd frontend/b-end
# 使用正确的参数启动前端服务，允许外网访问
pm2 serve dist 3000 --name "aiagent-frontend" --spa -- --host 0.0.0.0 || log_warning "前端服务器可能已在运行"
cd ../..
log_success "前端服务启动完成"

# 9. 保存PM2配置
pm2 save

# 10. 显示状态
echo
log_info "10. 检查服务状态..."
pm2 status

echo
echo "======================================"
log_success "✅ 公网部署修复完成！"
echo "======================================"
echo
log_info "🌐 访问地址:"
echo "  📱 网页版: http://你的服务器IP:3000"
echo "  🔌 API接口: http://你的服务器IP:3001"
echo "  💬 LINE Bot: http://你的服务器IP:3002 (如果已配置)"
echo
log_info "🔧 测试命令:"
echo "  本地测试: curl http://localhost:3001/health"
echo "  外网测试: curl http://你的服务器IP:3001/health"
echo
log_info "📋 如果仍无法访问，请检查:"
echo "  1. 云服务商安全组是否开放端口 3000, 3001, 3002"
echo "  2. 服务器网络配置是否正确"
echo "  3. 运行诊断脚本: ./diagnose.sh"
echo "  4. 查看详细故障排除: DEPLOYMENT_TROUBLESHOOTING.md"
echo
log_success "修复脚本执行完成！"