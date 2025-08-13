import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();

// LINE service base URL
const LINE_SERVICE_URL = process.env.LINE_SERVICE_URL || 'http://localhost:3003';

// Proxy function to forward requests to LINE service
const proxyToLineService = async (req: Request, res: Response, endpoint: string) => {
  try {
    const url = `${LINE_SERVICE_URL}${endpoint}`;
    
    // Clean headers - remove problematic ones
    const cleanHeaders: any = {
      'Content-Type': 'application/json'
    };
    
    // Only include safe headers
    if (req.headers.authorization) {
      cleanHeaders.authorization = req.headers.authorization;
    }
    
    const config = {
      method: req.method.toLowerCase() as any,
      url,
      data: req.body,
      headers: cleanHeaders,
      timeout: 300000, // Increased timeout to 300 seconds
      validateStatus: () => true // Accept all status codes
    };

    logger.info(`Proxying ${req.method} request to LINE service: ${url}`, { body: req.body });
    
    const response = await axios(config);
    logger.info(`LINE service response: ${response.status}`, { data: response.data });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error('Error proxying to LINE service:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'LINE service unavailable',
        message: 'Unable to connect to LINE service. Please ensure it is running.'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        error: 'Request timeout',
        message: 'LINE service request timed out'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process LINE service request'
      });
    }
  }
};

// Get LINE configuration - Public access for chat functionality
router.get('/config', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/line/config');
});

// Admin-only endpoints for LINE configuration management
router.post('/config', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/line/config');
});

router.delete('/config', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/line/config');
});

router.post('/check-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    
    if (!url) {
      res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a URL to check'
      });
      return;
    }
    
    // Simple URL validation
    const urlPattern = /^https?:\/\/.+/;
    const isValid = urlPattern.test(url);
    
    logger.info(`Checking URL: ${url}, Valid: ${isValid}`);
    
    res.json({
      valid: isValid,
      url: url,
      message: isValid ? 'URL is valid' : 'URL format is invalid'
    });
  } catch (error: any) {
    logger.error('Error checking URL:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check URL'
    });
  }
});

// LINE webhook endpoint
router.post('/webhook', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/webhook');
});

// LINE users endpoints
router.get('/users', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/users');
});

router.get('/users/:userId', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, `/api/v1/users/${req.params.userId}`);
});

// LINE messages endpoints
router.get('/messages', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/messages');
});

router.post('/messages', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/messages');
});

// LINE stats endpoint
router.get('/stats', async (req: Request, res: Response) => {
  await proxyToLineService(req, res, '/api/v1/stats');
});

export default router;