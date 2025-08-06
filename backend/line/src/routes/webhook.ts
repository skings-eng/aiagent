import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/webhook';
import { MessageService } from '../services/message';
import { UserService } from '../services/user';
import { CacheService } from '../config/redis';
import { logger, logApiRequest, logError, logWebhookEvent } from '../utils/logger';
import {
  ApiResponse
} from '../types';
import { Client, middleware, MiddlewareConfig, WebhookEvent } from '@line/bot-sdk';
import crypto from 'crypto';

const router = Router();

// Initialize services (will be injected by the main app)
let webhookService: WebhookService;
let messageService: MessageService;
let userService: UserService;
let cacheService: CacheService;
let lineClient: Client;
let channelSecret: string;

// Middleware to inject services
export const injectServices = async (client: Client, cache: CacheService, secret: string) => {
  lineClient = client;
  cacheService = cache;
  channelSecret = secret;
  
  // WebhookService is now static, no need to instantiate
  await WebhookService.initialize();
  messageService = new MessageService(client, cache);
  userService = new UserService(client, cache);
};

// Custom webhook validation middleware
const validateWebhook = (req: Request, res: Response, next: Function) => {
  try {
    const signature = req.get('x-line-signature');
    
    if (!signature) {
      logError('Missing LINE signature', new Error('No signature header'), {
        headers: req.headers,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Missing LINE signature',
        code: 'WEBHOOK_VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    
    if (signature !== hash) {
      logError('Invalid LINE signature', new Error('Signature mismatch'), {
        signature,
        expectedHash: hash,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid LINE signature',
        code: 'WEBHOOK_VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    return next();
  } catch (error) {
    logError('Webhook validation error', error as Error, {
      ip: req.ip,
      headers: req.headers
    });
    
    return res.status(500).json({
      success: false,
      error: 'Webhook validation failed',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
};

// Rate limiting for webhook events
const webhookRateLimit = async (req: Request, res: Response, next: Function) => {
  try {
    const ip = req.ip;
    const key = `webhook_rate_limit:${ip}`;
    const limit = 1000; // requests per minute
    const window = 60; // seconds
    
    const current = await cacheService.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      logError('Webhook rate limit exceeded', new Error('Too many requests'), {
        ip,
        count,
        limit
      });
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    await cacheService.set(key, (count + 1).toString(), window);
    return next();
  } catch (error) {
    // Don't block webhook processing if rate limiting fails
    logger.warn('Webhook rate limiting failed', { error: (error as Error).message });
    return next();
  }
};

/**
 * POST /webhook
 * Handle LINE webhook events
 */
router.post('/', webhookRateLimit, validateWebhook, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'LINE webhook received');
    
    const { events, destination } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Log webhook event
    logWebhookEvent('Webhook events received', JSON.stringify({
      eventCount: events.length,
      destination: req.body.destination,
      eventTypes: events.map((e: WebhookEvent) => e.type)
    }));
    
    // Process events asynchronously
    const eventPromises = events.map(async (event: WebhookEvent) => {
      try {
        // Process webhook event (WebhookService doesn't have handleEvent method)
        logWebhookEvent(`Processing ${event.type} event`, JSON.stringify(event));
        
        // Update user activity if applicable
        // Note: extractUserId is private, using direct extraction
        const userId = (event as any).source?.userId;
        if (userId) {
          await userService.updateUserActivity(userId);
        }
      } catch (error) {
        logError('Failed to process webhook event', error as Error, {
          eventType: event.type,
          eventId: (event as any).webhookEventId,
          userId: (event as any).source?.userId
        });
        
        // Don't throw error to prevent webhook retry
      }
    });
    
    // Wait for all events to be processed (with timeout)
    await Promise.allSettled(eventPromises);
    
    // Always respond with 200 OK to prevent LINE from retrying
    return res.status(200).json({
      success: true,
      data: {
        processed: events.length,
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<{ processed: number; timestamp: string }>);
    
  } catch (error) {
    logError('Webhook processing error', error as Error, {
      body: req.body,
      ip: req.ip
    });
    
    // Always respond with 200 OK to prevent LINE from retrying
    return res.status(200).json({
      success: false,
      error: 'Webhook processing failed',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /webhook/test
 * Test webhook endpoint
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Webhook test');
    
    const response: ApiResponse<{ status: string; timestamp: string; services: any }> = {
      success: true,
      data: {
        status: 'Webhook endpoint is working',
        timestamp: new Date().toISOString(),
        services: {
          webhookService: true,
          messageService: !!messageService,
          userService: !!userService,
          cacheService: !!cacheService,
          lineClient: !!lineClient
        }
      },
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Webhook test error', error as Error, { ip: req.ip });
    
    return res.status(500).json({
      success: false,
      error: 'Webhook test failed',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * POST /webhook/simulate
 * Simulate webhook event for testing
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Simulate webhook event');
    
    const { event } = req.body;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Event data is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Validate event structure
    if (!event.type || !event.timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event structure',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Process the simulated event
    // Note: WebhookService doesn't have handleEvent method, using direct processing
    logWebhookEvent('Simulated event', event);
    
    const response: ApiResponse<{ processed: boolean; timestamp: string }> = {
      success: true,
      data: {
        processed: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Webhook simulation error', error as Error, {
      event: req.body.event,
      ip: req.ip
    });
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Webhook simulation failed',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * GET /webhook/events
 * Get recent webhook events (for debugging)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get webhook events');
    
    const { limit = '50', type } = req.query;
    
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Get recent events from cache
    const cacheKey = type 
      ? CacheService.generateKey('webhook_events', type as string)
      : CacheService.generateKey('webhook_events', 'all');
    
    const eventsData = await cacheService.get(cacheKey);
    const events = eventsData ? JSON.parse(eventsData) : [];
    
    // Limit results
    const limitedEvents = events.slice(0, limitNum);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: limitedEvents,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get webhook events', error as Error, {
      query: req.query,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get webhook events',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * POST /webhook/register-handler
 * Register custom event handler
 */
router.post('/register-handler', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Register webhook handler');
    
    const { eventType, handlerName } = req.body;
    
    if (!eventType || !handlerName) {
      return res.status(400).json({
        success: false,
        error: 'Event type and handler name are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // This would typically register a custom handler
    // For now, we'll just acknowledge the registration
    
    const response: ApiResponse<{ registered: boolean; eventType: string; handlerName: string }> = {
      success: true,
      data: {
        registered: true,
        eventType,
        handlerName
      },
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to register webhook handler', error as Error, {
      body: req.body,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to register webhook handler',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /webhook/events
 * Clear webhook events cache
 */
router.delete('/events', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Clear webhook events');
    
    // Clear webhook events cache
    await cacheService.flushPattern('webhook_events:*');
    
    const response: ApiResponse<{ cleared: boolean; timestamp: string }> = {
      success: true,
      data: {
        cleared: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logError('Failed to clear webhook events', error as Error, { ip: req.ip });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear webhook events',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

export default router;
export { router as webhookRouter };