#!/bin/bash
set -e

echo "🔧 修复生产环境部署问题..."
echo "当前目录: $(pwd)"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 停止服务
echo "📛 停止现有服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 配置后端 API
echo "⚙️  配置后端 API..."
cd backend/api

# 备份原有配置
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 创建生产环境配置
cat > .env << EOF
PORT=8001
NODE_ENV=production
SERVER_HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/aiagent
REDIS_URL=redis://localhost:6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI API 密钥 (请根据实际情况配置)
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
EOF

echo "✅ 后端配置完成"

# 重新构建前端
echo "🏗️  重新构建前端..."
cd ../../frontend/b-end
npm run build
echo "✅ 前端构建完成"

# 配置防火墙
echo "🔥 配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
    echo "使用 UFW 配置防火墙..."
    sudo ufw allow 3000 2>/dev/null || echo "端口 3000 可能已开放"
    sudo ufw allow 8001 2>/dev/null || echo "端口 8001 可能已开放"
    sudo ufw reload 2>/dev/null || true
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "使用 firewalld 配置防火墙..."
    sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    sudo firewall-cmd --permanent --add-port=8001/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
else
    echo "⚠️  未检测到防火墙管理工具，请手动开放端口 3000 和 8001"
fi

# 启动服务
echo "🚀 启动服务..."
cd ../..

# 检查启动脚本是否存在
if [ -f "start-services.sh" ]; then
    chmod +x start-services.sh
    ./start-services.sh
else
    echo "❌ 未找到 start-services.sh，手动启动服务..."
    
    # 手动启动服务
    echo "启动后端 API..."
    cd backend/api
    pm2 start dist/index.js --name "aiagent-api" --env production
    
    echo "启动前端服务..."
    cd ../../frontend/b-end
    pm2 serve dist 3000 --name "aiagent-frontend" --spa
    
    cd ../..
fi

# 保存 PM2 配置
pm2 save

echo ""
echo "✅ 修复完成！"
echo ""
echo "📊 服务状态:"
pm2 status
echo ""
echo "🌐 访问地址:"
echo "  前端: http://$(hostname -I | awk '{print $1}'):3000"
echo "  API:  http://$(hostname -I | awk '{print $1}'):8001"
echo ""
echo "🔍 测试命令:"
echo "  curl http://$(hostname -I | awk '{print $1}'):8001/health"
echo "  curl http://$(hostname -I | awk '{print $1}'):3000/"
echo ""
echo "📝 如果仍有问题，请检查:"
echo "  1. pm2 logs aiagent-api"
echo "  2. pm2 logs aiagent-frontend"
echo "  3. 浏览器开发者工具的网络和控制台错误"
echo "  4. 确保 MongoDB 和 Redis 服务正在运行"