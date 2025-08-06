import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

// Log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory
const logsDir = join(process.cwd(), 'logs');

// Daily rotate file transport for error logs
const errorFileTransport = new DailyRotateFile({
  filename: join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  handleExceptions: true,
  handleRejections: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  format: fileFormat
});

// Daily rotate file transport for combined logs
const combinedFileTransport = new DailyRotateFile({
  filename: join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  handleExceptions: true,
  handleRejections: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  format: fileFormat
});

// Daily rotate file transport for access logs
const accessFileTransport = new DailyRotateFile({
  filename: join(logsDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  format: fileFormat
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: {
    service: 'line-bot-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    errorFileTransport,
    combinedFileTransport,
    accessFileTransport
  ],
  exitOnError: false
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

// Request logger utility
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Performance logger
export class PerformanceLogger {
  private startTime: number;
  private logger: winston.Logger;
  private operation: string;
  
  constructor(operation: string, requestId?: string) {
    this.startTime = Date.now();
    this.operation = operation;
    this.logger = requestId ? createRequestLogger(requestId) : logger;
  }
  
  end(additionalData?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    const logData = {
      operation: this.operation,
      duration: `${duration}ms`,
      ...additionalData
    };
    
    if (duration > 1000) {
      this.logger.warn('Slow operation detected', logData);
    } else {
      this.logger.debug('Operation completed', logData);
    }
    
    return duration;
  }
}

// Error logger utility
export const logError = (message: string, error: Error, context?: Record<string, any>) => {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  });
};

// API request logger
export const logApiRequest = (req: any, message: string) => {
  logger.info(message, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    type: 'api_request'
  });
};

// LINE webhook logger
export const logWebhookEvent = (eventType: string, userId?: string, requestId?: string) => {
  const requestLogger = requestId ? createRequestLogger(requestId) : logger;
  
  requestLogger.info('LINE webhook event received', {
    eventType,
    userId,
    type: 'webhook_event'
  });
};

// Message logger
export const logMessage = (direction: 'incoming' | 'outgoing', messageType: string, userId?: string, requestId?: string) => {
  const requestLogger = requestId ? createRequestLogger(requestId) : logger;
  
  requestLogger.info('Message processed', {
    direction,
    messageType,
    userId,
    type: 'message'
  });
};

// User action logger
export const logUserAction = (action: string, userId: string, details?: Record<string, any>, requestId?: string) => {
  const requestLogger = requestId ? createRequestLogger(requestId) : logger;
  
  requestLogger.info('User action', {
    action,
    userId,
    details,
    type: 'user_action'
  });
};

// System event logger
export const logSystemEvent = (event: string, details?: Record<string, any>) => {
  logger.info('System event', {
    event,
    details,
    type: 'system_event'
  });
};

// Security event logger
export const logSecurityEvent = (event: string, details?: Record<string, any>, requestId?: string) => {
  const requestLogger = requestId ? createRequestLogger(requestId) : logger;
  
  requestLogger.warn('Security event', {
    event,
    details,
    type: 'security_event'
  });
};

export { logger };