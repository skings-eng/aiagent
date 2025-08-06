import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  // Mock Redis client for tests
  jest.mock('../config/redis', () => ({
    redisClient: {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      flushall: jest.fn(),
      quit: jest.fn(),
    },
  }));
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear Redis mock calls
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  await mongoServer.stop();
});

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: async (userData = {}) => {
    const { User } = require('../models/User');
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      roles: ['user'],
      status: 'active',
      ...userData,
    };
    return await User.create(defaultUser);
  },
  
  // Helper to create test admin
  createTestAdmin: async (userData = {}) => {
    const { User } = require('../models/User');
    const defaultAdmin = {
      username: 'testadmin',
      email: 'admin@example.com',
      password: 'password123',
      roles: ['admin'],
      status: 'active',
      ...userData,
    };
    return await User.create(defaultAdmin);
  },
  
  // Helper to generate JWT token
  generateToken: (userId: string, roles: string[] = ['user']) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, roles },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Helper to create test AI model
  createTestAIModel: async (modelData = {}) => {
    const { AIModel } = require('../models/AIModel');
    const defaultModel = {
      name: 'Test Model',
      type: 'text-generation',
      provider: 'openai',
      version: '1.0.0',
      status: 'active',
      configuration: {
        maxTokens: 4096,
        temperature: 0.7,
      },
      pricing: {
        inputTokens: 0.001,
        outputTokens: 0.002,
      },
      ...modelData,
    };
    return await AIModel.create(defaultModel);
  },
  
  // Helper to create test prompt
  createTestPrompt: async (promptData = {}, ownerId?: string) => {
    const { Prompt } = require('../models/Prompt');
    const defaultPrompt = {
      name: 'Test Prompt',
      content: 'This is a test prompt: {{variable}}',
      category: 'general',
      description: 'A test prompt for testing',
      tags: ['test', 'example'],
      language: 'en',
      variables: [{
        name: 'variable',
        description: 'Test variable',
        type: 'string',
        required: true,
      }],
      isPublic: true,
      active: true,
      owner: ownerId,
      ...promptData,
    };
    return await Prompt.create(defaultPrompt);
  },
  
  // Helper to create test setting
  createTestSetting: async (settingData = {}) => {
    const { Settings } = require('../models/Settings');
    const defaultSetting = {
      key: 'test.setting',
      value: 'test value',
      type: 'string',
      category: 'test',
      description: 'A test setting',
      isPublic: false,
      isEditable: true,
      ...settingData,
    };
    return await Settings.create(defaultSetting);
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
      toBeValidEmail(): R;
      toBeValidJWT(): R;
    }
  }
  
  var testUtils: {
    createTestUser: (userData?: any) => Promise<any>;
    createTestAdmin: (userData?: any) => Promise<any>;
    generateToken: (userId: string, roles?: string[]) => string;
    createTestAIModel: (modelData?: any) => Promise<any>;
    createTestPrompt: (promptData?: any, ownerId?: string) => Promise<any>;
    createTestSetting: (settingData?: any) => Promise<any>;
  };
}

// Custom Jest matchers
expect.extend({
  toBeValidObjectId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
  
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests