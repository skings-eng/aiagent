import { z } from 'zod';

// 用户基本信息
export const UserSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  language: z.enum(['ja', 'en']).default('ja'),
  timezone: z.string().default('Asia/Tokyo'),
  isLineConnected: z.boolean().default(false),
  lineUserId: z.string().optional(),
  queryCount: z.number().default(0),
  maxQueries: z.number().default(1), // 未添加LINE好友的查询限制
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// 用户查询历史
export const UserQuerySchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  query: z.string(),
  stockCode: z.string().optional(),
  analysisId: z.string().optional(),
  queryType: z.enum(['GENERAL_QUESTION']),
  language: z.enum(['ja', 'en']),
  responseTime: z.number(), // 响应时间（毫秒）
  success: z.boolean(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
});

// 用户行为事件
export const UserEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  eventType: z.enum([
    'PAGE_VIEW',
    'QUERY_SUBMITTED',
    'ANALYSIS_VIEWED',
    'LINE_PROMPT_SHOWN',
    'LINE_LINK_CLICKED',
    'LINE_CONNECTED',
    'QUERY_LIMIT_REACHED',
    'ERROR_OCCURRED'
  ]),
  eventData: z.record(z.string(), z.any()).optional(),
  page: z.string().optional(),
  referrer: z.string().optional(),
  createdAt: z.string().datetime(),
});

// 用户会话信息
export const UserSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  language: z.enum(['ja', 'en']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().optional(), // 会话持续时间（秒）
  pageViews: z.number().default(0),
  queries: z.number().default(0),
  conversions: z.array(z.enum(['LINE_CONNECTED', 'PREMIUM_UPGRADE'])).default([]),
  isActive: z.boolean().default(true),
});

// 用户偏好设置
export const UserPreferencesSchema = z.object({
  userId: z.string(),
  language: z.enum(['ja', 'en']),
  timezone: z.string(),
  analysisType: z.enum(['QUICK', 'DETAILED', 'TECHNICAL', 'FUNDAMENTAL']).default('QUICK'),
  notifications: z.object({
    email: z.boolean().default(false),
    line: z.boolean().default(true),
    browser: z.boolean().default(true),
  }).default({}),
  favoriteStocks: z.array(z.string()).default([]),
  watchlist: z.array(z.string()).default([]),
  updatedAt: z.string().datetime(),
});

// 导出类型
export type User = z.infer<typeof UserSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type UserEvent = z.infer<typeof UserEventSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// 用户统计数据
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  lineConnectedUsers: number;
  averageQueriesPerUser: number;
  averageSessionDuration: number;
  conversionRate: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  topStocks: Array<{
    code: string;
    name: string;
    count: number;
  }>;
}

// 用户行为分析
export interface UserBehaviorAnalysis {
  userId: string;
  sessionId: string;
  totalQueries: number;
  uniqueStocks: number;
  averageResponseTime: number;
  mostActiveHour: number;
  preferredLanguage: 'ja' | 'en';
  conversionProbability: number;
  riskScore: number;
  engagementScore: number;
  lastActivity: string;
}