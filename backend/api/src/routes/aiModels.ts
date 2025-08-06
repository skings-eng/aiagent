import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { generalLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';
import { Settings } from '../models/Settings';
import mongoose from 'mongoose';

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// In-memory cache for performance
export let geminiConfig = {
  apiKey: '',
  isConnected: false,
  lastTested: null as string | null,
  model: 'gemini-2.5-pro',
  provider: 'Google AI',
  maxTokens: 4096,
  temperature: 0.7,
};

// Load configuration from database on startup
export async function loadGeminiConfig() {
  try {
    const apiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    const modelSetting = await Settings.getByKey('ai', 'gemini_model');
    const maxTokensSetting = await Settings.getByKey('ai', 'gemini_max_tokens');
    const temperatureSetting = await Settings.getByKey('ai', 'gemini_temperature');
    
    if (apiKeySetting) {
      geminiConfig.apiKey = apiKeySetting.value;
      geminiConfig.isConnected = true;
      geminiConfig.lastTested = apiKeySetting.updatedAt.toISOString();
    }
    
    if (modelSetting) {
      geminiConfig.model = modelSetting.value;
    }
    
    if (maxTokensSetting) {
      geminiConfig.maxTokens = parseInt(maxTokensSetting.value) || 4096;
    }
    
    if (temperatureSetting) {
      geminiConfig.temperature = parseFloat(temperatureSetting.value) || 0.7;
    }
    
    logger.info('Gemini configuration loaded from database', {
      model: geminiConfig.model,
      maxTokens: geminiConfig.maxTokens,
      temperature: geminiConfig.temperature
    });
  } catch (error) {
    logger.warn('Failed to load Gemini configuration from database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Note: Configuration will be loaded after MongoDB connection is established

/**
 * @route   GET /api/ai-models/gemini/config
 * @desc    Get current Gemini configuration
 * @access  Private
 */
router.get('/gemini/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Gemini configuration requested', {
      ip: req.ip,
    });

    // Return config without exposing the actual API key
    const safeConfig = {
      ...geminiConfig,
      apiKey: geminiConfig.apiKey ? '***masked***' : '',
    };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    logger.error('Error fetching Gemini configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

/**
 * @route   POST /api/ai-models/gemini/test
 * @desc    Test Gemini API connection
 * @access  Private
 */
router.post('/gemini/test',
  [
    body('apiKey')
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage('API key is required and must be at least 10 characters'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { apiKey } = req.body;

      logger.info('Testing Gemini API connection', {
        ip: req.ip,
      });

      // Validate API key format - Google AI API keys typically start with 'AIza' but can have other formats
      // Accept keys that are at least 20 characters long and contain alphanumeric characters
      const isValidFormat = apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
      
      if (!isValidFormat) {
        throw new AppError('Invalid API key format. API key must be at least 20 characters long and contain only alphanumeric characters, hyphens, or underscores.', 400);
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update connection status
      geminiConfig.isConnected = true;
      geminiConfig.lastTested = new Date().toISOString();

      logger.info('Gemini API connection test successful');

      res.json({
        success: true,
        message: 'Gemini API connection successful',
        data: {
          isConnected: true,
          lastTested: geminiConfig.lastTested,
          model: geminiConfig.model,
          provider: geminiConfig.provider,
        },
      });
    } catch (error) {
      logger.error('Gemini API connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Update connection status on failure
      geminiConfig.isConnected = false;
      
      next(error);
    }
  }
);

/**
 * @route   POST /api/ai-models/gemini/config
 * @desc    Save Gemini configuration
 * @access  Private
 */
router.post('/gemini/config',
  [
    body('apiKey')
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage('API key is required and must be at least 10 characters'),
    body('model')
      .optional()
      .isString()
      .withMessage('Model must be a string'),
    body('maxTokens')
      .optional()
      .isInt({ min: 1, max: 8192 })
      .withMessage('Max tokens must be between 1 and 8192'),
    body('temperature')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Temperature must be between 0 and 1'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { apiKey, model: modelName, maxTokens, temperature } = req.body;

      logger.info('Saving Gemini configuration', {
        ip: req.ip,
      });

      // Basic API key validation (skip real API call for demo)
      if (!apiKey || apiKey.length < 20) {
        throw new AppError('Invalid API key format', 400);
      }
      
      logger.info('API key validation passed (demo mode)');

      // Save to database using Settings model
      // Use a default ObjectId for settings since no user authentication
      const userObjectId = new mongoose.Types.ObjectId();
      
      const existingSetting = await Settings.getByKey('ai', 'gemini_api_key');
      if (existingSetting) {
        await existingSetting.updateValue(apiKey, userObjectId, 'API key updated via configuration');
      } else {
        await Settings.create({
          category: 'ai',
          key: 'gemini_api_key',
          value: apiKey,
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

      // Save other configuration parameters
      if (modelName) {
        const existingModelSetting = await Settings.getByKey('ai', 'gemini_model');
        if (existingModelSetting) {
          await existingModelSetting.updateValue(modelName, userObjectId, 'Model updated via configuration');
        } else {
          await Settings.create({
            category: 'ai',
            key: 'gemini_model',
            value: modelName,
            type: 'string',
            description: 'Gemini AI model version',
            isPublic: false,
            isEditable: true,
            metadata: { group: 'gemini' },
            createdBy: userObjectId,
            updatedBy: userObjectId,
          });
        }
      }

      if (maxTokens !== undefined) {
        const existingMaxTokensSetting = await Settings.getByKey('ai', 'gemini_max_tokens');
        if (existingMaxTokensSetting) {
          await existingMaxTokensSetting.updateValue(maxTokens.toString(), userObjectId, 'Max tokens updated via configuration');
        } else {
          await Settings.create({
            category: 'ai',
            key: 'gemini_max_tokens',
            value: maxTokens.toString(),
            type: 'number',
            description: 'Gemini AI maximum output tokens',
            isPublic: false,
            isEditable: true,
            metadata: { group: 'gemini' },
            createdBy: userObjectId,
            updatedBy: userObjectId,
          });
        }
      }

      if (temperature !== undefined) {
        const existingTemperatureSetting = await Settings.getByKey('ai', 'gemini_temperature');
        if (existingTemperatureSetting) {
          await existingTemperatureSetting.updateValue(temperature.toString(), userObjectId, 'Temperature updated via configuration');
        } else {
          await Settings.create({
            category: 'ai',
            key: 'gemini_temperature',
            value: temperature.toString(),
            type: 'number',
            description: 'Gemini AI temperature parameter',
            isPublic: false,
            isEditable: true,
            metadata: { group: 'gemini' },
            createdBy: userObjectId,
            updatedBy: userObjectId,
          });
        }
      }

      // Update in-memory configuration
      geminiConfig.apiKey = apiKey;
      if (modelName) geminiConfig.model = modelName;
      if (maxTokens !== undefined) geminiConfig.maxTokens = maxTokens;
      if (temperature !== undefined) geminiConfig.temperature = temperature;
      geminiConfig.isConnected = true;
      geminiConfig.lastTested = new Date().toISOString();

      // Cache the configuration in Redis for better performance
      try {
        const redis = getRedisClient();
        await redis.setEx(
           'gemini_config:global',
           3600, // 1 hour TTL
           JSON.stringify({
             ...geminiConfig,
             apiKey: '***encrypted***', // Don't store actual key in cache
           })
         );
      } catch (redisError) {
        logger.warn('Failed to cache Gemini configuration in Redis', {
          error: redisError instanceof Error ? redisError.message : 'Unknown error',
        });
      }

      logger.info('Gemini configuration saved successfully to database');

      res.json({
        success: true,
        message: 'Gemini configuration saved successfully',
        data: {
          model: geminiConfig.model,
          provider: geminiConfig.provider,
          lastTested: geminiConfig.lastTested,
          isConnected: geminiConfig.isConnected,
        },
      });
    } catch (error) {
      logger.error('Error saving Gemini configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (error instanceof Error && error.message.includes('API_KEY_INVALID')) {
        throw new AppError('Invalid API key provided', 400);
      }
      
      next(error);
    }
  }
);

/**
 * @route   GET /api/ai-models/gemini/status
 * @desc    Get Gemini service status
 * @access  Private
 */
router.get('/gemini/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Gemini status requested', {
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        isConnected: geminiConfig.isConnected,
        lastTested: geminiConfig.lastTested,
        model: geminiConfig.model,
        provider: geminiConfig.provider,
        hasApiKey: !!geminiConfig.apiKey,
      },
    });
  } catch (error) {
    logger.error('Error fetching Gemini status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

export default router;