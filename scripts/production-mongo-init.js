// MongoDB生产环境初始化脚本
// 用于在生产服务器上创建与本地相同的数据库结构
// 使用方法: mongosh --host <host> --port <port> --username <username> --password <password> < production-mongo-init.js

// 切换到aiagent数据库
db = db.getSiblingDB('aiagent');

print('开始初始化MongoDB数据库: aiagent');

// 1. 创建users集合
print('创建users集合...');
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: '用户名，3-30字符'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: '邮箱地址'
        },
        password: {
          bsonType: 'string',
          minLength: 60,
          description: 'bcrypt加密密码'
        },
        roles: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
            enum: ['user', 'admin', 'moderator']
          },
          description: '用户角色数组'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'inactive', 'suspended', 'pending'],
          description: '用户状态'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 2. 创建aimodels集合
print('创建aimodels集合...');
db.createCollection('aimodels', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'provider', 'version'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: '模型名称'
        },
        type: {
          bsonType: 'string',
          enum: ['text-generation', 'image-generation', 'embedding', 'chat', 'completion'],
          description: '模型类型'
        },
        provider: {
          bsonType: 'string',
          enum: ['openai', 'anthropic', 'google', 'huggingface', 'custom'],
          description: '提供商'
        },
        version: {
          bsonType: 'string',
          description: '模型版本'
        },
        apiKey: {
          bsonType: 'string',
          description: '加密的API密钥'
        },
        config: {
          bsonType: 'object',
          description: '模型配置参数'
        },
        isActive: {
          bsonType: 'bool',
          description: '是否启用'
        },
        lastTested: {
          bsonType: 'date',
          description: '最后测试时间'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 3. 创建settings集合
print('创建settings集合...');
db.createCollection('settings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'value', 'type'],
      properties: {
        key: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: '设置键名（唯一）'
        },
        value: {
          description: '设置值（混合类型）'
        },
        type: {
          bsonType: 'string',
          enum: ['string', 'number', 'boolean', 'object', 'array'],
          description: '数据类型'
        },
        category: {
          bsonType: 'string',
          enum: ['system', 'ai', 'line', 'security'],
          description: '分类'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: '描述信息'
        },
        isPublic: {
          bsonType: 'bool',
          description: '是否公开'
        },
        isEditable: {
          bsonType: 'bool',
          description: '是否可编辑'
        },
        validation: {
          bsonType: 'object',
          description: '验证规则'
        },
        metadata: {
          bsonType: 'object',
          description: '元数据'
        },
        createdBy: {
          bsonType: 'objectId',
          description: '创建者'
        },
        updatedBy: {
          bsonType: 'objectId',
          description: '更新者'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 4. 创建prompts集合
print('创建prompts集合...');
db.createCollection('prompts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'content'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: '提示词名称'
        },
        content: {
          bsonType: 'string',
          minLength: 1,
          description: '提示词内容'
        },
        category: {
          bsonType: 'string',
          description: '分类'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: '标签数组'
        },
        isActive: {
          bsonType: 'bool',
          description: '是否启用'
        },
        usage: {
          bsonType: 'number',
          minimum: 0,
          description: '使用次数'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 5. 创建chathistory集合
print('创建chathistory集合...');
db.createCollection('chathistory', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId'],
      properties: {
        sessionId: {
          bsonType: 'string',
          description: '会话ID'
        },
        userId: {
          bsonType: 'objectId',
          description: '用户ID'
        },
        messages: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['role', 'content', 'timestamp'],
            properties: {
              role: {
                bsonType: 'string',
                enum: ['user', 'assistant', 'system'],
                description: '消息角色'
              },
              content: {
                bsonType: 'string',
                description: '消息内容'
              },
              timestamp: {
                bsonType: 'date',
                description: '时间戳'
              },
              metadata: {
                bsonType: 'object',
                description: '元数据'
              }
            }
          },
          description: '消息数组'
        },
        model: {
          bsonType: 'string',
          description: '使用的AI模型'
        },
        tokens: {
          bsonType: 'number',
          minimum: 0,
          description: '消耗的token数'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 6. 创建lineusers集合
print('创建lineusers集合...');
db.createCollection('lineusers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['lineUserId'],
      properties: {
        lineUserId: {
          bsonType: 'string',
          description: 'LINE用户ID（唯一）'
        },
        displayName: {
          bsonType: 'string',
          description: '显示名称'
        },
        pictureUrl: {
          bsonType: 'string',
          description: '头像URL'
        },
        statusMessage: {
          bsonType: 'string',
          description: '状态消息'
        },
        language: {
          bsonType: 'string',
          description: '语言设置'
        },
        isBlocked: {
          bsonType: 'bool',
          description: '是否被屏蔽'
        },
        lastActiveAt: {
          bsonType: 'date',
          description: '最后活跃时间'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        },
        updatedAt: {
          bsonType: 'date',
          description: '更新时间'
        }
      }
    }
  }
});

// 7. 创建linemessages集合
print('创建linemessages集合...');
db.createCollection('linemessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['messageId', 'userId', 'type', 'timestamp'],
      properties: {
        messageId: {
          bsonType: 'string',
          description: 'LINE消息ID'
        },
        userId: {
          bsonType: 'string',
          description: 'LINE用户ID'
        },
        type: {
          bsonType: 'string',
          enum: ['text', 'image', 'video', 'audio', 'sticker', 'location'],
          description: '消息类型'
        },
        content: {
          bsonType: 'string',
          description: '消息内容'
        },
        replyToken: {
          bsonType: 'string',
          description: '回复token'
        },
        timestamp: {
          bsonType: 'date',
          description: '时间戳'
        },
        isProcessed: {
          bsonType: 'bool',
          description: '是否已处理'
        },
        response: {
          bsonType: 'string',
          description: 'AI回复内容'
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间'
        }
      }
    }
  }
});

print('创建索引...');

// 创建索引以提高性能

// users集合索引
db.users.createIndex({ 'username': 1 }, { unique: true, name: 'idx_users_username' });
db.users.createIndex({ 'email': 1 }, { unique: true, name: 'idx_users_email' });
db.users.createIndex({ 'roles': 1 }, { name: 'idx_users_roles' });
db.users.createIndex({ 'status': 1 }, { name: 'idx_users_status' });
db.users.createIndex({ 'createdAt': 1 }, { name: 'idx_users_created' });

// aimodels集合索引
db.aimodels.createIndex({ 'name': 1 }, { unique: true, name: 'idx_aimodels_name' });
db.aimodels.createIndex({ 'type': 1 }, { name: 'idx_aimodels_type' });
db.aimodels.createIndex({ 'provider': 1 }, { name: 'idx_aimodels_provider' });
db.aimodels.createIndex({ 'isActive': 1 }, { name: 'idx_aimodels_active' });
db.aimodels.createIndex({ 'createdAt': 1 }, { name: 'idx_aimodels_created' });

// settings集合索引
db.settings.createIndex({ 'key': 1 }, { unique: true, name: 'idx_settings_key' });
db.settings.createIndex({ 'category': 1 }, { name: 'idx_settings_category' });
db.settings.createIndex({ 'isPublic': 1 }, { name: 'idx_settings_public' });
db.settings.createIndex({ 'isEditable': 1 }, { name: 'idx_settings_editable' });

// prompts集合索引
db.prompts.createIndex({ 'name': 1 }, { name: 'idx_prompts_name' });
db.prompts.createIndex({ 'category': 1 }, { name: 'idx_prompts_category' });
db.prompts.createIndex({ 'tags': 1 }, { name: 'idx_prompts_tags' });
db.prompts.createIndex({ 'isActive': 1 }, { name: 'idx_prompts_active' });
db.prompts.createIndex({ 'usage': -1 }, { name: 'idx_prompts_usage' });
db.prompts.createIndex({ 'createdAt': 1 }, { name: 'idx_prompts_created' });

// 创建文本搜索索引
db.prompts.createIndex({
  'name': 'text',
  'content': 'text',
  'tags': 'text'
}, {
  weights: {
    'name': 10,
    'tags': 5,
    'content': 1
  },
  name: 'idx_prompts_text_search'
});

// chathistory集合索引
db.chathistory.createIndex({ 'sessionId': 1 }, { name: 'idx_chathistory_session' });
db.chathistory.createIndex({ 'userId': 1 }, { name: 'idx_chathistory_user' });
db.chathistory.createIndex({ 'createdAt': 1 }, { name: 'idx_chathistory_created' });
db.chathistory.createIndex({ 'model': 1 }, { name: 'idx_chathistory_model' });

// lineusers集合索引
db.lineusers.createIndex({ 'lineUserId': 1 }, { unique: true, name: 'idx_lineusers_lineid' });
db.lineusers.createIndex({ 'isBlocked': 1 }, { name: 'idx_lineusers_blocked' });
db.lineusers.createIndex({ 'lastActiveAt': 1 }, { name: 'idx_lineusers_active' });
db.lineusers.createIndex({ 'createdAt': 1 }, { name: 'idx_lineusers_created' });

// linemessages集合索引
db.linemessages.createIndex({ 'messageId': 1 }, { unique: true, name: 'idx_linemessages_msgid' });
db.linemessages.createIndex({ 'userId': 1 }, { name: 'idx_linemessages_user' });
db.linemessages.createIndex({ 'timestamp': 1 }, { name: 'idx_linemessages_timestamp' });
db.linemessages.createIndex({ 'type': 1 }, { name: 'idx_linemessages_type' });
db.linemessages.createIndex({ 'isProcessed': 1 }, { name: 'idx_linemessages_processed' });
db.linemessages.createIndex({ 'userId': 1, 'timestamp': -1 }, { name: 'idx_linemessages_user_time' });

print('插入默认数据...');

// 插入默认管理员用户（密码: admin123）
const adminUser = {
  username: 'admin',
  email: 'admin@aiagent.local',
  password: '$2b$10$rQZ8kHWKtGY5uJQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5e', // admin123
  roles: ['admin'],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

try {
  db.users.insertOne(adminUser);
  print('✓ 默认管理员用户创建成功 (用户名: admin, 密码: admin123)');
} catch (e) {
  if (e.code === 11000) {
    print('⚠ 管理员用户已存在，跳过创建');
  } else {
    print('✗ 创建管理员用户失败:', e.message);
  }
}

// 插入默认系统设置
const defaultSettings = [
  {
    key: 'app.name',
    value: 'AI智能体系统',
    type: 'string',
    category: 'system',
    description: '应用程序名称',
    isPublic: true,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'app.version',
    value: '1.0.0',
    type: 'string',
    category: 'system',
    description: '应用程序版本',
    isPublic: true,
    isEditable: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'auth.session_timeout',
    value: 86400,
    type: 'number',
    category: 'security',
    description: '会话超时时间（秒）',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'api.rate_limit.requests_per_minute',
    value: 60,
    type: 'number',
    category: 'security',
    description: 'API速率限制（每分钟请求数）',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'ai.default_model',
    value: 'gpt-3.5-turbo',
    type: 'string',
    category: 'ai',
    description: '默认AI模型',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'line.webhook_enabled',
    value: true,
    type: 'boolean',
    category: 'line',
    description: 'LINE Webhook是否启用',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.settings.insertMany(defaultSettings, { ordered: false });
  print('✓ 默认系统设置创建成功');
} catch (e) {
  if (e.code === 11000) {
    print('⚠ 部分系统设置已存在，跳过重复项');
  } else {
    print('✗ 创建系统设置失败:', e.message);
  }
}

// 插入示例AI模型配置
const sampleModels = [
  {
    name: 'GPT-3.5-Turbo',
    type: 'chat',
    provider: 'openai',
    version: '3.5-turbo',
    config: {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'GPT-4',
    type: 'chat',
    provider: 'openai',
    version: '4.0',
    config: {
      maxTokens: 8192,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Claude-3-Sonnet',
    type: 'chat',
    provider: 'anthropic',
    version: '3.0',
    config: {
      maxTokens: 4096,
      temperature: 0.7
    },
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Gemini-2.5-Pro',
    type: 'chat',
    provider: 'google',
    version: '2.5-pro',
    config: {
      maxTokens: 8192,
      temperature: 0.7,
      topP: 0.95,
      topK: 40
    },
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.aimodels.insertMany(sampleModels, { ordered: false });
  print('✓ 示例AI模型配置创建成功');
} catch (e) {
  if (e.code === 11000) {
    print('⚠ 部分AI模型配置已存在，跳过重复项');
  } else {
    print('✗ 创建AI模型配置失败:', e.message);
  }
}

// 插入示例提示词
const samplePrompts = [
  {
    name: '通用助手',
    content: '你是一个有用的AI助手，请根据用户的问题提供准确、有帮助的回答。',
    category: 'general',
    tags: ['助手', '通用', '基础'],
    isActive: true,
    usage: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '代码助手',
    content: '你是一个专业的编程助手，请帮助用户解决编程问题，提供代码示例和最佳实践建议。',
    category: 'programming',
    tags: ['编程', '代码', '开发'],
    isActive: true,
    usage: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '数据分析助手',
    content: '你是一个数据分析专家，请帮助用户分析数据、解释统计结果，并提供数据驱动的见解。',
    category: 'analysis',
    tags: ['数据', '分析', '统计'],
    isActive: true,
    usage: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.prompts.insertMany(samplePrompts, { ordered: false });
  print('✓ 示例提示词创建成功');
} catch (e) {
  if (e.code === 11000) {
    print('⚠ 部分提示词已存在，跳过重复项');
  } else {
    print('✗ 创建提示词失败:', e.message);
  }
}

print('\n=== MongoDB数据库初始化完成 ===');
print('数据库名称: aiagent');
print('创建的集合:');
print('  ✓ users (用户管理)');
print('  ✓ aimodels (AI模型配置)');
print('  ✓ settings (系统设置)');
print('  ✓ prompts (提示词管理)');
print('  ✓ chathistory (聊天记录)');
print('  ✓ lineusers (LINE用户数据)');
print('  ✓ linemessages (LINE消息记录)');
print('\n创建的索引: 已为所有集合创建性能优化索引');
print('\n默认数据:');
print('  ✓ 管理员用户 (用户名: admin, 密码: admin123)');
print('  ✓ 系统设置 (6项基础配置)');
print('  ✓ AI模型配置 (4个示例模型)');
print('  ✓ 提示词模板 (3个示例提示词)');
print('\n数据库初始化成功！');