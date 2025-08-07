# Ubuntu 服务器部署故障排除指南

## 问题概述

如果在Ubuntu服务器上遇到以下PM2错误：
- `[PM2][ERROR] Error: Script not found`
- 无法找到 `aiagent-api`、`aiagent-frontend`、`aiagent-line` 进程
- 脚本路径错误，如 `/home/ubuntu/aiagent/backend/api/dist/server.js` 不存在

## 解决方案

### 第一步：拉取最新代码

```bash
cd /home/ubuntu/aiagent
git pull origin main
```

### 第二步：停止现有服务

```bash
# 停止所有PM2进程
pm2 stop all
pm2 delete all

# 清理端口（如果需要）
sudo fuser -k 8001/tcp || true
sudo fuser -k 8002/tcp || true
sudo fuser -k 4173/tcp || true
```

### 第三步：重新运行部署脚本

```bash
# 确保脚本可执行
chmod +x deploy-production.sh

# 运行部署脚本
./deploy-production.sh
```

### 第四步：验证构建结果

```bash
# 检查构建文件是否存在
echo "=== 检查API构建 ==="
ls -la backend/api/dist/server.js

echo "=== 检查LINE构建 ==="
ls -la backend/line/dist/index.js

echo "=== 检查前端构建 ==="
ls -la frontend/b-end/dist/index.html

echo "=== 检查MCP服务器 ==="
ls -la backend/api/mcp-yfinance-server/venv/
ls -la backend/api/mcp-yfinance-server/start_mcp.sh
```

### 第五步：检查服务状态

```bash
# 查看PM2状态
pm2 status

# 查看服务日志
pm2 logs

# 查看特定服务日志
pm2 logs aiagent-api
pm2 logs aiagent-line
pm2 logs aiagent-frontend
pm2 logs aiagent-mcp
```

## 手动构建步骤（如果自动构建失败）

### 1. 构建共享模块

```bash
cd shared
npm install
npm run build
cd ..
```

### 2. 构建后端API

```bash
cd backend/api
npm install
npm run build
cd ../..
```

### 3. 构建后端LINE服务

```bash
cd backend/line
npm install
npm run build
cd ../..
```

### 4. 构建前端

```bash
cd frontend/b-end
npm install
npm run build
cd ../..
```

### 5. 设置MCP服务器

```bash
cd backend/api/mcp-yfinance-server

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# 确保启动脚本可执行
chmod +x start_mcp.sh

cd ../../..
```

## 常见问题和解决方案

### 问题1：Node.js版本不兼容

```bash
# 检查Node.js版本
node --version

# 如果版本低于18，需要升级
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 问题2：Python3不可用

```bash
# 安装Python3和pip
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

### 问题3：权限问题

```bash
# 确保用户对项目目录有完整权限
sudo chown -R $USER:$USER /home/ubuntu/aiagent
chmod -R 755 /home/ubuntu/aiagent
```

### 问题4：端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :8001
sudo netstat -tlnp | grep :8002
sudo netstat -tlnp | grep :4173

# 杀死占用进程
sudo fuser -k 8001/tcp
sudo fuser -k 8002/tcp
sudo fuser -k 4173/tcp
```

### 问题5：环境变量配置

```bash
# 检查环境变量文件
ls -la backend/api/.env.production
ls -la backend/line/.env.production

# 如果文件不存在，部署脚本会自动创建
# 但需要手动配置GEMINI_API_KEY
nano backend/api/.env.production
```

## 验证部署成功

### 1. 检查所有服务运行状态

```bash
pm2 status
```

应该看到4个服务都在运行：
- aiagent-api
- aiagent-line
- aiagent-frontend
- aiagent-mcp

### 2. 测试API端点

```bash
# 测试API健康检查
curl http://localhost:8001/api/v1/health

# 测试前端
curl http://localhost:4173
```

### 3. 检查日志无错误

```bash
pm2 logs --lines 50
```

## 如果问题仍然存在

1. 收集详细日志信息：
   ```bash
   pm2 logs > pm2_logs.txt
   ls -la backend/api/dist/ > build_status.txt
   ls -la backend/line/dist/ >> build_status.txt
   ls -la frontend/b-end/dist/ >> build_status.txt
   ```

2. 检查系统资源：
   ```bash
   df -h  # 磁盘空间
   free -h  # 内存使用
   ```

3. 重新克隆项目（最后手段）：
   ```bash
   cd /home/ubuntu
   mv aiagent aiagent_backup
   git clone https://github.com/skings-eng/aiagent.git
   cd aiagent
   ./deploy-production.sh
   ```

## 联系支持

如果按照以上步骤仍无法解决问题，请提供：
- PM2日志输出
- 构建状态信息
- 系统环境信息（Node.js版本、Python版本等）
- 错误截图或完整错误信息