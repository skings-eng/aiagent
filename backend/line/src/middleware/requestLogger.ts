import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id: string;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqWithId = req as RequestWithId;
  reqWithId.id = uuidv4();
  
  const start = Date.now();
  const { method, url } = req;
  
  logger.info('Request started', {
    requestId: reqWithId.id,
    method,
    url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId: reqWithId.id,
      method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return originalEnd(chunk, encoding, cb);
  };
  
  next();
};