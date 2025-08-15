#!/bin/bash

# 修复远程服务器上的 OpenAI Organization 问题
# 此脚本需要在远程服务器上运行

echo "=== 修复 OpenAI Organization 问题 ==="

# 清理环境变量
echo "清理 OPENAI_ORG_ID 环境变量..."
unset OPENAI_ORG_ID 2>/dev/null || true

# 检查并清理可能的系统环境变量文件
echo "检查系统环境变量文件..."
if [ -f /etc/environment ]; then
    sudo sed -i '/OPENAI_ORG_ID/d' /etc/environment 2>/dev/null || true
fi

# 清理用户环境变量文件
for file in ~/.bashrc ~/.bash_profile ~/.zshrc ~/.profile; do
    if [ -f "$file" ]; then
        sed -i '/OPENAI_ORG_ID/d' "$file" 2>/dev/null || true
    fi
done

# 重启 PM2 服务
echo "重启 PM2 服务..."
cd /root/aiagent
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "修复完成！请测试 OpenAI API 调用是否正常。"
echo "如果问题仍然存在，请检查服务器的其他环境变量配置文件。"