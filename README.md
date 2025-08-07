# 🤖 AI智能投资助手 - 生产环境部署指南

一个基于AI的智能投资助手系统，支持股票分析、实时查询、LINE Bot聊天等功能。

## 🎯 项目简介

本项目是一个完整的AI投资助手系统，包含：
- **前端界面**: React + Vite + Tailwind CSS (端口: 4173)
- **后端API**: Node.js + Express + TypeScript (端口: 3001)
- **LINE Bot**: LINE机器人服务 (端口: 3003)
- **MCP服务**: 股票数据服务器 (端口: 3002)
- **AI服务**: 支持OpenAI、Claude、Gemini
- **数据库**: MongoDB + Redis
- **故障排查工具**: 自动化诊断和修复脚本

## 📋 系统要求

- **操作系统**: Ubuntu 20.04+ (推荐 22.04 LTS)
- **内存**: 最少2GB，推荐4GB+
- **硬盘**: 最少10GB可用空间
- **网络**: 稳定的互联网连接
- **域名/IP**: 公网IP地址或域名（用于LINE Bot webhook）

## 🚀 生产环境部署指南

### 第一步：准备Ubuntu服务器

#### 1.1 连接到服务器
```bash
# 使用SSH连接到你的Ubuntu服务器
ssh root@你的服务器IP
# 或者
ssh ubuntu@你的服务器IP
```

#### 1.2 更新系统
```bash
# 更新系统包列表
sudo apt update

# 升级所有已安装的包
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim htop tree
```

### 第二步：获取项目代码

#### 2.1 克隆项目代码
```bash
# 进入用户主目录
cd ~

# 从GitHub克隆项目
git clone https://github.com/skings-eng/aiagent.git

# 进入项目目录
cd aiagent

# 给脚本添加执行权限
chmod +x *.sh
```

### 第三步：一键安装依赖

#### 3.1 运行安装脚本
```bash
# 运行Ubuntu安装脚本
./install-ubuntu.sh
```

**安装脚本会自动完成：**
- ✅ Node.js 18.x 安装
- ✅ Python 3.11+ 安装
- ✅ MongoDB 7.0 安装和配置
- ✅ Redis 7.x 安装和配置
- ✅ PM2 进程管理器安装
- ✅ 项目依赖安装和构建
- ✅ 防火墙配置
- ✅ 系统优化

#### 3.2 验证安装结果
```bash
# 检查Node.js版本
node --version  # 应该显示 v18.x.x

# 检查Python版本
python3 --version  # 应该显示 Python 3.11.x

# 检查MongoDB状态
sudo systemctl status mongod

# 检查Redis状态
sudo systemctl status redis-server

# 检查PM2
pm2 --version
```

### 第四步：配置环境变量

#### 4.1 配置后端API环境变量
```bash
# 创建后端API环境配置文件
cat > backend/api/.env << 'EOF'
# 基础配置
NODE_ENV=production
PORT=3001
SERVER_HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/aiagent_prod
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS配置
FRONTEND_URL=http://你的服务器IP:4173
ALLOWED_ORIGINS=http://你的服务器IP:4173

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
JWT_EXPIRES_IN=7d

# AI API密钥（至少配置一个）
GOOGLE_AI_API_KEY=你的Google_AI_API密钥
OPENAI_API_KEY=你的OpenAI_API密钥
ANTHROPIC_API_KEY=你的Claude_API密钥

# 日志配置
LOG_LEVEL=info
EOF
```

#### 4.2 配置LINE Bot环境变量
```bash
# 创建LINE Bot环境配置文件
cat > backend/line/.env << 'EOF'
# 基础配置
NODE_ENV=production
PORT=3003
SERVER_HOST=0.0.0.0

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# LINE Bot配置（需要从LINE Developers获取）
LINE_CHANNEL_ACCESS_TOKEN=你的LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的LINE_CHANNEL_SECRET

# CORS配置
CORS_ORIGIN=http://你的服务器IP:4173
ALLOWED_ORIGINS=http://你的服务器IP:4173

# 日志配置
LOG_LEVEL=info
EOF
```

#### 4.3 配置前端环境变量
```bash
# 创建前端环境配置文件
cat > frontend/b-end/.env << 'EOF'
VITE_API_BASE_URL=http://你的服务器IP:3001
VITE_GEMINI_API_KEY=你的Gemini_API密钥
EOF
```

**⚠️ 重要提醒：请将上面的 `你的服务器IP` 替换为你的实际服务器IP地址！**

### 第五步：获取API密钥

#### 5.1 获取Google Gemini API密钥
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录Google账号
3. 点击"Create API Key"
4. 复制生成的API密钥
5. 将密钥填入环境变量文件

#### 5.2 获取OpenAI API密钥（可选）
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录OpenAI账号
3. 点击"Create new secret key"
4. 复制生成的API密钥

#### 5.3 获取LINE Bot配置（可选）
1. 访问 [LINE Developers](https://developers.line.biz/)
2. 创建新的Provider和Channel
3. 获取Channel Access Token和Channel Secret
4. 设置Webhook URL: `http://你的服务器IP:3003/webhook`

### 第六步：部署项目

#### 6.1 运行生产环境部署脚本
```bash
# 运行生产环境部署脚本
./deploy-production.sh
```

**部署脚本会自动完成：**
- ✅ 停止现有服务
- ✅ 清理端口占用
- ✅ 安装项目依赖
- ✅ 构建所有服务
- ✅ 创建生产环境配置
- ✅ 配置PM2服务
- ✅ 启动所有服务
- ✅ 配置防火墙
- ✅ 运行健康检查

#### 6.2 验证部署结果
```bash
# 查看所有服务状态
pm2 status

# 应该看到以下服务都在运行：
# - aiagent-api (端口: 3001)
# - aiagent-frontend (端口: 4173)
# - aiagent-line (端口: 3003)
# - aiagent-mcp (MCP服务)
```

### 第七步：配置防火墙和安全

#### 7.1 配置UFW防火墙
```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 允许应用端口
sudo ufw allow 3001  # API服务
sudo ufw allow 4173  # 前端服务
sudo ufw allow 3003  # LINE Bot服务

# 查看防火墙状态
sudo ufw status
```

#### 7.2 配置云服务商安全组
如果使用阿里云、腾讯云、AWS等云服务，还需要在控制台配置安全组：
- 开放端口：22 (SSH), 80 (HTTP), 443 (HTTPS), 3001, 4173, 3003
- 允许来源：0.0.0.0/0 (所有IP)

## 🌐 访问地址

部署成功后，可以通过以下地址访问：

- **前端界面**: http://你的服务器IP:4173
- **API服务**: http://你的服务器IP:3001
- **API文档**: http://你的服务器IP:3001/api-docs
- **LINE Bot**: http://你的服务器IP:3003
- **健康检查**: 
  - API: http://你的服务器IP:3001/health
  - LINE: http://你的服务器IP:3003/health

## 🔧 服务管理命令

### 查看服务状态
```bash
# 查看所有服务状态
pm2 status

# 查看服务详细信息
pm2 show aiagent-api
pm2 show aiagent-frontend
pm2 show aiagent-line
pm2 show aiagent-mcp
```

### 查看服务日志
```bash
# 查看所有服务日志
pm2 logs

# 查看特定服务日志
pm2 logs aiagent-api
pm2 logs aiagent-frontend
pm2 logs aiagent-line
pm2 logs aiagent-mcp

# 实时查看日志
pm2 logs --lines 50
```

### 重启服务
```bash
# 重启所有服务
pm2 restart all

# 重启特定服务
pm2 restart aiagent-api
pm2 restart aiagent-frontend
pm2 restart aiagent-line
pm2 restart aiagent-mcp
```

### 停止和删除服务
```bash
# 停止所有服务
pm2 stop all

# 删除所有服务
pm2 delete all
```

## 🛠️ 故障排除

### 🚨 Gemini API Key配置问题

如果遇到Gemini API Key无法保存或测试失败的问题：

#### 快速修复（推荐）
```bash
# 运行快速修复脚本
./quick-fix-gemini.sh
```

#### 详细诊断
```bash
# 运行详细诊断脚本
node diagnose-gemini-issue.js
```

#### 交互式修复
```bash
# 运行交互式修复脚本
node fix-gemini-config.js
```

### 🌐 CORS跨域配置问题

如果前端无法访问后端API：

```bash
# 检查CORS配置
grep -r "FRONTEND_URL\|ALLOWED_ORIGINS" backend/api/.env*

# 编辑后端环境配置
nano backend/api/.env

# 确保包含正确配置
FRONTEND_URL=http://你的服务器IP:4173
ALLOWED_ORIGINS=http://你的服务器IP:4173

# 重启后端服务
pm2 restart aiagent-api
```

### 常见问题解决

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :4173
sudo lsof -i :3003

# 杀死占用进程
sudo kill -9 <PID>

# 重新启动服务
pm2 restart all
```

#### 2. MongoDB连接失败
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 重启MongoDB
sudo systemctl restart mongod

# 测试数据库连接
node backend/api/test-db-connection.js
```

#### 3. Redis连接失败
```bash
# 检查Redis状态
sudo systemctl status redis-server

# 重启Redis
sudo systemctl restart redis-server

# 测试Redis连接
redis-cli ping
```

#### 4. 完全重新部署
```bash
# 停止所有服务
pm2 delete all

# 清理构建文件
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +
find . -name "build" -type d -exec rm -rf {} +

# 重新运行部署脚本
./deploy-production.sh
```

## 📊 性能监控

### 系统监控
```bash
# 查看系统资源使用情况
htop

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h

# 查看网络连接
netstat -tlnp
```

### PM2监控
```bash
# PM2监控面板
pm2 monit

# 查看PM2进程列表
pm2 list

# 查看服务资源使用
pm2 show aiagent-api
```

## 🔄 更新代码

当GitHub上的代码更新时：

```bash
# 进入项目目录
cd ~/aiagent

# 拉取最新代码
git pull origin main

# 重新部署
./deploy-production.sh
```

## 🔐 安全建议

1. **修改默认密码**：确保修改所有默认密码
2. **使用HTTPS**：生产环境建议配置SSL证书
3. **定期更新**：定期更新系统和依赖包
4. **备份数据**：定期备份MongoDB数据
5. **监控日志**：定期检查服务日志
6. **限制访问**：配置防火墙和安全组

## 📚 更多资源

### 📖 项目文档
- **快速开始指南**: `QUICK_START.md`
- **Ubuntu部署指南**: `UBUNTU_DEPLOY_GUIDE.md`
- **数据库配置指南**: `DATABASE_CONFIG_GUIDE.md`
- **Gemini配置故障排查**: `GEMINI_CONFIG_TROUBLESHOOTING.md`
- **修复工具使用指南**: `GEMINI_FIX_TOOLS.md`
- **部署文档**: `DEPLOYMENT.md`

### 🛠️ 自动化工具
- **快速修复脚本**: `quick-fix-gemini.sh`
- **详细诊断脚本**: `diagnose-gemini-issue.js`
- **交互式修复脚本**: `fix-gemini-config.js`
- **数据库连接测试**: `backend/api/test-db-connection.js`
- **Gemini配置检查**: `backend/api/check_gemini_config.js`

### 🌐 在线资源
- **API文档**: 访问 http://你的服务器IP:3001/api-docs
- **GitHub仓库**: https://github.com/skings-eng/aiagent
- **问题反馈**: 在GitHub上提交Issue

## 📞 技术支持

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查服务日志：`pm2 logs`
3. 在GitHub仓库提交Issue
4. 发送邮件到技术支持邮箱

## 📄 开源许可

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

🎉 **恭喜！你已经成功部署了AI智能投资助手！**

现在可以通过浏览器访问 http://你的服务器IP:4173 开始使用AI助手进行股票分析了！

**记住要将文档中的 `你的服务器IP` 替换为你的实际服务器IP地址！**