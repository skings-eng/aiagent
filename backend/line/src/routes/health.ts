import { Router, Request, Response } from 'express';
import { CacheService } from '../config/redis';
import { logger, logApiRequest, logError } from '../utils/logger';
import { ApiResponse } from '../types';
import { Client } from '@line/bot-sdk';
import os from 'os';

const router = Router();

// Initialize services (will be injected by the main app)
let cacheService: CacheService;
let lineClient: Client;

// Middleware to inject services
export const injectServices = (client: Client, cache: CacheService) => {
  lineClient = client;
  cacheService = cache;
};

// Health check data interface
interface HealthCheckData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    redis: {
      status: 'connected' | 'disconnected' | 'error';
      latency?: number;
      error?: string;
    };
    lineApi: {
      status: 'connected' | 'disconnected' | 'error';
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      available: number;
      total: number;
      percentage: number;
    };
  };
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
  };
}

// Simple metrics storage
let metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: [] as number[]
};

// Middleware to track metrics
const trackMetrics = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  metrics.requestCount++;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }
    
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });
  
  next();
};

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthData = await getHealthData();
    
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;
    
    const response: ApiResponse<HealthCheckData> = {
      success: healthData.status !== 'unhealthy',
      data: healthData,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  } catch (error) {
    logError('Health check failed', error as Error, { ip: req.ip });
    
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString(),
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      }
    } as ApiResponse<any>);
  }
});

/**
 * GET /health/detailed
 * Detailed health check with all service statuses
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Detailed health check');
    
    const healthData = await getHealthData(true);
    
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;
    
    const response: ApiResponse<HealthCheckData> = {
      success: healthData.status !== 'unhealthy',
      data: healthData,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  } catch (error) {
    logError('Detailed health check failed', error as Error, { ip: req.ip });
    
    res.status(503).json({
      success: false,
      error: 'Detailed health check failed',
      code: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString(),
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      }
    } as ApiResponse<any>);
  }
});

/**
 * GET /health/redis
 * Redis-specific health check
 */
router.get('/redis', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Redis health check');
    
    const redisHealth = await checkRedisHealth();
    
    const response: ApiResponse<typeof redisHealth> = {
      success: redisHealth.status === 'connected',
      data: redisHealth,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = redisHealth.status === 'connected' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logError('Redis health check failed', error as Error, { ip: req.ip });
    
    res.status(503).json({
      success: false,
      error: 'Redis health check failed',
      code: 'REDIS_HEALTH_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /health/line
 * LINE API health check
 */
router.get('/line', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'LINE API health check');
    
    const lineHealth = await checkLineApiHealth();
    
    const response: ApiResponse<typeof lineHealth> = {
      success: lineHealth.status === 'connected',
      data: lineHealth,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = lineHealth.status === 'connected' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logError('LINE API health check failed', error as Error, { ip: req.ip });
    
    res.status(503).json({
      success: false,
      error: 'LINE API health check failed',
      code: 'LINE_API_HEALTH_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /health/metrics
 * Get application metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get health metrics');
    
    const averageResponseTime = metrics.responseTimes.length > 0 
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
      : 0;
    
    const metricsData = {
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    const response: ApiResponse<typeof metricsData> = {
      success: true,
      data: metricsData,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logError('Failed to get metrics', error as Error, { ip: req.ip });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      code: 'METRICS_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * POST /health/reset-metrics
 * Reset application metrics
 */
router.post('/reset-metrics', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Reset health metrics');
    
    metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimes: []
    };
    
    const response: ApiResponse<{ reset: boolean; timestamp: string }> = {
      success: true,
      data: {
        reset: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logError('Failed to reset metrics', error as Error, { ip: req.ip });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      code: 'METRICS_RESET_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /health/readiness
 * Kubernetes readiness probe
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const redisHealth = await checkRedisHealth();
    const lineHealth = await checkLineApiHealth();
    
    const isReady = redisHealth.status === 'connected' && lineHealth.status === 'connected';
    
    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ 
        status: 'not ready',
        services: {
          redis: redisHealth.status,
          lineApi: lineHealth.status
        }
      });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: (error as Error).message
    });
  }
});

/**
 * GET /health/liveness
 * Kubernetes liveness probe
 */
router.get('/liveness', (req: Request, res: Response) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({ status: 'alive' });
});

// Helper functions

async function getHealthData(detailed: boolean = false): Promise<HealthCheckData> {
  const redisHealth = await checkRedisHealth();
  const lineHealth = await checkLineApiHealth();
  
  // Determine overall status
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  
  if (redisHealth.status === 'error' || lineHealth.status === 'error') {
    status = 'unhealthy';
  } else if (redisHealth.status === 'disconnected' || lineHealth.status === 'disconnected') {
    status = 'degraded';
  }
  
  const averageResponseTime = metrics.responseTimes.length > 0 
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
    : 0;
  
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      redis: redisHealth,
      lineApi: lineHealth
    },
    system: {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        usage: Math.round(process.cpuUsage().user / 1000000) // Convert to seconds
      },
      disk: {
        available: Math.round(freeMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100)
      }
    },
    metrics: {
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      averageResponseTime: Math.round(averageResponseTime)
    }
  };
}

async function checkRedisHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}> {
  try {
    if (!cacheService) {
      return { status: 'disconnected', error: 'Cache service not initialized' };
    }
    
    const startTime = Date.now();
    
    // Test Redis connection with a simple ping
    await cacheService.set('health_check', 'ping', 10);
    const result = await cacheService.get('health_check');
    
    const latency = Date.now() - startTime;
    
    if (result === 'ping') {
      await cacheService.del('health_check');
      return { status: 'connected', latency };
    } else {
      return { status: 'error', error: 'Redis ping test failed' };
    }
  } catch (error) {
    return { 
      status: 'error', 
      error: (error as Error).message 
    };
  }
}

async function checkLineApiHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}> {
  try {
    if (!lineClient) {
      return { status: 'disconnected', error: 'LINE client not initialized' };
    }
    
    // Test LINE API connection by getting bot info
    // This is a simple check that doesn't require specific user data
    const botInfo = await lineClient.getBotInfo();
    
    if (botInfo && botInfo.userId) {
      return { status: 'connected' };
    } else {
      return { status: 'error', error: 'Invalid bot info response' };
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    // Check if it's a network/connection error vs API error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      return { status: 'disconnected', error: errorMessage };
    } else {
      return { status: 'error', error: errorMessage };
    }
  }
}

export default router;
export { router as healthRouter, trackMetrics };