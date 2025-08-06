#!/bin/bash

# 智能投资助手 - 一键安装脚本
# 适用于Ubuntu 20.04+

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
echo "    智能投资助手 - 一键安装脚本"
echo "======================================"
echo

# 检查系统
log_info "检查系统环境..."
if [ ! -f /etc/os-release ]; then
    log_error "无法检测系统版本"
    exit 1
fi

source /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
    log_warning "此脚本专为Ubuntu设计，当前系统: $ID"
    read -p "是否继续安装? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_success "系统检查通过: $PRETTY_NAME"

# 更新系统
log_info "更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
log_info "安装基础依赖..."
sudo apt install -y curl wget git build-essential

# 检查并安装Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        log_success "Node.js已安装: $(node --version)"
    else
        log_warning "Node.js版本过低，正在升级..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    log_info "安装Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

log_success "Node.js安装完成: $(node --version)"
log_success "NPM版本: $(npm --version)"

# 安装Python
log_info "检查Python环境..."
if command -v python3 &> /dev/null; then
    log_success "Python3已安装: $(python3 --version)"
else
    log_info "安装Python3..."
    sudo apt install -y python3 python3-pip python3-venv
fi

# 安装PM2
if command -v pm2 &> /dev/null; then
    log_success "PM2已安装: $(pm2 --version)"
else
    log_info "安装PM2进程管理器..."
    sudo npm install -g pm2
fi

# 创建项目目录
log_info "准备项目目录..."
if [ ! -d "/opt" ]; then
    sudo mkdir -p /opt
fi

# 设置权限
sudo chown -R $USER:$USER /opt 2>/dev/null || true

echo
log_success "✅ 所有依赖安装完成！"
echo
log_info "📋 安装清单:"
echo "  ✓ Node.js: $(node --version)"
echo "  ✓ NPM: $(npm --version)"
echo "  ✓ Python3: $(python3 --version)"
echo "  ✓ PM2: $(pm2 --version)"
echo "  ✓ Git: $(git --version | head -1)"
echo
log_info "🎯 下一步:"
echo "  1. 克隆项目: git clone <项目地址> /opt/aiagent"
echo "  2. 进入目录: cd /opt/aiagent"
echo "  3. 配置API密钥: nano backend/api/.env"
echo "  4. 启动服务: ./start-services.sh"
echo
log_success "🎉 环境准备完成！可以开始部署智能投资助手了！"