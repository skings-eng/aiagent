# 前端API配置修复指南

## 问题描述
用户在Ubuntu服务器上访问 `http://172.237.20.24:3000/gemini` 时，前端发送的API请求仍然指向 `http://localhost:8001`，导致Gemini Key测试和保存失败。

## 问题原因
1. 前端在远程服务器上可能没有正确检测到生产环境
2. 浏览器缓存了旧的API配置
3. 前端服务没有使用正确的环境变量

## 解决方案

### 方案1：使用自动修复脚本（推荐）
在Ubuntu服务器上运行以下命令：
```bash
# 下载并运行修复脚本
wget https://raw.githubusercontent.com/your-repo/aiagent/main/fix-frontend-api-config.sh
chmod +x fix-frontend-api-config.sh
./fix-frontend-api-config.sh
```

### 方案2：手动修复

#### 步骤1：停止现有前端服务
```bash
pm2 stop aiagent-frontend
pm2 delete aiagent-frontend
```

#### 步骤2：配置环境变量
```bash
cd frontend/b-end
cat > .env << EOF
VITE_API_BASE_URL=http://172.237.20.24:8001
VITE_NODE_ENV=production
VITE_SERVER_IP=172.237.20.24
EOF
```

#### 步骤3：重新构建前端
```bash
npm install
npm run build
```

#### 步骤4：启动前端服务
```bash
pm2 start --name "aiagent-frontend" npm -- run preview -- --port 3000 --host 0.0.0.0
pm2 save
```

### 方案3：快速测试修复
如果只是想快速测试，可以直接修改前端代码：

1. 编辑 `frontend/b-end/src/services/api.ts`
2. 将 `API_BASE_URL` 硬编码为：
```javascript
const API_BASE_URL = 'http://172.237.20.24:8001';
```
3. 重新构建并启动前端

## 验证修复

### 1. 检查前端服务状态
```bash
pm2 list
pm2 logs aiagent-frontend --lines 20
```

### 2. 测试前端访问
```bash
curl http://172.237.20.24:3000
```

### 3. 检查API配置
打开浏览器开发者工具，访问 `http://172.237.20.24:3000/gemini`，在Console中应该看到：
```
🔧 API Configuration: {
  hostname: "172.237.20.24",
  isDevelopment: false,
  API_BASE_URL: "http://172.237.20.24:8001",
  envVar: "http://172.237.20.24:8001"
}
```

### 4. 测试Gemini API
在Gemini配置页面测试API Key，Network标签中应该看到请求发送到：
`http://172.237.20.24:8001/api/v1/ai-models/gemini/test`

## 故障排除

### 如果API请求仍然指向localhost
1. 清除浏览器缓存和Cookie
2. 使用无痕模式访问
3. 检查 `.env` 文件是否正确创建
4. 确认前端重新构建成功

### 如果前端无法访问
1. 检查防火墙设置：`sudo ufw status`
2. 确认端口3000已开放：`sudo ufw allow 3000`
3. 检查PM2服务状态：`pm2 list`

### 如果API请求失败
1. 确认后端API服务运行正常：`curl http://172.237.20.24:8001/api/v1/health`
2. 检查CORS配置是否包含前端地址
3. 查看后端日志：`pm2 logs aiagent-api --lines 50`

## 重要提示
- 确保后端API服务运行在8001端口
- 确保CORS配置包含 `http://172.237.20.24:3000`
- 修复后需要清除浏览器缓存
- 建议使用HTTPS在生产环境中