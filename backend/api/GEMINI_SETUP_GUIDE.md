# Gemini API 配置指南

## 问题诊断

当前您遇到的"无法连接到AI服务"错误是由于以下原因：

1. **API密钥未配置**: 当前使用的是占位符API密钥，不是真实的Gemini API密钥
2. **环境变量配置**: 需要正确设置环境变量
3. **数据库配置**: 需要更新数据库中存储的API密钥

## 解决步骤

### 1. 获取Gemini API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录您的Google账户
3. 点击"Create API Key"
4. 选择一个Google Cloud项目（或创建新项目）
5. 复制生成的API密钥（格式类似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）

### 2. 配置环境变量

编辑 `.env.production` 文件，将占位符替换为您的真实API密钥：

```bash
# 将这行：
GOOGLE_API_KEY=AIzaSyExample_Replace_With_Your_Real_API_Key_Here

# 替换为：
GOOGLE_API_KEY=您的真实API密钥
```

### 3. 更新数据库配置

运行配置更新脚本：

```bash
node update-gemini-config.js
```

### 4. 重启应用

重启您的后端服务以加载新配置：

```bash
# 如果使用PM2
pm2 restart all

# 或者如果直接运行
# 停止当前进程并重新启动
```

## 验证配置

### 检查环境变量

```bash
node -e "require('dotenv').config({path:'.env.production'}); console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0,10) + '...' : 'Not set');"
```

### 检查数据库配置

```bash
node -e "require('dotenv').config({path:'.env.production'}); const mongoose = require('mongoose'); const { Settings } = require('./dist/models/Settings'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const setting = await Settings.getByKey('ai', 'gemini_api_key'); console.log('DB API Key:', setting ? setting.value.substring(0,10) + '...' : 'Not found'); await mongoose.disconnect(); });"
```

### 测试API连接

创建测试脚本：

```javascript
// test-gemini.js
require('dotenv').config({ path: '.env.production' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not found');
    return;
  }
  
  if (apiKey.includes('Example') || apiKey.includes('Replace')) {
    console.error('❌ Please replace placeholder API key');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const result = await model.generateContent('Hello, test message');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connection successful!');
    console.log('Response:', text.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error.message);
  }
}

testGemini();
```

运行测试：

```bash
node test-gemini.js
```

## 常见问题

### 1. API密钥无效
- 确保API密钥正确复制，没有多余的空格
- 确认API密钥在Google AI Studio中是激活状态
- 检查API密钥的配额和限制

### 2. 网络连接问题
- 确保服务器可以访问 `https://generativelanguage.googleapis.com`
- 检查防火墙设置
- 如果在中国大陆，可能需要配置代理

### 3. 权限问题
- 确保Google Cloud项目启用了Generative AI API
- 检查API密钥的权限设置

### 4. 配额限制
- 检查API使用配额
- 确认没有超出免费层限制

## 代码中的关键配置

### 环境变量优先级

在 `app.ts` 中，系统按以下优先级读取API密钥：

1. `GOOGLE_API_KEY` (推荐，符合官方文档)
2. `GOOGLE_AI_API_KEY` (向后兼容)

### 初始化代码

```typescript
// chat.ts 中的关键代码
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
const model = genAI.getGenerativeModel({ model: geminiConfig.model });
```

## 完成配置后

1. ✅ 获取真实的Gemini API密钥
2. ✅ 更新 `.env.production` 文件
3. ✅ 运行 `update-gemini-config.js` 更新数据库
4. ✅ 重启应用服务
5. ✅ 测试聊天功能

配置完成后，您应该能够正常使用AI聊天功能，不再出现"无法连接到AI服务"的错误。