import { Client, Message, TextMessage, ImageMessage, VideoMessage, AudioMessage, LocationMessage, StickerMessage, FlexMessage, TemplateMessage, QuickReply, QuickReplyItem } from '@line/bot-sdk';
import { CacheService } from '../config/redis';
import { logger, logMessage, logError } from '../utils/logger';
import {
  Message as MessageRecord,
  MessageType,
  MessageDirection,
  MessageContent,
  BotResponse,
  MessageAnalytics
} from '../types';

// Define message status enum
enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Define custom error classes
class LineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LineError';
  }
}

class MessageSendError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'MessageSendError';
  }
}

class ValidationError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class RateLimitError extends LineError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
import { v4 as uuidv4 } from 'uuid';

export class MessageService {
  private client: Client;
  private cache: CacheService;
  private readonly MESSAGE_CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly RATE_LIMIT_WINDOW = 60; // 1 minute
  private readonly RATE_LIMIT_MAX_MESSAGES = 500; // per minute

  constructor(client: Client, cache: CacheService) {
    this.client = client;
    this.cache = cache;
  }

  /**
   * Send a reply message to a user
   */
  async sendReply(replyToken: string, messages: Message | Message[]): Promise<BotResponse> {
    try {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      
      // Validate messages
      this.validateMessages(messageArray);
      
      // Check rate limit
      await this.checkRateLimit('reply');
      
      // Send reply
      await this.client.replyMessage(replyToken, messageArray);
      
      // Log and cache message records
      const messageRecords = await this.createMessageRecords(messageArray, 'outgoing', replyToken);
      
      logMessage('outgoing', 'reply', replyToken);
      
      return {
        success: true,
        messageIds: messageRecords.map(record => record.id),
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to send reply message', error as Error, {
        replyToken,
        messageCount: Array.isArray(messages) ? messages.length : 1
      });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new MessageSendError(`Failed to send reply: ${(error as Error).message}`);
    }
  }

  /**
   * Send a push message to a user
   */
  async sendPush(to: string, messages: Message | Message[]): Promise<BotResponse> {
    try {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      
      // Validate messages
      this.validateMessages(messageArray);
      
      // Check rate limit
      await this.checkRateLimit('push', to);
      
      // Send push message
      await this.client.pushMessage(to, messageArray);
      
      // Log and cache message records
      const messageRecords = await this.createMessageRecords(messageArray, 'outgoing', to);
      
      logMessage('outgoing', 'push', to);
      
      return {
        success: true,
        messageIds: messageRecords.map(record => record.id),
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to send push message', error as Error, {
        to,
        messageCount: Array.isArray(messages) ? messages.length : 1
      });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new MessageSendError(`Failed to send push message: ${(error as Error).message}`);
    }
  }

  /**
   * Send a multicast message to multiple users
   */
  async sendMulticast(to: string[], messages: Message | Message[]): Promise<BotResponse> {
    try {
      if (!to || to.length === 0) {
        throw new ValidationError('Recipient list cannot be empty');
      }
      
      if (to.length > 500) {
        throw new ValidationError('Cannot send to more than 500 recipients at once');
      }
      
      const messageArray = Array.isArray(messages) ? messages : [messages];
      
      // Validate messages
      this.validateMessages(messageArray);
      
      // Check rate limit
      await this.checkRateLimit('multicast');
      
      // Send multicast message
      await this.client.multicast(to, messageArray);
      
      // Log and cache message records for each recipient
      const allMessageRecords: MessageRecord[] = [];
      for (const recipient of to) {
        const messageRecords = await this.createMessageRecords(messageArray, 'outgoing', recipient);
        allMessageRecords.push(...messageRecords);
      }
      
      logMessage('outgoing', 'multicast', to.join(','));
      
      return {
        success: true,
        messageIds: allMessageRecords.map(record => record.id),
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to send multicast message', error as Error, {
        recipientCount: to?.length || 0,
        messageCount: Array.isArray(messages) ? messages.length : 1
      });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new MessageSendError(`Failed to send multicast message: ${(error as Error).message}`);
    }
  }

  /**
   * Send a broadcast message to all followers
   */
  async sendBroadcast(messages: Message | Message[]): Promise<BotResponse> {
    try {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      
      // Validate messages
      this.validateMessages(messageArray);
      
      // Check rate limit
      await this.checkRateLimit('broadcast');
      
      // Send broadcast message
      await this.client.broadcast(messageArray);
      
      // Create a single message record for broadcast
      const messageRecords = await this.createMessageRecords(messageArray, 'outgoing', 'all');
      
      logMessage('outgoing', 'broadcast', 'all');
      
      return {
        success: true,
        messageIds: messageRecords.map(record => record.id),
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to send broadcast message', error as Error, {
        messageCount: Array.isArray(messages) ? messages.length : 1
      });
      
      if (error instanceof LineError) {
        throw error;
      }
      
      throw new MessageSendError(`Failed to send broadcast message: ${(error as Error).message}`);
    }
  }

  /**
   * Create a text message
   */
  createTextMessage(text: string, quickReply?: QuickReply): TextMessage {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Text message cannot be empty');
    }
    
    if (text.length > 5000) {
      throw new ValidationError('Text message cannot exceed 5000 characters');
    }
    
    const message: TextMessage = {
      type: 'text',
      text: text.trim()
    };
    
    if (quickReply) {
      message.quickReply = quickReply;
    }
    
    return message;
  }

  /**
   * Create an image message
   */
  createImageMessage(originalContentUrl: string, previewImageUrl: string, quickReply?: QuickReply): ImageMessage {
    if (!originalContentUrl || !previewImageUrl) {
      throw new ValidationError('Image URLs cannot be empty');
    }
    
    const message: ImageMessage = {
      type: 'image',
      originalContentUrl,
      previewImageUrl
    };
    
    if (quickReply) {
      message.quickReply = quickReply;
    }
    
    return message;
  }

  /**
   * Create a sticker message
   */
  createStickerMessage(packageId: string, stickerId: string, quickReply?: QuickReply): StickerMessage {
    if (!packageId || !stickerId) {
      throw new ValidationError('Package ID and Sticker ID cannot be empty');
    }
    
    const message: StickerMessage = {
      type: 'sticker',
      packageId,
      stickerId
    };
    
    if (quickReply) {
      message.quickReply = quickReply;
    }
    
    return message;
  }

  /**
   * Create quick reply items
   */
  createQuickReply(items: QuickReplyItem[]): QuickReply {
    if (!items || items.length === 0) {
      throw new ValidationError('Quick reply items cannot be empty');
    }
    
    if (items.length > 13) {
      throw new ValidationError('Quick reply cannot have more than 13 items');
    }
    
    return { items };
  }

  /**
   * Get message history for a user
   */
  async getMessageHistory(userId: string, limit: number = 50, offset: number = 0): Promise<MessageRecord[]> {
    try {
      const cacheKey = CacheService.generateKey('message_history', userId, limit.toString(), offset.toString());
      
      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get message IDs from cache
      const messageIds = await this.cache.sMembers(CacheService.generateKey('user_messages', userId));
      
      // Sort by timestamp (assuming message IDs contain timestamp)
      const sortedIds = messageIds.sort().reverse();
      
      // Get paginated results
      const paginatedIds = sortedIds.slice(offset, offset + limit);
      
      // Get message records
      const messages: MessageRecord[] = [];
      for (const messageId of paginatedIds) {
        const messageData = await this.cache.get(CacheService.generateKey('message', messageId));
        if (messageData) {
          messages.push(JSON.parse(messageData));
        }
      }
      
      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(messages), 300); // 5 minutes
      
      return messages;
    } catch (error) {
      logError('Failed to get message history', error as Error, { userId, limit, offset });
      throw new LineError(`Failed to get message history: ${(error as Error).message}`);
    }
  }

  /**
   * Get message analytics
   */
  async getMessageAnalytics(startDate: Date, endDate: Date): Promise<MessageAnalytics> {
    try {
      const cacheKey = CacheService.generateKey('message_analytics', startDate.toISOString(), endDate.toISOString());
      
      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get analytics data from cache
      const analytics: MessageAnalytics = {
        totalMessages: 0,
        incomingMessages: 0,
        outgoingMessages: 0,
        messagesByType: {},
        messagesByStatus: {},
        averageResponseTime: 0
      };
      
      // This would typically involve querying a database
      // For now, we'll return basic analytics from cache
      
      // Cache the result
      await this.cache.set(cacheKey, JSON.stringify(analytics), 3600); // 1 hour
      
      return analytics;
    } catch (error) {
      logError('Failed to get message analytics', error as Error, { startDate, endDate });
      throw new LineError(`Failed to get message analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Validate messages
   */
  private validateMessages(messages: Message[]): void {
    if (!messages || messages.length === 0) {
      throw new ValidationError('Messages cannot be empty');
    }
    
    if (messages.length > 5) {
      throw new ValidationError('Cannot send more than 5 messages at once');
    }
    
    for (const message of messages) {
      if (!message.type) {
        throw new ValidationError('Message type is required');
      }
    }
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(operation: string, identifier?: string): Promise<void> {
    try {
      const key = CacheService.generateKey('rate_limit', operation, identifier || 'global');
      const current = await this.cache.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= this.RATE_LIMIT_MAX_MESSAGES) {
        throw new RateLimitError(`Rate limit exceeded for ${operation}`);
      }
      
      // Increment counter
      await this.cache.set(key, (count + 1).toString(), this.RATE_LIMIT_WINDOW);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      logError('Failed to check rate limit', error as Error, { operation, identifier });
      // Don't throw error for rate limit check failures
    }
  }

  /**
   * Create message records
   */
  private async createMessageRecords(messages: Message[], type: MessageDirection, target: string): Promise<MessageRecord[]> {
    const records: MessageRecord[] = [];
    
    for (const message of messages) {
      const record: MessageRecord = {
        id: uuidv4(),
        type: type,
        content: this.extractMessageContent(message),
        status: MessageStatus.SENT,
        timestamp: new Date(),
        userId: target !== 'all' ? target : 'system',
        direction: 'outgoing' as const,
        metadata: {
          messageType: type,
          target
        }
      };
      
      records.push(record);
      
      // Cache the message record
      await this.cache.set(
        CacheService.generateKey('message', record.id),
        JSON.stringify(record),
        this.MESSAGE_CACHE_TTL
      );
      
      // Add to user's message set
      if (target !== 'all') {
        await this.cache.sAdd(CacheService.generateKey('user_messages', target), record.id);
      }
    }
    
    return records;
  }

  /**
   * Get message type from LINE message type
   */
  private getMessageType(lineType: string): MessageType {
    switch (lineType) {
      case 'text':
        return MessageType.TEXT;
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'audio':
        return MessageType.AUDIO;
      case 'file':
        return MessageType.FILE;
      case 'location':
        return MessageType.LOCATION;
      case 'sticker':
        return MessageType.STICKER;
      case 'flex':
        return MessageType.FLEX;
      case 'template':
        return MessageType.TEMPLATE;
      default:
        return MessageType.OTHER;
    }
  }

  /**
   * Extract message content
   */
  private extractMessageContent(message: Message): MessageContent {
    const content: MessageContent = {
      type: message.type
    };
    
    switch (message.type) {
      case 'text':
        content.text = (message as TextMessage).text;
        break;
      case 'image':
        content.imageUrl = (message as ImageMessage).originalContentUrl;
        content.previewUrl = (message as ImageMessage).previewImageUrl;
        break;
      case 'sticker':
        content.packageId = (message as StickerMessage).packageId;
        content.stickerId = (message as StickerMessage).stickerId;
        break;
      case 'location':
        const locationMsg = message as LocationMessage;
        content.latitude = locationMsg.latitude;
        content.longitude = locationMsg.longitude;
        content.address = locationMsg.address;
        break;
      default:
        content.raw = message;
        break;
    }
    
    return content;
  }
}

export default MessageService;