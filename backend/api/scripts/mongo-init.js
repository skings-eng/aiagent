// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the aiagent database
db = db.getSiblingDB('aiagent');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 60 // bcrypt hash length
        },
        roles: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
            enum: ['user', 'admin', 'moderator']
          }
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'inactive', 'suspended', 'pending']
        }
      }
    }
  }
});

db.createCollection('aimodels', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'provider', 'version'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        type: {
          bsonType: 'string',
          enum: ['text-generation', 'image-generation', 'embedding', 'chat', 'completion']
        },
        provider: {
          bsonType: 'string',
          enum: ['openai', 'anthropic', 'google', 'huggingface', 'custom']
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'inactive', 'deprecated', 'maintenance']
        }
      }
    }
  }
});

db.createCollection('prompts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'content', 'category', 'owner'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200
        },
        content: {
          bsonType: 'string',
          minLength: 1
        },
        category: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        language: {
          bsonType: 'string',
          pattern: '^[a-z]{2}(-[A-Z]{2})?$' // ISO language codes
        },
        difficulty: {
          bsonType: 'string',
          enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
      }
    }
  }
});

db.createCollection('settings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'value', 'type'],
      properties: {
        key: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        type: {
          bsonType: 'string',
          enum: ['string', 'number', 'boolean', 'object', 'array']
        },
        category: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        }
      }
    }
  }
});

// Create indexes for better performance

// Users collection indexes
db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'roles': 1 });
db.users.createIndex({ 'status': 1 });
db.users.createIndex({ 'createdAt': 1 });
db.users.createIndex({ 'lastLoginAt': 1 });

// AI Models collection indexes
db.aimodels.createIndex({ 'name': 1 }, { unique: true });
db.aimodels.createIndex({ 'type': 1 });
db.aimodels.createIndex({ 'provider': 1 });
db.aimodels.createIndex({ 'status': 1 });
db.aimodels.createIndex({ 'createdAt': 1 });

// Prompts collection indexes
db.prompts.createIndex({ 'name': 1, 'owner': 1 }, { unique: true });
db.prompts.createIndex({ 'owner': 1 });
db.prompts.createIndex({ 'category': 1 });
db.prompts.createIndex({ 'tags': 1 });
db.prompts.createIndex({ 'language': 1 });
db.prompts.createIndex({ 'difficulty': 1 });
db.prompts.createIndex({ 'isPublic': 1 });
db.prompts.createIndex({ 'active': 1 });
db.prompts.createIndex({ 'createdAt': 1 });
db.prompts.createIndex({ 'updatedAt': 1 });
db.prompts.createIndex({ 'stats.views': 1 });
db.prompts.createIndex({ 'stats.likes': 1 });
db.prompts.createIndex({ 'stats.forks': 1 });

// Text search index for prompts
db.prompts.createIndex({
  'name': 'text',
  'description': 'text',
  'content': 'text',
  'tags': 'text'
}, {
  weights: {
    'name': 10,
    'description': 5,
    'tags': 3,
    'content': 1
  },
  name: 'prompt_text_search'
});

// Settings collection indexes
db.settings.createIndex({ 'key': 1 }, { unique: true });
db.settings.createIndex({ 'category': 1 });
db.settings.createIndex({ 'isPublic': 1 });
db.settings.createIndex({ 'isEditable': 1 });
db.settings.createIndex({ 'createdAt': 1 });

// Create default admin user (password: admin123)
db.users.insertOne({
  username: 'admin',
  email: 'admin@aiagent.local',
  password: '$2b$10$rQZ8kHWKtGY5uJQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5e', // admin123
  firstName: 'System',
  lastName: 'Administrator',
  roles: ['admin'],
  status: 'active',
  profile: {
    bio: 'System administrator account',
    avatar: null,
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        marketing: false
      }
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
});

// Create default settings
const defaultSettings = [
  {
    key: 'app.name',
    value: 'AI Agent Platform',
    type: 'string',
    category: 'general',
    description: 'Application name',
    isPublic: true,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'app.version',
    value: '1.0.0',
    type: 'string',
    category: 'general',
    description: 'Application version',
    isPublic: true,
    isEditable: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'auth.session_timeout',
    value: 3600,
    type: 'number',
    category: 'authentication',
    description: 'Session timeout in seconds',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'prompts.max_per_user',
    value: 100,
    type: 'number',
    category: 'prompts',
    description: 'Maximum prompts per user',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'uploads.max_file_size',
    value: 10485760,
    type: 'number',
    category: 'uploads',
    description: 'Maximum file upload size in bytes (10MB)',
    isPublic: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.settings.insertMany(defaultSettings);

// Create sample AI models
const sampleModels = [
  {
    name: 'GPT-4',
    type: 'text-generation',
    provider: 'openai',
    version: '4.0',
    description: 'OpenAI GPT-4 model for advanced text generation',
    status: 'active',
    configuration: {
      maxTokens: 8192,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    pricing: {
      inputTokens: 0.03,
      outputTokens: 0.06,
      currency: 'USD',
      per: 1000
    },
    capabilities: ['chat', 'completion', 'function-calling'],
    limits: {
      requestsPerMinute: 60,
      tokensPerMinute: 150000
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Claude-3-Sonnet',
    type: 'text-generation',
    provider: 'anthropic',
    version: '3.0',
    description: 'Anthropic Claude 3 Sonnet model',
    status: 'active',
    configuration: {
      maxTokens: 4096,
      temperature: 0.7
    },
    pricing: {
      inputTokens: 0.003,
      outputTokens: 0.015,
      currency: 'USD',
      per: 1000
    },
    capabilities: ['chat', 'completion'],
    limits: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.aimodels.insertMany(sampleModels);

print('MongoDB initialization completed successfully!');
print('Created collections: users, aimodels, prompts, settings');
print('Created indexes for optimal performance');
print('Inserted default admin user (username: admin, password: admin123)');
print('Inserted default settings and sample AI models');