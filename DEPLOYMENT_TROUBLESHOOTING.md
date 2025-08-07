# 公网部署故障排除指南

## 问题描述
用户反馈公网部署的网站 `http://172.237.20.24:3000/home` 无法访问。

## 常见问题分析

### 1. 端口配置不一致问题

**问题**: 前端代理配置与后端API端口不匹配
- 前端 `vite.config.ts` 中代理指向 `localhost:8001`
- 后端API默认端口是 `8000`
- 启动脚本显示API在 `3001` 端口

**解决方案**:
```bash
# 1. 检查后端API实际运行端口
pm2 status
pm2 logs aiagent-api

# 2. 修改前端代理配置
# 编辑 frontend/b-end/vite.config.ts
# 将 target: 'http://localhost:8001' 改为正确的API端口

# 3. 或者修改后端API端口配置
# 编辑 backend/api/.env
# 设置 PORT=8001
```

### 2. 防火墙和安全组配置

**检查云服务器防火墙**:
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw allow 3002

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

**检查云服务商安全组**:
- 阿里云: 在ECS控制台配置安全组规则
- 腾讯云: 在CVM控制台配置安全组
- AWS: 在EC2控制台配置Security Groups
- 确保开放端口: 3000 (前端), 3001 (API), 3002 (LINE Bot)

### 3. 服务启动状态检查

```bash
# 检查所有服务状态
pm2 status

# 检查具体服务日志
pm2 logs aiagent-api
pm2 logs aiagent-frontend
pm2 logs aiagent-line
pm2 logs aiagent-mcp

# 检查端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001
netstat -tlnp | grep :3002

# 或使用 ss 命令
ss -tlnp | grep :3000
```

### 4. 网络连接测试

```bash
# 在服务器上测试本地连接
curl http://localhost:3000
curl http://localhost:3001/health
curl http://localhost:3002/health

# 测试外网访问
curl http://172.237.20.24:3000
curl http://172.237.20.24:3001/health
```

### 5. 前端构建和部署问题

**检查前端构建**:
```bash
# 重新构建前端
cd frontend/b-end
npm run build

# 检查构建文件
ls -la dist/

# 使用PM2重新部署
pm2 delete aiagent-frontend
pm2 serve dist 3000 --name "aiagent-frontend" --spa
```

### 6. 环境变量配置

**检查API环境变量**:
```bash
# 查看API环境变量
cat backend/api/.env

# 确保包含必要配置
PORT=3001  # 或者 8001，与前端代理一致
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/japan-stock-ai
REDIS_HOST=localhost
GOOGLE_AI_API_KEY=你的API密钥
```

### 7. 数据库连接问题

```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 检查Redis状态
sudo systemctl status redis

# 测试数据库连接
node backend/api/test-db-connection.js
```

### 8. 完整重启流程

```bash
# 1. 停止所有服务
./stop-services.sh

# 2. 清理PM2进程
pm2 delete all
pm2 kill

# 3. 重新构建项目
npm run build:all

# 4. 重新启动服务
./start-services.sh --with-frontend

# 5. 检查状态
pm2 status
pm2 logs
```

## 具体修复步骤

### 步骤1: 统一端口配置

1. **修改后端API端口**:
```bash
# 编辑 backend/api/.env
echo "PORT=8001" >> backend/api/.env
```

2. **或者修改前端代理配置**:
```typescript
// frontend/b-end/vite.config.ts
server: {
  port: 3000,
  host: '0.0.0.0',  // 允许外网访问
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // 改为实际API端口
      changeOrigin: true,
      secure: false,
    },
  },
},
```

### 步骤2: 配置外网访问

1. **修改前端配置允许外网访问**:
```typescript
// frontend/b-end/vite.config.ts
server: {
  port: 3000,
  host: '0.0.0.0',  // 重要：允许外网访问
  // ...
}
```

2. **修改PM2启动配置**:
```bash
# 使用正确的host配置启动前端
pm2 serve frontend/b-end/dist 3000 --name "aiagent-frontend" --spa -- --host 0.0.0.0
```

### 步骤3: 生产环境优化

1. **使用Nginx反向代理** (推荐):
```nginx
# /etc/nginx/sites-available/aiagent
server {
    listen 80;
    server_name 172.237.20.24;
    
    # 前端静态文件
    location / {
        root /path/to/aiagent/frontend/b-end/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **启用Nginx配置**:
```bash
sudo ln -s /etc/nginx/sites-available/aiagent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 快速诊断命令

```bash
#!/bin/bash
echo "=== 智能投资助手部署诊断 ==="
echo
echo "1. 服务状态:"
pm2 status
echo
echo "2. 端口监听:"
netstat -tlnp | grep -E ':(3000|3001|3002)'
echo
echo "3. 防火墙状态:"
sudo ufw status 2>/dev/null || echo "UFW未安装或未启用"
echo
echo "4. 本地连接测试:"
curl -s -o /dev/null -w "前端(3000): %{http_code}\n" http://localhost:3000 || echo "前端(3000): 连接失败"
curl -s -o /dev/null -w "API(3001): %{http_code}\n" http://localhost:3001/health || echo "API(3001): 连接失败"
echo
echo "5. 外网连接测试:"
curl -s -o /dev/null -w "外网前端: %{http_code}\n" http://172.237.20.24:3000 || echo "外网前端: 连接失败"
echo
echo "6. 进程信息:"
ps aux | grep -E '(node|pm2)' | grep -v grep
```

将此脚本保存为 `diagnose.sh` 并运行：
```bash
chmod +x diagnose.sh
./diagnose.sh
```

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
1. 诊断脚本的完整输出
2. `pm2 logs` 的错误日志
3. 云服务商和服务器配置信息
4. 网络环境描述

---

**注意**: 在生产环境中，建议使用Nginx作为反向代理，而不是直接暴露Node.js服务端口。