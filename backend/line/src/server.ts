import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { middleware, Client } from '@line/bot-sdk';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { validateWebhook } from './middleware/validation';
import { CacheService } from './config/redis';

// Import routes
import webhookRoutes from './routes/webhook';
import healthRoutes from './routes/health';
import userRoutes from './routes/user';
import messageRoutes from './routes/message';
import configRoutes, { injectServices as injectConfigServices } from './routes/config';

// Function to get LINE Bot SDK configuration (lazy initialization)
function getLineConfig() {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  if (!process.env.LINE_CHANNEL_SECRET) {
    throw new Error('LINE_CHANNEL_SECRET is not set');
  }
  
  return {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  };
}

export function createServer(): express.Application {
  const app = express();
  
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Line-Signature'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));
  
  // Request logging middleware
  app.use(requestLogger);
  
  // Rate limiting
  if (process.env.RATE_LIMIT_ENABLED !== 'false') {
    app.use(rateLimiter);
  }
  
  // Health check endpoint (before other middleware)
  app.use('/health', healthRoutes);
  
  // LINE webhook middleware (for webhook routes only)
  app.use('/webhook', middleware(getLineConfig()));
  
  // Body parsing for non-webhook routes
  app.use('/api', express.json({ limit: '10mb' }));
  app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Webhook validation middleware
  app.use('/webhook', validateWebhook);
  
  // Initialize services for config routes
  try {
    const lineClient = new Client(getLineConfig());
    const cacheService = new CacheService();
    injectConfigServices(lineClient, cacheService);
  } catch (error) {
    logger.warn('Failed to initialize config services:', error);
  }
  
  // API Routes
  app.use('/webhook', webhookRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/messages', messageRoutes);
  app.use('/api/v1/line/config', configRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'LINE Bot Service',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        webhook: '/webhook',
        health: '/health',
        users: '/api/v1/users',
        messages: '/api/v1/messages',
        config: '/api/v1/line/config'
      }
    });
  });
  
  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      title: 'LINE Bot Service API',
      version: '1.0.0',
      description: 'REST API for LINE Bot Service',
      baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
      endpoints: {
        users: {
          'GET /users': 'Get all users',
          'GET /users/:userId': 'Get user by ID',
          'PUT /users/:userId': 'Update user',
          'DELETE /users/:userId': 'Delete user'
        },
        messages: {
          'GET /messages': 'Get message history',
          'POST /messages/send': 'Send message',
          'GET /messages/:messageId': 'Get message by ID'
        }
      },
      webhook: {
        url: '/webhook',
        method: 'POST',
        description: 'LINE webhook endpoint for receiving events'
      }
    });
  });
  
  // 404 handler - must be after all routes
  app.use(notFoundHandler);
  
  // Global error handler - must be last
  app.use(errorHandler);
  
  return app;
}

// Export LINE config function for use in other modules
export { getLineConfig };