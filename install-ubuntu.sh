#!/bin/bash

# 智能投资助手 - Ubuntu 一键安装脚本
# 适用于 Ubuntu 20.04+ 系统
# 包含所有组件：Node.js、Python、MongoDB、Redis、前端、后端、MCP服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_cmd() {
    echo -e "${CYAN}[CMD]${NC} $1"
}

# 检查是否为root用户
check_root() {
    #if [[ $EUID -eq 0 ]]; then
    #    log_error "请不要使用root用户运行此脚本"
    #   log_info "正确用法: ./install-ubuntu.sh"
    #    exit 1
    #fi
    return 0
}

# 检查Ubuntu版本
check_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "无法检测操作系统版本"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        log_error "此脚本仅支持Ubuntu系统，当前系统: $ID"
        exit 1
    fi
    
    log_success "检测到Ubuntu系统: $PRETTY_NAME"
    
    # 检查版本兼容性
    VERSION_ID_MAJOR=$(echo $VERSION_ID | cut -d'.' -f1)
    if [[ $VERSION_ID_MAJOR -lt 20 ]]; then
        log_warning "建议使用Ubuntu 20.04或更高版本，当前版本: $VERSION_ID"
        read -p "是否继续安装? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 更新系统
update_system() {
    log_step "更新系统包..."
    sudo apt update && sudo apt upgrade -y
    
    log_step "安装基础依赖..."
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip \
        vim \
        htop \
        tree \
        jq
    
    log_success "系统更新完成"
}

# 安装Node.js 18.x
install_nodejs() {
    log_step "安装Node.js 18.x..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            log_success "Node.js已安装: $(node --version)"
            return
        else
            log_warning "Node.js版本过低，正在升级..."
        fi
    fi
    
    # 添加NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # 安装Node.js
    sudo apt-get install -y nodejs
    
    # 验证安装
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log_success "Node.js安装完成: $(node --version)"
        log_success "NPM版本: $(npm --version)"
    else
        log_error "Node.js安装失败"
        exit 1
    fi
}

# 安装Python 3.11+
install_python() {
    log_step "安装Python 3.11+..."
    
    # 检查Python版本
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -ge 11 ]]; then
            log_success "Python已安装: $(python3 --version)"
            return
        else
            log_warning "Python版本过低，正在升级..."
        fi
    fi
    
    # 添加deadsnakes PPA（用于获取最新Python版本）
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt update
    
    # 安装Python 3.11
    sudo apt install -y \
        python3.11 \
        python3.11-venv \
        python3.11-dev \
        python3-pip \
        python3.11-distutils
    
    # 设置Python3.11为默认python3
    sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
    
    # 验证安装
    if command -v python3 &> /dev/null; then
        log_success "Python安装完成: $(python3 --version)"
    else
        log_error "Python安装失败"
        exit 1
    fi
}

# 安装MongoDB 7.0
install_mongodb() {
    log_step "安装MongoDB 7.0..."
    
    if command -v mongod &> /dev/null; then
        log_success "MongoDB已安装，跳过安装步骤"
        return
    fi
    
    # 导入MongoDB公钥
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # 检测Ubuntu版本并设置合适的源
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    
    # Ubuntu 24.04 (noble) 使用 jammy 源
    if [[ "$UBUNTU_CODENAME" == "noble" ]]; then
        log_warning "检测到Ubuntu 24.04，使用Ubuntu 22.04 (jammy)的MongoDB源"
        UBUNTU_CODENAME="jammy"
    fi
    
    # 添加MongoDB源
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $UBUNTU_CODENAME/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # 更新包列表
    sudo apt update
    
    # 安装MongoDB
    sudo apt install -y mongodb-org
    
    # 启动并启用MongoDB服务
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    # 验证安装
    if sudo systemctl is-active --quiet mongod; then
        log_success "MongoDB安装并启动完成"
    else
        log_error "MongoDB启动失败"
        exit 1
    fi
}

# 安装Redis 7.x
install_redis() {
    log_step "安装Redis 7.x..."
    
    if command -v redis-server &> /dev/null; then
        log_success "Redis已安装，跳过安装步骤"
        return
    fi
    
    # 安装Redis
    sudo apt install -y redis-server
    
    # 配置Redis
    sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # 启动并启用Redis服务
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # 验证安装
    if sudo systemctl is-active --quiet redis-server; then
        log_success "Redis安装并启动完成"
    else
        log_error "Redis启动失败"
        exit 1
    fi
}

# 安装PM2
install_pm2() {
    log_step "安装PM2进程管理器..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2已安装: $(pm2 --version)"
        return
    fi
    
    # 安装PM2
    sudo npm install -g pm2
    
    # 验证安装
    if command -v pm2 &> /dev/null; then
        log_success "PM2安装完成: $(pm2 --version)"
    else
        log_error "PM2安装失败"
        exit 1
    fi
}

# 安装项目依赖
install_project_dependencies() {
    log_step "安装项目依赖..."
    
    # 检查是否在项目目录中
    if [[ ! -f "package.json" ]]; then
        log_error "未找到package.json文件，请确保在项目根目录中运行此脚本"
        exit 1
    fi
    
    # 清理可能存在的node_modules
    log_info "清理旧的依赖..."
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "package-lock.json" -delete 2>/dev/null || true
    
    # 安装根目录依赖
    log_info "安装根目录依赖..."
    npm install
    
    # 构建shared模块（必须先构建）
    log_info "构建shared模块..."
    cd shared
    npm install
    npm run build
    cd ..
    
    # 安装并构建后端API
    log_info "安装后端API依赖..."
    cd backend/api
    npm install
    npm run build
    cd ../..
    
    # 安装并构建LINE Bot
    log_info "安装LINE Bot依赖..."
    cd backend/line
    npm install
    npm run build
    cd ../..
    
    # 安装前端依赖
    log_info "安装前端B端依赖..."
    cd frontend/b-end
    npm install
    npm run build
    cd ../..
    
    # 设置MCP Python环境
    log_info "设置MCP Python环境..."
    cd backend/api/mcp-yfinance-server
    
    # 删除可能存在的虚拟环境
    rm -rf venv
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    
    # 升级pip并安装依赖
    pip install --upgrade pip
    pip install -e .
    
    cd ../../..
    
    log_success "项目依赖安装完成"
}

# 配置环境变量
setup_environment() {
    log_step "配置环境变量..."
    
    # 配置后端API环境变量
    if [[ ! -f "backend/api/.env" ]]; then
        log_info "创建后端API环境配置..."
        cp backend/api/.env.example backend/api/.env
        
        # 设置默认端口
        sed -i 's/PORT=8000/PORT=8001/' backend/api/.env
        
        log_warning "请编辑 backend/api/.env 文件，填入您的API密钥"
    else
        log_success "后端API环境配置已存在"
    fi
    
    # 配置LINE Bot环境变量
    if [[ ! -f "backend/line/.env" ]]; then
        log_info "创建LINE Bot环境配置..."
        cp backend/line/.env.example backend/line/.env
        log_warning "请编辑 backend/line/.env 文件，填入LINE相关配置"
    else
        log_success "LINE Bot环境配置已存在"
    fi
    
    # 配置前端环境变量
    if [[ ! -f "frontend/b-end/.env" ]]; then
        log_info "创建前端环境配置..."
        cat > frontend/b-end/.env << EOF
VITE_API_BASE_URL=http://localhost:8001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EOF
        log_warning "请编辑 frontend/b-end/.env 文件，填入您的Gemini API密钥"
    else
        log_success "前端环境配置已存在"
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    log_success "环境配置完成"
}

# 配置防火墙
setup_firewall() {
    log_step "配置防火墙..."
    
    # 检查UFW是否安装
    if ! command -v ufw &> /dev/null; then
        sudo apt install -y ufw
    fi
    
    # 配置防火墙规则
    sudo ufw --force enable
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 3000/tcp  # 前端
    sudo ufw allow 8001/tcp  # API服务
    sudo ufw allow 3002/tcp  # LINE Bot
    
    log_success "防火墙配置完成"
}

# 优化系统配置
optimize_system() {
    log_step "优化系统配置..."
    
    # 设置文件描述符限制
    echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # 优化内核参数
    echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
    echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # 创建交换文件（如果内存小于4GB）
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 4 ]]; then
        log_info "检测到内存较小，创建2GB交换文件..."
        if [[ ! -f /swapfile ]]; then
            sudo fallocate -l 2G /swapfile
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        fi
    fi
    
    log_success "系统优化完成"
}

# 测试数据库连接
test_databases() {
    log_step "测试数据库连接..."
    
    # 测试MongoDB
    if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        log_success "MongoDB连接正常"
    else
        log_error "MongoDB连接失败"
        return 1
    fi
    
    # 测试Redis
    if redis-cli ping > /dev/null 2>&1; then
        log_success "Redis连接正常"
    else
        log_error "Redis连接失败"
        return 1
    fi
    
    return 0
}

# 创建启动脚本
create_startup_scripts() {
    log_step "创建启动脚本..."
    
    # 更新start-services.sh脚本
    cat > start-services.sh << 'EOF'
#!/bin/bash

# 智能投资助手 - 服务启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在项目根目录
if [[ ! -f "package.json" ]]; then
    log_error "请在项目根目录中运行此脚本"
    exit 1
fi

# 检查数据库服务
log_info "检查数据库服务..."
if ! sudo systemctl is-active --quiet mongod; then
    log_warning "启动MongoDB服务..."
    sudo systemctl start mongod
fi

if ! sudo systemctl is-active --quiet redis-server; then
    log_warning "启动Redis服务..."
    sudo systemctl start redis-server
fi

# 停止现有的PM2进程
log_info "停止现有服务..."
pm2 delete all 2>/dev/null || true

# 启动MCP服务器
log_info "启动MCP服务器..."
cd backend/api/mcp-yfinance-server
source venv/bin/activate
pm2 start --name "aiagent-mcp" --interpreter python3 demo_stock_price_server.py
cd ../../..

# 启动后端API服务
log_info "启动API服务..."
pm2 start --name "aiagent-api" --cwd backend/api npm -- start

# 启动LINE Bot服务
log_info "启动LINE Bot服务..."
pm2 start --name "aiagent-line" --cwd backend/line npm -- start

# 检查是否需要启动前端服务
if [[ "$1" == "--with-frontend" ]]; then
    log_info "启动前端服务..."
    pm2 start --name "aiagent-frontend" --cwd frontend/b-end npm -- run preview -- --port 3000 --host 0.0.0.0
fi

# 保存PM2配置
pm2 save

log_info "服务启动完成！"
log_info "查看服务状态: pm2 status"
log_info "查看日志: pm2 logs"

if [[ "$1" == "--with-frontend" ]]; then
    log_info "前端访问地址: http://localhost:3000"
fi
log_info "API访问地址: http://localhost:8001"
log_info "LINE Bot访问地址: http://localhost:3002"
EOF
    
    chmod +x start-services.sh
    
    # 创建停止脚本
    cat > stop-services.sh << 'EOF'
#!/bin/bash

# 智能投资助手 - 服务停止脚本

echo "停止所有服务..."
pm2 delete all 2>/dev/null || true
pm2 kill

echo "服务已停止"
EOF
    
    chmod +x stop-services.sh
    
    log_success "启动脚本创建完成"
}

# 主安装流程
main() {
    echo "======================================"
    echo "    智能投资助手 - Ubuntu 一键安装"
    echo "======================================"
    echo
    
    # 检查权限和系统
    check_root
    check_ubuntu
    
    # 系统更新和基础软件安装
    update_system
    install_nodejs
    install_python
    install_mongodb
    install_redis
    install_pm2
    
    # 项目相关安装
    install_project_dependencies
    setup_environment
    
    # 系统优化
    setup_firewall
    optimize_system
    
    # 测试和脚本创建
    if test_databases; then
        create_startup_scripts
        
        echo
        log_success "✅ 安装完成！"
        echo
        log_info "📋 安装清单:"
        echo "  ✓ Node.js: $(node --version)"
        echo "  ✓ NPM: $(npm --version)"
        echo "  ✓ Python: $(python3 --version)"
        echo "  ✓ PM2: $(pm2 --version)"
        echo "  ✓ MongoDB: 已安装并运行"
        echo "  ✓ Redis: 已安装并运行"
        echo "  ✓ 项目依赖: 已安装"
        echo "  ✓ 环境配置: 已创建"
        echo
        log_info "🎯 下一步:"
        echo "  1. 编辑API密钥: nano backend/api/.env"
        echo "  2. 编辑前端配置: nano frontend/b-end/.env"
        echo "  3. 启动服务: ./start-services.sh --with-frontend"
        echo "  4. 查看状态: pm2 status"
        echo
        log_success "🎉 智能投资助手安装完成！"
    else
        log_error "数据库连接测试失败，请检查MongoDB和Redis服务状态"
        exit 1
    fi
}

# 运行主函数
main "$@"