#!/bin/bash

# 强制更新PM2配置脚本
# 解决PM2仍然使用旧路径的问题

set -e

echo "=== 强制更新PM2配置 ==="
echo "当前时间: $(date)"
echo "当前目录: $(pwd)"
echo "当前用户: $(whoami)"

# 1. 停止并删除所有PM2进程
echo "\n=== 步骤1: 停止所有PM2进程 ==="
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

# 2. 清理PM2缓存和日志
echo "\n=== 步骤2: 清理PM2缓存 ==="
rm -rf ~/.pm2/logs/* || true
rm -rf ~/.pm2/pids/* || true
rm -rf ./logs/* || true
mkdir -p logs

# 3. 验证当前ecosystem.config.js配置
echo "\n=== 步骤3: 验证配置文件 ==="
echo "检查ecosystem.config.js是否存在:"
ls -la ecosystem.config.js

echo "\n检查配置文件中的路径设置:"
grep -n "cwd:" ecosystem.config.js || echo "未找到cwd配置"
grep -n "/root/aiagent" ecosystem.config.js || echo "未找到/root/aiagent路径"
grep -n "/home/ubuntu" ecosystem.config.js && echo "⚠️  警告：仍然包含旧路径!" || echo "✅ 未发现旧路径"

# 4. 设置环境变量
echo "\n=== 步骤4: 设置环境变量 ==="
export PROJECT_ROOT="/root/aiagent"
echo "PROJECT_ROOT设置为: $PROJECT_ROOT"

# 5. 验证构建文件存在
echo "\n=== 步骤5: 验证构建文件 ==="
echo "检查API构建文件:"
if [ -f "backend/api/dist/server.js" ]; then
    echo "✅ backend/api/dist/server.js 存在"
    ls -la backend/api/dist/server.js
else
    echo "❌ backend/api/dist/server.js 不存在"
    echo "尝试构建API..."
    cd backend/api
    npm install
    npm run build
    cd ../..
fi

echo "\n检查LINE构建文件:"
if [ -f "backend/line/dist/index.js" ]; then
    echo "✅ backend/line/dist/index.js 存在"
    ls -la backend/line/dist/index.js
else
    echo "❌ backend/line/dist/index.js 不存在"
    echo "尝试构建LINE..."
    cd backend/line
    npm install
    npm run build
    cd ../..
fi

echo "\n检查前端构建文件:"
if [ -f "frontend/b-end/dist/index.html" ]; then
    echo "✅ frontend/b-end/dist/index.html 存在"
    ls -la frontend/b-end/dist/index.html
else
    echo "❌ frontend/b-end/dist/index.html 不存在"
    echo "尝试构建前端..."
    cd frontend/b-end
    npm install
    npm run build
    cd ../..
fi

echo "\n检查MCP启动脚本:"
if [ -f "backend/api/mcp-yfinance-server/start_mcp.sh" ]; then
    echo "✅ MCP启动脚本存在"
    chmod +x backend/api/mcp-yfinance-server/start_mcp.sh
    ls -la backend/api/mcp-yfinance-server/start_mcp.sh
else
    echo "❌ MCP启动脚本不存在"
fi

# 6. 使用绝对路径启动PM2
echo "\n=== 步骤6: 使用绝对路径启动PM2 ==="
echo "当前工作目录: $(pwd)"
echo "绝对路径: $(realpath .)"

# 创建临时配置文件，使用绝对路径
echo "创建临时配置文件..."
cat > ecosystem.temp.config.js << 'EOF'
const path = require('path');
const projectRoot = process.cwd();

module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: path.join(projectRoot, 'backend/api/dist/server.js'),
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        PORT: 8001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: path.join(projectRoot, 'logs/api-error.log'),
      out_file: path.join(projectRoot, 'logs/api-out.log'),
      log_file: path.join(projectRoot, 'logs/api-combined.log'),
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-line',
      script: path.join(projectRoot, 'backend/line/dist/index.js'),
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        PORT: 8002
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: path.join(projectRoot, 'logs/line-error.log'),
      out_file: path.join(projectRoot, 'logs/line-out.log'),
      log_file: path.join(projectRoot, 'logs/line-combined.log'),
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: path.join(projectRoot, 'frontend/b-end'),
      env: {
        NODE_ENV: 'production',
        PORT: 4173
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: path.join(projectRoot, 'logs/frontend-error.log'),
      out_file: path.join(projectRoot, 'logs/frontend-out.log'),
      log_file: path.join(projectRoot, 'logs/frontend-combined.log'),
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-mcp',
      script: path.join(projectRoot, 'backend/api/mcp-yfinance-server/start_mcp.sh'),
      cwd: projectRoot,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: path.join(projectRoot, 'logs/mcp-error.log'),
      out_file: path.join(projectRoot, 'logs/mcp-out.log'),
      log_file: path.join(projectRoot, 'logs/mcp-combined.log'),
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

echo "\n=== 步骤7: 启动PM2服务 ==="
echo "使用临时配置文件启动PM2..."
pm2 start ecosystem.temp.config.js

# 等待服务启动
echo "\n等待服务启动..."
sleep 5

# 检查服务状态
echo "\n=== 步骤8: 检查服务状态 ==="
pm2 status

echo "\n=== 步骤9: 检查服务日志 ==="
pm2 logs --lines 10

echo "\n=== PM2配置强制更新完成 ==="
echo "如果服务正常运行，可以删除临时配置文件:"
echo "rm ecosystem.temp.config.js"

echo "\n如果仍有问题，请检查:"
echo "1. 确保在正确的目录 (/root/aiagent) 运行此脚本"
echo "2. 确保所有构建文件都存在"
echo "3. 检查文件权限"
echo "4. 查看详细日志: pm2 logs"