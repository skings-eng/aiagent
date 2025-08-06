import { WebhookEvent, Message, User as LineUser } from '@line/bot-sdk';

// User related types
export interface User {
  id: string;
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
  isBlocked: boolean;
  isFollowing: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

export interface UserSettings {
  userId: string;
  notifications: boolean;
  language: string;
  timezone: string;
  preferences: Record<string, any>;
}

// Message related types
export interface MessageRecord {
  id: string;
  lineMessageId?: string;
  userId: string;
  type: MessageType;
  content: MessageContent;
  direction: 'incoming' | 'outgoing';
  status: MessageStatus;
  timestamp: Date;
  replyToken?: string;
  metadata?: Record<string, any>;
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'sticker'
  | 'template'
  | 'flex'
  | 'imagemap';

export type MessageStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface MessageContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  sticker?: {
    packageId: string;
    stickerId: string;
  };
  template?: any;
  flex?: any;
  imagemap?: any;
}

// Webhook related types
export interface WebhookEventData {
  id: string;
  type: string;
  userId?: string;
  timestamp: Date;
  replyToken?: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: MessageRecord;
  postback?: {
    data: string;
    params?: Record<string, any>;
  };
  follow?: {
    isFollowing: boolean;
  };
  unfollow?: {
    isFollowing: boolean;
  };
  join?: {
    type: 'group' | 'room';
  };
  leave?: {
    type: 'group' | 'room';
  };
  memberJoined?: {
    members: Array<{
      type: 'user';
      userId: string;
    }>;
  };
  memberLeft?: {
    members: Array<{
      type: 'user';
      userId: string;
    }>;
  };
  beacon?: {
    hwid: string;
    type: 'enter' | 'leave' | 'banner';
    dm?: string;
  };
  accountLink?: {
    result: 'ok' | 'failed';
    nonce: string;
  };
  things?: {
    deviceId: string;
    type: 'link' | 'unlink' | 'scenarioResult';
  };
}

// Rich menu types
export interface RichMenu {
  id: string;
  size: {
    width: number;
    height: number;
  };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

export interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: {
    type: 'postback' | 'message' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
    data?: string;
    text?: string;
    uri?: string;
    mode?: 'date' | 'time' | 'datetime';
    initial?: string;
    max?: string;
    min?: string;
  };
}

// Bot response types
export interface BotResponse {
  messages: Message[];
  quickReply?: {
    items: Array<{
      type: 'action';
      action: {
        type: 'message' | 'postback' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
        label: string;
        text?: string;
        data?: string;
        uri?: string;
      };
    }>;
  };
}

// Analytics types
export interface MessageAnalytics {
  userId: string;
  messageCount: number;
  lastMessageAt: Date;
  averageResponseTime: number;
  messageTypes: Record<MessageType, number>;
  period: {
    start: Date;
    end: Date;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  blockedUsers: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface SystemAnalytics {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  failedMessages: number;
  averageResponseTime: number;
  webhookEvents: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export class LineError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'LineError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class WebhookValidationError extends LineError {
  constructor(message: string, details?: any) {
    super(message, 'WEBHOOK_VALIDATION_ERROR', 400, details);
    this.name = 'WebhookValidationError';
  }
}

export class MessageSendError extends LineError {
  constructor(message: string, details?: any) {
    super(message, 'MESSAGE_SEND_ERROR', 500, details);
    this.name = 'MessageSendError';
  }
}

export class UserNotFoundError extends LineError {
  constructor(userId: string) {
    super(`User not found: ${userId}`, 'USER_NOT_FOUND', 404);
    this.name = 'UserNotFoundError';
  }
}

export class RateLimitError extends LineError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends LineError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends LineError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends LineError {
  constructor(message: string = 'Authorization failed') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class ConflictError extends LineError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
    this.name = 'ConflictError';
  }
}

// Configuration types
export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl?: string;
  richMenuId?: string;
}

export interface ServiceConfig {
  line: LineConfig;
  redis: {
    url: string;
    password?: string;
    database: number;
  };
  logging: {
    level: string;
    format: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  features: {
    analytics: boolean;
    richMenu: boolean;
    multicast: boolean;
  };
}

// Event handler types
export type EventHandler<T extends WebhookEvent = WebhookEvent> = (
  event: T,
  context: {
    userId?: string;
    requestId: string;
    timestamp: Date;
  }
) => Promise<BotResponse | void>;

export interface EventHandlers {
  message?: EventHandler;
  follow?: EventHandler;
  unfollow?: EventHandler;
  join?: EventHandler;
  leave?: EventHandler;
  memberJoined?: EventHandler;
  memberLeft?: EventHandler;
  postback?: EventHandler;
  beacon?: EventHandler;
  accountLink?: EventHandler;
  things?: EventHandler;
}