import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Admin credentials (in production, these should be in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Validation middleware
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 1 })
    .withMessage('密码不能为空'),
];

// Handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array(),
    });
    return;
  }
  next();
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validateLogin, handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    logger.info('Login attempt', {
      username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      logger.warn('Invalid login attempt', {
        username,
        ip: req.ip,
      });
      
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // Successful login
    logger.info('Successful login', {
      username,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: 1,
        username: 'Administrator',
        email: 'admin@system.local',
        role: 'admin',
        name: 'Administrator',
      },
      // TODO: Add JWT token here
      // token: generateJWT(user)
    });
  } catch (error) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Admin logout
 * @access  Public
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Logout request', {
      ip: req.ip,
    });

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private (in a real app, this would require authentication)
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you would verify the JWT token here
    // For now, we'll just return mock data
    const userData = {
      id: '1',
      username: ADMIN_USERNAME,
      name: 'Administrator',
      role: 'admin',
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    logger.error('Get user info error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next(error);
  }
});

export default router;