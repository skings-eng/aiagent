#!/bin/bash

# 智能投资助手 - 一键安装脚本
# 适用于Ubuntu 20.04+ 和 macOS

set -e

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            if [[ "$ID" == "ubuntu" ]]; then
                OS="ubuntu"
            else
                OS="linux"
            fi
        else
            OS="linux"
        fi
    else
        OS="unknown"
    fi
}

# 调用操作系统检测
detect_os

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
case $OS in
    "macos")
        log_success "检测到macOS系统"
        ;;
    "ubuntu")
        source /etc/os-release
        log_success "检测到Ubuntu系统: $PRETTY_NAME"
        ;;
    "linux")
        log_warning "检测到Linux系统，但非Ubuntu"
        read -p "是否继续安装? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        ;;
    *)
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
        ;;
esac

# 更新系统和安装基础依赖
if [[ "$OS" == "macos" ]]; then
    # macOS使用Homebrew
    if ! command -v brew &> /dev/null; then
        log_info "安装Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        # 添加Homebrew到PATH
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        log_success "Homebrew已安装"
    fi
    
    log_info "更新Homebrew..."
    brew update
    
    log_info "安装基础依赖..."
    brew install curl wget git
else
    # Ubuntu/Linux使用apt
    log_info "更新系统包..."
    sudo apt update && sudo apt upgrade -y
    
    log_info "安装基础依赖..."
    sudo apt install -y curl wget git build-essential
fi

# 检查并安装Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        log_success "Node.js已安装: $(node --version)"
    else
        log_warning "Node.js版本过低，正在升级..."
        if [[ "$OS" == "macos" ]]; then
            brew install node@18
            brew link node@18 --force
        else
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    fi
else
    log_info "安装Node.js 18.x..."
    if [[ "$OS" == "macos" ]]; then
        brew install node@18
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

log_success "Node.js安装完成: $(node --version)"
log_success "NPM版本: $(npm --version)"

# 安装Python
log_info "检查Python环境..."
if command -v python3 &> /dev/null; then
    log_success "Python3已安装: $(python3 --version)"
else
    log_info "安装Python3..."
    if [[ "$OS" == "macos" ]]; then
        brew install python@3.11
    else
        sudo apt install -y python3 python3-pip python3-venv
    fi
fi

# 安装PM2
if command -v pm2 &> /dev/null; then
    log_success "PM2已安装: $(pm2 --version)"
else
    log_info "安装PM2进程管理器..."
    sudo npm install -g pm2
fi

# 安装MongoDB
log_info "安装MongoDB数据库..."
if command -v mongod >/dev/null 2>&1; then
    log_info "MongoDB已安装，跳过安装步骤"
else
    if [[ "$OS" == "macos" ]]; then
        # macOS使用Homebrew安装MongoDB
        log_info "使用Homebrew安装MongoDB..."
        brew tap mongodb/brew
        brew install mongodb-community@7.0
        
        # 启动MongoDB服务
        log_info "启动MongoDB服务..."
        brew services start mongodb/brew/mongodb-community
    else
        # Ubuntu使用apt安装MongoDB
        # 导入MongoDB公钥
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        
        # 添加MongoDB源
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        
        # 更新包列表
        sudo apt update
        
        # 安装MongoDB
        sudo apt install -y mongodb-org
        
        # 启动MongoDB服务
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
    
    log_success "MongoDB安装并启动完成"
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
if command -v mongod >/dev/null 2>&1; then
    if [[ "$OS" == "macos" ]]; then
        echo "  ✓ MongoDB: $(mongod --version | head -1 | awk '{print $3}')"
    else
        echo "  ✓ MongoDB: $(mongod --version | head -1 | awk '{print $3}')"
    fi
else
    echo "  ✗ MongoDB: 未安装"
fi
echo
log_info "🎯 下一步:"
echo "  1. 克隆项目: git clone <项目地址> /opt/aiagent"
echo "  2. 进入目录: cd /opt/aiagent"
echo "  3. 配置API密钥: nano backend/api/.env"
echo "  4. 启动服务: ./start-services.sh"
echo
log_success "🎉 环境准备完成！可以开始部署智能投资助手了！"