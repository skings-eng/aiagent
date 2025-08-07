# Gemini API Key 配置问题分析与解决方案

## 问题描述

用户反映在本地测试Gemini API key可以成功，但在Ubuntu服务器上测试失败且无法保存配置。

## 问题分析

### 1. 环境差异分析

#### 本地环境 vs Ubuntu环境
- **本地环境**: macOS/Windows，开发模式
- **Ubuntu环境**: Linux服务器，生产模式
- **配置文件差异**: 不同的环境变量文件和数据库配置

### 2. 可能的根本原因

#### 2.1 数据库连接问题
```javascript
// Settings模型需要MongoDB连接才能保存配置
// 如果MongoDB连接失败，配置保存会失败
const existingSetting = await Settings.getByKey('ai', 'gemini_api_key');
```

**检查点：**
- MongoDB服务是否在Ubuntu上正常运行
- 数据库连接字符串是否正确
- 网络连接是否正常

#### 2.2 环境变量配置问题
```bash
# 生产环境配置文件: backend/api/.env.production
MONGODB_URI=mongodb://localhost:27017/japan_stock_ai_prod
GOOGLE_AI_API_KEY=AIzaSyCAWckxmtKkHq4ELpEkvViz4bsLUc2SOHw
```

**问题：**
- Ubuntu环境可能没有正确加载 `.env` 文件
- 数据库名称不一致（开发环境 vs 生产环境）
- API key可能被环境变量覆盖

#### 2.3 权限和文件系统问题
```javascript
// Settings模型需要写入权限
await Settings.create({
  category: 'ai',
  key: 'gemini_api_key',
  value: apiKey,
  // ...
});
```

**检查点：**
- MongoDB数据目录权限
- Node.js进程权限
- 文件系统权限

#### 2.4 网络连接问题
```javascript
// Gemini API测试需要外网连接
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

**检查点：**
- Ubuntu服务器是否能访问Google AI API
- 防火墙设置
- 代理配置

### 3. 代码层面的问题

#### 3.1 错误处理不完善
```javascript
// aiModels.ts 中的错误处理可能掩盖了真实问题
catch (error) {
  logger.error('Error saving Gemini configuration', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  // 错误信息可能不够详细
}
```

#### 3.2 数据库初始化问题
```javascript
// app.ts 中的初始化逻辑
const initializeGeminiFromEnv = async () => {
  // 这个函数可能在数据库连接建立之前执行
};
```

## 解决方案

### 步骤1：检查系统服务状态

```bash
# 在Ubuntu服务器上执行
sudo systemctl status mongod
sudo systemctl status redis

# 如果服务未运行，启动服务
sudo systemctl start mongod
sudo systemctl start redis
sudo systemctl enable mongod
sudo systemctl enable redis
```

### 步骤2：验证数据库连接

```bash
# 进入后端API目录
cd /path/to/aiagent/backend/api

# 运行数据库连接测试
node test-db-connection.js
```

### 步骤3：检查环境变量配置

```bash
# 确保环境变量文件存在且配置正确
ls -la backend/api/.env*

# 检查环境变量是否正确加载
cd backend/api
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI); console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'SET' : 'NOT SET');"
```

### 步骤4：手动测试Gemini配置

```bash
# 在后端API目录下运行
node check_gemini_config.js
```

### 步骤5：检查网络连接

```bash
# 测试是否能访问Google AI API
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

### 步骤6：查看详细日志

```bash
# 查看PM2日志
pm2 logs aiagent-api

# 查看MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log

# 查看系统日志
sudo journalctl -u mongod -f
```

## 临时解决方案

如果问题持续存在，可以尝试以下临时解决方案：

### 1. 直接在环境变量中设置API Key

```bash
# 编辑环境变量文件
nano backend/api/.env

# 添加或修改
GOOGLE_AI_API_KEY=你的实际API密钥

# 重启服务
pm2 restart aiagent-api
```

### 2. 手动初始化数据库配置

```javascript
// 创建临时脚本 init-gemini.js
const mongoose = require('mongoose');
const { Settings } = require('./dist/models/Settings');

async function initGemini() {
  try {
    await mongoose.connect('mongodb://localhost:27017/japan-stock-ai');
    
    const userObjectId = new mongoose.Types.ObjectId();
    
    await Settings.create({
      category: 'ai',
      key: 'gemini_api_key',
      value: 'YOUR_ACTUAL_API_KEY',
      type: 'string',
      description: 'Gemini AI API key',
      isPublic: false,
      isEditable: true,
      metadata: { group: 'gemini', sensitive: true },
      createdBy: userObjectId,
      updatedBy: userObjectId,
    });
    
    console.log('Gemini API key initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initGemini();
```

## 预防措施

1. **环境一致性**: 确保开发和生产环境的配置一致
2. **错误监控**: 添加更详细的错误日志和监控
3. **健康检查**: 定期检查数据库和API连接状态
4. **备份配置**: 定期备份重要配置数据

## 联系支持

如果问题仍然存在，请提供以下信息：
- Ubuntu版本和系统信息
- MongoDB和Redis服务状态
- 完整的错误日志
- 网络连接测试结果