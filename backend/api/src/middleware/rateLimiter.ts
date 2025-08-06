import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Extend Request interface to include rateLimit property
declare module 'express-serve-static-core' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime?: Date;
    };
  }
}

// Custom store using Redis
class RedisStore {
  public prefix: string;
  private resetExpiryOnChange: boolean;

  constructor(prefix = 'rl:', resetExpiryOnChange = false) {
    this.prefix = prefix;
    this.resetExpiryOnChange = resetExpiryOnChange;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = this.prefix + key;
    const redisClient = getRedisClient();
    
    try {
      const current = await redisClient.get(redisKey);
      
      if (current === null) {
        // First request
        await redisClient.setEx(redisKey, 3600, '1'); // 1 hour default
        return { totalHits: 1, resetTime: new Date(Date.now() + 3600000) };
      }
      
      const totalHits = parseInt(current) + 1;
      
      if (this.resetExpiryOnChange) {
        await redisClient.setEx(redisKey, 3600, totalHits.toString());
      } else {
        await redisClient.set(redisKey, totalHits.toString());
      }
      
      const ttl = await redisClient.ttl(redisKey);
      const resetTime = new Date(Date.now() + ttl * 1000);
      
      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Redis rate limiter error:', error);
      // Fallback to allowing the request if Redis fails
      return { totalHits: 1, resetTime: new Date(Date.now() + 3600000) };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    const redisClient = getRedisClient();
    
    try {
      await redisClient.decr(redisKey);
    } catch (error) {
      logger.error('Redis rate limiter decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    const redisClient = getRedisClient();
    
    try {
      await redisClient.del(redisKey);
    } catch (error) {
      logger.error('Redis rate limiter reset error:', error);
    }
  }
}

// Key generator function
const generateKey = (req: Request): string => {
  // Use IP address for rate limiting since no user authentication
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  return `ip:${ip}`;
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response): void => {
  const ip = req.ip || req.connection.remoteAddress;
  
  logger.warn('Rate limit exceeded', {
    ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP/user, please try again later.',
    retryAfter: Math.round((req as any).rateLimit?.resetTime?.getTime() || Date.now() + 3600000),
  });
};

// Skip function for certain conditions
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  // Skip rate limiting for successful requests (2xx status codes)
  return res.statusCode < 400;
};

const skipFailedRequests = (req: Request, res: Response): boolean => {
  // Skip rate limiting for failed requests (4xx and 5xx status codes)
  return res.statusCode >= 400;
};

// General rate limiter (10000 requests per 15 minutes) - Increased for development
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore('general:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// Authentication rate limiter removed - no JWT authentication required

// API rate limiter (1000 requests per hour)
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each user to 1000 requests per hour
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('api:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// AI model interaction rate limiter (10000 requests per hour) - Increased for testing
export const aiModelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Limit each user to 10000 AI requests per hour
  message: 'AI model rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('ai:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// File upload rate limiter (10 uploads per hour)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 uploads per hour
  message: 'File upload rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('upload:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// Password reset rate limiter (3 requests per hour)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('password-reset:'),
  keyGenerator: (req: Request) => {
    // Use email for password reset attempts
    const email = req.body.email || req.query.email;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return email ? `email:${email}` : `ip:${ip}`;
  },
  handler: rateLimitHandler,
});

// Admin actions rate limiter (200 requests per hour)
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Limit admin users to 200 requests per hour
  message: 'Admin rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('admin:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  skip: (req: Request) => {
    // Skip admin limiter since no user authentication
    return true;
  },
});

// Search rate limiter (100 searches per hour)
export const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each user to 100 searches per hour
  message: 'Search rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('search:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// Export rate limiter (5 exports per hour)
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 exports per hour
  message: 'Export rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('export:'),
  keyGenerator: generateKey,
  handler: rateLimitHandler,
});

// Create custom rate limiter
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  prefix?: string;
  skipSuccessful?: boolean;
  skipFailed?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Rate limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore(options.prefix || 'custom:'),
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skipSuccessfulRequests: options.skipSuccessful || false,
    skipFailedRequests: options.skipFailed || false,
  });
};

// Rate limiter middleware factory
export const createRateLimiter = (type: string) => {
  switch (type) {
    case 'general':
      return generalLimiter;
    case 'auth':
      return generalLimiter; // Fallback to general limiter
    case 'api':
      return apiLimiter;
    case 'ai':
      return aiModelLimiter;
    case 'upload':
      return uploadLimiter;
    case 'password-reset':
      return passwordResetLimiter;
    case 'admin':
      return adminLimiter;
    case 'search':
      return searchLimiter;
    case 'export':
      return exportLimiter;
    default:
      return generalLimiter;
  }
};

// Utility function to check rate limit status
export const checkRateLimit = async (key: string, prefix = 'general:'): Promise<{
  allowed: boolean;
  totalHits: number;
  resetTime?: Date;
}> => {
  try {
    const redisClient = getRedisClient();
    const redisKey = prefix + key;
    const current = await redisClient.get(redisKey);
    
    if (current === null) {
      return { allowed: true, totalHits: 0 };
    }
    
    const totalHits = parseInt(current);
    const ttl = await redisClient.ttl(redisKey);
    const resetTime = new Date(Date.now() + ttl * 1000);
    
    // Default limits based on prefix
    const limits: { [key: string]: number } = {
      'general:': 100,
      'auth:': 5,
      'api:': 1000,
      'ai:': 50,
      'upload:': 10,
      'password-reset:': 3,
      'admin:': 200,
      'search:': 100,
      'export:': 5,
    };
    
    const limit = limits[prefix] || 100;
    const allowed = totalHits < limit;
    
    return { allowed, totalHits, resetTime };
  } catch (error) {
    logger.error('Rate limit check error:', error);
    return { allowed: true, totalHits: 0 };
  }
};

// Utility function to reset rate limit for a key
export const resetRateLimit = async (key: string, prefix = 'general:'): Promise<void> => {
  try {
    const redisClient = getRedisClient();
    const redisKey = prefix + key;
    await redisClient.del(redisKey);
    logger.info(`Rate limit reset for key: ${redisKey}`);
  } catch (error) {
    logger.error('Rate limit reset error:', error);
  }
};