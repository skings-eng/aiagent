import * as winston from 'winston';
import * as path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE = process.env.LOG_FILE || 'logs/app.log';
const LOG_MAX_SIZE = parseInt(process.env.LOG_MAX_SIZE || '10485760'); // 10MB in bytes
const LOG_MAX_FILES = parseInt(process.env.LOG_MAX_FILES || '5');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: LOG_LEVEL,
    format: consoleFormat,
  }),
];

// Add file transport in production or when LOG_FILE is specified
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
  // Ensure logs directory exists
  const logDir = path.dirname(LOG_FILE);
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: LOG_FILE,
      format: fileFormat,
      maxsize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file exception handlers in production
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
  const logDir = path.dirname(LOG_FILE);
  
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    })
  );
}

// Create a stream object for Morgan HTTP logger
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Utility functions for structured logging
export const logUtils = {
  // Log API request
  logRequest: (req: any, res: any, responseTime?: number) => {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  },
  
  // Log database operations
  logDatabase: (operation: string, collection: string, duration?: number, error?: any) => {
    const logData = {
      operation,
      collection,
      duration: duration ? `${duration}ms` : undefined,
      error: error?.message,
    };
    
    if (error) {
      logger.error('Database Operation Failed', logData);
    } else {
      logger.debug('Database Operation', logData);
    }
  },
  
  // Log AI model operations
  logAI: (model: string, operation: string, tokens?: number, duration?: number, error?: any) => {
    const logData = {
      model,
      operation,
      tokens,
      duration: duration ? `${duration}ms` : undefined,
      error: error?.message,
    };
    
    if (error) {
      logger.error('AI Operation Failed', logData);
    } else {
      logger.info('AI Operation', logData);
    }
  },
  
  // Log security events
  logSecurity: (event: string, userId?: string, ip?: string, details?: any) => {
    const logData = {
      event,
      userId,
      ip,
      timestamp: new Date().toISOString(),
      ...details,
    };
    
    logger.warn('Security Event', logData);
  },
  
  // Log performance metrics
  logPerformance: (metric: string, value: number, unit: string, tags?: Record<string, any>) => {
    const logData = {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...tags,
    };
    
    logger.info('Performance Metric', logData);
  },
};

// Export default logger
export default logger;