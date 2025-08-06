import { Router, Request, Response } from 'express';
import { UserService } from '../services/user';
import { CacheService } from '../config/redis';
import { logger } from '../utils/logger';
import { Client } from '@line/bot-sdk';

const router = Router();

// Services will be injected
let userService: UserService;

// Inject services
export const injectServices = (lineClient: Client, cache: CacheService) => {
  userService = new UserService(lineClient, cache);
};

/**
 * Get user by ID
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await userService.getUser(userId!);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get user', error as Error, {
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update user settings
 */
router.put('/:userId/settings', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    const updatedUser = await userService.updateUserSettings(userId!, settings);
    
    return res.json({
      success: true,
      data: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to update user settings', error as Error, {
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Block user
 */
router.post('/:userId/block', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    await userService.blockUser(userId!, reason);
    
    return res.json({
      success: true,
      message: 'User blocked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to block user', error as Error, {
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Unblock user
 */
router.post('/:userId/unblock', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    await userService.unblockUser(userId!);
    
    return res.json({
      success: true,
      message: 'User unblocked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to unblock user', error as Error, {
      userId: req.params.userId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;