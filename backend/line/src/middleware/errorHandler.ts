import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestLogger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const reqWithId = req as RequestWithId;
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    requestId: reqWithId.id,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let message = 'Internal Server Error';
  let statusCode = 500;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // Custom app errors
  if (err instanceof AppError) {
    message = err.message;
    statusCode = err.statusCode;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    requestId: reqWithId.id,
    timestamp: new Date().toISOString()
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const reqWithId = req as RequestWithId;
  const message = `Route ${req.originalUrl} not found`;
  
  logger.warn('Route not found', {
    requestId: reqWithId.id,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(404).json({
    success: false,
    error: message,
    requestId: reqWithId.id,
    timestamp: new Date().toISOString()
  });
};