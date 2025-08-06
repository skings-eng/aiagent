import express, { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { Settings } from '../models/Settings';
import { handleValidationErrors } from '../middleware/validation';
import { adminLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';
import mongoose from 'mongoose';

const router = express.Router();

// Apply rate limiting
router.use(adminLimiter);

/**
 * @route GET /api/v1/settings
 * @desc Get all settings with optional filtering
 * @access Admin
 */
router.get('/',
  [
    query('category')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    query('group')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Group must be between 1 and 50 characters'),
    query('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean'),
    query('isEditable')
      .optional()
      .isBoolean()
      .withMessage('isEditable must be a boolean'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, group, isPublic, isEditable } = req.query;
      
      const filter: any = {};
      if (category) {
        filter.category = category;
      }
      if (group) {
        filter.group = group;
      }
      if (isPublic !== undefined) {
        filter.isPublic = isPublic === 'true';
      }
      if (isEditable !== undefined) {
        filter.isEditable = isEditable === 'true';
      }

      const settings = await Settings.find(filter).sort({ category: 1, key: 1 });

      res.json({
        success: true,
        data: {
          settings,
          total: settings.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/settings/categories
 * @desc Get all setting categories
 * @access Admin
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Settings.distinct('category');
    
    res.json({
      success: true,
      data: {
        categories: categories.sort(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/settings/public
 * @desc Get public settings (no auth required)
 * @access Public
 */
router.get('/public', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to get from cache first
    const redisClient = getRedisClient();
    const cacheKey = 'settings:public';
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      res.json({
        success: true,
        data: {
          settings: JSON.parse(cached),
        },
      });
      return;
    }

    const publicSettings = await Settings.find({ isPublic: true });
    
    // Convert to key-value pairs for easier consumption
    const settingsMap = publicSettings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(settingsMap));

    res.json({
      success: true,
      data: {
        settings: settingsMap,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/settings/:key
 * @desc Get a specific setting by key
 * @access Admin
 */
router.get('/:key',
  [
    param('key')
      .notEmpty()
      .isLength({ min: 1, max: 100 })
      .withMessage('Key must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      
      const setting = await Settings.findOne({ key });
      
      if (!setting) {
        throw new AppError('Setting not found', 404);
      }

      res.json({
        success: true,
        data: {
          setting,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/settings
 * @desc Create a new setting
 * @access Admin
 */
router.post('/',
  [
    body('key')
      .notEmpty()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Key must be alphanumeric with dots, underscores, or hyphens only'),
    body('value')
      .notEmpty()
      .withMessage('Value is required'),
    body('type')
      .isIn(['string', 'number', 'boolean', 'object', 'array'])
      .withMessage('Type must be string, number, boolean, object, or array'),
    body('category')
      .notEmpty()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean'),
    body('isEditable')
      .optional()
      .isBoolean()
      .withMessage('isEditable must be a boolean'),
    body('validation')
      .optional()
      .isObject()
      .withMessage('Validation must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        key,
        value,
        type,
        category,
        description,
        isPublic = false,
        isEditable = true,
        validation,
        metadata,
      } = req.body;

      // Check if setting already exists
      const existingSetting = await Settings.findOne({ key });
      if (existingSetting) {
        throw new AppError('Setting with this key already exists', 400);
      }

      const setting = new Settings({
        key,
        value,
        type,
        category,
        description,
        isPublic,
        isEditable,
        validation,
        metadata,
        createdBy: new mongoose.Types.ObjectId(),
        updatedBy: new mongoose.Types.ObjectId(),
      });

      await setting.save();

      // Clear public settings cache if this is a public setting
      if (setting.isPublic) {
        const redisClient = getRedisClient();
        await redisClient.del('settings:public');
      }

      logger.info('Setting created', {
        key: setting.key,
        category: setting.category,
      });

      res.status(201).json({
        success: true,
        data: {
          setting,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/v1/settings/:key
 * @desc Update a setting
 * @access Admin
 */
router.put('/:key',
  [
    param('key')
      .notEmpty()
      .isLength({ min: 1, max: 100 })
      .withMessage('Key must be between 1 and 100 characters'),
    body('value')
      .optional(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean'),
    body('isEditable')
      .optional()
      .isBoolean()
      .withMessage('isEditable must be a boolean'),
    body('validation')
      .optional()
      .isObject()
      .withMessage('Validation must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const updates = req.body;

      const setting = await Settings.findOne({ key });
      if (!setting) {
        throw new AppError('Setting not found', 404);
      }

      if (!setting.isEditable && Object.keys(updates).some(k => k !== 'metadata')) {
        throw new AppError('This setting is not editable', 400);
      }

      const wasPublic = setting.isPublic;

      // Update fields
      Object.assign(setting, updates);
      setting.updatedBy = new mongoose.Types.ObjectId();
      setting.updatedAt = new Date();

      await setting.save();

      // Clear public settings cache if this was or is now a public setting
      if (wasPublic || setting.isPublic) {
        const redisClient = getRedisClient();
        await redisClient.del('settings:public');
      }

      logger.info('Setting updated', {
        key: setting.key,
        category: setting.category,
      });

      res.json({
        success: true,
        data: {
          setting,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/settings/:key
 * @desc Delete a setting
 * @access Admin
 */
router.delete('/:key',
  [
    param('key')
      .notEmpty()
      .isLength({ min: 1, max: 100 })
      .withMessage('Key must be between 1 and 100 characters'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      
      const setting = await Settings.findOne({ key });
      if (!setting) {
        throw new AppError('Setting not found', 404);
      }

      if (!setting.isEditable) {
        throw new AppError('This setting cannot be deleted', 400);
      }

      const wasPublic = setting.isPublic;
      await Settings.deleteOne({ key });

      // Clear public settings cache if this was a public setting
      if (wasPublic) {
        const redisClient = getRedisClient();
        await redisClient.del('settings:public');
      }

      logger.info('Setting deleted', {
        key,
      });

      res.json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;