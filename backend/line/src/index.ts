import { config } from 'dotenv';
import { join } from 'path';
import { createServer } from './server';
import { logger } from './utils/logger';
import { connectRedis, disconnectRedis } from './config/redis';
import { WebhookService } from './services/webhook';
import { MessageService } from './services/message';
import { UserService } from './services/user';

// Load environment variables
config({ path: join(__dirname, '../.env') });

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }
    
    // Disconnect from Redis
    await disconnectRedis();
    logger.info('Redis connection closed');
    
    // Clean up services
    await WebhookService.cleanup();
    // Services cleanup handled by graceful shutdown
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Main application startup
let server: any;

async function startApplication() {
  try {
    logger.info('Starting LINE Bot Service...');
    
    // Validate required environment variables
    const requiredEnvVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'REDIS_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('Redis connected successfully');
    
    // Initialize services
    logger.info('Initializing services...');
    await WebhookService.initialize();
    logger.info('Services initialized successfully');
    
    // Create and start server
    const app = createServer();
    const port = process.env.PORT || 3003;
    
    server = app.listen(port, () => {
      logger.info(`🚀 LINE Bot Service started on port ${port}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Webhook URL: ${process.env.LINE_WEBHOOK_URL || `http://localhost:${port}/webhook`}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
      
      // Log service status
      logger.info('✅ LINE Bot Service is ready to receive webhooks');
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
      
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });
    
  } catch (error) {
    logger.error('Failed to start LINE Bot Service:', error);
    process.exit(1);
  }
}

// Start the application
startApplication().catch((error) => {
  logger.error('Application startup failed:', error);
  process.exit(1);
});

// Export for testing
export { server };