#!/bin/bash

# 快速修复生产环境Gemini API配置脚本
# 解决部署脚本覆盖有效API密钥的问题

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 修复生产环境Gemini API配置"
echo "================================"

# 检查当前目录
if [[ ! -f "deploy-production.sh" ]]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 检查现有的API密钥
log_info "检查现有的API密钥配置..."

if [[ -f "backend/api/.env.production" ]]; then
    CURRENT_KEY=$(grep "^GOOGLE_API_KEY=" backend/api/.env.production | cut -d'=' -f2- | tr -d '"' 2>/dev/null || echo "")
    if [[ -z "$CURRENT_KEY" ]]; then
        CURRENT_KEY=$(grep "^GEMINI_API_KEY=" backend/api/.env.production | cut -d'=' -f2- | tr -d '"' 2>/dev/null || echo "")
    fi
    if [[ -z "$CURRENT_KEY" ]]; then
        CURRENT_KEY=$(grep "^GOOGLE_AI_API_KEY=" backend/api/.env.production | cut -d'=' -f2- | tr -d '"' 2>/dev/null || echo "")
    fi
    
    if [[ -n "$CURRENT_KEY" && "$CURRENT_KEY" != "your-gemini-api-key" ]]; then
        log_info "找到有效的API密钥 (长度: ${#CURRENT_KEY})"
        VALID_KEY_FOUND=true
    else
        log_warn "未找到有效的API密钥"
        VALID_KEY_FOUND=false
    fi
else
    log_warn "生产环境配置文件不存在"
    VALID_KEY_FOUND=false
fi

# 如果没有找到有效密钥，提示用户
if [[ "$VALID_KEY_FOUND" != "true" ]]; then
    log_error "未找到有效的Gemini API密钥！"
    echo "请执行以下步骤："
    echo "1. 获取有效的Google AI API密钥"
    echo "2. 手动编辑 backend/api/.env.production 文件"
    echo "3. 设置 GOOGLE_API_KEY=你的实际密钥"
    echo "4. 重启PM2服务: pm2 restart aiagent-api"
    exit 1
fi

# 重启API服务以应用配置
log_info "重启API服务以应用配置..."
if command -v pm2 &> /dev/null; then
    pm2 restart aiagent-api || {
        log_warn "PM2重启失败，尝试停止并启动服务"
        pm2 stop aiagent-api 2>/dev/null || true
        pm2 start ecosystem.config.js --only aiagent-api || {
            log_error "无法启动API服务，请检查PM2配置"
            exit 1
        }
    }
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    log_info "检查服务状态..."
    pm2 status aiagent-api
    
    # 检查最新日志
    log_info "检查最新日志..."
    pm2 logs aiagent-api --lines 10
else
    log_error "PM2未安装，请手动重启服务"
    exit 1
fi

log_info "✅ 修复完成！"
echo ""
echo "📋 后续步骤："
echo "1. 检查PM2日志确认没有API错误"
echo "2. 测试前端聊天功能"
echo "3. 如果仍有问题，检查Google AI API配额和密钥有效性"
echo ""
echo "🔍 调试命令："
echo "- 查看API日志: pm2 logs aiagent-api"
echo "- 检查服务状态: pm2 status"
echo "- 测试API密钥: node backend/api/test-gemini-production.js"