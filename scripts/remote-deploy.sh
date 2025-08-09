#!/bin/bash

# AI智能体系统 - 远程服务器一键部署脚本
# 在远程服务器上执行，包含环境检查、配置和部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置文件路径
CONFIG_FILE="$PWD/backend/.env-server"

# 默认配置变量（如果配置文件不存在时使用）
PROJECT_NAME="aiagent"
DEPLOY_PATH="/root/aiagent"
GIT_REPO=""
GIT_BRANCH="main"
NODE_ENV="development"

# 端口配置
API_PORT=8001
FRONTEND_PORT=3000
LINE_PORT=3003
MONGODB_PORT=27017
REDIS_PORT=6379

# 数据库配置
MONGODB_DATABASE="aiagent"
REDIS_DATABASE=0

# 版本要求
REQUIRED_NODE_VERSION="18.0.0"
REQUIRED_PYTHON_VERSION="3.11"

# 加载配置文件
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        log_info "加载配置文件: $CONFIG_FILE"
        # 读取配置文件并设置环境变量
        while IFS='=' read -r key value; do
            # 跳过注释和空行
            if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
                continue
            fi
            # 移除前后空格
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            # 设置变量
            if [[ -n $key && -n $value ]]; then
                export "$key"="$value"
            fi
        done < "$CONFIG_FILE"
        log_success "配置文件加载完成"
    else
        log_warning "配置文件 $CONFIG_FILE 不存在，使用默认配置"
    fi
}

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

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "AI智能体系统远程部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -c, --config FILE       配置文件路径 (默认: backend/.env-server)"
    echo "  -r, --repo URL          Git仓库地址 (覆盖配置文件)"
    echo "  -b, --branch BRANCH     Git分支 (覆盖配置文件)"
    echo "  -p, --path PATH         部署路径 (覆盖配置文件)"
    echo "  -e, --env ENV           环境变量 (覆盖配置文件)"
    echo "  --api-port PORT         API服务端口 (覆盖配置文件)"
    echo "  --frontend-port PORT    前端服务端口 (覆盖配置文件)"
    echo "  --line-port PORT        LINE服务端口 (覆盖配置文件)"
    echo "  --mongodb-port PORT     MongoDB端口 (覆盖配置文件)"
    echo "  --redis-port PORT       Redis端口 (覆盖配置文件)"
    echo "  --mongodb-db NAME       MongoDB数据库名 (覆盖配置文件)"
    echo "  --redis-db NUM          Redis数据库编号 (覆盖配置文件)"
    echo "  --check-only            仅执行环境检查"
    echo "  --skip-check            跳过环境检查"
    echo "  --skip-port-check       跳过端口占用检查"
    echo ""
    echo "配置文件:"
    echo "  脚本会自动加载 backend/.env-server 配置文件"
    echo "  配置文件包含所有部署相关的配置信息"
    echo "  命令行参数会覆盖配置文件中的对应设置"
    echo ""
    echo "示例:"
    echo "  $0                                          # 使用默认配置文件"
    echo "  $0 -c /path/to/custom.env                   # 使用自定义配置文件"
    echo "  $0 -r https://github.com/user/aiagent.git   # 覆盖Git仓库地址"
    echo "  $0 --check-only                            # 仅执行环境检查"
    echo "  $0 --skip-check                            # 跳过环境检查直接部署"
    echo "  $0 --skip-port-check                       # 跳过端口检查(适用于数据库已运行)"
}

# 版本比较函数
version_compare() {
    local version1=$1
    local version2=$2
    
    if [ "$(printf '%s\n' "$version1" "$version2" | sort -V | head -n1)" = "$version2" ]; then
        return 0  # version1 >= version2
    else
        return 1  # version1 < version2
    fi
}

# ==================== 环境检查部分 ====================

# 检查系统信息
check_system_info() {
    log_check "检查系统信息..."
    
    echo "操作系统: $(uname -s)"
    echo "架构: $(uname -m)"
    echo "内核版本: $(uname -r)"
    if [ -f /etc/os-release ]; then
        echo "发行版: $(grep PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d \")"
    fi
    echo "运行时间: $(uptime -p 2>/dev/null || uptime)"
    echo "内存信息: $(free -h | grep Mem:)"
    echo "磁盘空间: $(df -h / | tail -1)"
    
    log_success "系统信息获取完成"
}

# 检查Node.js
check_nodejs() {
    log_check "检查Node.js..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        log_info "安装建议:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        return 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/v//')
    echo "  当前版本: $node_version"
    echo "  要求版本: >= $REQUIRED_NODE_VERSION"
    
    if version_compare "$node_version" "$REQUIRED_NODE_VERSION"; then
        log_success "Node.js 版本满足要求"
        return 0
    else
        log_error "Node.js 版本过低"
        log_info "请升级到 $REQUIRED_NODE_VERSION 或更高版本"
        return 1
    fi
}

# 检查npm
check_npm() {
    log_check "检查npm..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        return 1
    fi
    
    local npm_version
    npm_version=$(npm --version)
    echo "  npm版本: $npm_version"
    log_success "npm 已安装"
    return 0
}

# 检查Python
check_python() {
    log_check "检查Python..."
    
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        log_info "安装建议:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y python3 python3-pip python3-venv"
        return 1
    fi
    
    local python_version
    python_version=$(python3 --version | cut -d' ' -f2)
    echo "  当前版本: $python_version"
    echo "  要求版本: >= $REQUIRED_PYTHON_VERSION"
    
    if version_compare "$python_version" "$REQUIRED_PYTHON_VERSION"; then
        log_success "Python 版本满足要求"
        return 0
    else
        log_error "Python 版本过低"
        log_info "请升级到 $REQUIRED_PYTHON_VERSION 或更高版本"
        return 1
    fi
}

# 检查MongoDB
check_mongodb() {
    log_check "检查MongoDB..."
    
    if ! command -v mongod &> /dev/null; then
        log_error "MongoDB 未安装"
        log_info "安装建议:"
        echo "  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -"
        echo "  echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y mongodb-org"
        echo "  sudo systemctl start mongod"
        echo "  sudo systemctl enable mongod"
        return 1
    fi
    
    if systemctl is-active --quiet mongod 2>/dev/null || pgrep mongod >/dev/null 2>&1; then
        log_success "MongoDB 已安装并运行"
        local mongo_version
        mongo_version=$(mongosh --version 2>/dev/null | head -1 || mongo --version 2>/dev/null | head -1 || echo 'client_not_found')
        echo "  $mongo_version"
        return 0
    else
        log_warning "MongoDB 已安装但未运行"
        log_info "启动命令:"
        echo "  sudo systemctl start mongod"
        echo "  sudo systemctl enable mongod"
        return 1
    fi
}

# 检查Redis
check_redis() {
    log_check "检查Redis..."
    
    if ! command -v redis-server &> /dev/null; then
        log_error "Redis 未安装"
        log_info "安装建议:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y redis-server"
        echo "  sudo systemctl start redis"
        echo "  sudo systemctl enable redis"
        return 1
    fi
    
    if systemctl is-active --quiet redis 2>/dev/null || systemctl is-active --quiet redis-server 2>/dev/null || pgrep redis-server >/dev/null 2>&1; then
        log_success "Redis 已安装并运行"
        local redis_version
        redis_version=$(redis-cli --version 2>/dev/null || echo 'client_not_found')
        echo "  $redis_version"
        return 0
    else
        log_warning "Redis 已安装但未运行"
        log_info "启动命令:"
        echo "  sudo systemctl start redis"
        echo "  sudo systemctl enable redis"
        return 1
    fi
}

# 检查端口占用
check_ports() {
    log_check "检查端口占用..."
    
    local ports=("$API_PORT" "$FRONTEND_PORT" "$LINE_PORT" "$MONGODB_PORT" "$REDIS_PORT")
    local port_names=("API服务" "前端服务" "LINE服务" "MongoDB" "Redis")
    local port_issues=0
    local service_ports=("$MONGODB_PORT" "$REDIS_PORT")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            # 检查是否是数据库服务端口
            if [[ " ${service_ports[@]} " =~ " ${port} " ]]; then
                log_success "端口 $port ($name): 服务已运行"
            else
                log_warning "端口 $port ($name): 已被占用"
                ((port_issues++))
            fi
        else
            echo "  端口 $port ($name): 可用"
        fi
    done
    
    if [ $port_issues -eq 0 ]; then
        log_success "所有端口检查完成"
        return 0
    else
        log_warning "发现 $port_issues 个端口冲突"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_check "检查磁盘空间..."
    
    local disk_info
    disk_info=$(df -h / | tail -1)
    local available
    available=$(echo "$disk_info" | awk '{print $4}' | sed 's/G//')
    
    echo "  $disk_info"
    
    if [ "${available%.*}" -ge 5 ]; then
        log_success "磁盘空间充足"
        return 0
    else
        log_warning "磁盘空间不足，建议至少5GB可用空间"
        return 1
    fi
}

# 检查内存
check_memory() {
    log_check "检查内存..."
    
    local memory_info
    memory_info=$(free -h | grep Mem:)
    echo "  $memory_info"
    
    # 简单检查，建议至少2GB内存
    if [[ "$memory_info" == *"Gi"* ]]; then
        log_success "内存充足"
        return 0
    else
        log_warning "内存可能不足，建议至少2GB内存"
        return 1
    fi
}

# 检查必要工具
check_tools() {
    log_check "检查必要工具..."
    
    local tools=("git" "curl" "wget" "unzip")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo "  $tool: 已安装"
        else
            echo "  $tool: 未安装"
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -eq 0 ]; then
        log_success "所有必要工具已安装"
        return 0
    else
        log_warning "缺少工具: ${missing_tools[*]}"
        log_info "安装命令:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y ${missing_tools[*]}"
        return 1
    fi
}

# 执行环境检查
run_environment_check() {
    echo -e "${BLUE}=== 环境检查 ===${NC}"
    
    local checks_passed=0
    local total_checks=0
    
    local checks=(
        "check_system_info"
        "check_nodejs"
        "check_npm"
        "check_python"
        "check_mongodb"
        "check_redis"
    )
    
    # 如果没有跳过端口检查，则添加端口检查
    if [ "$SKIP_PORT_CHECK" != "true" ]; then
        checks+=("check_ports")
    else
        log_info "跳过端口占用检查"
    fi
    
    for check in "${checks[@]}"; do
        ((total_checks++))
        if $check; then
            ((checks_passed++))
        fi
        echo ""
    done
    
    echo -e "${BLUE}=== 检查总结 ===${NC}"
    echo "通过检查: $checks_passed/$total_checks"
    
    if [ $checks_passed -eq $total_checks ]; then
        log_success "所有检查通过，环境满足部署要求！"
        return 0
    else
        log_error "部分检查未通过，请根据上述建议修复问题后重新运行"
        return 1
    fi
}

# ==================== 配置部分 ====================

# 验证必要配置
validate_config() {
    log_info "验证配置信息..."
    
    local config_errors=0
    
    # 跳过Git仓库验证，使用当前目录作为部署路径
    if [ -z "$DEPLOY_PATH" ]; then
        DEPLOY_PATH="/root/aiagent"
        log_info "使用默认部署路径: $DEPLOY_PATH"
    fi
    
    # 设置配置文件的绝对路径
    CONFIG_FILE="$DEPLOY_PATH/backend/.env-server"
    log_info "配置文件路径: $CONFIG_FILE"
    
    # 自动生成安全密钥（如果未配置）
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-super-secret-jwt-key-$(date +%s)")
        log_info "自动生成JWT密钥"
    fi
    
    if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "your-session-secret-change-this-in-production" ]; then
        SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-session-secret-$(date +%s)")
        log_info "自动生成Session密钥"
    fi
    
    if [ $config_errors -gt 0 ]; then
        log_error "配置验证失败，请检查配置文件 $CONFIG_FILE"
        return 1
    fi
    
    log_success "配置验证通过"
    return 0
}

# 显示配置确认
show_config_summary() {
    echo ""
    echo -e "${YELLOW}=== 配置确认 ===${NC}"
    echo "项目名称: $PROJECT_NAME"
    echo "部署路径: $DEPLOY_PATH"
    echo "Git仓库: $GIT_REPO"
    echo "Git分支: $GIT_BRANCH"
    echo "环境变量: $NODE_ENV"
    echo ""
    echo "端口配置:"
    echo "  API服务: $API_PORT"
    echo "  前端服务: $FRONTEND_PORT"
    echo "  LINE服务: $LINE_PORT"
    echo "  MongoDB: $MONGODB_PORT"
    echo "  Redis: $REDIS_PORT"
    echo ""
    echo "数据库配置:"
    echo "  MongoDB数据库: $MONGODB_DATABASE"
    echo "  Redis数据库: $REDIS_DATABASE"
    echo ""
    echo "API密钥配置:"
    if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key" ]; then
        echo "  OpenAI API Key: ${OPENAI_API_KEY:0:10}..."
    else
        echo "  OpenAI API Key: 未配置"
    fi
    if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your-anthropic-api-key" ]; then
        echo "  Anthropic API Key: ${ANTHROPIC_API_KEY:0:10}..."
    else
        echo "  Anthropic API Key: 未配置"
    fi
    if [ -n "$GOOGLE_AI_API_KEY" ] && [ "$GOOGLE_AI_API_KEY" != "AIzaSyCAWckxmtKkHq4ELpEkvViz4bsLUc2SOHw" ]; then
        echo "  Google Gemini API Key: ${GOOGLE_AI_API_KEY:0:10}..."
    else
        echo "  Google Gemini API Key: 使用默认值"
    fi
    echo ""
    echo "LINE Bot配置:"
    if [ -n "$LINE_CHANNEL_ACCESS_TOKEN" ] && [ "$LINE_CHANNEL_ACCESS_TOKEN" != "your-line-channel-access-token" ]; then
        echo "  LINE Access Token: ${LINE_CHANNEL_ACCESS_TOKEN:0:10}..."
    else
        echo "  LINE Access Token: 未配置"
    fi
    if [ -n "$LINE_CHANNEL_SECRET" ] && [ "$LINE_CHANNEL_SECRET" != "your-line-channel-secret" ]; then
        echo "  LINE Channel Secret: ${LINE_CHANNEL_SECRET:0:10}..."
    else
        echo "  LINE Channel Secret: 未配置"
    fi
    echo ""
}

# ==================== 部署部分 ====================

# 创建环境变量文件
create_env_files() {
    log_info "创建环境变量配置文件..."
    
    # 创建API环境变量文件
    cat > "$DEPLOY_PATH/backend/api/.env" << EOF
# Server Configuration
PORT=$API_PORT
NODE_ENV=$NODE_ENV
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:$MONGODB_PORT/$MONGODB_DATABASE
MONGODB_TEST_URI=mongodb://localhost:$MONGODB_PORT/${MONGODB_DATABASE}-test

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=
REDIS_DB=$REDIS_DATABASE

# JWT Configuration
JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# AI Model Configuration
# OpenAI
OPENAI_API_KEY=${OPENAI_API_KEY:-your-openai-api-key}
OPENAI_ORG_ID=your-openai-org-id

# Anthropic Claude
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your-anthropic-api-key}

# Google Gemini
GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY:-AIzaSyCAWckxmtKkHq4ELpEkvViz4bsLUc2SOHw}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:$FRONTEND_PORT,http://localhost:3001

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AI Agent <noreply@aiagent.com>

# Slack Integration
SLACK_WEBHOOK_URL=your-slack-webhook-url
SLACK_CHANNEL=#alerts

# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN:-your-line-channel-access-token}
LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET:-your-line-channel-secret}

# External APIs
STOCK_API_KEY=your-stock-data-api-key
STOCK_API_BASE_URL=https://api.stockdata.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=${SESSION_SECRET:-your-session-secret-change-this-in-production}

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true

# Cache
CACHE_TTL=3600
CACHE_MAX_KEYS=1000

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=ai-agent-backups
BACKUP_S3_REGION=ap-northeast-1

# AWS Configuration (for S3 backups)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-northeast-1

# MCP数据服务配置
MCP_PYTHON_PATH=$DEPLOY_PATH/backend/api/mcp-yfinance-server/venv/bin/python
MCP_SERVER_PATH=$DEPLOY_PATH/backend/api/mcp-yfinance-server/server.py
MCP_TIMEOUT=${MCP_TIMEOUT:-30000}
MCP_RETRY_COUNT=${MCP_RETRY_COUNT:-3}
MCP_CACHE_TTL=${MCP_CACHE_TTL:-300}
EOF

    # 创建LINE服务环境变量文件
    cat > "$DEPLOY_PATH/backend/line/.env" << EOF
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN:-test_access_token_for_development}
LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET:-test_channel_secret_for_development}

# Server Configuration
PORT=$LINE_PORT
NODE_ENV=$NODE_ENV
HOST=0.0.0.0

# Redis Configuration
REDIS_URL=redis://localhost:$REDIS_PORT
REDIS_HOST=localhost
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=
REDIS_DB=$REDIS_DATABASE
REDIS_KEY_PREFIX=line_bot:

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# Request Logging
REQUEST_LOG_ENABLED=true
REQUEST_LOG_FORMAT=combined

# Debug Logging
DEBUG_LOG_ENABLED=false
DEBUG_LOG_LEVEL=debug

# Performance Logging
PERFORMANCE_LOG_ENABLED=true
PERFORMANCE_LOG_THRESHOLD=1000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MESSAGE=Too many requests, please try again later

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=*
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
CORS_CREDENTIALS=false

# Security Configuration
HELMET_ENABLED=true
HELMET_CONTENT_SECURITY_POLICY=false
HELMET_CROSS_ORIGIN_EMBEDDER_POLICY=false

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Session Configuration
SESSION_SECRET=${SESSION_SECRET:-your_session_secret_here}
SESSION_COOKIE_MAX_AGE=86400000
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTP_ONLY=true

# Feature Flags
FEATURE_USER_BLOCKING=true
FEATURE_MESSAGE_ANALYTICS=true
FEATURE_WEBHOOK_SIMULATION=true
FEATURE_CUSTOM_HANDLERS=false
FEATURE_RICH_MENU=false
FEATURE_PUSH_NOTIFICATIONS=true
FEATURE_MULTICAST_MESSAGES=true
FEATURE_BROADCAST_MESSAGES=false
EOF

    log_success "环境变量配置文件创建完成"
}

# 克隆或更新代码
clone_or_update_code() {
    log_info "获取项目代码..."
    
    if [ -z "$GIT_REPO" ]; then
        log_error "Git仓库地址未设置"
        return 1
    fi
    
    # 创建部署目录
    sudo mkdir -p "$DEPLOY_PATH"
    sudo chown "$(whoami):$(whoami)" "$DEPLOY_PATH"
    
    if [ -d "$DEPLOY_PATH/.git" ]; then
        log_info "更新现有代码..."
        cd "$DEPLOY_PATH"
        git fetch origin
        git checkout "$GIT_BRANCH"
        git pull origin "$GIT_BRANCH"
    else
        log_info "克隆新代码..."
        git clone -b "$GIT_BRANCH" "$GIT_REPO" "$DEPLOY_PATH"
        cd "$DEPLOY_PATH"
    fi
    
    log_success "代码获取完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd "$DEPLOY_PATH"
    
    # 安装根目录依赖
    echo "安装根目录依赖..."
    npm install
    
    # 安装共享模块依赖
    echo "安装共享模块依赖..."
    cd shared && npm install && cd ..
    
    # 安装API依赖
    echo "安装API依赖..."
    cd backend/api && npm install && cd ../..
    
    # 安装LINE服务依赖
    echo "安装LINE服务依赖..."
    cd backend/line && npm install && cd ../..
    
    # 安装前端依赖
    echo "安装前端依赖..."
    cd frontend/c-end && npm install && cd ../..
    
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    cd "$DEPLOY_PATH"
    
    # 构建共享模块
    echo "构建共享模块..."
    npm run build:shared
    
    # 构建后端服务
    echo "构建后端服务..."
    npm run build:backend
    
    # 构建前端
    echo "构建前端..."
    npm run build:frontend
    
    log_success "项目构建完成"
}

# 设置MCP服务
setup_mcp_service() {
    log_info "设置MCP数据服务..."
    
    cd "$DEPLOY_PATH/backend/api/mcp-yfinance-server"
    
    # 创建Python虚拟环境
    if [ ! -d "venv" ]; then
        echo "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境并安装依赖
    echo "安装Python依赖..."
    source venv/bin/activate
    pip install .
    
    # 确保启动脚本有执行权限
    chmod +x start_mcp.sh
    
    log_success "MCP数据服务设置完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    cd "$DEPLOY_PATH"
    
    # 创建日志目录
    mkdir -p logs
    
    # 创建上传目录
    mkdir -p uploads
    
    # 创建备份目录
    mkdir -p backups
    
    # 设置目录权限
    chmod 755 logs uploads backups
    
    log_success "必要目录创建完成"
}

# 创建PM2配置文件
create_pm2_config() {
    log_info "创建PM2配置文件..."
    
    cat > "$DEPLOY_PATH/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: '$DEPLOY_PATH',
      env: {
        NODE_ENV: '$NODE_ENV',
        PORT: $API_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-line',
      script: './backend/line/dist/index.js',
      cwd: '$DEPLOY_PATH',
      env: {
        NODE_ENV: '$NODE_ENV',
        PORT: $LINE_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/line-error.log',
      out_file: './logs/line-out.log',
      log_file: './logs/line-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run start',
      cwd: '$DEPLOY_PATH/frontend/c-end',
      env: {
        NODE_ENV: '$NODE_ENV',
        PORT: $FRONTEND_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-mcp',
      script: './backend/api/mcp-yfinance-server/start_mcp.sh',
      cwd: '$DEPLOY_PATH',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/mcp-error.log',
      out_file: './logs/mcp-out.log',
      log_file: './logs/mcp-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

    log_success "PM2配置文件创建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    cd "$DEPLOY_PATH"
    
    # 检查PM2是否安装
    if ! command -v pm2 &> /dev/null; then
        echo "安装PM2..."
        npm install -g pm2
    fi
    
    # 停止现有服务（如果存在）
    echo "停止现有服务..."
    pm2 delete all 2>/dev/null || true
    
    # 启动所有服务
    echo "启动服务..."
    pm2 start ecosystem.config.js
    
    # 保存PM2配置
    pm2 save
    
    # 设置PM2开机自启
    pm2 startup
    
    # 显示服务状态
    echo ""
    echo "=== 服务状态 ==="
    pm2 status
    
    log_success "服务启动完成"
}

# 创建数据库初始化脚本
create_db_init_script() {
    log_info "创建数据库初始化脚本..."
    
    mkdir -p "$DEPLOY_PATH/scripts"
    
    cat > "$DEPLOY_PATH/scripts/init-database.js" << 'EOF'
// AI智能体系统 - MongoDB数据库初始化脚本

// 切换到目标数据库
use('aiagent');

// 创建用户集合
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "lastLoginAt": 1 });
db.users.createIndex({ "role": 1 });

// 创建对话集合
db.createCollection('conversations');
db.conversations.createIndex({ "userId": 1 });
db.conversations.createIndex({ "createdAt": 1 });
db.conversations.createIndex({ "updatedAt": 1 });
db.conversations.createIndex({ "title": "text" });

// 创建消息集合
db.createCollection('messages');
db.messages.createIndex({ "conversationId": 1 });
db.messages.createIndex({ "userId": 1 });
db.messages.createIndex({ "createdAt": 1 });
db.messages.createIndex({ "role": 1 });
db.messages.createIndex({ "content": "text" });

// 创建设置集合
db.createCollection('settings');
db.settings.createIndex({ "key": 1 }, { unique: true });
db.settings.createIndex({ "category": 1 });
db.settings.createIndex({ "updatedAt": 1 });

// 创建AI模型集合
db.createCollection('aimodels');
db.aimodels.createIndex({ "name": 1 }, { unique: true });
db.aimodels.createIndex({ "provider": 1 });
db.aimodels.createIndex({ "isActive": 1 });
db.aimodels.createIndex({ "createdAt": 1 });

// 插入默认管理员用户
db.users.insertOne({
  username: "admin",
  email: "admin@aiagent.com",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq8S/EO", // admin123
  role: "admin",
  isActive: true,
  profile: {
    firstName: "Admin",
    lastName: "User",
    avatar: ""
  },
  preferences: {
    language: "zh-CN",
    theme: "light",
    notifications: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// 插入默认系统设置
db.settings.insertMany([
  {
    key: "system.name",
    value: "AI智能体系统",
    category: "system",
    description: "系统名称",
    type: "string",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "system.version",
    value: "1.0.0",
    category: "system",
    description: "系统版本",
    type: "string",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "ai.default_model",
    value: "gpt-3.5-turbo",
    category: "ai",
    description: "默认AI模型",
    type: "string",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "ai.max_tokens",
    value: 2048,
    category: "ai",
    description: "最大令牌数",
    type: "number",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 插入默认AI模型配置
db.aimodels.insertMany([
  {
    name: "gpt-3.5-turbo",
    displayName: "GPT-3.5 Turbo",
    provider: "openai",
    description: "OpenAI GPT-3.5 Turbo模型",
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    isActive: true,
    capabilities: ["chat", "completion"],
    config: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "gpt-4",
    displayName: "GPT-4",
    provider: "openai",
    description: "OpenAI GPT-4模型",
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    isActive: true,
    capabilities: ["chat", "completion", "analysis"],
    config: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "claude-3-sonnet",
    displayName: "Claude 3 Sonnet",
    provider: "anthropic",
    description: "Anthropic Claude 3 Sonnet模型",
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    isActive: true,
    capabilities: ["chat", "completion", "analysis"],
    config: {
      temperature: 0.7,
      maxTokens: 4096
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "gemini-pro",
    displayName: "Gemini Pro",
    provider: "google",
    description: "Google Gemini Pro模型",
    maxTokens: 32768,
    costPer1kTokens: 0.001,
    isActive: true,
    capabilities: ["chat", "completion", "multimodal"],
    config: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("数据库初始化完成！");
print("默认管理员账户: admin / admin123");
print("请及时修改默认密码！");
EOF

    cat > "$DEPLOY_PATH/scripts/init-db.sh" << EOF
#!/bin/bash

# 数据库初始化脚本

echo "正在初始化MongoDB数据库..."

if command -v mongosh &> /dev/null; then
    mongosh --host localhost:$MONGODB_PORT "$DEPLOY_PATH/scripts/init-database.js"
elif command -v mongo &> /dev/null; then
    mongo --host localhost:$MONGODB_PORT "$DEPLOY_PATH/scripts/init-database.js"
else
    echo "错误: 未找到MongoDB客户端 (mongosh 或 mongo)"
    exit 1
fi

echo "数据库初始化完成！"
EOF

    chmod +x "$DEPLOY_PATH/scripts/init-db.sh"
    
    log_success "数据库初始化脚本创建完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."
    
    cd "$DEPLOY_PATH"
    
    echo "=== 配置验证 ==="
    echo "项目路径: $(pwd)"
    echo "Node.js版本: $(node --version)"
    echo "npm版本: $(npm --version)"
    echo "Python版本: $(python3 --version)"
    echo "PM2版本: $(pm2 --version 2>/dev/null || echo '未安装')"
    
    echo ""
    echo "=== 端口配置 ==="
    echo "API端口: $API_PORT"
    echo "前端端口: $FRONTEND_PORT"
    echo "LINE服务端口: $LINE_PORT"
    echo "MongoDB端口: $MONGODB_PORT"
    echo "Redis端口: $REDIS_PORT"
    
    echo ""
    echo "=== 文件检查 ==="
    echo "API环境变量文件: $([ -f backend/api/.env ] && echo '存在' || echo '缺失')"
    echo "LINE环境变量文件: $([ -f backend/line/.env ] && echo '存在' || echo '缺失')"
    echo "PM2配置文件: $([ -f ecosystem.config.js ] && echo '存在' || echo '缺失')"
    echo "数据库初始化脚本: $([ -f scripts/init-database.js ] && echo '存在' || echo '缺失')"
    
    echo ""
    echo "=== 构建文件检查 ==="
    echo "API构建文件: $([ -f backend/api/dist/server.js ] && echo '存在' || echo '缺失')"
    echo "LINE构建文件: $([ -f backend/line/dist/index.js ] && echo '存在' || echo '缺失')"
    echo "前端构建文件: $([ -d frontend/c-end/dist ] && echo '存在' || echo '缺失')"
    
    log_success "部署验证完成"
}

# 显示部署完成信息
show_deployment_summary() {
    echo ""
    log_success "=== 部署完成 ==="
    echo -e "${GREEN}AI智能体系统已成功部署！${NC}"
    echo ""
    echo "服务访问地址:"
    echo "  前端管理界面: http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT"
    echo "  API服务: http://$(hostname -I | awk '{print $1}'):$API_PORT"
    echo "  LINE Bot服务: http://$(hostname -I | awk '{print $1}'):$LINE_PORT"
    echo ""
    echo "数据库信息:"
    echo "  MongoDB: mongodb://localhost:$MONGODB_PORT/$MONGODB_DATABASE"
    echo "  Redis: redis://localhost:$REDIS_PORT/$REDIS_DATABASE"
    echo ""
    echo "管理命令:"
    echo "  查看服务状态: cd $DEPLOY_PATH && pm2 status"
    echo "  查看日志: cd $DEPLOY_PATH && pm2 logs"
    echo "  重启服务: cd $DEPLOY_PATH && pm2 restart all"
    echo "  停止服务: cd $DEPLOY_PATH && pm2 stop all"
    echo ""
    echo "数据库初始化:"
    echo "  cd $DEPLOY_PATH/scripts && ./init-db.sh"
    echo ""
    log_warning "请确保:"
    echo "  1. MongoDB和Redis服务已启动"
    echo "  2. 防火墙已开放相应端口"
    echo "  3. 已配置正确的API密钥"
    echo "  4. 运行数据库初始化脚本"
}

# ==================== 主函数 ====================

# 执行完整部署
run_full_deployment() {
    echo -e "${BLUE}=== AI智能体系统远程部署 ===${NC}"
    echo "部署路径: $DEPLOY_PATH"
    echo "环境变量: $NODE_ENV"
    echo ""
    
    # 确认部署
    read -p "确认开始部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤（跳过代码克隆和环境变量文件生成）
    log_info "跳过环境变量文件生成，使用现有配置文件"
    install_dependencies
    build_project
    setup_mcp_service
    create_directories
    create_pm2_config
    create_db_init_script
    start_services
    verify_deployment
    show_deployment_summary
    
    log_success "部署完成！"
}

# 参数处理
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -r|--repo)
            GIT_REPO="$2"
            shift 2
            ;;
        -b|--branch)
            GIT_BRANCH="$2"
            shift 2
            ;;
        -p|--path)
            DEPLOY_PATH="$2"
            shift 2
            ;;
        -e|--env)
            NODE_ENV="$2"
            shift 2
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --line-port)
            LINE_PORT="$2"
            shift 2
            ;;
        --mongodb-port)
            MONGODB_PORT="$2"
            shift 2
            ;;
        --redis-port)
            REDIS_PORT="$2"
            shift 2
            ;;
        --mongodb-db)
            MONGODB_DATABASE="$2"
            shift 2
            ;;
        --redis-db)
            REDIS_DATABASE="$2"
            shift 2
            ;;
        --check-only)
            run_environment_check
            exit $?
            ;;
        --skip-check)
            SKIP_CHECK=true
            shift
            ;;
        --skip-port-check)
            SKIP_PORT_CHECK=true
            shift
            ;;
        *)
            log_error "未知选项: $1"
            echo "使用 -h 查看帮助信息"
            exit 1
            ;;
    esac
done

# 加载配置文件
load_config

# 主执行逻辑
main() {
    # 跳过环境检查（假设远程服务器环境已配置完毕）
    log_info "跳过环境检查，假设远程服务器环境已配置完毕"
    echo ""
    
    # 验证配置
    if ! validate_config; then
        log_error "配置验证失败，请检查配置文件或命令行参数"
        exit 1
    fi
    
    # 显示配置信息
    show_config_summary
    
    # 执行部署
    run_full_deployment
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"