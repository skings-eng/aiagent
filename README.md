# 智能投资助手 - Ubuntu 开发环境搭建指南

一个基于AI的日本股市分析助手，支持实时股价查询、技术分析和智能问答。

## 🎯 项目简介

本项目是一个完整的AI投资助手系统，包含：
- **前端界面**: React + Vite + Tailwind CSS
- **后端API**: Node.js + Express + TypeScript
- **LINE Bot**: 微信机器人服务
- **AI服务**: 支持OpenAI、Claude、Gemini
- **股票数据**: MCP股票数据服务器
- **数据库**: MongoDB + Redis

## 📋 系统要求

- **操作系统**: Ubuntu 20.04+ (推荐 22.04 LTS)
- **内存**: 最少2GB，推荐4GB+
- **硬盘**: 最少10GB可用空间
- **网络**: 稳定的互联网连接

## 🚀 一键安装（推荐）

### 方法一：使用安装脚本

```bash
# 1. 克隆项目
git clone https://github.com/skings-eng/aiagent.git
cd aiagent

# 2. 运行一键安装脚本
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

安装脚本会自动完成：
- ✅ 系统更新和基础软件安装
- ✅ Node.js 18.x 安装
- ✅ Python 3.11+ 安装
- ✅ MongoDB 7.0 安装和配置
- ✅ Redis 7.x 安装和配置
- ✅ PM2 进程管理器安装
- ✅ 项目依赖安装和构建
- ✅ 环境变量配置
- ✅ 防火墙配置
- ✅ 系统优化

## 🔧 手动安装（详细步骤）

如果一键安装失败，可以按照以下步骤手动安装：

### 1. 更新系统

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y curl wget git build-essential software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release unzip vim htop tree jq
```

### 2. 安装 Node.js 18.x

```bash
# 添加NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x
npm --version   # 应该显示 9.x.x+
```

### 3. 安装 Python 3.11+

```bash
# 添加deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# 安装Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip python3.11-distutils

# 设置为默认python3
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# 验证安装
python3 --version  # 应该显示 Python 3.11.x
```

### 4. 安装 MongoDB 7.0

```bash
# 导入MongoDB公钥
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 添加MongoDB源（Ubuntu 22.04）
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 更新包列表并安装
sudo apt update
sudo apt install -y mongodb-org

# 启动并启用服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

### 5. 安装 Redis 7.x

```bash
# 安装Redis
sudo apt install -y redis-server

# 配置Redis
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf

# 启动并启用服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证安装
sudo systemctl status redis-server
redis-cli ping  # 应该返回 PONG
```

### 6. 安装 PM2 进程管理器

```bash
# 全局安装PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 7. 克隆和配置项目

```bash
# 克隆项目
git clone https://github.com/skings-eng/aiagent.git
cd aiagent

# 安装根目录依赖
npm install

# 构建shared模块（必须先构建）
cd shared
npm install
npm run build
cd ..

# 安装并构建后端API
cd backend/api
npm install
npm run build
cd ../..

# 安装并构建LINE Bot
cd backend/line
npm install
npm run build
cd ../..

# 安装前端依赖
cd frontend/c-end
npm install
npm run build
cd ../..

# 设置MCP Python环境
cd backend/api/mcp-yfinance-server
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .
cd ../../..
```

## ⚙️ 环境配置

### 1. 配置后端API环境变量

```bash
# 复制环境变量模板
cp backend/api/.env.example backend/api/.env

# 编辑配置文件
nano backend/api/.env
```

**重要配置项：**
```env
# 服务端口
PORT=8001

# 数据库连接
MONGODB_URI=mongodb://localhost:27017/japan-stock-ai
REDIS_HOST=localhost
REDIS_PORT=6379

# AI API密钥（至少配置一个）
GOOGLE_AI_API_KEY=your-google-ai-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# JWT密钥（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. 配置LINE Bot环境变量

```bash
# 复制环境变量模板
cp backend/line/.env.example backend/line/.env

# 编辑配置文件
nano backend/line/.env
```

**重要配置项：**
```env
# LINE Bot配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here

# 服务端口
PORT=3003

# Redis配置
REDIS_URL=redis://localhost:6379
```

### 3. 配置前端环境变量

```bash
# 创建前端环境配置
cat > frontend/c-end/.env << EOF
VITE_API_BASE_URL=http://localhost:8001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

## 🎮 启动服务

### 开发环境启动

```bash
# 方法一：使用启动脚本（推荐）
./start-services.sh --with-frontend

# 方法二：手动启动各个服务
# 1. 启动MCP服务器
cd backend/api/mcp-yfinance-server
source venv/bin/activate
pm2 start --name "aiagent-mcp" --interpreter python3 demo_stock_price_server.py
cd ../../..

# 2. 启动后端API
pm2 start --name "aiagent-api" --cwd backend/api npm -- start

# 3. 启动LINE Bot
pm2 start --name "aiagent-line" --cwd backend/line npm -- start

# 4. 启动前端（可选）
pm2 start --name "aiagent-frontend" --cwd frontend/c-end npm -- run preview -- --port 3000 --host 0.0.0.0

# 保存PM2配置
pm2 save
```

### 查看服务状态

```bash
# 查看所有服务状态
pm2 status

# 查看服务日志
pm2 logs

# 查看特定服务日志
pm2 logs aiagent-api
pm2 logs aiagent-mcp
pm2 logs aiagent-line
```

### 停止服务

```bash
# 使用停止脚本
./stop-services.sh

# 或手动停止
pm2 delete all
pm2 kill
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **前端界面**: http://localhost:3000
- **API服务**: http://localhost:8001
- **LINE Bot**: http://localhost:3003
- **API文档**: http://localhost:8001/api-docs

## 🔍 验证安装

### 1. 检查数据库连接

```bash
# 测试MongoDB
mongosh --eval "db.adminCommand('ping')"

# 测试Redis
redis-cli ping
```

### 2. 检查API服务

```bash
# 测试API健康检查
curl http://localhost:8001/health

# 测试股票查询
curl "http://localhost:8001/api/v1/chat" -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"查询苹果公司股价"}'
```

### 3. 检查前端服务

打开浏览器访问 http://localhost:3000，应该能看到聊天界面。

## 🛠️ 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 查看端口占用
sudo lsof -i :8001
sudo lsof -i :3000
sudo lsof -i :3003

# 杀死占用进程
sudo kill -9 <PID>
```

**2. MongoDB启动失败**
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 查看MongoDB日志
sudo journalctl -u mongod

# 重启MongoDB
sudo systemctl restart mongod
```

**3. Redis启动失败**
```bash
# 检查Redis状态
sudo systemctl status redis-server

# 重启Redis
sudo systemctl restart redis-server
```

**4. Python虚拟环境问题**
```bash
# 重新创建虚拟环境
cd backend/api/mcp-yfinance-server
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .
```

**5. 前端构建失败**
```bash
# 清理并重新安装
cd frontend/c-end
rm -rf node_modules package-lock.json
npm install
npm run build
```

**6. PM2服务异常**
```bash
# 重启PM2
pm2 kill
pm2 resurrect

# 或重新启动服务
./start-services.sh --with-frontend
```

### 日志文件位置

- **PM2日志**: `~/.pm2/logs/`
- **MongoDB日志**: `/var/log/mongodb/mongod.log`
- **Redis日志**: `/var/log/redis/redis-server.log`
- **系统日志**: `sudo journalctl -u <service-name>`

## 📚 API密钥获取

### Google Gemini API
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录Google账号
3. 点击"Create API Key"
4. 复制生成的API密钥

### OpenAI API
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录OpenAI账号
3. 点击"Create new secret key"
4. 复制生成的API密钥

### LINE Bot配置
1. 访问 [LINE Developers](https://developers.line.biz/)
2. 创建新的Provider和Channel
3. 获取Channel Access Token和Channel Secret

## 🎯 下一步

1. **配置API密钥**: 编辑环境变量文件，填入你的API密钥
2. **启动服务**: 运行 `./start-services.sh --with-frontend`
3. **测试功能**: 访问前端界面，测试股票查询功能
4. **配置LINE Bot**: 如需LINE Bot功能，配置LINE相关环境变量
5. **生产部署**: 参考生产环境部署文档

## 📞 技术支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查服务日志：`pm2 logs`
3. 提交Issue到GitHub仓库

## 📄 开源许可

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

🎉 **恭喜！你已经成功搭建了智能投资助手开发环境！**

现在可以开始使用AI助手进行股票分析了！