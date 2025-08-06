// 应用常量
export const APP_CONFIG = {
  NAME: 'Japan Stock AI Agent',
  VERSION: '1.0.0',
  DESCRIPTION: '日本股票市场AI分析智能体系统',
  AUTHOR: 'AI Agent Team',
  LICENSE: 'MIT',
} as const;

// 环境常量
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

// 语言常量
export const LANGUAGES = {
  JAPANESE: 'ja',
  ENGLISH: 'en',
} as const;

// 日本股票市场常量
export const JAPANESE_MARKETS = {
  TSE: 'TSE', // 东京证券交易所
  JASDAQ: 'JASDAQ', // JASDAQ
  MOTHERS: 'Mothers', // Mothers市场
  TOKYO_PRO: 'TOKYO_PRO', // 东京PRO市场
} as const;

// 股票分析类型
export const ANALYSIS_TYPES = {
  QUICK: 'QUICK',
  DETAILED: 'DETAILED',
  TECHNICAL: 'TECHNICAL',
  FUNDAMENTAL: 'FUNDAMENTAL',
} as const;

// 投资建议类型
export const RECOMMENDATIONS = {
  STRONG_BUY: 'STRONG_BUY',
  BUY: 'BUY',
  HOLD: 'HOLD',
  SELL: 'SELL',
  STRONG_SELL: 'STRONG_SELL',
} as const;

// 风险等级
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

// 时间范围
export const TIME_HORIZONS = {
  SHORT_TERM: 'SHORT_TERM', // 短期（1-3个月）
  MEDIUM_TERM: 'MEDIUM_TERM', // 中期（3-12个月）
  LONG_TERM: 'LONG_TERM', // 长期（1年以上）
} as const;

// 技术分析趋势
export const TECHNICAL_TRENDS = {
  BULLISH: 'BULLISH', // 看涨
  BEARISH: 'BEARISH', // 看跌
  NEUTRAL: 'NEUTRAL', // 中性
} as const;

// 估值状态
export const VALUATION_STATUS = {
  UNDERVALUED: 'UNDERVALUED', // 低估
  FAIRLY_VALUED: 'FAIRLY_VALUED', // 合理估值
  OVERVALUED: 'OVERVALUED', // 高估
} as const;

// AI模型提供商
export const AI_PROVIDERS = {
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GOOGLE: 'GOOGLE',
  AZURE_OPENAI: 'AZURE_OPENAI',
  COHERE: 'COHERE',
  HUGGINGFACE: 'HUGGINGFACE',
  LOCAL: 'LOCAL',
} as const;

// 提示词类别
export const PROMPT_CATEGORIES = {
  STOCK_ANALYSIS: 'STOCK_ANALYSIS',
  TECHNICAL_ANALYSIS: 'TECHNICAL_ANALYSIS',
  FUNDAMENTAL_ANALYSIS: 'FUNDAMENTAL_ANALYSIS',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  MARKET_SUMMARY: 'MARKET_SUMMARY',
  GENERAL_CHAT: 'GENERAL_CHAT',
} as const;

// LINE消息类型
export const LINE_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
  STICKER: 'sticker',
  IMAGEMAP: 'imagemap',
  TEMPLATE: 'template',
  FLEX: 'flex',
} as const;

// LINE事件类型
export const LINE_EVENT_TYPES = {
  MESSAGE: 'message',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  JOIN: 'join',
  LEAVE: 'leave',
  MEMBER_JOINED: 'memberJoined',
  MEMBER_LEFT: 'memberLeft',
  POSTBACK: 'postback',
  BEACON: 'beacon',
  ACCOUNT_LINK: 'accountLink',
  THINGS: 'things',
} as const;

// 用户事件类型
export const USER_EVENT_TYPES = {
  PAGE_VIEW: 'PAGE_VIEW',
  QUERY_SUBMITTED: 'QUERY_SUBMITTED',
  ANALYSIS_VIEWED: 'ANALYSIS_VIEWED',
  LINE_PROMPT_SHOWN: 'LINE_PROMPT_SHOWN',
  LINE_LINK_CLICKED: 'LINE_LINK_CLICKED',
  LINE_CONNECTED: 'LINE_CONNECTED',
  QUERY_LIMIT_REACHED: 'QUERY_LIMIT_REACHED',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const;

// API错误代码
export const API_ERROR_CODES = {
  // 通用错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // 用户相关
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  QUERY_LIMIT_EXCEEDED: 'QUERY_LIMIT_EXCEEDED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  
  
  // AI相关
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  
  // LINE相关
  LINE_SERVICE_ERROR: 'LINE_SERVICE_ERROR',
  LINE_USER_NOT_FOUND: 'LINE_USER_NOT_FOUND',
  
  // MCP相关
  MCP_CONNECTION_ERROR: 'MCP_CONNECTION_ERROR',
  MCP_DATA_ERROR: 'MCP_DATA_ERROR',
} as const;

// HTTP状态码
export const HTTP_STATUS = {
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

// 缓存键前缀
export const CACHE_KEYS = {
  USER_SESSION: 'user:session:',
  USER_QUERIES: 'user:queries:',
  AI_RESPONSE: 'ai:response:',
  LINE_USER: 'line:user:',
  MCP_RESPONSE: 'mcp:response:',
  SYSTEM_CONFIG: 'system:config:',
} as const;

// 缓存TTL（秒）
export const CACHE_TTL = {
  USER_SESSION: 86400, // 24小时
  AI_RESPONSE: 3600, // 1小时
  LINE_USER: 86400, // 24小时
  MCP_RESPONSE: 300, // 5分钟
  SYSTEM_CONFIG: 3600, // 1小时
} as const;

// 队列名称
export const QUEUE_NAMES = {
  AI_ANALYSIS: 'ai-analysis',
  LINE_MESSAGES: 'line-messages',
  MCP_REQUESTS: 'mcp-requests',
  USER_EVENTS: 'user-events',
  NOTIFICATIONS: 'notifications',
  EMAIL_SENDING: 'email-sending',
} as const;

// 数据库表名
export const TABLE_NAMES = {
  USERS: 'users',
  USER_SESSIONS: 'user_sessions',
  USER_QUERIES: 'user_queries',
  USER_EVENTS: 'user_events',
  STOCKS: 'stocks',
  STOCK_PRICES: 'stock_prices',

  STOCK_FINANCIALS: 'stock_financials',
  STOCK_ANALYSES: 'stock_analyses',
  AI_MODELS: 'ai_models',
  PROMPT_TEMPLATES: 'prompt_templates',
  AI_REQUESTS: 'ai_requests',
  AI_RESPONSES: 'ai_responses',
  LINE_CONFIGS: 'line_configs',
  LINE_USERS: 'line_users',
  LINE_MESSAGES: 'line_messages',
  LINE_EVENTS: 'line_events',
  MCP_CONFIGS: 'mcp_configs',
  MCP_REQUESTS: 'mcp_requests',
  MCP_RESPONSES: 'mcp_responses',
  SYSTEM_CONFIGS: 'system_configs',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  JAPANESE_STOCK_CODE: /^[0-9]{4}$/, // 日本股票代码（4位数字）
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_JP: /^(\+81|0)[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{3,4}$/, // 日本电话号码
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  JAPANESE_TEXT: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
} as const;

// 默认配置值
export const DEFAULT_VALUES = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_TIMEOUT: 86400000, // 24小时（毫秒）
  REQUEST_TIMEOUT: 30000, // 30秒（毫秒）
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒（毫秒）
  MAX_QUERY_LENGTH: 1000,
  MAX_QUERIES_PER_SESSION: 1, // 未添加LINE好友的查询限制
  MAX_QUERIES_PER_MINUTE: 10,
  AI_RESPONSE_MAX_TOKENS: 4096,
  AI_TEMPERATURE: 0.7,
  LINE_MESSAGE_MAX_LENGTH: 2000,
  MCP_TIMEOUT: 30000, // 30秒（毫秒）
  CACHE_DEFAULT_TTL: 3600, // 1小时（秒）
} as const;

// 文件上传限制
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
  ],
  UPLOAD_PATH: '/uploads',
} as const;

// 日期格式
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'YYYY年MM月DD日',
  DISPLAY_WITH_TIME: 'YYYY年MM月DD日 HH:mm',
  API: 'YYYY-MM-DD HH:mm:ss',
} as const;

// 时区
export const TIMEZONES = {
  TOKYO: 'Asia/Tokyo',
  UTC: 'UTC',
} as const;

// 市场交易时间（东京时间）
export const MARKET_HOURS = {
  TSE: {
    MORNING_START: '09:00',
    MORNING_END: '11:30',
    AFTERNOON_START: '12:30',
    AFTERNOON_END: '15:00',
  },
  JASDAQ: {
    MORNING_START: '09:00',
    MORNING_END: '11:30',
    AFTERNOON_START: '12:30',
    AFTERNOON_END: '15:00',
  },
} as const;

// 系统事件
export const SYSTEM_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  QUERY_SUBMITTED: 'query.submitted',
  ANALYSIS_COMPLETED: 'analysis.completed',
  LINE_USER_FOLLOWED: 'line.user.followed',
  LINE_USER_UNFOLLOWED: 'line.user.unfollowed',
  AI_MODEL_UPDATED: 'ai.model.updated',
  SYSTEM_ERROR: 'system.error',
} as const;