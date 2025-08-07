# Gemini API Key 配置修复工具

当您在Ubuntu环境中遇到Gemini API Key测试失败或无法保存配置的问题时，可以使用以下工具进行诊断和修复。

## 🛠️ 可用工具

### 1. 快速修复脚本 (推荐)
```bash
./quick-fix-gemini.sh
```

**功能：**
- 自动检查并启动MongoDB和Redis服务
- 创建或修复环境变量文件
- 构建项目（如果需要）
- 测试数据库连接
- 重启PM2服务

**使用选项：**
```bash
./quick-fix-gemini.sh --help        # 显示帮助
./quick-fix-gemini.sh --check-only  # 仅检查状态
./quick-fix-gemini.sh --no-restart  # 修复但不重启服务
```

### 2. 详细诊断脚本
```bash
node diagnose-gemini-issue.js
```

**功能：**
- 全面检查系统环境
- 详细的错误诊断
- 生成诊断报告
- 提供具体的解决方案建议

### 3. 交互式修复脚本
```bash
node fix-gemini-config.js
```

**功能：**
- 交互式修复流程
- 逐步确认每个修复操作
- 自动初始化数据库配置
- 生成详细的修复报告

## 🚀 推荐使用流程

### 步骤1：快速修复
```bash
# 在项目根目录下运行
./quick-fix-gemini.sh
```

### 步骤2：设置API Key
编辑环境变量文件：
```bash
nano backend/api/.env
```

找到并修改：
```env
GOOGLE_AI_API_KEY=your-actual-api-key-here
```

### 步骤3：重启服务
```bash
pm2 restart all
```

### 步骤4：验证配置
```bash
# 检查服务状态
pm2 status

# 测试API
curl http://localhost:3001/api/ai-models/gemini/status

# 查看日志
pm2 logs
```

## 🔍 故障排查

### 如果快速修复失败
运行详细诊断：
```bash
node diagnose-gemini-issue.js
```

### 如果需要交互式修复
运行交互式脚本：
```bash
node fix-gemini-config.js
```

### 常见问题解决

#### 0. 数据库名称不匹配
**问题：** Ubuntu环境使用 `aiagent_prod`，但代码默认使用 `japan-stock-ai`

**解决方案：**
```bash
# 检查当前配置
grep MONGODB_URI backend/api/.env

# 确保使用正确的数据库名称
echo "MONGODB_URI=mongodb://localhost:27017/aiagent_prod" >> backend/api/.env
```

#### 1. MongoDB连接失败
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 2. Redis连接失败
```bash
# 检查Redis状态
sudo systemctl status redis

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### 3. 端口被占用
```bash
# 查看端口占用
netstat -tuln | grep -E ':(3001|3003|4173|27017|6379)'

# 杀死占用进程
sudo lsof -ti:3001 | xargs sudo kill -9
```

#### 4. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

#### 5. 环境变量未生效
```bash
# 重新加载环境变量
source backend/api/.env

# 或重启终端会话
```

## 📋 检查清单

在联系技术支持之前，请确认以下项目：

- [ ] MongoDB服务正在运行
- [ ] Redis服务正在运行
- [ ] 环境变量文件存在且包含有效的API Key
- [ ] 项目已正确构建（存在dist目录）
- [ ] 所需端口未被其他进程占用
- [ ] PM2服务正在运行
- [ ] 网络连接正常（可以访问Google AI API）
- [ ] 数据库名称配置正确（详见 `DATABASE_CONFIG_GUIDE.md`）

## 🆘 获取帮助

如果以上工具都无法解决问题，请：

1. 运行完整诊断：
   ```bash
   node diagnose-gemini-issue.js > diagnosis-report.txt
   ```

2. 收集日志：
   ```bash
   pm2 logs > pm2-logs.txt
   ```

3. 提供以下信息：
   - 操作系统版本：`lsb_release -a`
   - Node.js版本：`node --version`
   - npm版本：`npm --version`
   - 诊断报告：`diagnosis-report.txt`
   - PM2日志：`pm2-logs.txt`
   - 错误截图或具体错误信息

## 📝 注意事项

1. **API Key安全**：请确保不要将真实的API Key提交到版本控制系统
2. **权限要求**：某些操作可能需要sudo权限
3. **服务依赖**：确保MongoDB和Redis服务正常运行
4. **网络要求**：确保服务器可以访问Google AI API
5. **资源要求**：确保服务器有足够的内存和磁盘空间

---

**最后更新：** 2024年12月
**适用版本：** 智能投资助手 v1.0+