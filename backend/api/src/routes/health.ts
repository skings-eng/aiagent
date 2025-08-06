import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';

const router = express.Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Check MongoDB connection
    try {
      if (mongoose.connection.readyState === 1) {
        health.services.database = 'connected';
      } else {
        health.services.database = 'disconnected';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    // Check Redis connection
    try {
      const redisClient = getRedisClient();
      await redisClient.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'error';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});

export default router;