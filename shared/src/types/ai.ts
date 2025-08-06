import { z } from 'zod';

// AI模型提供商
export const AIProviderSchema = z.enum([
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'AZURE_OPENAI',
  'COHERE',
  'HUGGINGFACE',
  'LOCAL'
]);

// AI模型配置
export const AIModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: AIProviderSchema,
  modelId: z.string(), // 如 gpt-4, claude-3-sonnet 等
  apiKey: z.string(),
  apiEndpoint: z.string().url().optional(),
  maxTokens: z.number().min(1).max(200000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  timeout: z.number().min(1000).max(300000).default(30000), // 超时时间（毫秒）
  retryAttempts: z.number().min(0).max(5).default(3),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false), // 是否为主要模型
  priority: z.number().min(0).max(100).default(50), // 优先级，数字越大优先级越高
  costPerToken: z.number().min(0).optional(), // 每token成本
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).default(60),
    tokensPerMinute: z.number().min(1000).default(100000),
  }).optional(),
  capabilities: z.array(z.enum([
    'TEXT_GENERATION',
    'CODE_GENERATION',
    'ANALYSIS',
    'TRANSLATION',
    'SUMMARIZATION',
    'FUNCTION_CALLING'
  ])).default(['TEXT_GENERATION']),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 提示词模板
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'TECHNICAL_ANALYSIS',
    'FUNDAMENTAL_ANALYSIS',
    'RISK_ASSESSMENT',
    'MARKET_SUMMARY',
    'GENERAL_CHAT'
  ]),
  language: z.enum(['ja', 'en', 'both']),
  template: z.string(), // Markdown格式的提示词模板
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    required: z.boolean().default(false),
    description: z.string().optional(),
    defaultValue: z.any().optional(),
  })).default([]),
  version: z.string().default('1.0.0'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  usage: z.object({
    totalCalls: z.number().default(0),
    successRate: z.number().min(0).max(1).default(1),
    averageResponseTime: z.number().default(0),
    lastUsed: z.string().datetime().optional(),
  }).optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// AI分析请求
export const AIAnalysisRequestSchema = z.object({
  requestId: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  modelId: z.string(),
  promptTemplateId: z.string(),
  input: z.object({
    query: z.string(),
    stockData: z.any().optional(),
    context: z.record(z.string(), z.any()).optional(),
  }),
  parameters: z.object({
    maxTokens: z.number().optional(),
    temperature: z.number().optional(),
    language: z.enum(['ja', 'en']).default('ja'),
  }).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  createdAt: z.string().datetime(),
});

// AI分析响应
export const AIAnalysisResponseSchema = z.object({
  requestId: z.string(),
  modelId: z.string(),
  promptTemplateId: z.string(),
  response: z.object({
    content: z.string(),
    analysis: z.any().optional(), // 结构化分析结果
    confidence: z.number().min(0).max(1).optional(),
    reasoning: z.string().optional(),
  }),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
    cost: z.number().optional(),
  }),
  performance: z.object({
    responseTime: z.number(), // 响应时间（毫秒）
    queueTime: z.number().optional(), // 队列等待时间
    processingTime: z.number().optional(), // 实际处理时间
  }),
  status: z.enum(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
});

// AI模型性能统计
export const AIModelStatsSchema = z.object({
  modelId: z.string(),
  period: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  metrics: z.object({
    totalRequests: z.number(),
    successfulRequests: z.number(),
    failedRequests: z.number(),
    averageResponseTime: z.number(),
    totalTokensUsed: z.number(),
    totalCost: z.number(),
    successRate: z.number().min(0).max(1),
    averageConfidence: z.number().min(0).max(1).optional(),
  }),
  errors: z.array(z.object({
    errorCode: z.string(),
    count: z.number(),
    lastOccurrence: z.string().datetime(),
  })).default([]),
});

// 导出类型
export type AIProvider = z.infer<typeof AIProviderSchema>;
export type AIModelConfig = z.infer<typeof AIModelConfigSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type AIAnalysisRequest = z.infer<typeof AIAnalysisRequestSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type AIModelStats = z.infer<typeof AIModelStatsSchema>;

// AI服务状态
export interface AIServiceStatus {
  isHealthy: boolean;
  activeModels: number;
  totalModels: number;
  queueLength: number;
  averageResponseTime: number;
  errorRate: number;
  lastHealthCheck: string;
  issues: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: string;
  }>;
}

// 模型切换策略
export interface ModelSwitchStrategy {
  strategy: 'ROUND_ROBIN' | 'PRIORITY' | 'LOAD_BASED' | 'COST_OPTIMIZED';
  fallbackEnabled: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
}