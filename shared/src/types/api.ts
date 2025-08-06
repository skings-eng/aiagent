import { z } from 'zod';

// API响应基础结构
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string(),
    version: z.string().default('1.0.0'),
    responseTime: z.number().optional(),
  }),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    totalPages: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }).optional(),
});

// API错误代码
export const ApiErrorCodeSchema = z.enum([
  // 通用错误
  'INTERNAL_SERVER_ERROR',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'CONFLICT',
  'UNPROCESSABLE_ENTITY',
  'TOO_MANY_REQUESTS',
  'SERVICE_UNAVAILABLE',
  
  // 认证相关
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'INSUFFICIENT_PERMISSIONS',
  
  // 用户相关
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'INVALID_USER_DATA',
  'USER_BLOCKED',
  'SESSION_EXPIRED',
  'QUERY_LIMIT_EXCEEDED',
  
  
  
  // AI相关
  'AI_SERVICE_UNAVAILABLE',
  'AI_MODEL_ERROR',
  'PROMPT_TEMPLATE_NOT_FOUND',
  'ANALYSIS_FAILED',
  'INVALID_PROMPT',
  
  // LINE相关
  'LINE_SERVICE_ERROR',
  'LINE_USER_NOT_FOUND',
  'LINE_MESSAGE_FAILED',
  'LINE_WEBHOOK_ERROR',
  

  
  // 数据相关
  'DATABASE_ERROR',
  'CACHE_ERROR',
  'VALIDATION_ERROR',
  'DATA_CORRUPTION',
]);

// 分页请求参数
export const PaginationParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 搜索参数
export const SearchParamsSchema = z.object({
  q: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
}).merge(PaginationParamsSchema);

// API请求头
export const ApiHeadersSchema = z.object({
  'Content-Type': z.string().default('application/json'),
  'Accept': z.string().default('application/json'),
  'Accept-Language': z.enum(['ja', 'en']).default('ja'),
  'User-Agent': z.string().optional(),
  'X-Request-ID': z.string().optional(),
  'X-Session-ID': z.string().optional(),
  'X-User-ID': z.string().optional(),
  'Authorization': z.string().optional(),
});

// 股票查询API请求


// 股票查询API响应


// AI模型配置API请求
export const AIModelConfigApiRequestSchema = z.object({
  name: z.string(),
  provider: z.string(),
  modelId: z.string(),
  apiKey: z.string(),
  apiEndpoint: z.string().url().optional(),
  maxTokens: z.number().min(1).max(200000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

// 提示词模板API请求
export const PromptTemplateApiRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  language: z.enum(['ja', 'en', 'both']),
  template: z.string(),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    description: z.string().optional(),
    defaultValue: z.any().optional(),
  })).default([]),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

// LINE配置API请求
export const LineConfigApiRequestSchema = z.object({
  name: z.string(),
  channelAccessToken: z.string(),
  channelSecret: z.string(),
  friendAddUrl: z.string().url(),
  qrCodeUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  settings: z.object({
    autoReply: z.boolean().default(true),
    welcomeMessage: z.string().optional(),
    maxMessageLength: z.number().min(1).max(5000).default(2000),
    rateLimitPerUser: z.number().min(1).max(100).default(10),
  }).optional(),
});

// 用户统计API响应
export const UserStatsApiResponseSchema = ApiResponseSchema.extend({
  data: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    newUsers: z.number(),
    lineConnectedUsers: z.number(),
    conversionRate: z.number(),
    averageQueriesPerUser: z.number(),
    topQueries: z.array(z.object({
      query: z.string(),
      count: z.number(),
    })),
    topStocks: z.array(z.object({
      code: z.string(),
      name: z.string(),
      count: z.number(),
    })),
    chartData: z.object({
      userGrowth: z.array(z.object({
        date: z.string(),
        users: z.number(),
      })),
      queryVolume: z.array(z.object({
        date: z.string(),
        queries: z.number(),
      })),
      conversionFunnel: z.array(z.object({
        stage: z.string(),
        count: z.number(),
        rate: z.number(),
      })),
    }),
  }).optional(),
});

// 系统健康检查响应
export const HealthCheckApiResponseSchema = ApiResponseSchema.extend({
  data: z.object({
    status: z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY']),
    services: z.object({
      database: z.object({
        status: z.enum(['UP', 'DOWN']),
        responseTime: z.number(),
        lastCheck: z.string().datetime(),
      }),
      redis: z.object({
        status: z.enum(['UP', 'DOWN']),
        responseTime: z.number(),
        lastCheck: z.string().datetime(),
      }),
      aiService: z.object({
        status: z.enum(['UP', 'DOWN', 'DEGRADED']),
        activeModels: z.number(),
        queueLength: z.number(),
        lastCheck: z.string().datetime(),
      }),
      lineService: z.object({
        status: z.enum(['UP', 'DOWN']),
        webhookStatus: z.string(),
        lastCheck: z.string().datetime(),
      }),

    }),
    uptime: z.number(),
    version: z.string(),
    environment: z.string(),
  }).optional(),
});

// 导出类型
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type ApiHeaders = z.infer<typeof ApiHeadersSchema>;

export type AIModelConfigApiRequest = z.infer<typeof AIModelConfigApiRequestSchema>;
export type PromptTemplateApiRequest = z.infer<typeof PromptTemplateApiRequestSchema>;
export type LineConfigApiRequest = z.infer<typeof LineConfigApiRequestSchema>;
export type UserStatsApiResponse = z.infer<typeof UserStatsApiResponseSchema>;
export type HealthCheckApiResponse = z.infer<typeof HealthCheckApiResponseSchema>;

// API端点常量
export const API_ENDPOINTS = {
  // 用户相关
  USER_SESSION: '/api/v1/users/session',
  USER_STATS: '/api/v1/users/stats',
  USER_QUERIES: '/api/v1/users/queries',
  USER_EVENTS: '/api/v1/users/events',
  
  // AI相关
  AI_MODELS: '/api/v1/ai/models',
  AI_PROMPTS: '/api/v1/ai/prompts',
  AI_ANALYSIS: '/api/v1/ai/analysis',
  AI_STATS: '/api/v1/ai/stats',
  
  // LINE相关
  LINE_CONFIG: '/api/v1/line/config',
  LINE_WEBHOOK: '/api/v1/line/webhook',
  LINE_USERS: '/api/v1/line/users',
  LINE_MESSAGES: '/api/v1/line/messages',
  LINE_STATS: '/api/v1/line/stats',
  
  // 系统相关
  HEALTH_CHECK: '/api/v1/health',
  SYSTEM_STATS: '/api/v1/system/stats',
  SYSTEM_CONFIG: '/api/v1/system/config',
} as const;

// HTTP状态码映射
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;