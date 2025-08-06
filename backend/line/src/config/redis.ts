import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

// Redis connection configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3'),
  lazyConnect: true
};

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    if (redisClient?.isOpen) {
      logger.info('Redis client already connected');
      return;
    }
    
    const clientOptions: any = {
      url: redisConfig.url,
      database: redisConfig.database,
      socket: {
        connectTimeout: redisConfig.connectTimeout,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 50, 500);
        }
      }
    };
    
    if (redisConfig.password) {
      clientOptions.password = redisConfig.password;
    }
    
    redisClient = createClient(clientOptions);
    
    // Error handling
    redisClient.on('error', (error) => {
      logger.error('Redis client error', error);
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
    
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('Redis connection established successfully');
    
  } catch (error) {
    logger.error('Failed to connect to Redis', error as Error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient?.isOpen) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis', error as Error);
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client is not connected');
  }
  return redisClient;
}

/**
 * Cache service for common operations
 */
export class CacheService {
  private client: RedisClientType;
  
  constructor() {
    this.client = getRedisClient();
  }
  
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error as Error);
      return null;
    }
  }
  
  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error as Error);
      return false;
    }
  }
  
  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error as Error);
      return false;
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error as Error);
      return false;
    }
  }
  
  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys error for pattern ${pattern}`, error as Error);
      return [];
    }
  }
  
  /**
   * Delete all keys matching pattern
   */
  async flushPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.client.del(keys);
    } catch (error) {
      logger.error(`Cache flush pattern error for ${pattern}`, error as Error);
      return 0;
    }
  }
  
  /**
   * Set hash field
   */
  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hSet(key, field, value);
      return true;
    } catch (error) {
      logger.error(`Cache hSet error for key ${key}, field ${field}`, error as Error);
      return false;
    }
  }
  
  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error(`Cache hGet error for key ${key}, field ${field}`, error as Error);
      return undefined;
    }
  }
  
  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error(`Cache hGetAll error for key ${key}`, error as Error);
      return {};
    }
  }
  
  /**
   * Delete hash field
   */
  async hDel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hDel(key, field);
      return result > 0;
    } catch (error) {
      logger.error(`Cache hDel error for key ${key}, field ${field}`, error as Error);
      return false;
    }
  }
  
  /**
   * Add to set
   */
  async sAdd(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sAdd(key, member);
      return result > 0;
    } catch (error) {
      logger.error(`Cache sAdd error for key ${key}, member ${member}`, error as Error);
      return false;
    }
  }
  
  /**
   * Get set members
   */
  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error(`Cache sMembers error for key ${key}`, error as Error);
      return [];
    }
  }
  
  /**
   * Remove from set
   */
  async sRem(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sRem(key, member);
      return result > 0;
    } catch (error) {
      logger.error(`Cache sRem error for key ${key}, member ${member}`, error as Error);
      return false;
    }
  }
  
  /**
   * Generate cache key with prefix
   */
  static generateKey(prefix: string, ...parts: string[]): string {
    return `line:${prefix}:${parts.join(':')}`;
  }
}