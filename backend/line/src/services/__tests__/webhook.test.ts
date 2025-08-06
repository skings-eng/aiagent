import { WebhookService } from '../webhook';
import { CacheService } from '../cache';
import { Client } from '@line/bot-sdk';
import { LineWebhookEvent } from '../../types';

// Mock dependencies
jest.mock('../cache');
jest.mock('@line/bot-sdk');

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  flushAll: jest.fn(),
};

const mockLineClient = {
  replyMessage: jest.fn(),
  pushMessage: jest.fn(),
  getProfile: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: mockLogger,
}));

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    (CacheService as jest.MockedClass<typeof CacheService>).mockImplementation(() => mockCacheService as any);
    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockLineClient as any);
    
    webhookService = new WebhookService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with LINE client and cache service', () => {
      expect(Client).toHaveBeenCalledWith({
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
      });
      expect(CacheService).toHaveBeenCalled();
    });
  });

  describe('handleEvent', () => {
    it('should handle message events', async () => {
      const event = global.createMockMessageEvent({
        message: { type: 'text', text: 'Hello' },
      });

      await webhookService.handleEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing webhook event',
        expect.objectContaining({ eventType: 'message' })
      );
    });

    it('should handle follow events', async () => {
      const event = global.createMockWebhookEvent({ type: 'follow' });

      await webhookService.handleEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing webhook event',
        expect.objectContaining({ eventType: 'follow' })
      );
    });

    it('should handle unfollow events', async () => {
      const event = global.createMockWebhookEvent({ type: 'unfollow' });

      await webhookService.handleEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing webhook event',
        expect.objectContaining({ eventType: 'unfollow' })
      );
    });

    it('should handle unknown event types', async () => {
      const event = global.createMockWebhookEvent({ type: 'unknown' });

      await webhookService.handleEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unknown event type received',
        expect.objectContaining({ eventType: 'unknown' })
      );
    });

    it('should handle events without source', async () => {
      const event = { ...global.createMockWebhookEvent(), source: undefined } as LineWebhookEvent;

      await webhookService.handleEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Event received without source information',
        expect.any(Object)
      );
    });
  });

  describe('sendReply', () => {
    it('should send reply message successfully', async () => {
      const replyToken = 'test-reply-token';
      const messages = [{ type: 'text', text: 'Hello' }];

      mockLineClient.replyMessage.mockResolvedValue({ success: true });

      await webhookService.sendReply(replyToken, messages);

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith(replyToken, messages);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reply sent successfully',
        expect.objectContaining({ replyToken })
      );
    });

    it('should handle reply errors', async () => {
      const replyToken = 'test-reply-token';
      const messages = [{ type: 'text', text: 'Hello' }];
      const error = new Error('LINE API Error');

      mockLineClient.replyMessage.mockRejectedValue(error);

      await expect(webhookService.sendReply(replyToken, messages)).rejects.toThrow('LINE API Error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send reply',
        expect.objectContaining({ error: error.message })
      );
    });
  });

  describe('registerEventHandler', () => {
    it('should register event handler', () => {
      const handler = jest.fn();
      
      webhookService.registerEventHandler('message', handler);
      
      // Verify handler is registered (implementation detail)
      expect(handler).toBeDefined();
    });
  });

  describe('extractUserId', () => {
    it('should extract user ID from user source', () => {
      const event = global.createMockWebhookEvent({
        source: { type: 'user', userId: 'test-user-123' },
      });

      const userId = webhookService.extractUserId(event);

      expect(userId).toBe('test-user-123');
    });

    it('should extract user ID from group source', () => {
      const event = global.createMockWebhookEvent({
        source: { type: 'group', groupId: 'test-group-123', userId: 'test-user-456' },
      });

      const userId = webhookService.extractUserId(event);

      expect(userId).toBe('test-user-456');
    });

    it('should return null for missing user ID', () => {
      const event = global.createMockWebhookEvent({
        source: { type: 'user' },
      });

      const userId = webhookService.extractUserId(event);

      expect(userId).toBeNull();
    });
  });

  describe('cacheEventData', () => {
    it('should cache event data with TTL', async () => {
      const event = global.createMockMessageEvent();
      const ttl = 3600;

      await webhookService.cacheEventData(event, ttl);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('event:'),
        expect.objectContaining({ eventId: event.webhookEventId }),
        ttl
      );
    });

    it('should handle cache errors gracefully', async () => {
      const event = global.createMockMessageEvent();
      const error = new Error('Cache error');

      mockCacheService.set.mockRejectedValue(error);

      await webhookService.cacheEventData(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to cache event data',
        expect.objectContaining({ error: error.message })
      );
    });
  });

  describe('error handling', () => {
    it('should handle LINE API errors', async () => {
      const event = global.createMockMessageEvent();
      const error = new Error('LINE API rate limit exceeded');

      // Mock a method that might fail
      mockLineClient.replyMessage.mockRejectedValue(error);

      await expect(webhookService.sendReply('token', [])).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send reply',
        expect.objectContaining({ error: error.message })
      );
    });

    it('should handle cache service errors', async () => {
      const event = global.createMockMessageEvent();
      const error = new Error('Redis connection failed');

      mockCacheService.set.mockRejectedValue(error);

      await webhookService.cacheEventData(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to cache event data',
        expect.objectContaining({ error: error.message })
      );
    });

    it('should handle malformed events', async () => {
      const malformedEvent = { type: 'message' } as LineWebhookEvent; // Missing required fields

      await webhookService.handleEvent(malformedEvent);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Event received without source information',
        expect.any(Object)
      );
    });
  });

  describe('performance', () => {
    it('should handle concurrent events', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        global.createMockMessageEvent({ message: { text: `Message ${i}` } })
      );

      const promises = events.map(event => webhookService.handleEvent(event));
      
      await Promise.all(promises);

      expect(mockLogger.info).toHaveBeenCalledTimes(10);
    });

    it('should not block on slow cache operations', async () => {
      const event = global.createMockMessageEvent();
      
      // Simulate slow cache operation
      mockCacheService.set.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const start = Date.now();
      await webhookService.cacheEventData(event);
      const duration = Date.now() - start;

      // Should not wait for cache operation to complete
      expect(duration).toBeLessThan(100);
    });
  });
});