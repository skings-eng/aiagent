#!/bin/bash

# Ubuntu服务器构建问题诊断脚本
# 用于诊断PM2脚本文件不存在的问题

set -e

echo "=== AI Agent 构建问题诊断脚本 ==="
echo "时间: $(date)"
echo "用户: $(whoami)"
echo "当前目录: $(pwd)"
echo ""

# 检查基本环境
echo "=== 1. 环境检查 ==="
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"
echo "TypeScript版本: $(npx tsc --version 2>/dev/null || echo '未安装')"
echo "PM2版本: $(pm2 --version 2>/dev/null || echo '未安装')"
echo ""

# 检查项目结构
echo "=== 2. 项目结构检查 ==="
echo "项目根目录内容:"
ls -la
echo ""

echo "backend目录结构:"
ls -la backend/ 2>/dev/null || echo "backend目录不存在"
echo ""

echo "backend/api目录结构:"
ls -la backend/api/ 2>/dev/null || echo "backend/api目录不存在"
echo ""

echo "backend/line目录结构:"
ls -la backend/line/ 2>/dev/null || echo "backend/line目录不存在"
echo ""

# 检查dist目录
echo "=== 3. 构建输出检查 ==="
echo "backend/api/dist目录:"
if [ -d "backend/api/dist" ]; then
    ls -la backend/api/dist/
    echo "server.js文件详情:"
    ls -la backend/api/dist/server.js 2>/dev/null || echo "server.js不存在"
else
    echo "backend/api/dist目录不存在"
fi
echo ""

echo "backend/line/dist目录:"
if [ -d "backend/line/dist" ]; then
    ls -la backend/line/dist/
    echo "index.js文件详情:"
    ls -la backend/line/dist/index.js 2>/dev/null || echo "index.js不存在"
else
    echo "backend/line/dist目录不存在"
fi
echo ""

# 检查package.json配置
echo "=== 4. package.json配置检查 ==="
echo "backend/api/package.json的main和scripts:"
if [ -f "backend/api/package.json" ]; then
    echo "main字段: $(grep '"main"' backend/api/package.json)"
    echo "start脚本: $(grep '"start"' backend/api/package.json)"
    echo "build脚本: $(grep '"build"' backend/api/package.json)"
else
    echo "backend/api/package.json不存在"
fi
echo ""

echo "backend/line/package.json的main和scripts:"
if [ -f "backend/line/package.json" ]; then
    echo "main字段: $(grep '"main"' backend/line/package.json)"
    echo "start脚本: $(grep '"start"' backend/line/package.json)"
    echo "build脚本: $(grep '"build"' backend/line/package.json)"
else
    echo "backend/line/package.json不存在"
fi
echo ""

# 检查shared模块
echo "=== 5. Shared模块检查 ==="
echo "shared目录结构:"
ls -la shared/ 2>/dev/null || echo "shared目录不存在"
echo ""

echo "shared/dist目录:"
if [ -d "shared/dist" ]; then
    ls -la shared/dist/
else
    echo "shared/dist目录不存在"
fi
echo ""

# 检查node_modules
echo "=== 6. 依赖检查 ==="
echo "backend/api/node_modules存在: $([ -d 'backend/api/node_modules' ] && echo '是' || echo '否')"
echo "backend/line/node_modules存在: $([ -d 'backend/line/node_modules' ] && echo '是' || echo '否')"
echo "shared/node_modules存在: $([ -d 'shared/node_modules' ] && echo '是' || echo '否')"
echo ""

# 检查TypeScript配置
echo "=== 7. TypeScript配置检查 ==="
echo "backend/api/tsconfig.json存在: $([ -f 'backend/api/tsconfig.json' ] && echo '是' || echo '否')"
echo "backend/line/tsconfig.json存在: $([ -f 'backend/line/tsconfig.json' ] && echo '是' || echo '否')"
echo ""

# 尝试手动构建测试
echo "=== 8. 手动构建测试 ==="
echo "测试shared模块构建:"
cd shared
if npm run build 2>&1; then
    echo "✅ shared模块构建成功"
else
    echo "❌ shared模块构建失败"
fi
cd ..
echo ""

echo "测试backend/api构建:"
cd backend/api
if npm run build 2>&1; then
    echo "✅ backend/api构建成功"
    echo "构建后的文件:"
    ls -la dist/ 2>/dev/null || echo "dist目录仍不存在"
else
    echo "❌ backend/api构建失败"
fi
cd ../..
echo ""

echo "测试backend/line构建:"
cd backend/line
if npm run build 2>&1; then
    echo "✅ backend/line构建成功"
    echo "构建后的文件:"
    ls -la dist/ 2>/dev/null || echo "dist目录仍不存在"
else
    echo "❌ backend/line构建失败"
fi
cd ../..
echo ""

# 检查PM2配置
echo "=== 9. PM2配置检查 ==="
if [ -f "ecosystem.config.js" ]; then
    echo "PM2配置文件存在"
    echo "API服务配置:"
    grep -A 5 "aiagent-api" ecosystem.config.js
    echo "LINE服务配置:"
    grep -A 5 "aiagent-line" ecosystem.config.js
else
    echo "ecosystem.config.js不存在"
fi
echo ""

echo "=== 诊断完成 ==="
echo "请将此诊断结果发送给开发团队进行进一步分析。"