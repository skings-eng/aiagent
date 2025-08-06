# 智能投资助手 - 新手部署指南

## 🚀 快速开始

这是一个为新手准备的简化部署指南，只需要几个步骤就能在Ubuntu服务器上运行智能投资助手。

## 📋 系统要求

- Ubuntu 20.04 LTS 或更高版本
- 至少 2GB 内存
- 至少 10GB 硬盘空间

## 🛠️ 一键部署步骤

### 第一步：准备服务器

```bash
# 更新系统（复制粘贴运行）
sudo apt update && sudo apt upgrade -y

# 安装必要软件（复制粘贴运行）
sudo apt install -y curl wget git build-essential

# 安装 Node.js（复制粘贴运行）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Python（复制粘贴运行）
sudo apt install -y python3 python3-pip python3-venv

# 安装进程管理工具（复制粘贴运行）
sudo npm install -g pm2
```

### 第二步：下载项目

```bash
# 下载项目到服务器（替换成你的项目地址）
git clone <你的项目地址> /opt/aiagent
cd /opt/aiagent

# 设置文件权限
sudo chown -R $USER:$USER /opt/aiagent
chmod +x start-services.sh
chmod +x stop-services.sh
```

### 第三步：配置环境变量

#### 3.1 配置后端API

```bash
cd /opt/aiagent/backend/api
cp .env.example .env
nano .env
```

**重要：** 只需要修改这几个配置：

```env
# 必须配置：你的Gemini API密钥
GEMINI_API_KEY=你的gemini_api密钥

# 其他保持默认即可
PORT=3001
NODE_ENV=production
GEMINI_MODEL=gemini-1.5-flash
CORS_ORIGIN=*
LOG_LEVEL=info
```

#### 3.2 配置LINE（简化版）

```bash
cd /opt/aiagent/backend/line
cp .env.example .env
nano .env
```

**注意：** LINE配置非常简单，只需要填写：

```env
# LINE配置（如果你有LINE Bot，填写；没有可以先跳过）
LINE_CHANNEL_ACCESS_TOKEN=你的line_token（可选）
LINE_CHANNEL_SECRET=你的line_secret（可选）

# 其他保持默认
PORT=3002
NODE_ENV=production
API_BASE_URL=http://localhost:3001
```

**新手提示：** 如果你暂时不使用LINE功能，可以先跳过LINE配置，系统依然可以正常运行网页版。

### 第四步：一键启动

```bash
# 回到项目根目录
cd /opt/aiagent

# 运行一键启动脚本
./start-services.sh
```

脚本会自动：
- 安装所有依赖
- 构建项目
- 启动所有服务
- 显示运行状态

### 第五步：验证部署

启动完成后，你应该看到类似输出：

```
✅ 所有服务启动成功！

📊 服务状态：
- API服务: http://localhost:3001 ✅
- LINE服务: http://localhost:3002 ✅  
- 前端服务: http://localhost:3000 ✅
- MCP服务: 运行中 ✅

🌐 访问地址：
- 网页版: http://你的服务器IP:3000
- API接口: http://你的服务器IP:3001
```

## 🎯 快速测试

1. **测试网页版**：在浏览器打开 `http://你的服务器IP:3000`
2. **测试API**：访问 `http://你的服务器IP:3001/health` 应该返回 "OK"
3. **测试聊天功能**：在网页上发送消息测试AI回复

## 📱 LINE Bot配置（可选）

如果你想使用LINE Bot功能：

1. 去 [LINE Developers](https://developers.line.biz/) 创建应用
2. 获取 `Channel Access Token` 和 `Channel Secret`
3. 填写到 `/opt/aiagent/backend/line/.env` 文件中
4. 重启服务：`pm2 restart aiagent-line`

## 🔧 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启所有服务
pm2 restart all

# 停止所有服务
./stop-services.sh

# 重新启动
./start-services.sh
```

## ❗ 常见问题

### 问题1：端口被占用
```bash
# 查看端口占用
sudo netstat -tulpn | grep :3001
# 杀死占用进程
sudo kill -9 进程ID
```

### 问题2：权限错误
```bash
# 重新设置权限
sudo chown -R $USER:$USER /opt/aiagent
chmod +x /opt/aiagent/*.sh
```

### 问题3：Gemini API不工作
- 检查API密钥是否正确
- 确认API密钥有足够额度
- 检查网络连接

### 问题4：服务启动失败
```bash
# 查看详细错误
pm2 logs
# 手动重启
pm2 restart all
```

## 🔒 安全设置（推荐）

```bash
# 开启防火墙
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # 前端
sudo ufw allow 3001  # API
```

## 📞 获取帮助

- 查看项目README.md了解更多功能
- 检查日志文件：`pm2 logs`
- 确保所有环境变量正确配置

## 🎉 完成！

恭喜！你的智能投资助手现在已经在服务器上运行了。你可以：

1. 通过网页版使用AI投资建议
2. 查看股票分析和技术指标
3. 获取实时市场数据
4. （可选）通过LINE Bot使用

**新手提示：** 建议先熟悉网页版功能，LINE Bot可以后续再配置。