import { z } from 'zod';

// 通用ID类型
export const IdSchema = z.string().min(1);

// 时间戳类型
export const TimestampSchema = z.string().datetime();

// 语言类型
export const LanguageSchema = z.enum(['ja', 'en']);

// 状态类型
export const StatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'DELETED']);

// 优先级类型
export const PrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// 环境类型
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

// 日志级别
export const LogLevelSchema = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']);

// 基础实体
export const BaseEntitySchema = z.object({
  id: IdSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  deletedAt: TimestampSchema.optional(),
  version: z.number().default(1),
});

// 分页信息
export const PaginationInfoSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// 排序信息
export const SortInfoSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']),
});

// 过滤器
export const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'regex']),
  value: z.any(),
});

// 日期范围
export const DateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

// 地理位置
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
});

// 文件信息
export const FileInfoSchema = z.object({
  id: IdSchema,
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().min(0),
  path: z.string(),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  uploadedAt: TimestampSchema,
  uploadedBy: IdSchema.optional(),
});

// 配置项
export const ConfigItemSchema = z.object({
  key: z.string(),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  category: z.string().optional(),
  isSecret: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.any()).optional(),
  }).optional(),
  updatedAt: TimestampSchema,
  updatedBy: IdSchema.optional(),
});

// 系统通知
export const NotificationSchema = z.object({
  id: IdSchema,
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  recipients: z.array(IdSchema),
  channels: z.array(z.enum(['EMAIL', 'SMS', 'PUSH', 'LINE', 'SLACK'])),
  isRead: z.boolean().default(false),
  readAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
});

// 审计日志
export const AuditLogSchema = z.object({
  id: IdSchema,
  action: z.string(),
  resource: z.string(),
  resourceId: IdSchema.optional(),
  userId: IdSchema.optional(),
  sessionId: IdSchema.optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  changes: z.object({
    before: z.any().optional(),
    after: z.any().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: TimestampSchema,
});

// 系统指标
export const SystemMetricsSchema = z.object({
  timestamp: TimestampSchema,
  cpu: z.object({
    usage: z.number().min(0).max(100),
    cores: z.number().min(1),
    loadAverage: z.array(z.number()),
  }),
  memory: z.object({
    total: z.number().min(0),
    used: z.number().min(0),
    free: z.number().min(0),
    usage: z.number().min(0).max(100),
  }),
  disk: z.object({
    total: z.number().min(0),
    used: z.number().min(0),
    free: z.number().min(0),
    usage: z.number().min(0).max(100),
  }),
  network: z.object({
    bytesIn: z.number().min(0),
    bytesOut: z.number().min(0),
    packetsIn: z.number().min(0),
    packetsOut: z.number().min(0),
  }),
  processes: z.object({
    total: z.number().min(0),
    running: z.number().min(0),
    sleeping: z.number().min(0),
    zombie: z.number().min(0),
  }),
});

// 导出类型
export type Id = z.infer<typeof IdSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
export type SortInfo = z.infer<typeof SortInfoSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type FileInfo = z.infer<typeof FileInfoSchema>;
export type ConfigItem = z.infer<typeof ConfigItemSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type SystemMetrics = z.infer<typeof SystemMetricsSchema>;

// 通用响应包装器
export interface ResponseWrapper<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
    responseTime?: number;
  };
  pagination?: PaginationInfo;
}

// 查询选项
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: SortInfo[];
  filters?: Filter[];
  search?: string;
  include?: string[];
  exclude?: string[];
  dateRange?: DateRange;
}

// 批量操作结果
export interface BulkOperationResult<T> {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// 缓存选项
export interface CacheOptions {
  ttl?: number; // 生存时间（秒）
  tags?: string[]; // 缓存标签
  compress?: boolean; // 是否压缩
  serialize?: boolean; // 是否序列化
}

// 重试选项
export interface RetryOptions {
  maxAttempts: number;
  delay: number; // 初始延迟（毫秒）
  backoff: 'fixed' | 'exponential' | 'linear';
  maxDelay?: number; // 最大延迟
  jitter?: boolean; // 是否添加随机抖动
}

// 限流选项
export interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyGenerator?: (req: any) => string; // 键生成器
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}