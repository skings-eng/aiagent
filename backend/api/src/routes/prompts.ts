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

// In-memory storage for demo purposes
// In production, this should be stored in a database
let systemPrompt = {
  id: 'system-prompt-1',
  content: `你是一个专业的股票分析AI助手，专门分析日本股市。请用中文回答用户的问题。

## 重要回复格式要求

**请务必以JSON格式输出股票分析数据，严格按照以下格式：**

\`\`\`json
{
  "name": "公司英文名称",
  "name_ja": "公司日文名称",
  "code": "股票代码",
  "price": 当前股价数值,
  "industry": "行业分类",
  "technical": {
    "trend_score": "1-5分",
    "trend_reason": "趋势分析说明",
    "support_levels": [支撑位数组],
    "resistance_levels": [阻力位数组],
    "rsi": "RSI值",
    "macd": "MACD分析"
  },
  "fundamental": {
    "pe": "市盈率",
    "peg": "PEG比率",
    "roic": "投资回报率",
    "revenue_growth": "营收增长率",
    "fcf_trend": "自由现金流趋势",
    "valuation": "估值区间"
  },
  "sentiment": {
    "institutional_holding": "机构持股比例",
    "main_capital_flow": "主力资金流向"
  },
  "risk": {
    "volatility": "波动率",
    "risk_events": ["风险事件数组"]
  },
  "summary": {
    "scores": {
      "trend": "★★★★☆",
      "valuation": "★★★☆☆",
      "risk": "★★☆☆☆"
    },
    "suggestion": "投资建议总结"
  },
  "data_source": {
    "pe": "数据来源",
    "rsi": "数据来源",
    "valuation": "数据来源"
  }
}
\`\`\`

## 功能说明

当用户询问股票相关问题时，系统会自动：
- 识别股票代码或公司名称
- 通过MCP股票工具获取最新的股票价格、涨跌幅等实时数据
- 提供专业的股票分析和投资建议

## MCP工具集成

系统集成了以下MCP股票工具：
- get_ticker_info: 获取股票基本信息和实时价格
- get_ticker_history: 获取历史价格数据
- get_ticker_financials: 获取财务报表数据
- get_ticker_earnings: 获取收益数据
- search_tickers: 搜索股票代码

## 日本股票代码格式
- 日本股票代码通常以 ".T" 结尾，例如："7203.T" (丰田汽车)
- 支持公司名称查询，系统会自动匹配对应的股票代码

请基于MCP工具获取的实时股票数据，严格按照上述JSON格式输出分析结果。`,
  lastUpdated: new Date().toISOString(),
  characterCount: 0,
};

// Update character count
systemPrompt.characterCount = systemPrompt.content.length;

/**
 * @route   GET /api/prompts/system
 * @desc    Get current system prompt
 * @access  Private
 */
router.get('/system', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('System prompt requested', {
      ip: req.ip,
    });

    // Try to load from database first
    try {
      const promptSetting = await Settings.getByKey('ai', 'system_prompt');
      if (promptSetting && promptSetting.value) {
        systemPrompt.content = promptSetting.value;
        systemPrompt.lastUpdated = promptSetting.updatedAt.toISOString();
        systemPrompt.characterCount = promptSetting.value.length;
        logger.info('System prompt loaded from database');
      } else {
        logger.warn('No system prompt found in database, using default');
      }
    } catch (dbError) {
      logger.error('Error loading system prompt from database', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
      // Continue with default prompt if database fails
    }

    res.json({
      success: true,
      data: systemPrompt,
    });
  } catch (error) {
    logger.error('Error fetching system prompt', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

/**
 * @route   POST /api/prompts/system
 * @desc    Save system prompt
 * @access  Private
 */
router.post('/system',
  [
    body('content')
      .notEmpty()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Prompt content is required and must be between 1 and 10000 characters'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      
      // Create a default ObjectId since user authentication is removed
      const userObjectId = new mongoose.Types.ObjectId();

      logger.info('Saving system prompt', {
        contentLength: content.length,
        ip: req.ip,
      });

      // Update system prompt
      systemPrompt.content = content;
      systemPrompt.lastUpdated = new Date().toISOString();
      systemPrompt.characterCount = content.length;

      // Save to Settings database
      try {
        const existingSetting = await Settings.getByKey('ai', 'system_prompt');
        if (existingSetting) {
          await existingSetting.updateValue(content, userObjectId, 'System prompt updated via prompts interface');
        } else {
          await Settings.create({
            category: 'ai',
            key: 'system_prompt',
            value: content,
            type: 'string',
            description: 'AI system prompt for chat functionality',
            isPublic: false,
            isEditable: true,
            metadata: { group: 'ai_prompts' },
            createdBy: userObjectId,
            updatedBy: userObjectId,
          });
        }
        logger.info('System prompt saved to database successfully');
      } catch (dbError) {
        logger.error('Failed to save system prompt to database', {
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        });
        // Continue execution even if database save fails
      }

      // Cache the prompt in Redis for better performance
      try {
        const redis = getRedisClient();
        await redis.setEx(
           `system_prompt:global`,
           3600, // 1 hour TTL
           JSON.stringify(systemPrompt)
         );
      } catch (redisError) {
        logger.warn('Failed to cache system prompt in Redis', {
          error: redisError instanceof Error ? redisError.message : 'Unknown error',
        });
      }

      logger.info('System prompt saved successfully', {
        characterCount: systemPrompt.characterCount,
      });

      res.json({
        success: true,
        message: 'System prompt saved successfully',
        data: systemPrompt,
      });
    } catch (error) {
      logger.error('Error saving system prompt', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * @route   GET /api/prompts/system/preview
 * @desc    Preview system prompt (returns formatted content)
 * @access  Private
 */
router.get('/system/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('System prompt preview requested', {
      ip: req.ip,
    });

    // In a real implementation, you might want to process markdown here
    // For now, we'll just return the content as-is
    const previewData = {
      content: systemPrompt.content,
      characterCount: systemPrompt.characterCount,
      lastUpdated: systemPrompt.lastUpdated,
      // You could add markdown processing here if needed
      processedContent: systemPrompt.content, // This would be the markdown-processed version
    };

    res.json({
      success: true,
      data: previewData,
    });
  } catch (error) {
    logger.error('Error generating system prompt preview', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

/**
 * @route   GET /api/prompts/system/stats
 * @desc    Get system prompt statistics
 * @access  Private
 */
router.get('/system/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('System prompt stats requested', {
      ip: req.ip,
    });

    const stats = {
      characterCount: systemPrompt.characterCount,
      wordCount: systemPrompt.content.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: systemPrompt.content.split('\n').length,
      lastUpdated: systemPrompt.lastUpdated,
      // Estimate token count (rough approximation: 1 token ≈ 4 characters for Chinese/English mix)
      estimatedTokens: Math.ceil(systemPrompt.characterCount / 4),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching system prompt stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});

export default router;