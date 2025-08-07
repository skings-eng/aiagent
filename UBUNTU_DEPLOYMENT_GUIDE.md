# Ubuntu 服务器部署指南

## 问题诊断

如果遇到 `[PM2][ERROR] Error: Script not found` 错误，请按以下步骤排查：

### 1. 检查构建文件是否存在

```bash
# 在项目根目录执行
ls -la backend/api/dist/server.js
ls -la backend/line/dist/index.js
ls -la frontend/b-end/dist/index.html
```

如果文件不存在，说明构建过程失败。

### 2. 手动执行构建过程

```bash
# 确保在项目根目录
cd /home/ubuntu/aiagent

# 安装依赖
npm install

# 手动构建
npm run build

# 检查构建结果
echo "API build:"
ls -la backend/api/dist/
echo "LINE build:"
ls -la backend/line/dist/
echo "Frontend build:"
ls -la frontend/b-end/dist/
```

### 3. 检查 Node.js 和 npm 版本

```bash
node --version  # 应该是 v18 或更高
npm --version   # 应该是 v8 或更高
```

### 4. 检查项目目录权限

```bash
# 确保用户对项目目录有完整权限
sudo chown -R $USER:$USER /home/ubuntu/aiagent
chmod -R 755 /home/ubuntu/aiagent
```

### 5. 检查 PM2 配置

```bash
# 查看生成的 PM2 配置
cat ecosystem.config.js

# 验证路径是否正确
echo "当前目录: $(pwd)"
echo "API 脚本路径: $(realpath backend/api/dist/server.js)"
echo "LINE 脚本路径: $(realpath backend/line/dist/index.js)"
```

## 完整部署步骤

### 1. 环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git
```

### 2. 克隆项目

```bash
# 克隆到 /home/ubuntu/aiagent
cd /home/ubuntu
git clone <your-repository-url> aiagent
cd aiagent
```

### 3. 运行部署脚本

```bash
# 赋予执行权限
chmod +x deploy-production.sh

# 运行部署脚本
./deploy-production.sh
```

### 4. 验证部署

```bash
# 检查 PM2 状态
pm2 status

# 查看日志
pm2 logs

# 检查服务是否运行
curl http://localhost:3001/health  # API 健康检查
curl http://localhost:4173         # 前端页面
curl http://localhost:3003/health  # LINE 服务健康检查
```

## 常见问题解决

### 问题 1: TypeScript 编译失败

```bash
# 检查 TypeScript 是否安装
npx tsc --version

# 如果没有安装，全局安装 TypeScript
sudo npm install -g typescript

# 重新构建
npm run build
```

### 问题 2: 依赖安装失败

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 3: 端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :4173
sudo netstat -tlnp | grep :3003

# 杀死占用端口的进程
sudo kill -9 <PID>
```

### 问题 4: PM2 启动失败

```bash
# 停止所有 PM2 进程
pm2 stop all
pm2 delete all

# 重新启动
pm2 start ecosystem.config.js

# 查看详细错误信息
pm2 logs --lines 50
```

## 监控和维护

### 查看服务状态

```bash
# PM2 状态
pm2 status
pm2 monit

# 系统资源
top
df -h
free -h
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建和重启
npm run build
pm2 reload ecosystem.config.js
```

### 备份和恢复

```bash
# 备份 PM2 配置
pm2 save

# 设置开机自启
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

## 安全建议

1. 配置防火墙只开放必要端口
2. 使用 HTTPS (配置 Nginx 反向代理)
3. 定期更新系统和依赖
4. 监控日志文件大小
5. 设置自动备份

## 联系支持

如果问题仍然存在，请提供以下信息：

1. `npm --version` 和 `node --version` 输出
2. `pm2 logs` 的完整输出
3. `ls -la backend/api/dist/` 和 `ls -la backend/line/dist/` 输出
4. 部署脚本的完整执行日志