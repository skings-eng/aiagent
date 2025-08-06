import { z } from 'zod';

// LINE配置
export const LineConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  channelAccessToken: z.string(),
  channelSecret: z.string(),
  botUserId: z.string(),
  webhookUrl: z.string().url(),
  friendAddUrl: z.string().url(), // LINE好友添加链接
  qrCodeUrl: z.string().url().optional(), // 二维码图片链接
  isActive: z.boolean().default(true),
  settings: z.object({
    autoReply: z.boolean().default(true),
    welcomeMessage: z.string().optional(),
    maxMessageLength: z.number().min(1).max(5000).default(2000),
    rateLimitPerUser: z.number().min(1).max(100).default(10), // 每用户每分钟消息限制
    enableRichMenu: z.boolean().default(true),
    enableQuickReply: z.boolean().default(true),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// LINE用户信息
export const LineUserSchema = z.object({
  lineUserId: z.string(),
  displayName: z.string(),
  pictureUrl: z.string().url().optional(),
  statusMessage: z.string().optional(),
  language: z.enum(['ja', 'en']).default('ja'),
  isBlocked: z.boolean().default(false),
  isFriend: z.boolean().default(true),
  followedAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().optional(),
  messageCount: z.number().default(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

// LINE消息类型
export const LineMessageTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'audio',
  'file',
  'location',
  'sticker',
  'imagemap',
  'template',
  'flex'
]);

// LINE消息
export const LineMessageSchema = z.object({
  id: z.string(),
  type: LineMessageTypeSchema,
  text: z.string().optional(),
  replyToken: z.string().optional(),
  userId: z.string(),
  timestamp: z.string().datetime(),
  source: z.object({
    type: z.enum(['user', 'group', 'room']),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  message: z.any(), // 原始消息对象
  isProcessed: z.boolean().default(false),
  response: z.object({
    type: z.enum(['reply', 'push', 'multicast', 'broadcast']),
    messages: z.array(z.any()),
    sentAt: z.string().datetime().optional(),
    success: z.boolean().optional(),
    error: z.string().optional(),
  }).optional(),
});

// LINE Webhook事件
export const LineWebhookEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'message',
    'follow',
    'unfollow',
    'join',
    'leave',
    'memberJoined',
    'memberLeft',
    'postback',
    'beacon',
    'accountLink',
    'things'
  ]),
  timestamp: z.number(),
  source: z.object({
    type: z.enum(['user', 'group', 'room']),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  replyToken: z.string().optional(),
  message: z.any().optional(),
  postback: z.any().optional(),
  beacon: z.any().optional(),
  link: z.any().optional(),
  things: z.any().optional(),
  joined: z.any().optional(),
  left: z.any().optional(),
  rawEvent: z.any(), // 原始事件对象
  processedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

// LINE Rich Menu
export const LineRichMenuSchema = z.object({
  id: z.string(),
  name: z.string(),
  chatBarText: z.string(),
  selected: z.boolean().default(false),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  areas: z.array(z.object({
    bounds: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    action: z.object({
      type: z.enum(['postback', 'message', 'uri', 'datetimepicker']),
      data: z.string().optional(),
      text: z.string().optional(),
      uri: z.string().optional(),
      mode: z.string().optional(),
      initial: z.string().optional(),
      max: z.string().optional(),
      min: z.string().optional(),
    }),
  })),
  imageUrl: z.string().url(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// LINE统计数据
export const LineStatsSchema = z.object({
  period: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  metrics: z.object({
    totalUsers: z.number(),
    newFollowers: z.number(),
    unfollowers: z.number(),
    activeUsers: z.number(),
    totalMessages: z.number(),
    incomingMessages: z.number(),
    outgoingMessages: z.number(),
    averageResponseTime: z.number(),
    messageDeliveryRate: z.number().min(0).max(1),
    userEngagementRate: z.number().min(0).max(1),
  }),
  topMessages: z.array(z.object({
    content: z.string(),
    count: z.number(),
    type: LineMessageTypeSchema,
  })).default([]),
  errors: z.array(z.object({
    errorType: z.string(),
    count: z.number(),
    lastOccurrence: z.string().datetime(),
  })).default([]),
});

// 导出类型
export type LineConfig = z.infer<typeof LineConfigSchema>;
export type LineUser = z.infer<typeof LineUserSchema>;
export type LineMessageType = z.infer<typeof LineMessageTypeSchema>;
export type LineMessage = z.infer<typeof LineMessageSchema>;
export type LineWebhookEvent = z.infer<typeof LineWebhookEventSchema>;
export type LineRichMenu = z.infer<typeof LineRichMenuSchema>;
export type LineStats = z.infer<typeof LineStatsSchema>;

// LINE服务状态
export interface LineServiceStatus {
  isConnected: boolean;
  webhookStatus: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastWebhookReceived: string;
  messageQueueLength: number;
  rateLimitStatus: {
    remaining: number;
    resetTime: string;
  };
  errors: Array<{
    timestamp: string;
    error: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

// LINE消息模板
export interface LineMessageTemplate {
  id: string;
  name: string;
  type: 'text' | 'flex' | 'template';
  content: any;
  variables: string[];
  language: 'ja' | 'en' | 'both';
  category: 'WELCOME' | 'ERROR' | 'PROMOTION' | 'NOTIFICATION';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// LINE用户行为分析
export interface LineUserBehavior {
  lineUserId: string;
  totalMessages: number;
  averageMessagesPerDay: number;
  mostActiveHour: number;
  preferredMessageType: LineMessageType;
  engagementScore: number;
  lastActivity: string;
  conversionEvents: string[];
  interests: string[];
}