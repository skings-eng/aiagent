import { Router, Request, Response } from 'express';
import { MessageService } from '../services/message';
import { logger } from '../utils/logger';
import { Client } from '@line/bot-sdk';
import { CacheService } from '../config/redis';
import { ApiResponse } from '../types';

const router = Router();

// Function to get cache service (lazy initialization)
function getCacheService(): CacheService {
  return new CacheService();
}

// Function to get LINE client (lazy initialization)
function getLineClient(): Client {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  if (!process.env.LINE_CHANNEL_SECRET) {
    throw new Error('LINE_CHANNEL_SECRET is not set');
  }
  
  return new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  });
}

// Function to get message service (lazy initialization)
function getMessageService(): MessageService {
  const lineClient = getLineClient();
  const cacheService = getCacheService();
  return new MessageService(lineClient, cacheService);
}

/**
 * Send a push message
 */
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { to, messages } = req.body;
    
    if (!to || !messages) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, messages',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await getMessageService().sendPush(to, messages);
    
    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to send push message', error as Error, {
      to: req.body.to
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * Send a multicast message
 */
router.post('/multicast', async (req: Request, res: Response) => {
  try {
    const { to, messages } = req.body;
    
    if (!to || !Array.isArray(to) || !messages) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to (array), messages',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await getMessageService().sendMulticast(to, messages);
    
    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to send multicast message', error as Error, {
      recipients: req.body.to
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * Send a broadcast message
 */
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!messages) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: messages',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await getMessageService().sendBroadcast(messages);
    
    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to send broadcast message', error as Error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * Get message history for a user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const { limit = '50', offset = '0' } = req.query;
    
    const messages = await getMessageService().getMessageHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json({
      success: true,
      data: messages,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to get message history', error as Error, {
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get message history',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * Get message analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: startDate, endDate',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const analytics = await getMessageService().getMessageAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    return res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    logger.error('Failed to get message analytics', error as Error, {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get message analytics',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

export default router;