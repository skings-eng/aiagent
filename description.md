# AI智能体系统 - 项目架构说明

## 项目概述

本项目是一个基于AI的智能体系统，提供AI对话、LINE Bot集成、股票数据分析等功能。系统采用微服务架构，支持多种AI模型，并提供Web管理界面。

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
| **MCP数据服务** | `stdio` | MCP | 基于MCP协议的金融数据服务，通过标准输入输出通信 |
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
默认管理员账户:
  用户名: admin
  密码: admin123
  请登录后立即修改默认密码！

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

### 3. MCP数据服务 (backend/api/mcp-yfinance-server)

**技术栈**:
- **语言**: Python 3.11+
- **数据源**: Yahoo Finance (yfinance)
- **数据处理**: Pandas, NumPy
- **协议**: MCP (Model Context Protocol)

**核心功能**:
- 金融数据获取
- 历史数据分析
- 技术指标计算
- 趋势分析
- 数据可视化
- 关注列表管理

**服务配置**:
- **通信方式**: 标准输入输出 (stdio)
- **协议**: MCP (Model Context Protocol)
- **启动方式**: `python3 main.py`
- **进程管理**: 由主API服务调用

**依赖包**:
- yfinance: 金融数据获取
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

### MongoDB 数据库

**连接配置**:
- **默认URI**: `mongodb://localhost:27017/aiagent`
- **数据库名**: `aiagent`
- **连接池**: 最大10个连接
- **超时设置**: 服务器选择5秒，Socket 45秒
- **环境变量**: `MONGODB_URI`

**集合结构**:

#### 1. users 集合
```javascript
{
  username: String,     // 用户名 (3-30字符)
  email: String,        // 邮箱地址
  password: String,     // bcrypt加密密码
  roles: [String],      // 角色: ['user', 'admin', 'moderator']
  status: String,       // 状态: 'active', 'inactive', 'suspended', 'pending'
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. aimodels 集合
```javascript
{
  name: String,         // 模型名称
  type: String,         // 类型: 'text-generation', 'image-generation', 'embedding', 'chat', 'completion'
  provider: String,     // 提供商: 'openai', 'anthropic', 'google'
  version: String,      // 模型版本
  apiKey: String,       // 加密的API密钥
  config: Object,       // 模型配置参数
  isActive: Boolean,    // 是否启用
  lastTested: Date,     // 最后测试时间
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. settings 集合
```javascript
{
  key: String,          // 设置键名 (唯一)
  value: Mixed,         // 设置值
  type: String,         // 数据类型: 'string', 'number', 'boolean', 'object', 'array'
  category: String,     // 分类: 'system', 'ai', 'line', 'security'
  description: String,  // 描述信息
  isPublic: Boolean,    // 是否公开
  isEditable: Boolean,  // 是否可编辑
  validation: Object,   // 验证规则
  metadata: Object,     // 元数据
  createdBy: ObjectId,  // 创建者
  updatedBy: ObjectId,  // 更新者
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. prompts 集合
```javascript
{
  name: String,         // 提示词名称
  content: String,      // 提示词内容
  category: String,     // 分类
  tags: [String],       // 标签
  isActive: Boolean,    // 是否启用
  usage: Number,        // 使用次数
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. chathistory 集合
```javascript
{
  sessionId: String,    // 会话ID
  userId: ObjectId,     // 用户ID
  messages: [{
    role: String,       // 'user', 'assistant', 'system'
    content: String,    // 消息内容
    timestamp: Date,    // 时间戳
    metadata: Object    // 元数据
  }],
  model: String,        // 使用的AI模型
  tokens: Number,       // 消耗的token数
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. lineusers 集合
```javascript
{
  lineUserId: String,   // LINE用户ID (唯一)
  displayName: String,  // 显示名称
  pictureUrl: String,   // 头像URL
  statusMessage: String,// 状态消息
  language: String,     // 语言设置
  isBlocked: Boolean,   // 是否被屏蔽
  lastActiveAt: Date,   // 最后活跃时间
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. linemessages 集合
```javascript
{
  messageId: String,    // LINE消息ID
  userId: String,       // LINE用户ID
  type: String,         // 消息类型: 'text', 'image', 'video', 'audio'
  content: String,      // 消息内容
  replyToken: String,   // 回复token
  timestamp: Date,      // 时间戳
  isProcessed: Boolean, // 是否已处理
  response: String,     // AI回复内容
  createdAt: Date
}
```

**索引配置**:
- users: `username`, `email` (唯一索引)
- settings: `key` (唯一索引), `category`
- chathistory: `sessionId`, `userId`, `createdAt`
- lineusers: `lineUserId` (唯一索引)
- linemessages: `userId`, `timestamp`

### Redis 缓存数据库

**连接配置**:
- **默认地址**: `redis://localhost:6379`
- **数据库**: 0 (默认)
- **连接超时**: 10秒
- **命令超时**: 5秒
- **重试策略**: 最多3次，延迟递增
- **环境变量**: `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_DB`

**缓存策略**:

#### 1. 会话存储
```
Key格式: session:{sessionId}
数据类型: String (JSON)
过期时间: 24小时 (86400秒)
内容: {
  userId: String,
  createdAt: Date,
  lastAccessAt: Date,
  metadata: Object
}
```

#### 2. 速率限制
```
Key格式: rate_limit:{ip}:{endpoint}
数据类型: String (计数器)
过期时间: 1小时 (3600秒)
内容: 请求次数
```

#### 3. AI模型配置缓存
```
Key格式: gemini_config:global
数据类型: String (JSON)
过期时间: 1小时 (3600秒)
内容: {
  model: String,
  provider: String,
  lastTested: String,
  isConnected: Boolean
}
```

#### 4. 公共设置缓存
```
Key格式: settings:public
数据类型: String (JSON)
过期时间: 30分钟 (1800秒)
内容: 所有公开设置的JSON数组
```

#### 5. LINE用户状态
```
Key格式: line_user:{userId}:status
数据类型: String
过期时间: 1小时 (3600秒)
内容: 用户当前状态信息
```

#### 6. 临时数据存储
```
Key格式: temp:{type}:{id}
数据类型: String (JSON)
过期时间: 15分钟 (900秒)
内容: 临时处理数据
```

**Redis工具类**:
- **CacheService**: 通用缓存操作
- **SessionManager**: 会话管理
- **RateLimiter**: 速率限制
- **TempStorage**: 临时存储

**监控和维护**:
- 连接状态监控
- 内存使用监控
- 键过期策略
- 数据备份策略
- 性能优化配置

## AI模型集成

### 支持的AI提供商
1. **OpenAI**: GPT系列模型
2. **Anthropic**: Claude系列模型
3. **Google**: Gemini 2.5 Pro

### AI功能
- 智能对话
- 问答系统
- 数据分析
- 内容生成
- 多模态处理
- 自然语言理解

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
  - aiagent-mcp: MCP数据服务 (stdio通信)

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