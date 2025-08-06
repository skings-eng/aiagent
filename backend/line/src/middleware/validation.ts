import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestLogger';

/**
 * Validate LINE webhook signature
 */
export const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const reqWithId = req as RequestWithId;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  
  if (!channelSecret) {
    logger.error('LINE_CHANNEL_SECRET not configured', {
      requestId: reqWithId.id,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      requestId: reqWithId.id,
      timestamp: new Date().toISOString()
    });
  }
  
  const signature = req.get('x-line-signature');
  
  if (!signature) {
    logger.warn('Missing LINE signature', {
      requestId: reqWithId.id,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      success: false,
      error: 'Missing signature',
      requestId: reqWithId.id,
      timestamp: new Date().toISOString()
    });
  }
  
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', channelSecret!)
    .update(body)
    .digest('base64');
  
  if (signature !== expectedSignature) {
    logger.warn('Invalid LINE signature', {
      requestId: reqWithId.id,
      url: req.url,
      receivedSignature: signature,
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid signature',
      requestId: reqWithId.id,
      timestamp: new Date().toISOString()
    });
  }
  
  logger.debug('Webhook signature validated', {
    requestId: reqWithId.id,
    timestamp: new Date().toISOString()
  });
  
  return next();
};

/**
 * Validate request body size
 */
export const validateBodySize = (maxSize: number = 1024 * 1024) => {
  return (req: RequestWithId, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      logger.warn('Request body too large', {
        requestId: req.id,
        contentLength,
        maxSize,
        url: req.url,
        timestamp: new Date().toISOString()
      });
      
      return res.status(413).json({
        success: false,
        error: 'Request body too large',
        requestId: req.id,
        maxSize,
        timestamp: new Date().toISOString()
      });
    }
    
    return next();
  };
};

/**
 * Validate content type
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: RequestWithId, res: Response, next: NextFunction) => {
    const contentType = req.get('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      logger.warn('Invalid content type', {
        requestId: req.id,
        contentType,
        allowedTypes,
        url: req.url,
        timestamp: new Date().toISOString()
      });
      
      return res.status(415).json({
        success: false,
        error: 'Unsupported content type',
        requestId: req.id,
        allowedTypes,
        timestamp: new Date().toISOString()
      });
    }
    
    return next();
  };
};