// Core LINE Bot Types
export interface LineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

export interface LineMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
  packageId?: string;
  stickerId?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
  duration?: number;
  title?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  fileName?: string;
  fileSize?: number;
}

export interface LineWebhookEvent {
  type: string;
  mode: string;
  timestamp: number;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
  message?: LineMessage;
  replyToken?: string;
}

// Application Types
export interface User {
  id: string;
  userId: string;
  lineUserId?: string;
  displayName: string;
  pictureUrl?: string;
  language?: string;
  isActive: boolean;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  profile?: {
    displayName?: string;
    statusMessage?: string | undefined;
    language?: string | undefined;
    preferences?: Record<string, any>;
  };
  settings?: {
    notifications?: boolean;
    language?: string;
    timezone?: string;
  };
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  userId: string;
  content: MessageContent;
  type: MessageDirection;
  direction?: MessageDirection;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, any>;
}

export interface MessageContent {
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker' | 'imagemap' | 'template' | 'flex';
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  packageId?: string;
  stickerId?: string;
  previewUrl?: string;
  raw?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    offset: number;
  };
}

// Analytics Types
export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  blockedUsers: number;
  usersByLanguage: Record<string, number>;
  topActiveUsers: Array<{
    userId: string;
    displayName: string;
    messageCount: number;
  }>;
}

export interface MessageAnalytics {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  messagesByType: Record<string, number>;
  messagesByStatus?: Record<string, number>;
  averageResponseTime: number;
}

// Service Types
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  flushAll(): Promise<void>;
}

export interface WebhookService {
  handleEvent(event: LineWebhookEvent): Promise<void>;
  sendReply(replyToken: string, messages: any[]): Promise<void>;
  registerEventHandler(eventType: string, handler: (event: LineWebhookEvent) => Promise<void>): void;
}

// Configuration Types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  redisUrl: string;
  logLevel: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

// Utility Types
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface Metrics {
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, value: number, tags?: Record<string, string>): void;
}

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId?: string;
      startTime?: number;
    }
  }
}

// Environment Variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      LINE_CHANNEL_SECRET: string;
      LINE_CHANNEL_ACCESS_TOKEN: string;
      REDIS_URL: string;
      LOG_LEVEL: string;
      CORS_ORIGINS: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
      TEST_MODE: string;
      DEV_MOCK_LINE_API: string;
    }
  }
}

// Mock Types for Testing
export interface MockLineClient {
  replyMessage: jest.MockedFunction<any>;
  pushMessage: jest.MockedFunction<any>;
  getProfile: jest.MockedFunction<any>;
}

export interface MockRedisClient {
  get: jest.MockedFunction<any>;
  set: jest.MockedFunction<any>;
  del: jest.MockedFunction<any>;
  exists: jest.MockedFunction<any>;
  flushall: jest.MockedFunction<any>;
  quit: jest.MockedFunction<any>;
}

// Bot Response Types
export interface BotResponse {
  success: boolean;
  message?: string;
  messages?: any[];
  messageIds?: string[];
  timestamp?: Date;
  error?: string;
}

// Export commonly used types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  STICKER = 'sticker',
  FLEX = 'flex',
  TEMPLATE = 'template',
  OTHER = 'other'
}

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type EventType = 'message' | 'follow' | 'unfollow' | 'join' | 'leave' | 'memberJoined' | 'memberLeft';
export type SourceType = 'user' | 'group' | 'room';