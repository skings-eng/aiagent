# 日本股票市场AI分析智能体系统 - 项目架构说明

## 项目概述

本项目是一个基于AI的日本股票市场分析智能体系统，提供股票数据分析、AI对话、LINE Bot集成等功能。系统采用微服务架构，支持多种AI模型，并提供Web管理界面。

## 技术架构

### 整体架构
- **架构模式**: 微服务架构
- **开发语言**: TypeScript/JavaScript, Python
- **包管理**: npm workspaces
- **进程管理**: PM2
- **数据库**: MongoDB, Redis
- **容器化**: Docker (已移除)

### 工作空间结构
```
aiagent/
├── backend/
│   ├── api/          # 主API服务
│   └── line/         # LINE Bot服务
├── frontend/
│   └── b-end/        # B端管理界面
├── shared/           # 共享类型和工具
└── package.json      # 根工作空间配置
```

### 服务端口配置

系统中各个服务使用的端口分配如下：

| 服务名称 | 端口 | 协议 | 说明 |
|---------|------|------|------|
| **主API服务** | `8001` | HTTP | 后端核心API服务，提供AI模型管理、聊天对话、系统设置等功能 |
| **前端服务** | `3000` | HTTP | React前端应用，B端管理界面，提供可视化配置和管理功能 |
| **LINE Bot服务** | `3003` | HTTP | LINE Bot Webhook服务，处理LINE消息接收和发送 |
| **MCP股票数据服务** | `stdio` | MCP | 基于MCP协议的股票数据服务，通过标准输入输出通信 |
| **MongoDB** | `27017` | TCP | 数据库服务，存储系统配置、聊天记录、用户数据等 |
| **Redis** | `6379` | TCP | 缓存服务，用于会话存储、速率限制、临时数据缓存 |

**端口使用说明**:
- **开发环境**: 所有服务使用上述默认端口
- **生产环境**: 可通过环境变量覆盖端口配置
- **反向代理**: 生产环境建议使用Nginx进行反向代理和负载均衡
- **防火墙**: 仅对外开放必要的端口（如前端3000、API 8001）
- **内部通信**: MongoDB和Redis仅允许内网访问

## 服务详细说明

### 1. 后端API服务 (backend/api)

**技术栈**:
- **框架**: Express.js + TypeScript
- **数据库**: MongoDB (Mongoose ODM)
- **缓存**: Redis
- **AI集成**: OpenAI, Anthropic Claude, Google Gemini
- **实时通信**: Socket.IO
- **安全**: Helmet, CORS, Rate Limiting
- **日志**: Winston
- **验证**: Joi, express-validator

**核心功能**:
- AI模型管理和配置
- 聊天对话处理
- 系统设置管理
- 提示词管理
- LINE服务代理
- 健康检查和监控

**API路由结构**:
```
/api/v1/
├── health          # 健康检查
├── ai-models       # AI模型配置
├── prompts         # 提示词管理
├── settings        # 系统设置
├── chat            # 聊天对话
└── line            # LINE服务代理
```

**环境配置**:
- 端口: 8001 (开发环境)
- MongoDB连接
- Redis配置
- AI API密钥 (OpenAI, Claude, Gemini)
- CORS设置
- 速率限制配置

### 2. LINE Bot服务 (backend/line)

**技术栈**:
- **框架**: Express.js + TypeScript
- **LINE SDK**: @line/bot-sdk
- **缓存**: Redis
- **日志**: Winston
- **安全**: Helmet, Rate Limiting

**核心功能**:
- LINE Webhook处理
- 消息接收和发送
- 用户管理
- 统计数据收集
- WebSocket支持

**服务配置**:
- 端口: 3003
- LINE Channel配置
- Webhook URL设置
- 消息处理逻辑

### 3. MCP股票数据服务 (backend/api/mcp-yfinance-server)

**技术栈**:
- **语言**: Python 3.11+
- **数据源**: Yahoo Finance (yfinance)
- **数据处理**: Pandas, NumPy
- **协议**: MCP (Model Context Protocol)

**核心功能**:
- 股票价格获取
- 历史数据分析
- 技术指标计算 (RSI, MACD, 布林带等)
- 趋势分析
- 基本面数据
- 关注列表管理

**服务配置**:
- **通信方式**: 标准输入输出 (stdio)
- **协议**: MCP (Model Context Protocol)
- **启动方式**: `python3 main.py`
- **进程管理**: 由主API服务调用

**依赖包**:
- yfinance: 股票数据获取
- pandas: 数据处理
- numpy: 数值计算
- matplotlib: 图表生成
- mcp: 协议支持

### 4. 前端管理界面 (frontend/b-end)

**技术栈**:
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router DOM
- **HTTP客户端**: Axios
- **表单**: React Hook Form + Zod
- **UI组件**: Lucide React (图标)
- **动画**: Framer Motion

**服务配置**:
- **端口**: 3000 (开发环境)
- **构建输出**: dist/ 目录
- **开发服务器**: Vite Dev Server
- **生产部署**: 静态文件服务

**核心页面**:
- Gemini API配置页面
- LINE配置管理页面
- 系统提示词管理
- 聊天界面
- 登录认证页面

**特性**:
- 响应式设计
- 实时API测试
- 配置预览功能
- 多语言支持 (i18next)
- 代码高亮显示

### 5. 共享模块 (shared)

**功能**:
- TypeScript类型定义
- 通用工具函数
- 数据验证模式 (Zod)
- 常量定义

## 数据库设计

### MongoDB集合
- **Settings**: 系统配置存储
- **Prompts**: 提示词管理
- **ChatHistory**: 聊天记录
- **LineUsers**: LINE用户数据
- **LineMessages**: LINE消息记录

### Redis缓存
- 会话存储
- 速率限制计数
- 临时数据缓存
- 实时数据存储

## AI模型集成

### 支持的AI提供商
1. **OpenAI**: GPT系列模型
2. **Anthropic**: Claude系列模型
3. **Google**: Gemini 2.5 Pro

### AI功能
- 股票分析对话
- 智能问答
- 数据解读
- 投资建议生成

## 安全配置

### 安全措施
- **Helmet**: HTTP安全头设置
- **CORS**: 跨域资源共享控制
- **Rate Limiting**: API请求频率限制
- **Input Validation**: 输入数据验证
- **Error Handling**: 统一错误处理

### 环境变量管理
- 开发环境: .env
- 生产环境: .env.production (已移除)
- API密钥加密存储

## 部署和运维

### 进程管理
- **PM2**: 生产环境进程管理
- **服务列表**:
  - aiagent-api: 主API服务 (端口: 8001)
  - aiagent-frontend: 前端服务 (端口: 3000)
  - aiagent-line: LINE Bot服务 (端口: 3003)
  - aiagent-mcp: MCP股票数据服务 (stdio通信)

**PM2配置说明**:
- **自动重启**: 服务异常时自动重启
- **负载均衡**: 支持多实例部署
- **日志管理**: 统一日志收集和轮转
- **监控**: 实时性能监控和告警

### 日志管理
- **Winston**: 结构化日志
- **日志级别**: error, warn, info, debug
- **日志轮转**: 按日期分割
- **访问日志**: Morgan中间件

### 监控和健康检查
- **健康检查端点**: /api/v1/health
- **状态监控**: /api/v1/status
- **服务依赖检查**: 数据库、Redis连接状态
- **性能指标**: 内存使用、运行时间

## 开发工作流

### 脚本命令
```bash
# 开发环境
npm run dev              # 启动前端和API
npm run dev:frontend     # 仅启动前端
npm run dev:api         # 仅启动API
npm run dev:line        # 仅启动LINE服务

# 构建
npm run build           # 构建所有模块
npm run build:shared    # 构建共享模块
npm run build:frontend  # 构建前端
npm run build:backend   # 构建后端

# 测试
npm run test            # 运行所有测试
npm run test:api        # API测试
npm run test:line       # LINE服务测试

# 代码质量
npm run lint            # 代码检查
npm run lint:fix        # 自动修复
```

### 开发环境要求
- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **Python**: >=3.11 (MCP服务)
- **MongoDB**: 数据库服务
- **Redis**: 缓存服务

## 配置管理

### 系统设置
- API速率限制配置
- CORS域名设置
- 文件上传限制
- 邮件服务配置
- 日志级别设置

### AI模型配置
- 默认模型选择
- Token限制设置
- 温度参数调整
- API密钥管理

### LINE集成配置
- Channel Access Token
- Channel Secret
- Webhook URL
- 推广链接设置
- 触发条件配置

## 扩展性设计

### 微服务架构优势
- **服务独立**: 各服务可独立部署和扩展
- **技术栈灵活**: 不同服务可使用不同技术
- **故障隔离**: 单个服务故障不影响整体
- **团队协作**: 支持多团队并行开发

### 水平扩展支持
- **负载均衡**: 支持多实例部署
- **数据库分片**: MongoDB集群支持
- **缓存集群**: Redis集群配置
- **CDN集成**: 静态资源分发

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**项目维护**: AI Agent Team  
**最后更新**: 2025年1月
**版本**: 1.0.0