import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { CacheService } from '../config/redis';
import { Client } from '@line/bot-sdk';

const router = Router();
let lineClient: Client;
let cacheService: CacheService;

// Inject services
export const injectServices = (client: Client, cache: CacheService) => {
  lineClient = client;
  cacheService = cache;
};

// Interface for LINE configuration
interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

// POST /api/v1/line/config - Save LINE configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    const { channelAccessToken, channelSecret, url, displayText, description, triggerConditions, isActive } = req.body;
    
    // 简化验证 - 只检查基本字段存在
    if (!channelAccessToken && !channelSecret && !url) {
      return res.status(400).json({
        success: false,
        message: 'At least one configuration field is required'
      });
    }
    
    // 构建配置对象
    const config: any = {
      updatedAt: new Date().toISOString(),
      isConfigured: true
    };
    
    // 添加提供的字段
    if (channelAccessToken) {
      config.channelAccessToken = channelAccessToken;
      process.env.LINE_CHANNEL_ACCESS_TOKEN = channelAccessToken;
    }
    
    if (channelSecret) {
      config.channelSecret = channelSecret;
      process.env.LINE_CHANNEL_SECRET = channelSecret;
    }
    
    if (url) config.url = url;
    if (displayText) config.displayText = displayText;
    if (description) config.description = description;
    if (triggerConditions) config.triggerConditions = triggerConditions;
    if (typeof isActive !== 'undefined') config.isActive = isActive;
    
    // 保存到Redis缓存
    if (cacheService) {
      await cacheService.set('line:config', JSON.stringify(config), 86400); // 24小时TTL
    }
    
    logger.info('LINE configuration updated successfully', { config: Object.keys(config) });
    
    // 返回掩码后的配置
    const responseData: any = {
      updatedAt: config.updatedAt,
      isConfigured: true
    };
    
    if (config.channelAccessToken) {
      responseData.channelAccessToken = config.channelAccessToken.length > 10 
        ? config.channelAccessToken.substring(0, 10) + '...'
        : 'Bearer ...';
    }
    
    if (config.channelSecret) {
      responseData.channelSecret = '***';
    }
    
    if (config.url) responseData.url = config.url;
    if (config.displayText) responseData.displayText = config.displayText;
    if (config.description) responseData.description = config.description;
    if (config.triggerConditions) responseData.triggerConditions = config.triggerConditions;
    if (typeof config.isActive !== 'undefined') responseData.isActive = config.isActive;
    
    return res.json({
      success: true,
      message: 'LINE configuration saved successfully',
      data: responseData
    });
    
  } catch (error) {
    logger.error('Error saving LINE configuration', {
      service: 'line-bot-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error while saving configuration'
    });
  }
});

// GET /api/v1/line/config - Get LINE configuration (masked)
router.get('/', async (req: Request, res: Response) => {
  try {
    let config = null;
    
    // 从缓存获取配置
    if (cacheService) {
      const cachedConfig = await cacheService.get('line:config');
      if (cachedConfig) {
        config = JSON.parse(cachedConfig);
      }
    }
    
    // 如果缓存中没有，尝试从环境变量获取基本配置
    if (!config && (process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_SECRET)) {
      config = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
        updatedAt: new Date().toISOString(),
        isConfigured: !!(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET)
      };
    }
    
    if (!config) {
      return res.json({
        success: true,
        data: {
          isConfigured: false,
          channelAccessToken: null,
          channelSecret: null,
          url: null,
          displayText: null,
          description: null,
          triggerConditions: null,
          isActive: false,
          updatedAt: null
        }
      });
    }
    
    // 返回掩码后的配置
    const responseData: any = {
      isConfigured: config.isConfigured || false,
      updatedAt: config.updatedAt
    };
    
    if (config.channelAccessToken) {
      responseData.channelAccessToken = config.channelAccessToken.length > 10 
        ? config.channelAccessToken.substring(0, 10) + '...'
        : 'Bearer ...';
    } else {
      responseData.channelAccessToken = null;
    }
    
    if (config.channelSecret) {
      responseData.channelSecret = '***';
    } else {
      responseData.channelSecret = null;
    }
    
    responseData.url = config.url || null;
    responseData.displayText = config.displayText || null;
    responseData.description = config.description || null;
    responseData.triggerConditions = config.triggerConditions || null;
    responseData.isActive = config.isActive || false;
    
    return res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    logger.error('Error getting LINE configuration', {
      service: 'line-bot-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error while getting configuration'
    });
  }
});

// DELETE /api/v1/line/config - Delete LINE configuration
router.delete('/', async (req: Request, res: Response) => {
  try {
    // Remove from cache
    if (cacheService) {
      await cacheService.del('line:config');
    }
    
    // Clear environment variables (for current session)
    process.env.LINE_CHANNEL_ACCESS_TOKEN = '';
    process.env.LINE_CHANNEL_SECRET = '';
    
    logger.info('LINE configuration deleted successfully', {
      service: 'line-bot-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
    
    res.json({
      success: true,
      message: 'LINE configuration deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting LINE configuration', {
      service: 'line-bot-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting configuration'
    });
  }
});

export default router;
export { router as configRouter };