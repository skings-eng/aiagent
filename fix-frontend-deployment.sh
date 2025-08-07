#!/bin/bash

# 修复前端部署问题 - 将c-end替换为b-end
# 解决远程服务器显示错误页面的问题

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

log_info "开始修复前端部署问题..."
log_info "问题：远程服务器显示的是c-end项目（简单聊天界面），而不是b-end项目（完整的股票分析界面）"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 1. 停止现有的前端服务
log_info "停止现有的前端服务..."
pm2 stop aiagent-frontend 2>/dev/null || log_warning "前端服务可能未运行"
pm2 delete aiagent-frontend 2>/dev/null || log_warning "前端服务可能未配置"

# 2. 确保b-end项目已构建
log_info "构建b-end前端项目..."
cd frontend/b-end

# 检查是否有.env文件，如果没有则创建
if [ ! -f ".env" ]; then
    log_info "创建b-end环境配置文件..."
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EOF
    log_warning "请编辑 frontend/b-end/.env 文件，填入您的Gemini API密钥"
fi

# 安装依赖并构建
log_info "安装依赖..."
npm install

log_info "构建项目..."
npm run build

cd ../..

# 3. 启动正确的前端服务（b-end）
log_info "启动b-end前端服务..."
pm2 start --name "aiagent-frontend" --cwd frontend/b-end npm -- run preview -- --port 3000 --host 0.0.0.0

# 4. 保存PM2配置
pm2 save

log_success "前端部署修复完成！"
log_info "现在远程服务器将显示正确的股票分析界面（b-end项目）"
log_info ""
log_info "验证步骤："
log_info "  1. 检查服务状态: pm2 status"
log_info "  2. 查看前端日志: pm2 logs aiagent-frontend"
log_info "  3. 访问: http://172.237.20.24:3000/home"
log_info ""
log_info "预期结果："
log_info "  - 应该看到完整的日本股票AI分析界面"
log_info "  - 包含市场数据、功能介绍等模块"
log_info "  - 而不是简单的聊天界面"
log_info ""
log_warning "如果仍有问题，请检查："
log_warning "  1. 后端API是否在8001端口正常运行"
log_warning "  2. 防火墙是否开放3000和8001端口"
log_warning "  3. frontend/b-end/.env文件配置是否正确"