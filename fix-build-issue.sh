#!/bin/bash

# Ubuntu服务器构建问题自动修复脚本
# 解决PM2脚本文件不存在的问题

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

echo "=== AI Agent 构建问题自动修复脚本 ==="
echo "时间: $(date)"
echo "用户: $(whoami)"
echo "当前目录: $(pwd)"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 停止所有PM2进程
log_info "停止所有PM2进程..."
pm2 stop all 2>/dev/null || log_warning "没有运行中的PM2进程"
pm2 delete all 2>/dev/null || log_warning "没有PM2进程需要删除"

# 第1步：完全清理环境
log_info "第1步：完全清理构建环境..."
rm -rf backend/api/dist
rm -rf backend/line/dist
rm -rf frontend/b-end/dist
rm -rf shared/dist
log_success "构建目录清理完成"

# 第2步：清理所有node_modules
log_info "第2步：清理所有依赖..."
rm -rf backend/api/node_modules
rm -rf backend/line/node_modules
rm -rf frontend/b-end/node_modules
rm -rf shared/node_modules
rm -rf node_modules
log_success "依赖清理完成"

# 第3步：重新安装根目录依赖
log_info "第3步：安装根目录依赖..."
npm install
log_success "根目录依赖安装完成"

# 第4步：构建shared模块
log_info "第4步：构建shared模块..."
cd shared
npm install
if npm run build; then
    log_success "shared模块构建成功"
else
    log_error "shared模块构建失败"
    exit 1
fi
cd ..

# 验证shared模块构建结果
if [ ! -d "shared/dist" ] || [ ! -f "shared/dist/index.js" ]; then
    log_error "shared模块构建验证失败"
    exit 1
fi
log_success "shared模块构建验证通过"

# 第5步：构建backend/api
log_info "第5步：构建backend/api..."
cd backend/api
npm install
log_info "检查TypeScript编译..."
npx tsc --noEmit || log_warning "TypeScript检查有警告"
if npm run build; then
    log_success "backend/api构建成功"
else
    log_error "backend/api构建失败"
    exit 1
fi
cd ../..

# 验证backend/api构建结果
if [ ! -f "backend/api/dist/server.js" ]; then
    log_error "backend/api构建验证失败：server.js不存在"
    echo "dist目录内容:"
    ls -la backend/api/dist/ 2>/dev/null || echo "dist目录不存在"
    exit 1
fi
log_success "backend/api构建验证通过"

# 第6步：构建backend/line
log_info "第6步：构建backend/line..."
cd backend/line
npm install
log_info "检查TypeScript编译..."
npx tsc --noEmit || log_warning "TypeScript检查有警告"
if npm run build; then
    log_success "backend/line构建成功"
else
    log_error "backend/line构建失败"
    exit 1
fi
cd ../..

# 验证backend/line构建结果
if [ ! -f "backend/line/dist/index.js" ]; then
    log_error "backend/line构建验证失败：index.js不存在"
    echo "dist目录内容:"
    ls -la backend/line/dist/ 2>/dev/null || echo "dist目录不存在"
    exit 1
fi
log_success "backend/line构建验证通过"

# 第7步：构建frontend
log_info "第7步：构建frontend..."
cd frontend/b-end
npm install
if npm run build; then
    log_success "frontend构建成功"
else
    log_error "frontend构建失败"
    exit 1
fi
cd ../..

# 第8步：设置MCP服务器
log_info "第8步：设置MCP服务器..."
cd backend/api/mcp-yfinance-server
if [ ! -d "venv" ]; then
    log_info "创建Python虚拟环境..."
    python3 -m venv venv
fi
source venv/bin/activate
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi
chmod +x start_mcp.sh
cd ../../..
log_success "MCP服务器设置完成"

# 第9步：验证所有构建文件
log_info "第9步：最终验证..."
echo "检查关键文件:"
echo "✓ backend/api/dist/server.js: $([ -f 'backend/api/dist/server.js' ] && echo '存在' || echo '不存在')"
echo "✓ backend/line/dist/index.js: $([ -f 'backend/line/dist/index.js' ] && echo '存在' || echo '不存在')"
echo "✓ frontend/b-end/dist/index.html: $([ -f 'frontend/b-end/dist/index.html' ] && echo '存在' || echo '不存在')"
echo "✓ shared/dist/index.js: $([ -f 'shared/dist/index.js' ] && echo '存在' || echo '不存在')"

# 检查所有关键文件是否存在
if [ -f "backend/api/dist/server.js" ] && [ -f "backend/line/dist/index.js" ] && [ -f "frontend/b-end/dist/index.html" ]; then
    log_success "所有构建文件验证通过！"
else
    log_error "构建文件验证失败"
    exit 1
fi

# 第10步：启动PM2服务
log_info "第10步：启动PM2服务..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    sleep 5
    pm2 status
    log_success "PM2服务启动完成"
else
    log_error "ecosystem.config.js不存在"
    exit 1
fi

echo ""
log_success "=== 构建问题修复完成 ==="
echo "所有服务应该已经正常启动。"
echo "使用 'pm2 status' 检查服务状态"
echo "使用 'pm2 logs' 查看服务日志"