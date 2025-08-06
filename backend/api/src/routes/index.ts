import express from 'express';
import aiModelRoutes from './aiModels';
import promptRoutes from './prompts';
import settingsRoutes from './settings';
import chatRoutes from './chat';
import lineRoutes from './line';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API status endpoint with more detailed information
router.get('/status', async (req, res, next) => {
  try {
    const status = {
      success: true,
      message: 'API is operational',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'connected', // This could be checked dynamically
        redis: 'connected',    // This could be checked dynamically
        storage: 'available',  // This could be checked dynamically
      },
    };

    logger.info('API status checked', {
      requestedBy: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Mount routes
router.use('/ai-models', aiModelRoutes);
router.use('/prompts', promptRoutes);
router.use('/settings', settingsRoutes);
router.use('/chat', chatRoutes);
router.use('/line', lineRoutes);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agent API Documentation',
    version: process.env.API_VERSION || '1.0.0',
    endpoints: {
      authentication: {
        base: '/api/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /logout - User logout',
          'POST /logout-all - Logout from all sessions',
          'POST /refresh - Refresh access token',
          'POST /forgot-password - Request password reset',
          'POST /reset-password - Reset password with token',
          'POST /change-password - Change password (authenticated)',
          'POST /verify-email - Verify email address',
          'POST /resend-verification - Resend verification email',
          'GET /me - Get current user info',
          'GET /sessions - Get user sessions',
          'DELETE /sessions/:sessionId - Delete specific session',
        ],
      },

      aiModels: {
        base: '/api/ai-models',
        endpoints: [
          'GET / - Get all AI models',
          'GET /active - Get active AI models',
          'GET /provider/:provider - Get models by provider',
          'GET /stats - Get AI model statistics (admin)',
          'GET /:id - Get AI model by ID',
          'POST / - Create new AI model (admin)',
          'PUT /:id - Update AI model (admin)',
          'DELETE /:id - Delete AI model (admin)',
          'POST /:id/test - Test AI model (admin)',
          'GET /:id/usage - Get model usage statistics (admin)',
          'GET /:id/health - Check model health (admin)',
        ],
      },
      prompts: {
        base: '/api/prompts',
        endpoints: [
          'GET / - Get all prompts',
          'GET /categories - Get prompt categories',
          'GET /tags - Get popular prompt tags',
          'GET /popular - Get popular prompts',
          'GET /stats - Get prompt statistics (admin)',
          'GET /:id - Get prompt by ID',
          'POST / - Create new prompt',
          'PUT /:id - Update prompt',
          'DELETE /:id - Delete prompt',
          'POST /:id/duplicate - Duplicate prompt',
          'POST /:id/use - Record prompt usage',
          'GET /:id/versions - Get prompt versions',
          'POST /search - Advanced prompt search',
        ],
      },
      settings: {
        base: '/api/settings',
        endpoints: [
          'GET / - Get all settings (admin)',
          'GET /categories - Get setting categories (admin)',
          'GET /public - Get public settings (admin)',
          'GET /:key - Get setting by key (admin)',
          'POST / - Create new setting (admin)',
          'PUT /:key - Update setting (admin)',
          'DELETE /:key - Delete setting (admin)',
          'POST /bulk-update - Bulk update settings (admin)',
          'POST /reset-defaults - Reset to defaults (superadmin)',
          'GET /:key/history - Get setting history (admin)',
          'POST /export - Export settings (admin)',
        ],
      },
    },
    authentication: {
      type: 'None - All endpoints are public',
      note: 'No authentication required for any endpoints',
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
      admin: '200 requests per 15 minutes',
      search: '50 requests per 15 minutes',
    },
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation errors',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error',
    },
  });
});

// Catch-all route for undefined API endpoints
router.all('*', (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found on this server`,
    404
  );
  next(error);
});

export default router;