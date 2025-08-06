#!/bin/bash

# 数据库初始化脚本
# 用于验证MongoDB连接并创建必要的数据库和集合

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

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🗄️  数据库初始化脚本"
echo "==================="
echo

# 检查MongoDB服务状态
log_info "检查MongoDB服务状态..."
if ! systemctl is-active --quiet mongod; then
    log_warn "MongoDB服务未运行，正在启动..."
    sudo systemctl start mongod
    sleep 3
fi

if systemctl is-active --quiet mongod; then
    log_success "MongoDB服务正在运行"
else
    log_error "MongoDB服务启动失败"
    exit 1
fi

# 检查MongoDB连接
log_info "测试MongoDB连接..."
if mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    log_success "MongoDB连接成功"
else
    log_error "MongoDB连接失败"
    log_info "请检查MongoDB服务是否正常运行：sudo systemctl status mongod"
    exit 1
fi

# 创建数据库和基础集合
log_info "初始化数据库..."
mongosh --quiet --eval "
    use('japan-stock-ai');
    
    // 创建用户集合
    if (!db.getCollectionNames().includes('users')) {
        db.createCollection('users');
        print('✓ 创建 users 集合');
    }
    
    // 创建设置集合
    if (!db.getCollectionNames().includes('settings')) {
        db.createCollection('settings');
        print('✓ 创建 settings 集合');
    }
    
    // 创建聊天记录集合
    if (!db.getCollectionNames().includes('chathistories')) {
        db.createCollection('chathistories');
        print('✓ 创建 chathistories 集合');
    }
    
    // 显示数据库信息
    print('\n📊 数据库信息:');
    print('数据库名称: ' + db.getName());
    print('集合列表: ' + db.getCollectionNames().join(', '));
"

log_success "数据库初始化完成！"
echo
log_info "📋 数据库信息:"
echo "  • 数据库名称: japan-stock-ai"
echo "  • 连接地址: mongodb://localhost:27017/japan-stock-ai"
echo "  • 服务状态: $(systemctl is-active mongod)"
echo
log_success "🎉 数据库已准备就绪，可以启动应用服务了！"