# AI智能体系统 - 部署配置指南

## 概述

本指南介绍如何使用统一的配置文件进行远程服务器部署。所有部署相关的配置都集中在 `backend/.env-server` 文件中，简化了部署流程。

## 配置文件

### 位置
```
backend/.env-server
```

### 主要配置项

#### 基础配置
- `PROJECT_NAME`: 项目名称
- `DEPLOY_PATH`: 远程服务器部署路径
- `NODE_ENV`: 运行环境（development/production）

#### Git配置
- `GIT_REPO`: Git仓库地址
- `GIT_BRANCH`: Git分支

#### 端口配置
- `API_PORT`: API服务端口（默认：8001）
- `FRONTEND_PORT`: 前端服务端口（默认：3000）
- `LINE_PORT`: LINE服务端口（默认：3003）
- `MONGODB_PORT`: MongoDB端口（默认：27017）
- `REDIS_PORT`: Redis端口（默认：6379）

#### 数据库配置
- `MONGODB_DATABASE`: MongoDB数据库名
- `REDIS_DATABASE`: Redis数据库编号

#### API密钥配置
- `OPENAI_API_KEY`: OpenAI API密钥
- `ANTHROPIC_API_KEY`: Anthropic API密钥
- `GOOGLE_AI_API_KEY`: Google Gemini API密钥

#### LINE Bot配置
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE频道访问令牌
- `LINE_CHANNEL_SECRET`: LINE频道密钥

#### 安全配置
- `JWT_SECRET`: JWT密钥（自动生成）
- `SESSION_SECRET`: Session密钥（自动生成）

## 部署流程

### 1. 配置准备

1. 编辑 `backend/.env-server` 文件
2. 设置必要的配置项（特别是 `GIT_REPO`）
3. 配置API密钥和LINE Bot信息（可选）

### 2. 上传到服务器

将整个项目（包括配置文件）上传到远程服务器：

```bash
# 方式1：使用Git
git clone <your-repo-url> /path/to/project

# 方式2：使用scp
scp -r ./aiagent user@server:/path/to/project
```

### 3. 执行部署

在远程服务器上执行部署脚本：

```bash
# 进入项目目录
cd /path/to/project

# 执行部署（使用默认配置文件）
./scripts/remote-deploy.sh

# 或指定自定义配置文件
./scripts/remote-deploy.sh -c /path/to/custom.env

# 仅执行环境检查
./scripts/remote-deploy.sh --check-only

# 跳过环境检查直接部署
./scripts/remote-deploy.sh --skip-check
```

### 4. 命令行参数覆盖

可以使用命令行参数覆盖配置文件中的设置：

```bash
# 覆盖Git仓库地址
./scripts/remote-deploy.sh -r https://github.com/user/aiagent.git

# 覆盖部署路径
./scripts/remote-deploy.sh -p /opt/myapp

# 覆盖端口配置
./scripts/remote-deploy.sh --api-port 8080 --frontend-port 3001
```

## 配置文件示例

```bash
# 基础配置
PROJECT_NAME=aiagent
DEPLOY_PATH=/opt/aiagent
NODE_ENV=production

# Git配置
GIT_REPO=https://github.com/youruser/aiagent.git
GIT_BRANCH=main

# 端口配置
API_PORT=8001
FRONTEND_PORT=3000
LINE_PORT=3003

# API密钥（请替换为实际值）
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# LINE Bot配置
LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret
```

## 安全注意事项

1. **保护配置文件**：确保 `.env-server` 文件不被提交到公共Git仓库
2. **密钥管理**：定期更换API密钥和安全密钥
3. **权限控制**：设置适当的文件权限（600或644）
4. **环境隔离**：生产环境和开发环境使用不同的配置文件

## 故障排除

### 配置文件未找到
```
配置文件 backend/.env-server 不存在，使用默认配置
```
**解决方案**：确保配置文件存在且路径正确

### Git仓库地址未配置
```
Git仓库地址未配置 (GIT_REPO)
```
**解决方案**：在配置文件中设置 `GIT_REPO` 或使用 `-r` 参数

### 端口冲突
```
端口 8001 (API服务): 已被占用
```
**解决方案**：修改配置文件中的端口设置或停止占用端口的服务

## 监控和维护

部署完成后，可以通过以下方式监控服务状态：

```bash
# 检查PM2进程状态
pm2 status

# 查看服务日志
pm2 logs

# 重启服务
pm2 restart all
```

## 更新部署

当需要更新代码时，可以重新运行部署脚本：

```bash
# 更新代码并重新部署
./scripts/remote-deploy.sh
```

脚本会自动拉取最新代码、重新构建并重启服务。