#!/bin/bash

# 修复远程服务器上的 OpenAI Organization 问题
# 此脚本需要在远程服务器上运行

echo "=== 修复 OpenAI Organization 问题 ==="
echo "问题：401 OpenAI-Organization header should match organization for API key"
echo "原因：环境变量中存在 OPENAI_ORG_ID，导致 OpenAI SDK 自动发送 organization header"
echo ""

# 显示当前环境变量状态
echo "检查当前 OPENAI_ORG_ID 环境变量状态："
if [ -n "$OPENAI_ORG_ID" ]; then
    echo "  当前值: $OPENAI_ORG_ID"
else
    echo "  当前未设置"
fi
echo ""

# 清理当前会话的环境变量
echo "1. 清理当前会话的环境变量..."
unset OPENAI_ORG_ID 2>/dev/null || true
echo "   ✓ 已清理当前会话"

# 检查并清理系统环境变量文件
echo "2. 检查并清理系统环境变量文件..."
if [ -f /etc/environment ]; then
    if grep -q "OPENAI_ORG_ID" /etc/environment 2>/dev/null; then
        echo "   发现 /etc/environment 中有 OPENAI_ORG_ID，正在清理..."
        sudo sed -i '/OPENAI_ORG_ID/d' /etc/environment 2>/dev/null || true
        echo "   ✓ 已清理 /etc/environment"
    else
        echo "   ✓ /etc/environment 中无 OPENAI_ORG_ID"
    fi
else
    echo "   ✓ /etc/environment 文件不存在"
fi

# 清理用户环境变量文件
echo "3. 检查并清理用户环境变量文件..."
for file in ~/.bashrc ~/.bash_profile ~/.zshrc ~/.profile; do
    if [ -f "$file" ]; then
        if grep -q "OPENAI_ORG_ID" "$file" 2>/dev/null; then
            echo "   发现 $file 中有 OPENAI_ORG_ID，正在清理..."
            sed -i '/OPENAI_ORG_ID/d' "$file" 2>/dev/null || true
            echo "   ✓ 已清理 $file"
        else
            echo "   ✓ $file 中无 OPENAI_ORG_ID"
        fi
    fi
done

# 清理项目环境变量文件
echo "4. 检查并清理项目环境变量文件..."
cd /root/aiagent
for env_file in .env .env.local .env.production backend/api/.env backend/.env-server; do
    if [ -f "$env_file" ]; then
        if grep -q "OPENAI_ORG_ID" "$env_file" 2>/dev/null; then
            echo "   发现 $env_file 中有 OPENAI_ORG_ID，正在清理..."
            sed -i '/OPENAI_ORG_ID/d' "$env_file" 2>/dev/null || true
            echo "   ✓ 已清理 $env_file"
        else
            echo "   ✓ $env_file 中无 OPENAI_ORG_ID"
        fi
    fi
done

# 清理 PM2 环境变量
echo "5. 清理 PM2 环境变量..."
pm2 delete all 2>/dev/null || true
echo "   ✓ 已停止所有 PM2 进程"

# 重新加载环境变量
echo "6. 重新加载环境变量..."
source ~/.bashrc 2>/dev/null || true
source ~/.profile 2>/dev/null || true
echo "   ✓ 已重新加载环境变量"

# 启动服务
echo "7. 启动服务..."
pm2 start ecosystem.config.js
pm2 save
echo "   ✓ 已启动 PM2 服务"

echo ""
echo "=== 修復完了 ==="
echo "10秒待ってからOpenAI API呼び出しをテストしてください..."
echo ""
echo "テスト方法："
echo "1. チャットページにアクセスしてメッセージを送信"
echo "2. PM2ログを確認: pm2 logs aiagent-api"
echo "3. まだ問題がある場合は、OpenAI APIキーが有効かどうか確認してください"
echo ""