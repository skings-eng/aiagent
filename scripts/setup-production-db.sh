#!/bin/bash

# MongoDB生产环境数据库初始化脚本
# 用于在生产服务器上创建与本地相同的数据库结构

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示使用说明
show_usage() {
    echo "MongoDB生产环境数据库初始化脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --host HOST        MongoDB主机地址 (默认: localhost)"
    echo "  -p, --port PORT        MongoDB端口 (默认: 27017)"
    echo "  -u, --username USER    MongoDB用户名"
    echo "  -P, --password PASS    MongoDB密码"
    echo "  -d, --database DB      数据库名称 (默认: aiagent)"
    echo "  --auth-db AUTH_DB      认证数据库 (默认: admin)"
    echo "  --ssl                  使用SSL连接"
    echo "  --help                 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  # 本地MongoDB (无认证)"
    echo "  $0"
    echo ""
    echo "  # 远程MongoDB (带认证)"
    echo "  $0 -h mongodb.example.com -u admin -P password123"
    echo ""
    echo "  # 使用SSL连接"
    echo "  $0 -h mongodb.example.com -u admin -P password123 --ssl"
    echo ""
}

# 默认参数
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_USERNAME=""
MONGO_PASSWORD=""
MONGO_DATABASE="aiagent"
MONGO_AUTH_DB="admin"
USE_SSL=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            MONGO_HOST="$2"
            shift 2
            ;;
        -p|--port)
            MONGO_PORT="$2"
            shift 2
            ;;
        -u|--username)
            MONGO_USERNAME="$2"
            shift 2
            ;;
        -P|--password)
            MONGO_PASSWORD="$2"
            shift 2
            ;;
        -d|--database)
            MONGO_DATABASE="$2"
            shift 2
            ;;
        --auth-db)
            MONGO_AUTH_DB="$2"
            shift 2
            ;;
        --ssl)
            USE_SSL=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 检查mongosh是否安装
if ! command -v mongosh &> /dev/null; then
    print_error "mongosh 未安装。请先安装 MongoDB Shell。"
    print_info "安装方法: https://docs.mongodb.com/mongodb-shell/install/"
    exit 1
fi

# 检查初始化脚本是否存在
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SCRIPT="$SCRIPT_DIR/production-mongo-init.js"

if [[ ! -f "$INIT_SCRIPT" ]]; then
    print_error "初始化脚本不存在: $INIT_SCRIPT"
    exit 1
fi

# 构建MongoDB连接字符串
CONNECTION_STRING="mongodb://"

if [[ -n "$MONGO_USERNAME" && -n "$MONGO_PASSWORD" ]]; then
    CONNECTION_STRING="${CONNECTION_STRING}${MONGO_USERNAME}:${MONGO_PASSWORD}@"
fi

CONNECTION_STRING="${CONNECTION_STRING}${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}"

if [[ -n "$MONGO_USERNAME" ]]; then
    CONNECTION_STRING="${CONNECTION_STRING}?authSource=${MONGO_AUTH_DB}"
fi

if [[ "$USE_SSL" == true ]]; then
    if [[ "$CONNECTION_STRING" == *"?"* ]]; then
        CONNECTION_STRING="${CONNECTION_STRING}&ssl=true"
    else
        CONNECTION_STRING="${CONNECTION_STRING}?ssl=true"
    fi
fi

# 显示连接信息
print_info "MongoDB连接信息:"
echo "  主机: $MONGO_HOST"
echo "  端口: $MONGO_PORT"
echo "  数据库: $MONGO_DATABASE"
if [[ -n "$MONGO_USERNAME" ]]; then
    echo "  用户名: $MONGO_USERNAME"
    echo "  认证数据库: $MONGO_AUTH_DB"
fi
echo "  SSL: $USE_SSL"
echo ""

# 确认执行
read -p "是否继续执行数据库初始化? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "操作已取消"
    exit 0
fi

print_info "开始执行MongoDB数据库初始化..."
print_info "初始化脚本: $INIT_SCRIPT"
echo ""

# 执行初始化脚本
if mongosh "$CONNECTION_STRING" < "$INIT_SCRIPT"; then
    echo ""
    print_success "MongoDB数据库初始化完成！"
    echo ""
    print_info "默认管理员账户:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo "  请登录后立即修改默认密码！"
    echo ""
    print_info "数据库连接信息:"
    echo "  数据库: $MONGO_DATABASE"
    echo "  主机: $MONGO_HOST:$MONGO_PORT"
    echo ""
else
    print_error "MongoDB数据库初始化失败！"
    print_info "请检查:"
    echo "  1. MongoDB服务是否正在运行"
    echo "  2. 连接参数是否正确"
    echo "  3. 用户是否有足够的权限"
    echo "  4. 网络连接是否正常"
    exit 1
fi