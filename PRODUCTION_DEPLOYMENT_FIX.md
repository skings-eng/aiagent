# 生产环境部署修复指南

## 问题分析

您遇到的问题是前端页面显示"読み込み中..."（加载中），这是因为前端无法连接到后端API服务导致的。

### 根本原因
1. **API配置问题**: 前端原本硬编码为 `localhost:8001`，在生产环境中无法访问
2. **端口配置不一致**: 前端在3000端口，但API服务可能在其他端口
3. **防火墙配置**: 可能8001端口未开放

## 解决方案

### 1. 立即修复步骤

```bash
# 1. 停止所有服务
pm2 stop all
pm2 delete all

# 2. 确保后端API在8001端口运行
cd /path/to/your/project/backend/api
# 检查 .env 文件，确保 PORT=8001
echo "PORT=8001" >> .env
echo "NODE_ENV=production" >> .env
echo "SERVER_HOST=0.0.0.0" >> .env

# 3. 重新构建前端（已修复API配置）
cd /path/to/your/project/frontend/b-end
npm run build

# 4. 启动服务
cd /path/to/your/project
./start-services.sh
```

### 2. 检查防火墙配置

```bash
# Ubuntu/Debian 系统
sudo ufw allow 3000
sudo ufw allow 8001
sudo ufw reload

# CentOS/RHEL 系统
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --reload
```

### 3. 验证修复

```bash
# 检查服务状态
pm2 status

# 检查端口监听
netstat -tlnp | grep :3000
netstat -tlnp | grep :8001

# 测试API连接
curl http://172.237.20.24:8001/health
curl http://172.237.20.24:8001/api/v1/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'

# 测试前端访问
curl http://172.237.20.24:3000/
```

### 4. 生产环境最佳实践

#### 使用 Nginx 反向代理（推荐）

```nginx
# /etc/nginx/sites-available/aiagent
server {
    listen 80;
    server_name 172.237.20.24;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_timeout 60s;
    }
}
```

```bash
# 启用 Nginx 配置
sudo ln -s /etc/nginx/sites-available/aiagent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 修复后的访问地址

- **前端**: http://172.237.20.24:3000
- **API**: http://172.237.20.24:8001
- **使用 Nginx 后**: http://172.237.20.24 （推荐）

## 常见问题排查

### 1. 前端仍显示加载中
```bash
# 检查浏览器控制台错误
# 检查 API 是否可访问
curl http://172.237.20.24:8001/health

# 检查前端构建是否包含最新修复
grep -r "window.location.hostname" /path/to/frontend/b-end/dist/
```

### 2. API 无响应
```bash
# 检查后端日志
pm2 logs aiagent-api

# 检查端口占用
lsof -i :8001

# 重启 API 服务
pm2 restart aiagent-api
```

### 3. 数据库连接问题
```bash
# 检查 MongoDB 状态
sudo systemctl status mongod

# 检查 Redis 状态
sudo systemctl status redis

# 测试数据库连接
node test-db-connection.js
```

## 自动化修复脚本

创建 `fix-production.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 修复生产环境部署问题..."

# 停止服务
echo "停止现有服务..."
pm2 stop all || true
pm2 delete all || true

# 配置后端
echo "配置后端 API..."
cd backend/api
echo "PORT=8001" > .env.production
echo "NODE_ENV=production" >> .env.production
echo "SERVER_HOST=0.0.0.0" >> .env.production
cp .env.production .env

# 重新构建前端
echo "重新构建前端..."
cd ../../frontend/b-end
npm run build

# 配置防火墙
echo "配置防火墙..."
sudo ufw allow 3000 || true
sudo ufw allow 8001 || true

# 启动服务
echo "启动服务..."
cd ../..
./start-services.sh

echo "✅ 修复完成！"
echo "前端访问: http://172.237.20.24:3000"
echo "API 访问: http://172.237.20.24:8001"
```

运行修复脚本:
```bash
chmod +x fix-production.sh
./fix-production.sh
```