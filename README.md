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
├── frontend/b-end/          # React前端应用
├── backend/
│   ├── api/                 # 主API服务
│   │   └── mcp-yfinance-server/  # MCP股票服务器
│   └── line/                # LINE Bot服务
├── shared/                  # 共享类型和工具
├── ecosystem.config.js      # PM2配置文件
├── start-services.sh        # 一键启动脚本
├── DEPLOYMENT.md           # 部署文档
└── README.md               # 项目说明
```

## 快速开始

### 🎯 新手用户（推荐）

如果你是新手，建议使用我们的简化部署指南：

📖 **[5分钟快速部署指南](QUICK_START.md)** - 专为新手准备的超简单部署教程

### 开发环境搭建

1. **克隆项目**
   ```bash
   git clone <仓库地址>
   cd aiagent
   ```

2. **安装依赖**
   ```bash
   npm install
   cd backend/api && npm install
   cd ../line && npm install
   cd ../../frontend/b-end && npm install
   cd ../../shared && npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制并编辑API环境变量
   cp backend/api/.env.example backend/api/.env
   
   # 复制并编辑LINE Bot环境变量
   cp backend/line/.env.example backend/line/.env
   ```

4. **构建项目**
   ```bash
   # 构建共享模块
   cd shared && npm run build
   
   # 构建后端
   cd ../backend/api && npm run build
   cd ../line && npm run build
   
   # 构建前端
   cd ../../frontend/b-end && npm run build
   ```

5. **启动开发服务器**
   ```bash
   # 启动前端开发服务器
   cd frontend/b-end
   npm run dev
   
   # 在新终端启动API服务器
   cd backend/api
   npm run dev
   
   # 在新终端启动LINE Bot服务器
   cd backend/line
   npm run dev
   ```

### 生产环境部署

我们提供了多种部署方式：

- 🚀 **[新手快速部署](QUICK_START.md)** - 5分钟一键部署（推荐新手）
- 📖 **[详细部署指南](DEPLOYMENT.md)** - 完整的生产环境部署文档
- 🛠️ **一键安装脚本** - `curl -fsSL https://raw.githubusercontent.com/你的用户名/aiagent/main/install.sh | bash`

#### 快速部署 (Ubuntu系统)

1. **使用一键启动脚本**
   ```bash
   chmod +x start-services.sh
   ./start-services.sh
   ```

2. **使用PM2生态系统配置**
   ```bash
   pm2 start ecosystem.config.js
   ```

## 环境变量配置

### API服务配置 (.env)

```env
# 必需配置
GEMINI_API_KEY=你的gemini_api密钥
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

### 常见问题解决

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

### v1.0.0 (2025年1月6日)
- ✨ 首次正式版本发布
- 🤖 AI智能聊天功能
- 📈 股票分析功能
- 📱 LINE机器人集成
- 🌐 响应式网页界面
- 🚀 一键部署脚本

---

**智能投资助手** - 让投资决策更加智能化 🚀