# Ubuntu 服务器部署故障排除指南

## 🚨 最新修复 (推荐优先尝试)

如果您遇到 PM2 启动失败或构建问题，请先尝试以下最新修复：

```bash
# 1. 拉取最新代码（包含最新修复）
cd /home/ubuntu/aiagent
git pull origin main

# 2. 完全清理环境
rm -rf node_modules backend/*/node_modules frontend/*/node_modules shared/node_modules
rm -rf backend/*/dist frontend/*/dist shared/dist

# 3. 重新部署
./deploy-production.sh
```

**最新修复包括：**
- ✅ 修复了 PM2 配置中的路径问题 ⭐ **关键修复**
- ✅ 添加了 Node.js 版本检查
- ✅ 添加了构建前清理步骤
- ✅ 修复了 MCP 服务器配置
- ✅ 修复了 `backend/api/package.json` 中 main 字段指向错误
- ✅ 增强了 shared 模块依赖链接处理
- ✅ 添加了详细的构建诊断日志

## 已修复的问题

1. **PM2项目路径配置错误** ⭐ **关键修复**
   - 问题：`ecosystem.config.js` 中 `cwd` 路径设置为 `/home/ubuntu/aiagent`，但Ubuntu服务器实际路径为 `/root/aiagent`
   - 修复：将所有服务的 `cwd` 路径从 `/home/ubuntu/aiagent` 修改为 `/root/aiagent`
   - 影响：解决PM2 "Script not found" 错误，确保所有服务能正确启动

2. **backend/api/package.json main字段指向错误**
   - 问题：`main` 字段指向 `dist/index.js`，但实际入口文件是 `dist/server.js`
   - 修复：将 `main` 字段修改为 `dist/server.js`
   - 影响：确保PM2能正确找到API服务的入口文件

3. **Shared模块依赖链接处理增强**
   - 问题：Ubuntu服务器上 `shared` 模块可能未正确链接
   - 修复：在构建前增加 `npm install` 步骤重新链接依赖
   - 影响：确保本地文件依赖正确解析

4. **详细构建诊断日志**
   - 问题：构建失败时缺乏足够的诊断信息
   - 修复：添加环境信息输出和TypeScript编译错误检查
   - 影响：便于快速定位构建问题

## 问题概述

如果在Ubuntu服务器上遇到以下PM2错误：
- `[PM2][ERROR] Error: Script not found`
- 无法找到 `aiagent-api`、`aiagent-frontend`、`aiagent-line` 进程
- 脚本路径错误，如 `/home/ubuntu/aiagent/backend/api/dist/server.js` 不存在

## 解决方案

### 第一步：拉取最新代码

```bash
cd /root/aiagent
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
# 检查版本
node --version  # 需要 v18+
npm --version   # 需要 v8+

# 如果版本低于18，需要升级
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
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
sudo chown -R $USER:$USER /root/aiagent
chmod -R 755 /root/aiagent
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

### 问题5：构建文件冲突问题

```bash
# 手动清理旧的构建文件
rm -rf backend/api/dist
rm -rf backend/line/dist
rm -rf frontend/b-end/dist
rm -rf shared/dist

# 清理node_modules（如果需要）
rm -rf node_modules
rm -rf backend/api/node_modules
rm -rf backend/line/node_modules
rm -rf frontend/b-end/node_modules
rm -rf shared/node_modules

# 重新安装和构建
npm install
npm run build
```

### 问题6：Shared模块依赖链接问题

```bash
# 检查shared模块是否正确构建
ls -la shared/dist/

# 重新构建shared模块
cd shared
npm install
npm run build
cd ..

# 重新链接依赖并构建后端服务
cd backend/api
npm install  # 重新安装以确保shared模块链接
npm run build
cd ../..

cd backend/line
npm install  # 重新安装以确保shared模块链接
npm run build
cd ../..

# 验证构建结果
ls -la backend/api/dist/server.js
ls -la backend/line/dist/index.js

# 检查package.json中的依赖配置
grep -r "@japan-stock-ai/shared" backend/*/package.json
grep -r "file:../../shared" backend/*/package.json

# 检查TypeScript编译错误
cd backend/api && npx tsc --noEmit
cd ../line && npx tsc --noEmit
```

### 问题7：PM2配置路径问题

```bash
# 检查PM2配置文件
cat ecosystem.config.js

# 验证脚本路径是否正确
ls -la backend/api/dist/server.js
ls -la backend/line/dist/index.js
ls -la backend/api/mcp-yfinance-server/start_mcp.sh

# 确保MCP脚本可执行
chmod +x backend/api/mcp-yfinance-server/start_mcp.sh
```

### 问题7：环境变量配置

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
   cd /root
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