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
export let aiModelConfig = {
  provider: 'openai',
  apiKey: '',
  isConnected: false,
  lastTested: '',
  lastUpdated: new Date(),
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
};

/**
 * Load AI model configuration from database
 */
export async function loadAIModelConfig(): Promise<void> {
  try {
    logger.info('Loading AI model configuration from database');
    
    // Load provider
    const providerSetting = await Settings.getByKey('ai', 'ai_provider');
    if (providerSetting) {
      aiModelConfig.provider = providerSetting.value;
    }
    
    // Load API key
    const apiKeySetting = await Settings.getByKey('ai', 'gpt4o_api_key');
    if (apiKeySetting) {
      aiModelConfig.apiKey = apiKeySetting.value;
      logger.info('AI model API key loaded from database');
    }
    

    
    // Load model
    const modelSetting = await Settings.getByKey('ai', 'gpt4o_model');
    if (modelSetting) {
      aiModelConfig.model = modelSetting.value;
    }
    
    // Load max tokens
    const maxTokensSetting = await Settings.getByKey('ai', 'gpt4o_max_tokens');
    if (maxTokensSetting) {
      aiModelConfig.maxTokens = parseInt(maxTokensSetting.value, 10);
    }
    
    // Load temperature
    const temperatureSetting = await Settings.getByKey('ai', 'gpt4o_temperature');
    if (temperatureSetting) {
      aiModelConfig.temperature = parseFloat(temperatureSetting.value);
    }
    
    logger.info('AI model configuration loaded successfully', {
      provider: aiModelConfig.provider,
      hasApiKey: !!aiModelConfig.apiKey,
      model: aiModelConfig.model,
      maxTokens: aiModelConfig.maxTokens,
      temperature: aiModelConfig.temperature,
    });
  } catch (error) {
    logger.error('Error loading AI model configuration from database:', error);
  }
}

// Note: Configuration will be loaded after MongoDB connection is established

/**
 * @route   GET /api/ai-models/config
 * @desc    Get current AI model configuration
 * @access  Private
 */
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('AI model configuration requested', {
      ip: req.ip,
    });

    // Return actual API key for admin configuration (明文显示)
    const safeConfig = {
      ...aiModelConfig,
      apiKey: aiModelConfig.apiKey, // 返回明文API密钥
    };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    logger.error('Error fetching AI model configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

/**
 * @route   POST /api/ai-models/test
 * @desc    Test AI model API connection
 * @access  Private
 */
router.post('/test',
  [
    body('provider')
      .notEmpty()
      .isIn(['openai', 'anthropic', 'google'])
      .withMessage('Provider must be one of: openai, anthropic, google'),
    body('model')
      .notEmpty()
      .isString()
      .withMessage('Model is required'),
    body('apiKey')
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage('API key is required and must be at least 10 characters'),
    body('message')
      .optional()
      .isString()
      .withMessage('Message must be a string'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { apiKey, message } = req.body;

      logger.info('Testing AI model API connection', {
        ip: req.ip,
        provider: req.body.provider,
        model: req.body.model,
        hasMessage: !!message
      });

      // Validate API key format based on provider
      const { provider } = req.body;
      let isValidFormat = false;
      
      switch (provider) {
        case 'openai':
          isValidFormat = apiKey.startsWith('sk-') && apiKey.length >= 40;
          break;
        case 'anthropic':
          isValidFormat = apiKey.startsWith('sk-ant-') && apiKey.length >= 40;
          break;
        case 'google':
          isValidFormat = apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
          break;
        default:
          isValidFormat = apiKey.length >= 20;
      }
      
      if (!isValidFormat) {
        throw new AppError(`Invalid API key format for ${provider}. Please check your API key.`, 400);
      }

      // 真实的API连接测试
      let testResult = false;
      let errorMessage = '';
      let aiResponse = '';
      
      try {
        if (provider === 'openai') {
          if (message) {
            // 发送实际消息测试
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: req.body.model,
                messages: [{ role: 'user', content: message }],
                max_tokens: req.body.maxTokens || 150,
                temperature: req.body.temperature || 0.7
              })
            });
            
            if (response.ok) {
              const data = await response.json() as any;
              testResult = true;
              aiResponse = data.choices?.[0]?.message?.content || '无响应内容';
            } else {
              const errorData = await response.json() as any;
              errorMessage = errorData.error?.message || 'API调用失败';
            }
          } else {
            // 仅测试连接
            const response = await fetch('https://api.openai.com/v1/models', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
               const data = await response.json() as any;
               testResult = data.data && Array.isArray(data.data);
             } else {
               const errorData = await response.json() as any;
               errorMessage = errorData.error?.message || 'API调用失败';
             }
          }
        } else if (provider === 'anthropic') {
          // 测试Anthropic API
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: req.body.model,
              max_tokens: message ? (req.body.maxTokens || 150) : 10,
              messages: [{ role: 'user', content: message || 'test' }]
            })
          });
          
          if (response.ok) {
            testResult = true;
            if (message) {
              const data = await response.json() as any;
              aiResponse = data.content?.[0]?.text || '无响应内容';
            }
          } else if (response.status === 400) {
            testResult = true; // 400也表示API密钥有效
          } else {
            const errorData = await response.json() as any;
            errorMessage = errorData.error?.message || 'API调用失败';
          }
        } else if (provider === 'google') {
          // 测试Google Gemini API
          if (message) {
            // 发送实际消息测试
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${req.body.model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: message }]
                }],
                generationConfig: {
                  maxOutputTokens: req.body.maxTokens || 150,
                  temperature: req.body.temperature || 0.7
                }
              })
            });
            
            if (response.ok) {
              const data = await response.json() as any;
              testResult = true;
              aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '无响应内容';
            } else {
              const errorData = await response.json() as any;
              errorMessage = errorData.error?.message || 'API调用失败';
            }
          } else {
            // 仅测试连接
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
              method: 'GET'
            });
            
            if (response.ok) {
               const data = await response.json() as any;
               testResult = data.models && Array.isArray(data.models);
             } else {
               const errorData = await response.json() as any;
               errorMessage = errorData.error?.message || 'API调用失败';
             }
          }
        }
        
        if (!testResult) {
          throw new AppError(errorMessage || `${provider} API连接测试失败`, 400);
        }
        
        // Update connection status
        aiModelConfig.isConnected = true;
        aiModelConfig.lastTested = new Date().toISOString();
        
        logger.info('AI model API connection test successful', { provider });
      } catch (fetchError) {
        aiModelConfig.isConnected = false;
        const errorMsg = fetchError instanceof Error ? fetchError.message : '网络连接失败';
        logger.error('AI model API connection test failed', { provider, error: errorMsg });
        throw new AppError(`API连接测试失败: ${errorMsg}`, 400);
      }

      res.json({
        success: true,
        message: 'AI model API connection successful',
        data: {
          isConnected: true,
          lastTested: aiModelConfig.lastTested,
          model: req.body.model,
          provider: req.body.provider,
        },
        aiResponse: aiResponse || undefined
      });
    } catch (error) {
      logger.error('AI model API connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: req.body.provider
      });
      
      // Update connection status on failure
      aiModelConfig.isConnected = false;
      
      next(error);
    }
  }
);

/**
 * @route   POST /api/ai-models/config
 * @desc    Save AI model configuration
 * @access  Private
 */
router.post('/config',
  [
    body('provider')
      .notEmpty()
      .isIn(['openai', 'anthropic', 'google'])
      .withMessage('Provider must be one of: openai, anthropic, google'),
    body('apiKey')
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage('API key is required and must be at least 10 characters'),
    body('model')
      .notEmpty()
      .isString()
      .withMessage('Model is required'),
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
      const { provider, apiKey, model: modelName, maxTokens, temperature } = req.body;

      logger.info('Saving AI model configuration', {
        ip: req.ip,
        provider,
        model: modelName
      });
      
      logger.info('Received data types', {
        provider: typeof provider,
        apiKey: typeof apiKey,
        modelName: typeof modelName,
        maxTokens: typeof maxTokens,
        temperature: typeof temperature,
        maxTokensValue: maxTokens,
        temperatureValue: temperature
      });

      // Basic API key validation (skip real API call for demo)
      if (!apiKey || apiKey.length < 10) {
        throw new AppError('Invalid API key format', 400);
      }
      
      logger.info('API key validation passed (demo mode)');

      // Save to database using Settings model
      // Use a default ObjectId for settings since no user authentication
      logger.info('Starting to save configuration to database');
      const userObjectId = new mongoose.Types.ObjectId();
      
      // Save provider
      const existingProviderSetting = await Settings.getByKey('ai', 'ai_provider');
      if (existingProviderSetting) {
        await existingProviderSetting.updateValue(provider, userObjectId, 'Provider updated via configuration');
      } else {
        await Settings.create({
          category: 'ai',
          key: 'ai_provider',
          value: provider,
          type: 'string',
          description: 'AI service provider (openai, anthropic, google)',
          isPublic: false,
          isEditable: true,
          metadata: {
            group: 'ai',
            sensitive: false,
            restartRequired: false,
          },
          createdBy: userObjectId,
          updatedBy: userObjectId,
        });
      }
      
      // Save API key (still using gpt4o_api_key for backward compatibility)
      const existingSetting = await Settings.getByKey('ai', 'gpt4o_api_key');
      if (existingSetting) {
        await existingSetting.updateValue(apiKey, userObjectId, 'API key updated via configuration');
      } else {
        await Settings.create({
          category: 'ai',
          key: 'gpt4o_api_key',
          value: apiKey,
          type: 'string',
          description: 'AI API key for chat functionality',
          isPublic: false,
          isEditable: true,
          metadata: {
            group: 'ai',
            sensitive: true,
            restartRequired: false,
          },
          createdBy: userObjectId,
          updatedBy: userObjectId,
        });
      }



      // Save model (still using gpt4o_model for backward compatibility)
      if (modelName) {
        const existingModelSetting = await Settings.getByKey('ai', 'gpt4o_model');
        if (existingModelSetting) {
          await existingModelSetting.updateValue(modelName, userObjectId, 'Model updated via configuration');
        } else {
          await Settings.create({
            category: 'ai',
            key: 'gpt4o_model',
            value: modelName,
            type: 'string',
            description: 'AI model version',
            isPublic: false,
            isEditable: true,
            metadata: { group: 'ai' },
            createdBy: userObjectId,
            updatedBy: userObjectId,
          });
        }
      }

      if (maxTokens !== undefined) {
        try {
          logger.info('Processing maxTokens', { maxTokens, type: typeof maxTokens });
          const existingMaxTokensSetting = await Settings.getByKey('ai', 'gpt4o_max_tokens');
          logger.info('getByKey result for maxTokens', { 
            found: !!existingMaxTokensSetting, 
            id: existingMaxTokensSetting?._id,
            value: existingMaxTokensSetting?.value 
          });
          if (existingMaxTokensSetting) {
            logger.info('Updating existing maxTokens setting');
            await existingMaxTokensSetting.updateValue(maxTokens, userObjectId, 'Max tokens updated via configuration');
            logger.info('MaxTokens updated successfully');
          } else {
            logger.info('Creating new maxTokens setting');
            try {
              const newSetting = await Settings.create({
                category: 'ai',
                key: 'gpt4o_max_tokens',
                value: maxTokens,
                type: 'number',
                description: 'AI maximum output tokens',
                isPublic: false,
                isEditable: true,
                metadata: { group: 'ai' },
                createdBy: userObjectId,
                updatedBy: userObjectId,
              });
              logger.info('MaxTokens setting created successfully', { id: newSetting._id, value: newSetting.value });
              
              // 验证创建是否成功
              const verifyCreated = await Settings.getByKey('ai', 'gpt4o_max_tokens');
              logger.info('Verification after creation', { found: !!verifyCreated, value: verifyCreated?.value });
            } catch (createError) {
              logger.error('Failed to create maxTokens setting', { error: createError instanceof Error ? createError.message : 'Unknown error', stack: createError instanceof Error ? createError.stack : undefined });
              throw createError;
            }
          }
        } catch (error) {
          logger.error('Error processing maxTokens', { error: error instanceof Error ? error.message : 'Unknown error', maxTokens });
          throw error;
        }
      }

      if (temperature !== undefined) {
        try {
          logger.info('Processing temperature', { temperature, type: typeof temperature });
          const existingTemperatureSetting = await Settings.getByKey('ai', 'gpt4o_temperature');
          logger.info('getByKey result for temperature', { 
            found: !!existingTemperatureSetting, 
            id: existingTemperatureSetting?._id,
            value: existingTemperatureSetting?.value 
          });
          if (existingTemperatureSetting) {
            logger.info('Updating existing temperature setting');
            await existingTemperatureSetting.updateValue(temperature, userObjectId, 'Temperature updated via configuration');
            logger.info('Temperature updated successfully');
          } else {
            logger.info('Creating new temperature setting');
            try {
              const newSetting = await Settings.create({
                category: 'ai',
                key: 'gpt4o_temperature',
                value: temperature,
                type: 'number',
                description: 'AI temperature parameter',
                isPublic: false,
                isEditable: true,
                metadata: { group: 'ai' },
                createdBy: userObjectId,
                updatedBy: userObjectId,
              });
              logger.info('Temperature setting created successfully', { id: newSetting._id, value: newSetting.value });
              
              // 验证创建是否成功
              const verifyCreated = await Settings.getByKey('ai', 'gpt4o_temperature');
              logger.info('Verification after creation', { found: !!verifyCreated, value: verifyCreated?.value });
            } catch (createError) {
              logger.error('Failed to create temperature setting', { error: createError instanceof Error ? createError.message : 'Unknown error', stack: createError instanceof Error ? createError.stack : undefined });
              throw createError;
            }
          }
        } catch (error) {
          logger.error('Error processing temperature', { error: error instanceof Error ? error.message : 'Unknown error', temperature });
          throw error;
        }
      }

      // Update in-memory configuration
      aiModelConfig.provider = provider;
      aiModelConfig.apiKey = apiKey;
      if (modelName) aiModelConfig.model = modelName;
      if (maxTokens !== undefined) aiModelConfig.maxTokens = maxTokens;
      if (temperature !== undefined) aiModelConfig.temperature = temperature;
      aiModelConfig.isConnected = true;
      aiModelConfig.lastTested = new Date().toISOString();

      // Cache the configuration in Redis for better performance
      try {
        const redis = getRedisClient();
        await redis.setEx(
           'ai_config:global',
           3600, // 1 hour TTL
           JSON.stringify({
             ...aiModelConfig,
             apiKey: '***encrypted***', // Don't store actual key in cache
           })
         );
      } catch (redisError) {
        logger.warn('Failed to cache AI configuration in Redis', {
          error: redisError instanceof Error ? redisError.message : 'Unknown error',
        });
      }

      logger.info('AI configuration saved successfully to database');

      res.json({
        success: true,
        message: 'AI model configuration saved successfully',
        data: {
          provider: aiModelConfig.provider,
          model: aiModelConfig.model,
          lastTested: aiModelConfig.lastTested,
          isConnected: aiModelConfig.isConnected,
        },
      });
    } catch (error) {
      logger.error('Error saving AI model configuration', {
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
 * @route   GET /api/ai-models/status
 * @desc    Get AI model service status
 * @access  Private
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('AI model status requested', {
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        isConnected: aiModelConfig.isConnected,
        lastTested: aiModelConfig.lastTested,
        model: aiModelConfig.model,
        provider: aiModelConfig.provider,
        hasApiKey: !!aiModelConfig.apiKey,
      },
    });
  } catch (error) {
    logger.error('Error fetching AI model status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

export default router;