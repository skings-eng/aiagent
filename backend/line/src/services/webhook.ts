import { WebhookEvent, Client } from '@line/bot-sdk';
import { v4 as uuidv4 } from 'uuid';
import { logger, logWebhookEvent, logError } from '../utils/logger';
import { CacheService } from '../config/redis';
import { getLineConfig } from '../server';
import MessageService from './message';
import UserService from './user';
import { BotResponse } from '../types';

// Define webhook event data interface
interface WebhookEventData {
  id: string;
  type: string;
  userId?: string | undefined;
  timestamp: Date;
  replyToken?: string | undefined;
  source: {
    type: string;
    userId?: string | undefined;
    groupId?: string | undefined;
    roomId?: string | undefined;
  };
}

// Define event handlers interface
interface EventHandlers {
  message?: (event: any, context: any) => Promise<BotResponse | void>;
  follow?: (event: any, context: any) => Promise<BotResponse | void>;
  unfollow?: (event: any, context: any) => Promise<void>;
  join?: (event: any, context: any) => Promise<BotResponse | void>;
  leave?: (event: any, context: any) => Promise<void>;
  memberJoined?: (event: any, context: any) => Promise<BotResponse | void>;
  memberLeft?: (event: any, context: any) => Promise<void>;
  postback?: (event: any, context: any) => Promise<BotResponse | void>;
  beacon?: (event: any, context: any) => Promise<BotResponse | void>;
  accountLink?: (event: any, context: any) => Promise<BotResponse | void>;
  things?: (event: any, context: any) => Promise<BotResponse | void>;
}

/**
 * Webhook service for handling LINE webhook events
 */
export class WebhookService {
  private static client: Client;
  private static cache: CacheService;
  private static eventHandlers: EventHandlers = {};
  private static isInitialized = false;
  
  /**
   * Initialize the webhook service
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.info('WebhookService already initialized');
        return;
      }
      
      // Initialize LINE client
      this.client = new Client(getLineConfig());
      
      // Initialize cache service
      this.cache = new CacheService();
      
      // Register default event handlers
      this.registerDefaultHandlers();
      
      this.isInitialized = true;
      logger.info('WebhookService initialized successfully');
      
    } catch (error) {
      logError('Failed to initialize webhook service', error as Error, { service: 'WebhookService', method: 'initialize' });
      throw error;
    }
  }
  
  /**
   * Process webhook events
   */
  static async processEvents(events: WebhookEvent[], requestId: string): Promise<void> {
    try {
      logger.info(`Processing ${events.length} webhook events`, { requestId });
      
      // Process events in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(events, concurrencyLimit);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(event => this.processEvent(event, requestId))
        );
      }
      
      logger.info('All webhook events processed successfully', { requestId });
      
    } catch (error) {
      logError('Failed to process events', error as Error, { service: 'WebhookService', method: 'processEvents', requestId });
      throw error;
    }
  }
  
  /**
   * Process a single webhook event
   */
  private static async processEvent(event: WebhookEvent, requestId: string): Promise<void> {
    try {
      const eventId = uuidv4();
      const userId = this.extractUserId(event);
      
      logWebhookEvent(event.type, userId, requestId);
      
      // Store event data
      const eventData: WebhookEventData = {
        id: eventId,
        type: event.type,
        userId,
        timestamp: new Date(event.timestamp),
        replyToken: 'replyToken' in event ? event.replyToken : undefined,
        source: {
          type: event.source.type,
          userId: event.source.type === 'user' ? event.source.userId : undefined,
          groupId: event.source.type === 'group' ? event.source.groupId : undefined,
          roomId: event.source.type === 'room' ? event.source.roomId : undefined
        }
      };
      
      // Cache event data
      await this.cacheEventData(eventId, eventData);
      
      // Handle different event types
      const context = {
        userId,
        requestId,
        timestamp: new Date(event.timestamp)
      };
      
      let response: BotResponse | void = undefined;
      
      switch (event.type) {
        case 'message':
          response = await this.handleMessageEvent(event, context);
          break;
        case 'follow':
          response = await this.handleFollowEvent(event, context);
          break;
        case 'unfollow':
          response = await this.handleUnfollowEvent(event, context);
          break;
        case 'join':
          response = await this.handleJoinEvent(event, context);
          break;
        case 'leave':
          response = await this.handleLeaveEvent(event, context);
          break;
        case 'memberJoined':
          response = await this.handleMemberJoinedEvent(event, context);
          break;
        case 'memberLeft':
          response = await this.handleMemberLeftEvent(event, context);
          break;
        case 'postback':
          response = await this.handlePostbackEvent(event, context);
          break;
        case 'beacon':
          response = await this.handleBeaconEvent(event, context);
          break;
        case 'accountLink':
          response = await this.handleAccountLinkEvent(event, context);
          break;
        case 'things':
          response = await this.handleThingsEvent(event, context);
          break;
        default:
          logger.warn(`Unhandled event type: ${event.type}`, { requestId, eventId });
      }
      
      // Send response if available
      if (response && 'replyToken' in event && event.replyToken) {
        await this.sendReply(event.replyToken, response, requestId);
      }
      
    } catch (error) {
      logError('Failed to process event', error as Error, {
        service: 'WebhookService',
        method: 'processEvent',
        eventType: event.type,
        requestId
      });
      // Don't throw here to prevent other events from failing
    }
  }
  
  /**
   * Handle message events
   */
  private static async handleMessageEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      // TODO: Store incoming message and update user activity
      // These methods need to be implemented in MessageService and UserService
      
      // Call custom handler if registered
      if (this.eventHandlers.message) {
        return await this.eventHandlers.message(event, context);
      }
      
      // Default message handling
      return await this.defaultMessageHandler(event, context);
      
    } catch (error) {
      logError('Failed to handle message event', error as Error, {
        service: 'WebhookService',
        method: 'handleMessageEvent',
        eventType: event.type,
         userId: context.userId,
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle follow events
   */
  private static async handleFollowEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      // TODO: Update user following status
      // This method needs to be implemented in UserService
      
      // Call custom handler if registered
      if (this.eventHandlers.follow) {
        return await this.eventHandlers.follow(event, context);
      }
      
      // Default follow handling
      return {
        success: true,
        messages: [{
          type: 'text',
          text: 'Thank you for following! How can I help you today?'
        }]
      };
      
    } catch (error) {
      logError('Failed to handle follow event', error as Error, {
        service: 'WebhookService',
        method: 'handleFollowEvent',
        userId: event.source.userId,
         requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle unfollow events
   */
  private static async handleUnfollowEvent(event: any, context: any): Promise<void> {
    try {
      // TODO: Update user following status
      // This method needs to be implemented in UserService
      
      // Call custom handler if registered
      if (this.eventHandlers.unfollow) {
        await this.eventHandlers.unfollow(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle unfollow event', error as Error, {
        service: 'WebhookService',
        method: 'handleUnfollowEvent',
        userId: event.source.userId,
         requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle join events
   */
  private static async handleJoinEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.join) {
        return await this.eventHandlers.join(event, context);
      }
      
      // Default join handling
      return {
        success: true,
        messages: [{
          type: 'text',
          text: 'Hello! Thanks for adding me to this group. How can I help?'
        }]
      };
      
    } catch (error) {
      logError('Failed to handle join event', error as Error, {
        service: 'WebhookService',
        method: 'handleJoinEvent',
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle leave events
   */
  private static async handleLeaveEvent(event: any, context: any): Promise<void> {
    try {
      if (this.eventHandlers.leave) {
        await this.eventHandlers.leave(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle leave event', error as Error, {
        service: 'WebhookService',
        method: 'handleLeaveEvent',
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle member joined events
   */
  private static async handleMemberJoinedEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.memberJoined) {
        return await this.eventHandlers.memberJoined(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle member joined event', error as Error, {
        service: 'WebhookService',
        method: 'handleMemberJoinedEvent',
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle member left events
   */
  private static async handleMemberLeftEvent(event: any, context: any): Promise<void> {
    try {
      if (this.eventHandlers.memberLeft) {
        await this.eventHandlers.memberLeft(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle member left event', error as Error, {
        service: 'WebhookService',
        method: 'handleMemberLeftEvent',
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle postback events
   */
  private static async handlePostbackEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.postback) {
        return await this.eventHandlers.postback(event, context);
      }
      
      // Default postback handling
      return {
        success: true,
        messages: [{
          type: 'text',
          text: `Received postback: ${event.postback.data}`
        }]
      };
      
    } catch (error) {
      logError('Failed to handle postback event', error as Error, {
        service: 'WebhookService',
        method: 'handlePostbackEvent',
        userId: context.userId,
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle beacon events
   */
  private static async handleBeaconEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.beacon) {
        return await this.eventHandlers.beacon(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle beacon event', error as Error, {
        service: 'WebhookService',
        method: 'handleBeaconEvent',
        userId: context.userId,
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle account link events
   */
  private static async handleAccountLinkEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.accountLink) {
        return await this.eventHandlers.accountLink(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle account link event', error as Error, {
        service: 'WebhookService',
        method: 'handleAccountLinkEvent',
        userId: context.userId,
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Handle things events
   */
  private static async handleThingsEvent(event: any, context: any): Promise<BotResponse | void> {
    try {
      if (this.eventHandlers.things) {
        return await this.eventHandlers.things(event, context);
      }
      
    } catch (error) {
      logError('Failed to handle things event', error as Error, {
        service: 'WebhookService',
        method: 'handleThingsEvent',
        userId: context.userId,
        requestId: context.requestId
      });
    }
  }
  
  /**
   * Default message handler
   */
  private static async defaultMessageHandler(event: any, context: any): Promise<BotResponse> {
    const message = event.message;
    
    switch (message.type) {
      case 'text':
        return {
          success: true,
          messages: [{
            type: 'text',
            text: `You said: ${message.text}`
          }]
        };
      case 'sticker':
        return {
          success: true,
          messages: [{
            type: 'text',
            text: 'Nice sticker! 😊'
          }]
        };
      default:
        return {
          success: true,
          messages: [{
            type: 'text',
            text: 'Thanks for your message!'
          }]
        };
    }
  }
  
  /**
   * Send reply message
   */
  private static async sendReply(replyToken: string, response: BotResponse, requestId: string): Promise<void> {
    try {
      if (!response.messages || response.messages.length === 0) {
        logger.warn('No messages to send', { requestId });
        return;
      }
      await this.client.replyMessage(replyToken, response.messages);
      logger.info('Reply sent successfully', { requestId, messageCount: response.messages.length });
      
    } catch (error) {
      logError('Failed to send reply', error as Error, {
        service: 'WebhookService',
        method: 'sendReply',
        requestId
      });
      throw error;
    }
  }
  
  /**
   * Register event handlers
   */
  static registerEventHandlers(handlers: Partial<EventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
    logger.info('Event handlers registered', { handlers: Object.keys(handlers) });
  }
  
  /**
   * Register default event handlers
   */
  private static registerDefaultHandlers(): void {
    // Default handlers are implemented in the handle methods above
    logger.info('Default event handlers registered');
  }
  
  /**
   * Extract user ID from event
   */
  private static extractUserId(event: WebhookEvent): string | undefined {
    if (event.source.type === 'user') {
      return event.source.userId;
    }
    return undefined;
  }
  
  /**
   * Cache event data
   */
  private static async cacheEventData(eventId: string, eventData: WebhookEventData): Promise<void> {
    try {
      const key = CacheService.generateKey('event', eventId);
      await this.cache.set(key, JSON.stringify(eventData), 3600); // 1 hour TTL
    } catch (error) {
      logger.warn('Failed to cache event data', { eventId, error });
    }
  }
  
  /**
   * Chunk array into smaller arrays
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Get LINE client instance
   */
  static getClient(): Client {
    if (!this.client) {
      throw new Error('WebhookService not initialized');
    }
    return this.client;
  }
  
  /**
   * Cleanup resources
   */
  static async cleanup(): Promise<void> {
    try {
      // Clear event handlers
      this.eventHandlers = {};
      
      this.isInitialized = false;
      logger.info('WebhookService cleanup completed');
      
    } catch (error) {
      logError('Failed to cleanup webhook service', error as Error, { service: 'WebhookService', method: 'cleanup' });
    }
  }
}