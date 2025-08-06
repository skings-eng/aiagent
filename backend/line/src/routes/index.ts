import { Router } from 'express';
import { usersRouter, injectServices as injectUserServices } from './users';
import { messagesRouter, injectServices as injectMessageServices } from './messages';
import { webhookRouter, injectServices as injectWebhookServices } from './webhook';
import { healthRouter, injectServices as injectHealthServices, trackMetrics } from './health';
import { default as configRouter, injectServices as injectConfigServices } from './config';
import { CacheService } from '../config/redis';
import { Client } from '@line/bot-sdk';

const router = Router();

// Function to initialize all routes with services
export const initializeRoutes = (lineClient: Client, cacheService: CacheService, channelSecret: string) => {
  // Inject services into route handlers
  injectUserServices(lineClient, cacheService);
  injectMessageServices(lineClient, cacheService);
  injectWebhookServices(lineClient, cacheService, channelSecret);
  injectHealthServices(lineClient, cacheService);
  injectConfigServices(lineClient, cacheService);
  
  // Apply metrics tracking middleware to all routes
  router.use(trackMetrics);
  
  // Mount route handlers
  router.use('/users', usersRouter);
  router.use('/messages', messagesRouter);
  router.use('/webhook', webhookRouter);
  router.use('/health', healthRouter);
  router.use('/config', configRouter);
  
  return router;
};

// Export individual routers for direct use if needed
export {
  usersRouter,
  messagesRouter,
  webhookRouter,
  healthRouter,
  configRouter
};

export default router;