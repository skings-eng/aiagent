# 🚀 智能投资助手 - 5分钟快速部署

> 专为新手准备的超简单部署指南

## 📋 准备工作

你需要：
- 一台Ubuntu服务器（20.04或更新版本）
- Gemini API密钥（[获取地址](https://makersuite.google.com/app/apikey)）
- 5分钟时间

## 🎯 一键部署（复制粘贴即可）

### 步骤1：安装环境

```bash
# 复制粘贴运行（一次性安装所有依赖）
curl -fsSL https://raw.githubusercontent.com/你的用户名/aiagent/main/install.sh | bash
```

如果上面的命令不可用，手动安装：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装其他依赖
sudo apt install -y git python3 python3-pip python3-venv build-essential
sudo npm install -g pm2
```

### 步骤2：下载项目

```bash
# 下载项目
git clone https://github.com/你的用户名/aiagent.git /opt/aiagent
cd /opt/aiagent

# 设置权限
sudo chown -R $USER:$USER /opt/aiagent
chmod +x *.sh
```

### 步骤3：配置API密钥

```bash
# 复制配置文件
cp backend/api/.env.example backend/api/.env

# 编辑配置（只需要改一个地方）
nano backend/api/.env
```

**重要：** 只需要修改这一行：
```
GEMINI_API_KEY=你的真实API密钥
```

保存并退出（Ctrl+X，然后按Y，再按Enter）

### 步骤4：一键启动

```bash
# 一键启动所有服务
./start-services.sh
```

等待2-3分钟，看到 "✅ 智能投资助手启动完成！" 就成功了！

## 🎉 开始使用

### 网页版（推荐新手）

在浏览器打开：`http://你的服务器IP:3000`

### 快速测试

1. **测试API**：`curl http://localhost:3001/health`
2. **测试聊天**：在网页上发送 "帮我分析AAPL股票"

## 🔧 常用操作

```bash
# 查看服务状态
pm2 status

# 查看日志（如果有问题）
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
./stop-services.sh
```

## ❗ 遇到问题？

### 问题1：端口被占用
```bash
sudo netstat -tulpn | grep :3001
sudo kill -9 进程号
```

### 问题2：API密钥错误
- 检查 `backend/api/.env` 文件中的 `GEMINI_API_KEY`
- 确保API密钥有效且有额度

### 问题3：服务启动失败
```bash
# 查看详细错误
pm2 logs

# 重新启动
./start-services.sh
```

### 问题4：无法访问网页
- 检查防火墙：`sudo ufw allow 3000`
- 确认服务器IP地址正确

## 📱 LINE Bot配置（可选）

如果你想要LINE Bot功能：

1. 去 [LINE Developers](https://developers.line.biz/) 注册
2. 创建Messaging API应用
3. 获取 Channel Access Token 和 Channel Secret
4. 编辑 `backend/line/.env` 文件
5. 重启：`pm2 restart aiagent-line`

**新手建议：** 先用网页版熟悉功能，LINE Bot可以后续再配置。

## 🎯 功能介绍

- 📊 **股票分析**：输入股票代码获取详细分析
- 📈 **技术指标**：RSI、MACD、布林带等
- 💡 **投资建议**：基于AI的个性化建议
- 📱 **多平台**：网页版 + LINE Bot
- 🔄 **实时数据**：最新市场数据

## 🆘 获取帮助

- 📖 详细文档：查看 `README.md`
- 🔧 部署问题：查看 `DEPLOYMENT.md`
- 📝 日志分析：`pm2 logs`

---

**恭喜！** 你的智能投资助手现在已经运行了！🎉

试试发送 "分析TSLA股票" 或 "今日市场如何" 开始体验吧！