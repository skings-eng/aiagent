# Ubuntu 部署指南 - 智能投资助手

## 🎯 概述

本指南将帮助你在Ubuntu服务器上部署已修复的智能投资助手项目。代码已经修复了所有构建错误，可以直接部署。

## 📋 前提条件

- Ubuntu 20.04+ 服务器
- 至少 2GB 内存
- 至少 10GB 硬盘空间
- 公网IP地址
- sudo权限

## 🚀 快速部署步骤

### 第一步：连接到Ubuntu服务器

```bash
# SSH连接到服务器
ssh ubuntu@你的服务器IP
# 或者
ssh root@你的服务器IP
```

### 第二步：更新系统并安装基础依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git build-essential software-properties-common
```

### 第三步：克隆最新代码

```bash
# 进入用户主目录
cd ~

# 克隆项目（使用最新修复的代码）
git clone https://github.com/skings-eng/aiagent.git
cd aiagent

# 给脚本添加执行权限
chmod +x *.sh
```

### 第四步：运行一键安装脚本

```bash
# 运行Ubuntu安装脚本
./install-ubuntu.sh
```

**安装脚本会自动完成：**
- ✅ Node.js 18.x 安装
- ✅ Python 3.11+ 安装
- ✅ MongoDB 安装和配置
- ✅ Redis 安装和配置
- ✅ PM2 进程管理器安装
- ✅ 项目依赖安装
- ✅ 防火墙配置

### 第五步：配置环境变量

#### 5.1 配置后端API

```bash
# 编辑后端API配置
nano backend/api/.env
```

**最小配置示例：**
```env
# 基础配置
NODE_ENV=production
PORT=3001
SERVER_HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/japan-stock-ai
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置（替换为你的服务器IP）
FRONTEND_URL=http://你的服务器IP:4173
ALLOWED_ORIGINS=http://你的服务器IP:4173

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-$(date +%s)
JWT_EXPIRES_IN=7d

# AI API密钥（至少配置一个）
GOOGLE_AI_API_KEY=你的Google_AI_API密钥
# OPENAI_API_KEY=你的OpenAI_API密钥
# ANTHROPIC_API_KEY=你的Claude_API密钥

# 日志配置
LOG_LEVEL=info
EOF
```

#### 5.2 配置LINE Bot（可选）

```bash
# 编辑LINE配置
nano backend/line/.env
```

**LINE配置示例：**
```env
# 基础配置
NODE_ENV=production
PORT=3003
SERVER_HOST=0.0.0.0

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# LINE Bot配置（如果有LINE Bot）
LINE_CHANNEL_ACCESS_TOKEN=你的LINE_ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的LINE_CHANNEL_SECRET
LINE_WEBHOOK_URL=https://你的域名或IP:3003/webhook

# API配置
API_BASE_URL=http://localhost:3001

# 日志配置
LOG_LEVEL=info
```

#### 5.3 配置前端

```bash
# 编辑前端配置
nano frontend/b-end/.env
```

**前端配置示例：**
```env
# API配置（替换为你的服务器IP）
VITE_API_BASE_URL=http://你的服务器IP:3001
VITE_WS_URL=ws://你的服务器IP:3001

# 环境配置
VITE_NODE_ENV=production
```

### 第六步：构建和启动服务

```bash
# 安装所有依赖
npm install

# 构建项目
npm run build

# 启动所有服务
./start-services.sh --with-frontend
```

### 第七步：验证部署

```bash
# 检查服务状态
pm2 status

# 查看服务日志
pm2 logs

# 检查端口占用
sudo netstat -tlnp | grep -E ':(3001|3003|4173)'
```

**预期输出：**
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ aiagent-api    │ default     │ 1.0.0   │ fork    │ 12345    │ 5m     │ 0    │ online    │ 0%       │ 50.0mb   │ ubuntu   │ disabled │
│ 1   │ aiagent-line   │ default     │ 1.0.0   │ fork    │ 12346    │ 5m     │ 0    │ online    │ 0%       │ 30.0mb   │ ubuntu   │ disabled │
│ 2   │ aiagent-frontend│ default    │ 1.0.0   │ fork    │ 12347    │ 5m     │ 0    │ online    │ 0%       │ 20.0mb   │ ubuntu   │ disabled │
│ 3   │ aiagent-mcp    │ default     │ 1.0.0   │ fork    │ 12348    │ 5m     │ 0    │ online    │ 0%       │ 25.0mb   │ ubuntu   │ disabled │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### 第八步：配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 开放必要端口
sudo ufw allow 22      # SSH
sudo ufw allow 3001    # API
sudo ufw allow 3003    # LINE Bot
sudo ufw allow 4173    # 前端

# 查看防火墙状态
sudo ufw status
```

## 🌐 访问应用

部署完成后，可以通过以下地址访问：

- **前端界面**: http://你的服务器IP:4173
- **API文档**: http://你的服务器IP:3001/api-docs
- **LINE Webhook**: http://你的服务器IP:3003/webhook

## 🔧 常见问题排查

### 1. 构建失败

```bash
# 清理缓存重新构建
npm run clean
npm install
npm run build
```

### 2. 服务启动失败

```bash
# 查看详细日志
pm2 logs aiagent-api
pm2 logs aiagent-line
pm2 logs aiagent-frontend

# 重启服务
pm2 restart all
```

### 3. 数据库连接失败

```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 重启MongoDB
sudo systemctl restart mongod

# 检查Redis状态
sudo systemctl status redis-server
```

### 4. 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :3001

# 杀死占用进程
sudo fuser -k 3001/tcp
```

## 🔄 更新代码

当GitHub上有新的代码更新时：

```bash
# 进入项目目录
cd ~/aiagent

# 停止服务
./stop-services.sh

# 拉取最新代码
git pull origin main

# 重新构建和启动
npm run build
./start-services.sh --with-frontend
```

## 📊 监控和维护

### 查看系统资源

```bash
# 查看系统资源使用
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### PM2 监控

```bash
# PM2 监控面板
pm2 monit

# 查看进程详情
pm2 show aiagent-api

# 重启特定服务
pm2 restart aiagent-api
```

## 🎉 部署完成

恭喜！你已经成功在Ubuntu服务器上部署了智能投资助手。

**重要提醒：**
1. 将文档中的 `你的服务器IP` 替换为实际的服务器IP地址
2. 确保配置了至少一个AI API密钥
3. 定期备份数据库数据
4. 监控服务运行状态

现在可以通过浏览器访问 http://你的服务器IP:4173 开始使用AI投资助手了！