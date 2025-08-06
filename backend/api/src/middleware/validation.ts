import { body, param, query, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
    return;
  }

  next();
};

// Common validation rules
export const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Username validation
  username: body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  // Name validation
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),

  // Role validation
  role: body('role')
    .isIn(['admin', 'user', 'moderator'])
    .withMessage('Role must be admin, user, or moderator'),

  // Status validation
  status: body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),

  // MongoDB ObjectId validation
  objectId: (field: string) => 
    param(field)
      .isMongoId()
      .withMessage(`${field} must be a valid MongoDB ObjectId`),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search query validation
  search: query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters'),

  // Sort validation
  sort: query('sort')
    .optional()
    .matches(/^[a-zA-Z_]+(:(asc|desc))?$/)
    .withMessage('Sort must be in format "field" or "field:asc" or "field:desc"'),
};

// Authentication validations removed - no JWT authentication required

// User validations
export const userValidations = {
  // Create user validation
  create: [
    commonValidations.username,
    commonValidations.email,
    commonValidations.name,
    commonValidations.role,
    commonValidations.status,
  ],

  // Update user validation
  update: [
    commonValidations.objectId('id'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'user', 'moderator'])
      .withMessage('Role must be admin, user, or moderator'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status must be active, inactive, or suspended'),
  ],

  // Get user validation
  getById: [
    commonValidations.objectId('id'),
  ],

  // Delete user validation
  delete: [
    commonValidations.objectId('id'),
  ],

  // List users validation
  list: [
    commonValidations.page,
    commonValidations.limit,
    commonValidations.search,
    commonValidations.sort,
    query('role')
      .optional()
      .isIn(['admin', 'user', 'moderator'])
      .withMessage('Role filter must be admin, user, or moderator'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status filter must be active, inactive, or suspended'),
  ],
};

// AI Model validations
export const aiModelValidations = {
  // Create AI model validation
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Model name must be between 1 and 100 characters'),
    body('type')
      .isIn(['gpt', 'claude', 'gemini', 'custom'])
      .withMessage('Model type must be gpt, claude, gemini, or custom'),
    body('version')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Version must be between 1 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('config')
      .optional()
      .isObject()
      .withMessage('Config must be a valid object'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'training', 'deployed'])
      .withMessage('Status must be active, inactive, training, or deployed'),
  ],

  // Update AI model validation
  update: [
    commonValidations.objectId('id'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Model name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('config')
      .optional()
      .isObject()
      .withMessage('Config must be a valid object'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'training', 'deployed'])
      .withMessage('Status must be active, inactive, training, or deployed'),
  ],

  // Get AI model validation
  getById: [
    commonValidations.objectId('id'),
  ],

  // Delete AI model validation
  delete: [
    commonValidations.objectId('id'),
  ],

  // List AI models validation
  list: [
    commonValidations.page,
    commonValidations.limit,
    commonValidations.search,
    commonValidations.sort,
    query('type')
      .optional()
      .isIn(['gpt', 'claude', 'gemini', 'custom'])
      .withMessage('Type filter must be gpt, claude, gemini, or custom'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'training', 'deployed'])
      .withMessage('Status filter must be active, inactive, training, or deployed'),
  ],
};

// Prompt validations
export const promptValidations = {
  // Create prompt validation
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Prompt name must be between 1 and 100 characters'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Prompt content must be between 1 and 5000 characters'),
    body('category')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variables must be an array'),
    body('variables.*')
      .optional()
      .isString()
      .withMessage('Each variable must be a string'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .withMessage('Each tag must be a string'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  // Update prompt validation
  update: [
    commonValidations.objectId('id'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Prompt name must be between 1 and 100 characters'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Prompt content must be between 1 and 5000 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variables must be an array'),
    body('variables.*')
      .optional()
      .isString()
      .withMessage('Each variable must be a string'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .withMessage('Each tag must be a string'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  // Get prompt validation
  getById: [
    commonValidations.objectId('id'),
  ],

  // Delete prompt validation
  delete: [
    commonValidations.objectId('id'),
  ],

  // List prompts validation
  list: [
    commonValidations.page,
    commonValidations.limit,
    commonValidations.search,
    commonValidations.sort,
    query('category')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category filter must be between 1 and 50 characters'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive filter must be a boolean'),
  ],
};

// Settings validations
export const settingsValidations = {
  // Update settings validation
  update: [
    body('general')
      .optional()
      .isObject()
      .withMessage('General settings must be an object'),
    body('api')
      .optional()
      .isObject()
      .withMessage('API settings must be an object'),
    body('ai')
      .optional()
      .isObject()
      .withMessage('AI settings must be an object'),
    body('security')
      .optional()
      .isObject()
      .withMessage('Security settings must be an object'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notification settings must be an object'),
    body('backup')
      .optional()
      .isObject()
      .withMessage('Backup settings must be an object'),
  ],
};

// File upload validations
export const fileValidations = {
  // Image upload validation
  image: [
    body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Image file is required');
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
        }
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
          throw new Error('Image file size must not exceed 10MB');
        }
        
        return true;
      }),
  ],

  // Document upload validation
  document: [
    body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('Document file is required');
        }
        
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only PDF, DOC, DOCX, and TXT files are allowed');
        }
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (req.file.size > maxSize) {
          throw new Error('Document file size must not exceed 50MB');
        }
        
        return true;
      }),
  ],
};