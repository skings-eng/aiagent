import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { Settings } from './models/Settings';
import { loadGeminiConfig, geminiConfig } from './routes/aiModels';
import mongoose from 'mongoose';

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
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
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
      'http://127.0.0.1:5173',
      // Production origins - Ubuntu server
      'http://172.237.20.24:3000',
      'http://172.237.20.24:3001',
      'http://172.237.20.24:3002',
      'http://172.237.20.24:5173',
      'http://172.237.20.24:8080',
      'http://172.237.20.24:80',
      // HTTPS versions for production
      'https://172.237.20.24:3000',
      'https://172.237.20.24:3001',
      'https://172.237.20.24:3002',
      'https://172.237.20.24:5173',
      'https://172.237.20.24:8080',
      'https://172.237.20.24:443',
      // Production domain
      'https://aiforstock.shop',
      'https://aiforstock.shop/chat',
      'http://aiforstock.shop',
      'http://aiforstock.shop/chat',
    ];
    
    // Add production origins from environment
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    // In production, also allow any origin from the same host
    if (process.env.NODE_ENV === 'production' && origin) {
      try {
        const originUrl = new URL(origin);
        const serverHost = process.env.SERVER_HOST || '172.237.20.24';
        if (originUrl.hostname === serverHost || originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid URL, continue with normal check
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Forwarded-For',
    'X-Real-IP',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim(), { source: 'morgan' });
      }
    }
  }));
}

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP request completed with error', logData);
    } else {
      logger.info('HTTP request completed', logData);
    }
  });
  
  next();
});

// Static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agent API Server',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs',
    health: '/api/health',
    status: '/api/status',
  });
});

// 404 handler for non-API routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Initialize Gemini API key from environment variable
const initializeGeminiFromEnv = async () => {
  try {
    // Try GOOGLE_API_KEY first (recommended by Google Gen AI SDK), then fallback to GOOGLE_AI_API_KEY
    const envApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!envApiKey) {
      logger.info('No GOOGLE_API_KEY or GOOGLE_AI_API_KEY found in environment variables');
      return;
    }
    
    logger.info('Found Gemini API key in environment variables', {
      keySource: process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'GOOGLE_AI_API_KEY',
      keyLength: envApiKey.length
    });
    
    // Check if API key already exists in database
    const existingSetting = await Settings.getByKey('ai', 'gemini_api_key');
    
    if (existingSetting && existingSetting.value) {
      logger.info('Gemini API key already configured in database');
      return;
    }
    
    // Save environment API key to database
    const userObjectId = new mongoose.Types.ObjectId();
    
    if (existingSetting) {
      await existingSetting.updateValue(envApiKey, userObjectId, 'API key initialized from environment variable');
    } else {
      await Settings.create({
        category: 'ai',
        key: 'gemini_api_key',
        value: envApiKey,
        type: 'string',
        description: 'Gemini AI API key for chat functionality',
        isPublic: false,
        isEditable: true,
        metadata: {
          group: 'gemini',
          sensitive: true,
          restartRequired: false,
        },
        createdBy: userObjectId,
        updatedBy: userObjectId,
      });
    }
    
    // Update in-memory configuration
    geminiConfig.apiKey = envApiKey;
    geminiConfig.isConnected = true;
    geminiConfig.lastTested = new Date().toISOString();
    
    logger.info('Gemini API key initialized from environment variable and saved to database');
    
  } catch (error) {
    logger.error('Failed to initialize Gemini API key from environment variable', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected successfully');
    
    // Load Gemini configuration from database after MongoDB connection
    await loadGeminiConfig();
    
    // Initialize Gemini API key from environment variable if not in database
    await initializeGeminiFromEnv();
    
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');
    
    // Initialize default settings (skip for now - will be handled by admin user creation)
    // await Settings.initializeDefaults();
    // logger.info('Default settings initialized');
    
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.API_VERSION || '1.0.0',
        pid: process.pid,
      });
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Starting graceful shutdown...');
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections
        // MongoDB connection will be closed automatically
        // Redis connection should be closed if needed
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
export { startServer };
