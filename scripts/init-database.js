// AI智能体系统 - MongoDB数据库初始化脚本

// 切换到目标数据库
use('aiagent');

// 创建用户集合
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "lastLoginAt": 1 });
db.users.createIndex({ "role": 1 });

// 创建对话集合
db.createCollection('conversations');
db.conversations.createIndex({ "userId": 1 });
db.conversations.createIndex({ "createdAt": 1 });
db.conversations.createIndex({ "updatedAt": 1 });
db.conversations.createIndex({ "title": "text" });

// 创建消息集合
db.createCollection('messages');
db.messages.createIndex({ "conversationId": 1 });
db.messages.createIndex({ "userId": 1 });
db.messages.createIndex({ "createdAt": 1 });
db.messages.createIndex({ "role": 1 });
db.messages.createIndex({ "content": "text" });

// 创建设置集合
db.createCollection('settings');
db.settings.createIndex({ "key": 1 }, { unique: true });
db.settings.createIndex({ "category": 1 });
db.settings.createIndex({ "updatedAt": 1 });

// 创建AI模型集合
db.createCollection('aimodels');
db.aimodels.createIndex({ "name": 1 }, { unique: true });
db.aimodels.createIndex({ "provider": 1 });
db.aimodels.createIndex({ "isActive": 1 });
db.aimodels.createIndex({ "createdAt": 1 });

// 插入默认管理员用户
db.users.insertOne({
  username: "admin",
  email: "admin@aiagent.com",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq8S/EO", // admin123
  role: "admin",
  isActive: true,
  profile: {
    firstName: "Admin",
    lastName: "User",
    avatar: ""
  },
  preferences: {
    language: "zh-CN",
    theme: "light",
    notifications: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// 插入默认系统设置
db.settings.insertMany([
  {
    key: "system.name",
    value: "AI智能体系统",
    category: "system",
    description: "系统名称",
    type: "string",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "system.version",
    value: "1.0.0",
    category: "system",
    description: "系统版本",
    type: "string",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "ai.default_model",
    value: "gpt-3.5-turbo",
    category: "ai",
    description: "默认AI模型",
    type: "string",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "ai.max_tokens",
    value: 2048,
    category: "ai",
    description: "最大令牌数",
    type: "number",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 插入默认AI模型配置
db.aimodels.insertMany([
  {
    name: "gpt-3.5-turbo",
    displayName: "GPT-3.5 Turbo",
    provider: "openai",
    description: "OpenAI GPT-3.5 Turbo模型",
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    isActive: true,
    capabilities: ["chat", "completion"],
    config: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "gpt-4",
    displayName: "GPT-4",
    provider: "openai",
    description: "OpenAI GPT-4模型",
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    isActive: true,
    capabilities: ["chat", "completion", "analysis"],
    config: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "claude-3-sonnet",
    displayName: "Claude 3 Sonnet",
    provider: "anthropic",
    description: "Anthropic Claude 3 Sonnet模型",
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    isActive: true,
    capabilities: ["chat", "completion", "analysis"],
    config: {
      temperature: 0.7,
      maxTokens: 4096
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "gemini-pro",
    displayName: "Gemini Pro",
    provider: "google",
    description: "Google Gemini Pro模型",
    maxTokens: 32768,
    costPer1kTokens: 0.001,
    isActive: true,
    capabilities: ["chat", "completion", "multimodal"],
    config: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("数据库初始化完成！");
print("默认管理员账户: admin / admin123");
print("请及时修改默认密码！");
