import { Router, Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message';
import { CacheService } from '../config/redis';
import { logger, logApiRequest, logError } from '../utils/logger';
import {
  LineError,
  MessageSendError,
  ValidationError,
  RateLimitError
} from '../types/line';
import {
  Message as MessageRecord,
  ApiResponse,
  PaginatedResponse,
  BotResponse,
  MessageAnalytics
} from '../types';
import { Client, Message, TextMessage, ImageMessage, StickerMessage, QuickReply, QuickReplyItem } from '@line/bot-sdk';

const router = Router();

// Initialize services (will be injected by the main app)
let messageService: MessageService;
let cacheService: CacheService;

// Middleware to inject services
export const injectServices = (lineClient: Client, cache: CacheService) => {
  messageService = new MessageService(lineClient, cache);
  cacheService = cache;
};

// Middleware for request validation
const validateMessageData = (req: Request, res: Response, next: NextFunction) => {
  const { messages } = req.body;
  
  if (!messages) {
    return res.status(400).json({
      success: false,
      error: 'Messages are required',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  const messageArray = Array.isArray(messages) ? messages : [messages];
  
  if (messageArray.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one message is required',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  if (messageArray.length > 5) {
    return res.status(400).json({
      success: false,
      error: 'Cannot send more than 5 messages at once',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  return next();
};

// Middleware for pagination validation
const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { limit = '50', offset = '0' } = req.query;
  
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be between 1 and 100',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      success: false,
      error: 'Offset must be a non-negative number',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  req.query.limit = limitNum.toString();
  req.query.offset = offsetNum.toString();
  
  return next();
};

/**
 * POST /messages/reply
 * Send reply message
 */
router.post('/reply', validateMessageData, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Send reply message');
    
    const { replyToken, messages } = req.body;
    
    if (!replyToken) {
      return res.status(400).json({
        success: false,
        error: 'Reply token is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await messageService.sendReply(replyToken, messages);
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to send reply message', error as Error, {
      replyToken: req.body.replyToken,
      messageCount: Array.isArray(req.body.messages) ? req.body.messages.length : 1,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/push
 * Send push message
 */
router.post('/push', validateMessageData, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Send push message');
    
    const { to, messages } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to) is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await messageService.sendPush(to, messages);
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to send push message', error as Error, {
      to: req.body.to,
      messageCount: Array.isArray(req.body.messages) ? req.body.messages.length : 1,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/multicast
 * Send multicast message
 */
router.post('/multicast', validateMessageData, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Send multicast message');
    
    const { to, messages } = req.body;
    
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array (to) is required and cannot be empty',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const result = await messageService.sendMulticast(to, messages);
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to send multicast message', error as Error, {
      recipientCount: Array.isArray(req.body.to) ? req.body.to.length : 0,
      messageCount: Array.isArray(req.body.messages) ? req.body.messages.length : 1,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/broadcast
 * Send broadcast message
 */
router.post('/broadcast', validateMessageData, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Send broadcast message');
    
    const { messages } = req.body;
    
    const result = await messageService.sendBroadcast(messages);
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to send broadcast message', error as Error, {
      messageCount: Array.isArray(req.body.messages) ? req.body.messages.length : 1,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/text
 * Create and send text message
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Create text message');
    
    const { text, quickReply, replyToken, to } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    if (!replyToken && !to) {
      return res.status(400).json({
        success: false,
        error: 'Either replyToken or to is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Create quick reply if provided
    let quickReplyObj: QuickReply | undefined;
    if (quickReply && Array.isArray(quickReply)) {
      quickReplyObj = messageService.createQuickReply(quickReply);
    }
    
    // Create text message
    const message = messageService.createTextMessage(text, quickReplyObj);
    
    // Send message
    let result: BotResponse;
    if (replyToken) {
      result = await messageService.sendReply(replyToken, message);
    } else {
      result = await messageService.sendPush(to, message);
    }
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to create and send text message', error as Error, {
      text: req.body.text?.substring(0, 100),
      hasReplyToken: !!req.body.replyToken,
      hasTo: !!req.body.to,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/image
 * Create and send image message
 */
router.post('/image', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Create image message');
    
    const { originalContentUrl, previewImageUrl, quickReply, replyToken, to } = req.body;
    
    if (!originalContentUrl || !previewImageUrl) {
      return res.status(400).json({
        success: false,
        error: 'originalContentUrl and previewImageUrl are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    if (!replyToken && !to) {
      return res.status(400).json({
        success: false,
        error: 'Either replyToken or to is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Create quick reply if provided
    let quickReplyObj: QuickReply | undefined;
    if (quickReply && Array.isArray(quickReply)) {
      quickReplyObj = messageService.createQuickReply(quickReply);
    }
    
    // Create image message
    const message = messageService.createImageMessage(originalContentUrl, previewImageUrl, quickReplyObj);
    
    // Send message
    let result: BotResponse;
    if (replyToken) {
      result = await messageService.sendReply(replyToken, message);
    } else {
      result = await messageService.sendPush(to, message);
    }
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to create and send image message', error as Error, {
      originalContentUrl: req.body.originalContentUrl,
      previewImageUrl: req.body.previewImageUrl,
      hasReplyToken: !!req.body.replyToken,
      hasTo: !!req.body.to,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /messages/sticker
 * Create and send sticker message
 */
router.post('/sticker', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Create sticker message');
    
    const { packageId, stickerId, quickReply, replyToken, to } = req.body;
    
    if (!packageId || !stickerId) {
      return res.status(400).json({
        success: false,
        error: 'packageId and stickerId are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    if (!replyToken && !to) {
      return res.status(400).json({
        success: false,
        error: 'Either replyToken or to is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Create quick reply if provided
    let quickReplyObj: QuickReply | undefined;
    if (quickReply && Array.isArray(quickReply)) {
      quickReplyObj = messageService.createQuickReply(quickReply);
    }
    
    // Create sticker message
    const message = messageService.createStickerMessage(packageId, stickerId, quickReplyObj);
    
    // Send message
    let result: BotResponse;
    if (replyToken) {
      result = await messageService.sendReply(replyToken, message);
    } else {
      result = await messageService.sendPush(to, message);
    }
    
    const response: ApiResponse<BotResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to create and send sticker message', error as Error, {
      packageId: req.body.packageId,
      stickerId: req.body.stickerId,
      hasReplyToken: !!req.body.replyToken,
      hasTo: !!req.body.to,
      ip: req.ip
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: (error as Error).message,
        code: 'RATE_LIMIT_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if (error instanceof MessageSendError) {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'MESSAGE_SEND_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * GET /messages/history/:userId
 * Get message history for a user
 */
router.get('/history/:userId', validatePagination, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get message history');
    
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const messages = await messageService.getMessageHistory(userId, limit, offset);
    
    const paginatedData: PaginatedResponse<MessageRecord> = {
      data: messages,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        total: messages.length, // This would need to be calculated properly
        totalPages: Math.ceil(messages.length / limit),
        hasNext: messages.length === limit,
        hasPrev: offset > 0
      }
    };
    
    const response: ApiResponse<PaginatedResponse<MessageRecord>> = {
      success: true,
      data: paginatedData,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get message history', error as Error, {
      userId: req.params.userId,
      limit: req.query.limit,
      offset: req.query.offset,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /messages/analytics
 * Get message analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get message analytics');
    
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const analytics = await messageService.getMessageAnalytics(start, end);
    
    const response: ApiResponse<MessageAnalytics> = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get message analytics', error as Error, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

export default router;
export { router as messagesRouter };