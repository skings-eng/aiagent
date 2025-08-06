import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user';
import { CacheService } from '../config/redis';
import { logger, logApiRequest, logError } from '../utils/logger';
import {
  User,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { Client } from '@line/bot-sdk';

const router = Router();

// Initialize services (will be injected by the main app)
let userService: UserService;
let cacheService: CacheService;

// Middleware to inject services
export const injectServices = (lineClient: Client, cache: CacheService) => {
  userService = new UserService(lineClient, cache);
  cacheService = cache;
};

// Middleware for request validation
const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  if (!userId || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  return next();
};

// Middleware for pagination validation
const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { limit = '50', offset = '0' } = req.query;
  
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be between 1 and 100',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      success: false,
      error: 'Offset must be a non-negative number',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
  
  req.query.limit = limitNum.toString();
  req.query.offset = offsetNum.toString();
  
  return next();
};

/**
 * GET /users
 * Get list of users with pagination and filters
 */
router.get('/', validatePagination, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get users list');
    
    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    
    // Parse filters
    const filters: any = {};
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    if (req.query.isBlocked !== undefined) {
      filters.isBlocked = req.query.isBlocked === 'true';
    }
    if (req.query.createdAfter) {
      filters.createdAfter = req.query.createdAfter as string;
    }
    if (req.query.createdBefore) {
      filters.createdBefore = req.query.createdBefore as string;
    }
    
    const result = await userService.getUserList(limit, offset, filters);
    
    const response: ApiResponse<PaginatedResponse<User>> = {
      success: true,
      data: {
        data: result.users,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: offset + limit < result.total,
          hasPrev: offset > 0,
          offset
        }
      },
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get users list', error as Error, {
      query: req.query,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /users/search
 * Search users by query
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Search users');
    
    const { q: query, limit = '20' } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 50',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const users = await userService.searchUsers(query, limitNum);
    
    const response: ApiResponse<User[]> = {
      success: true,
      data: users,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to search users', error as Error, {
      query: req.query,
      ip: req.ip
    });
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * GET /users/analytics
 * Get user analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get user analytics');
    
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const analytics = await userService.getUserAnalytics(start, end);
    
    const response: ApiResponse<typeof analytics> = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get user analytics', error as Error, {
      query: req.query,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /users/:userId
 * Get user by ID
 */
router.get('/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get user by ID');
    
    const { userId } = req.params;
    const user = await userService.getUser(userId!);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get user', error as Error, {
      userId: req.params.userId,
      ip: req.ip
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
});

/**
 * GET /users/:userId/profile
 * Get user profile from LINE API
 */
router.get('/:userId/profile', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Get user profile');
    
    const { userId } = req.params;
    const profile = await userService.getUserProfile(userId!);
    
    const response: ApiResponse<typeof profile> = {
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to get user profile', error as Error, {
      userId: req.params.userId,
      ip: req.ip
    });
    
    if ((error as any).name === 'UserNotFoundError') {
      return res.status(404).json({
        success: false,
        error: (error as Error).message,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * PUT /users/:userId/settings
 * Update user settings
 */
router.put('/:userId/settings', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Update user settings');
    
    const { userId } = req.params;
    const settings = req.body;
    
    if (!settings || Object.keys(settings).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Settings data is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const user = await userService.updateUserSettings(userId!, settings);
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to update user settings', error as Error, {
      userId: req.params.userId,
      settings: req.body,
      ip: req.ip
    });
    
    if ((error as any).name === 'UserNotFoundError') {
      return res.status(404).json({
        success: false,
        error: (error as Error).message,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /users/:userId/block
 * Block user
 */
router.post('/:userId/block', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Block user');
    
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await userService.blockUser(userId!, reason);
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to block user', error as Error, {
      userId: req.params.userId,
      reason: req.body.reason,
      ip: req.ip
    });
    
    if ((error as any).name === 'UserNotFoundError') {
      return res.status(404).json({
        success: false,
        error: (error as Error).message,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * POST /users/:userId/unblock
 * Unblock user
 */
router.post('/:userId/unblock', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Unblock user');
    
    const { userId } = req.params;
    const user = await userService.unblockUser(userId!);
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to unblock user', error as Error, {
      userId: req.params.userId,
      ip: req.ip
    });
    
    if ((error as any).name === 'UserNotFoundError') {
      return res.status(404).json({
        success: false,
        error: (error as Error).message,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: (error as Error).message,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

/**
 * DELETE /users/:userId
 * Delete user
 */
router.delete('/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    logApiRequest(req, 'Delete user');
    
    const { userId } = req.params;
    await userService.deleteUser(userId!);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      timestamp: new Date().toISOString()
    };
    
    return res.json(response);
  } catch (error) {
    logError('Failed to delete user', error as Error, {
      userId: req.params.userId,
      ip: req.ip
    });
    
    if ((error as any).name === 'UserNotFoundError') {
      return res.status(404).json({
        success: false,
        error: (error as Error).message,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
});

export default router;
export { router as usersRouter };