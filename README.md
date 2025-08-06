# 智能投资助手

一个基于人工智能的智能投资助手系统，集成了股票分析、聊天机器人和LINE Bot功能。

## 功能特性

- 🤖 **AI聊天助手**: 基于Gemini API的智能对话系统
- 📈 **股票分析**: 实时股票数据获取和技术分析
- 📱 **LINE机器人**: 支持LINE平台的聊天机器人
- 🌐 **网页界面**: 现代化的响应式前端界面
- 🔧 **MCP集成**: 模块化组件协议支持

## 技术栈

### 前端技术
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

### 后端技术
- Node.js
- Express.js
- TypeScript
- LINE消息API
- Google Gemini API

### 工具和服务
- PM2 (进程管理)
- Python (MCP服务器)
- yfinance (股票数据)
- Nginx (反向代理)

## 项目结构

```
aiagent/
├── frontend/
│   ├── b-end/               # React管理端前端应用
│   └── c-end/               # React客户端前端应用
├── backend/
│   ├── api/                 # 主API服务
│   │   └── mcp-yfinance-server/  # MCP股票服务器
│   ├── line/                # LINE Bot服务
│   └── mcp/                 # MCP服务模块
├── shared/                  # 共享类型和工具
├── scripts/                 # 部署和维护脚本
│   └── init-database.sh     # 数据库初始化脚本
├── ecosystem.config.js      # PM2配置文件
├── start-services.sh        # 一键启动脚本
├── DEPLOYMENT.md           # 部署文档
└── README.md               # 项目说明
```

## 快速开始

### 💻 Ubuntu从GitHub部署方案

#### 前置要求

确保你的Ubuntu系统已安装以下软件：

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Python3和pip
sudo apt install -y python3 python3-pip

# 安装PM2进程管理器
sudo npm install -g pm2

# 安装MongoDB 7.0

**Ubuntu/Linux:**
```bash
# 导入MongoDB公钥
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 检测Ubuntu版本
UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")

# 如果是Ubuntu 24.04 (noble)，使用jammy源作为替代
if [ "$UBUNTU_CODENAME" = "noble" ]; then
    echo "检测到Ubuntu 24.04，使用Ubuntu 22.04 (jammy)的MongoDB源"
    UBUNTU_CODENAME="jammy"
fi

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $UBUNTU_CODENAME/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 更新包列表并安装
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
# 安装Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# 启动MongoDB服务
brew services start mongodb/brew/mongodb-community
```

# 安装Git
sudo apt install -y git
```

#### 部署步骤

1. **克隆项目**
   ```bash
   # 克隆GitHub仓库
   git clone https://github.com/skings-eng/aiagent.git
   cd aiagent
   ```

2. **安装系统依赖**
   ```bash
   # 给脚本执行权限
   chmod +x install.sh start-services.sh stop-services.sh
   
   # 运行系统依赖安装脚本
   ./install.sh
   ```

3. **安装项目依赖并构建**
   ```bash
   # 安装所有项目依赖
   npm install
   
   # 构建项目（必须先构建shared模块）
   npm run build
   ```

4. **配置数据库和环境变量**
   ```bash
   # 确保MongoDB服务正在运行
   # Ubuntu/Linux:
   sudo systemctl status mongod
   
   # 如果MongoDB未运行，启动它
   # Ubuntu/Linux:
   sudo systemctl start mongod
   
   # macOS:
   brew services list | grep mongodb
   brew services start mongodb/brew/mongodb-community
   
   # 初始化数据库（可选但推荐）
   chmod +x scripts/init-database.sh
   ./scripts/init-database.sh
   
   # 配置API服务环境变量
   cp backend/api/.env.example backend/api/.env
   nano backend/api/.env  # 编辑并填入你的API密钥和数据库配置
   
   # 配置LINE Bot环境变量（可选）
   cp backend/line/.env.example backend/line/.env
   nano backend/line/.env  # 编辑并填入LINE相关配置
   ```
   
   **重要的环境变量配置：**
   - `MONGODB_URI`: MongoDB连接字符串（默认：mongodb://localhost:27017/japan-stock-ai）
   - `OPENAI_API_KEY`: OpenAI API密钥
   - `ANTHROPIC_API_KEY`: Anthropic Claude API密钥
   - `GOOGLE_API_KEY`: Google Gemini API密钥

   # 进入MCP服务器目录
cd /path/to/aiagent/backend/api/mcp-yfinance-server

# 删除损坏的虚拟环境
rm -rf venv

# 重新创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 升级pip并安装依赖
pip install --upgrade pip
pip install -e .

# 返回项目根目录并重新启动服务
cd ../../..
./start-services.sh

5. **启动服务**
   ```bash
   # 使用一键启动脚本（包含前端服务）
   ./start-services.sh --with-frontend
   
   # 或仅启动后端服务
   ./start-services.sh
   
   # 或使用PM2直接启动
   pm2 start ecosystem.config.js
   ```

6. **验证部署**
   ```bash
   # 检查服务状态
   pm2 status
   
   # 查看日志
   pm2 logs
   
   # 访问应用
   curl http://localhost:3000
   ```

7. **设置开机自启（可选）**
   ```bash
   # 保存PM2进程列表
   pm2 save
   
   # 设置PM2开机自启
   pm2 startup
   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
   ```

### 开发环境搭建

1. **克隆项目**
   ```bash
   git clone https://github.com/你的用户名/aiagent.git
   cd aiagent
   ```

2. **安装依赖**
   ```bash
   # 使用安装脚本一键安装所有依赖
   ./install.sh
   
   # 或手动安装
   npm install
   cd backend/api && npm install
   cd ../line && npm install
   cd ../../frontend/b-end && npm install
   cd ../c-end && npm install
   cd ../../shared && npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制并编辑API环境变量
   cp backend/api/.env.example backend/api/.env
   
   # 复制并编辑LINE Bot环境变量
   cp backend/line/.env.example backend/line/.env
   ```

4. **启动开发服务器**
   ```bash
   # 使用开发模式启动所有服务
   npm run dev
   
   # 或分别启动各个服务
   # 前端开发服务器
   cd frontend/b-end && npm run dev
   
   # API服务器
   cd backend/api && npm run dev
   
   # LINE Bot服务器
   cd backend/line && npm run dev
   ```

### 生产环境部署

#### Ubuntu生产环境部署

1. **系统优化配置**
   ```bash
   # 设置系统限制
   echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
   echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
   
   # 优化内核参数
   echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **配置防火墙**
   ```bash
   # 启用UFW防火墙
   sudo ufw enable
   
   # 开放必要端口
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw allow 3000  # 前端应用
   sudo ufw allow 3001  # API服务
   sudo ufw allow 3002  # LINE Bot
   ```

3. **配置Nginx反向代理（可选）**
   ```bash
   # 安装Nginx
   sudo apt install -y nginx
   
   # 创建配置文件
   sudo nano /etc/nginx/sites-available/aiagent
   ```
   
   Nginx配置示例：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```
   
   ```bash
   # 启用站点
   sudo ln -s /etc/nginx/sites-available/aiagent /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **设置SSL证书（推荐）**
   ```bash
   # 安装Certbot
   sudo apt install -y certbot python3-certbot-nginx
   
   # 获取SSL证书
   sudo certbot --nginx -d your-domain.com
   ```

## 环境变量配置

### API服务配置 (.env)

```env
# 必需配置
GOOGLE_AI_API_KEY=你的google_ai_api密钥
PORT=3001
NODE_ENV=production

# 可选配置
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### LINE Bot服务配置 (.env)

```env
# 必需配置
LINE_CHANNEL_ACCESS_TOKEN=你的line访问令牌
LINE_CHANNEL_SECRET=你的line频道密钥
PORT=3002

# 可选配置
API_BASE_URL=http://localhost:3001
NODE_ENV=production
```

## API接口文档

### 主要接口端点

- `GET /health` - 健康检查
- `POST /api/chat` - AI聊天接口
- `GET /api/stock/:symbol` - 获取股票信息
- `POST /line/webhook` - LINE Bot Webhook

### 股票相关API

```bash
# 获取股票价格
GET /api/stock/AAPL/price

# 获取技术分析
GET /api/stock/AAPL/analysis

# 获取股票历史数据
GET /api/stock/AAPL/history?period=1mo
```

## 开发指南

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier代码格式化配置
- 使用语义化的Git提交信息

### 调试方法

```bash
# 查看PM2日志
pm2 logs

# 查看特定服务日志
pm2 logs aiagent-api

# 实时监控
pm2 monit
```

## 故障排除

### Ubuntu部署常见问题

1. **TypeScript编译错误**
   ```bash
   # 如果遇到backend/api编译错误，需要先构建shared模块
   cd /path/to/aiagent
   
   # 清理所有构建文件
   find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
   find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
   
   # 重新安装依赖
   npm install
   
   # 按正确顺序构建（shared -> backend -> frontend）
   npm run build
   ```

2. **依赖安装失败**
   ```bash
   # 更新包管理器
   sudo apt update
   
   # 清理npm缓存
   npm cache clean --force
   
   # 重新安装依赖
   find . -name "node_modules" -type d -exec rm -rf {} +
   npm install
   ```

3. **MCP服务器启动错误**
   ```bash
   # 错误：venv/bin/activate: No such file or directory
   cd backend/api/mcp-yfinance-server
   
   # 删除损坏的虚拟环境
   rm -rf venv
   
   # 重新创建虚拟环境
   python3 -m venv venv
   source venv/bin/activate
   
   # 升级pip并安装依赖
   pip install --upgrade pip
   pip install -e .
   
   # 返回项目根目录并重新启动服务
   cd ../../..
   ./start-services.sh
   ```

4. **Python环境问题**
   ```bash
   # 检查Python版本
   python3 --version
   
   # 确保Python版本 >= 3.11
   sudo apt update
   sudo apt install python3.11 python3.11-venv python3.11-dev
   ```

5. **MongoDB源问题 (Ubuntu 24.04)**
   
   如果遇到 `E: The repository 'https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 Release' does not have a Release file` 错误：
   
   ```bash
   # 删除现有的MongoDB源文件
   sudo rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # 重新添加MongoDB公钥
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   
   # 为Ubuntu 24.04使用jammy源
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # 更新包列表并安装
   sudo apt update
   sudo apt install -y mongodb-org
   ```

6. **数据库连接问题**
   
   **Ubuntu/Linux:**
   ```bash
   # 检查MongoDB服务状态
   sudo systemctl status mongod
   
   # 启动MongoDB服务
   sudo systemctl start mongod
   
   # 设置MongoDB开机自启
   sudo systemctl enable mongod
   
   # 检查MongoDB连接
   mongosh --eval "db.adminCommand('ping')"
   
   # 如果连接失败，检查防火墙设置
   sudo ufw allow 27017
   
   # 重启MongoDB服务
   sudo systemctl restart mongod
   ```
   
   **macOS:**
   ```bash
   # 检查MongoDB服务状态
   brew services list | grep mongodb
   
   # 启动MongoDB服务
   brew services start mongodb/brew/mongodb-community
   
   # 检查MongoDB连接
   mongosh --eval "db.adminCommand('ping')"
   
   # 重启MongoDB服务
   brew services restart mongodb/brew/mongodb-community
   
   # 如果仍有问题，检查MongoDB日志
   tail -f /opt/homebrew/var/log/mongodb/mongo.log
   ```

6. **Git克隆失败**
   ```bash
   # 配置Git代理（如果需要）
   git config --global http.proxy http://proxy-server:port
   
   # 或使用SSH克隆
   git clone git@github.com:你的用户名/aiagent.git
   ```

7. **服务启动失败**
   ```bash
   # 检查系统资源
   free -h
   df -h
   
   # 重启PM2
   pm2 kill
   pm2 start ecosystem.config.js
   ```

### 通用问题解决

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3001
   
   # 终止进程
   kill -9 <进程ID>
   ```

2. **环境变量未生效**
   - 检查.env文件是否存在
   - 确认环境变量格式正确
   - 重启相关服务

3. **MCP服务器连接失败**
   ```bash
   # 检查Python环境
   cd backend/api/mcp-yfinance-server
   python3 demo_stock_price_server.py
   ```

4. **前端构建失败**
   ```bash
   # 清理缓存
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **前端服务无法访问 (http://localhost:3000)**
   ```bash
   # 检查是否使用了正确的启动参数
   ./start-services.sh --with-frontend
   
   # 检查服务状态
   pm2 status
   
   # 如果没有aiagent-frontend服务，重新启动
   pm2 delete aiagent-frontend 2>/dev/null || true
   ./start-services.sh --with-frontend
   ```

### 🆘 Ubuntu部署快速修复

如果遇到任何问题，可以尝试以下一键修复命令：

```bash
# 完全重置并重新安装
cd aiagent
./stop-services.sh
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete
npm cache clean --force
./install.sh
./start-services.sh
```

#### 常见Ubuntu部署问题

1. **权限问题**
   ```bash
   # 修复脚本权限
   chmod +x *.sh
   
   # 修复文件所有权
   sudo chown -R $USER:$USER .
   ```

2. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :3000
   
   # 终止占用进程
   sudo kill -9 <进程ID>
   ```

3. **内存不足**
   ```bash
   # 创建交换文件
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### 日志文件位置

- PM2日志: `~/.pm2/logs/`
- 应用日志: `backend/api/logs/`
- Nginx日志: `/var/log/nginx/`

## 开源许可证

本项目采用 MIT 开源许可证

## 技术支持

如果您遇到问题或有疑问，请：

1. 查看 [故障排除](#故障排除) 部分
2. 搜索现有的问题报告
3. 创建新的问题报告并详细描述您遇到的问题

## 版本更新日志

### v1.0.2 (2025年1月6日)
- 🔧 修复c-end模块TypeScript构建错误
- 📦 优化项目结构，支持双前端架构
- 🛠️ 修复tsconfig.json重复配置问题
- 🧹 清理未使用的导入和变量
- ✅ 解决React Query类型兼容性问题
- 📝 更新项目结构文档

### v1.0.1 (2025年1月6日)
- 🐛 修复前端服务启动问题
- 📝 更新启动脚本说明文档
- 🔧 修复TypeScript编译错误
- ✅ 完善故障排除指南

### v1.0.0 (2025年1月6日)
- ✨ 首次正式版本发布
- 🤖 AI智能聊天功能
- 📈 股票分析功能
- 📱 LINE机器人集成
- 🌐 响应式网页界面
- 🚀 一键部署脚本

---

**智能投资助手** - 让投资决策更加智能化 🚀