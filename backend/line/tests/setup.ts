import dotenv from 'dotenv';
import { LineWebhookEvent, User, Message, MessageType } from '../src/types';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock console methods to reduce test noise
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep error for debugging
  debug: jest.fn(),
};

// Set global test timeout
jest.setTimeout(30000);

// Mock LINE Bot SDK
jest.mock('@line/bot-sdk', () => ({
  Client: jest.fn().mockImplementation(() => ({
    replyMessage: jest.fn().mockResolvedValue({ success: true }),
    pushMessage: jest.fn().mockResolvedValue({ success: true }),
    getProfile: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      displayName: 'Test User',
      pictureUrl: 'https://example.com/picture.jpg',
      statusMessage: 'Test status',
    }),
  })),
  middleware: jest.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
  validateSignature: jest.fn().mockReturnValue(true),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    flushall: jest.fn().mockResolvedValue('OK'),
    flushDb: jest.fn().mockResolvedValue('OK'),
  })),
}));

// Global test utilities
declare global {
  var createMockWebhookEvent: (overrides?: Partial<LineWebhookEvent>) => LineWebhookEvent;
  var createMockMessageEvent: (overrides?: any) => LineWebhookEvent;
  var createMockUserProfile: (overrides?: any) => any;
  var createMockUser: (overrides?: Partial<User>) => User;
  var createMockMessage: (overrides?: Partial<Message>) => Message;
  var wait: (ms: number) => Promise<void>;
  var randomString: (length?: number) => string;
}

global.createMockWebhookEvent = (overrides = {}) => ({
  type: 'message',
  mode: 'active',
  timestamp: Date.now(),
  source: {
    type: 'user' as const,
    userId: 'test-user-id',
  },
  webhookEventId: 'test-webhook-event-id',
  deliveryContext: {
    isRedelivery: false,
  },
  replyToken: 'test-reply-token',
  ...overrides,
});

global.createMockMessageEvent = (overrides = {}) => ({
  ...global.createMockWebhookEvent(),
  message: {
    id: 'test-message-id',
    type: 'text' as const,
    text: 'Hello, World!',
    ...overrides.message,
  },
  ...overrides,
});

global.createMockUserProfile = (overrides = {}) => ({
  userId: 'test-user-id',
  displayName: 'Test User',
  pictureUrl: 'https://example.com/picture.jpg',
  statusMessage: 'Test status',
  ...overrides,
});

global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  lineUserId: 'test-line-user-id',
  displayName: 'Test User',
  language: 'en',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  profile: {},
  settings: {
    notifications: true,
    language: 'en',
  },
  metadata: {},
  ...overrides,
});

global.createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  userId: 'test-user-id',
  content: {
    type: 'text' as const,
    text: 'Hello, World!',
  },
  type: 'incoming' as MessageType,
  timestamp: new Date(),
  status: 'sent' as const,
  metadata: {},
  ...overrides,
});

// Utility functions
global.wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

global.randomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Custom Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidUserId(): R;
      toBeValidMessageId(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toBeValidUserId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid user ID`,
        pass: false,
      };
    }
  },

  toBeValidMessageId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid message ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid message ID`,
        pass: false,
      };
    }
  },
});