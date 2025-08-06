import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { geminiConfig } from './aiModels';
import { aiModelLimiter } from '../middleware/rateLimiter';
import { checkLinePromotionTrigger } from '../utils/linePromotion';
import Settings from '../models/Settings';
import axios from 'axios';
import { getRedisClient } from '../config/redis';
import { mcpStockClient } from '../services/mcpClient';

const router = express.Router();

// Interface definitions
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// Function to get system prompt
async function getSystemPrompt(): Promise<string> {
  try {
    // Try to get from Redis cache first
    const redis = getRedisClient();
    const cachedPrompt = await redis.get('system_prompt:global');
    if (cachedPrompt) {
      const promptData = JSON.parse(cachedPrompt);
      return promptData.content;
    }
    
    // If not in cache, try to get from database
    const promptSetting = await Settings.getByKey('ai', 'system_prompt');
    if (promptSetting && promptSetting.value) {
      return promptSetting.value;
    }
    
    // Return default system prompt if nothing found
    return `你是专业的全球股票分析AI助手，支持美国、日本、中国等各大交易所股票分析。请用中文回答。

当用户询问股票时，基于提供的实时数据进行分析，输出JSON格式结果：

\`\`\`json
{
  "name": "公司名称",
  "code": "股票代码", 
  "price": 当前价格,
  "technical": {
    "trend_score": "1-5分",
    "rsi": "RSI值",
    "trend_reason": "趋势说明"
  },
  "summary": {
    "suggestion": "投资建议",
    "risk_level": "风险等级"
  }
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

请基于MCP工具获取的实时股票数据，严格按照上述JSON格式输出分析结果。`;
  } catch (error) {
    logger.error('Failed to get system prompt', { error });
    return '你是一个专业的AI助手，请用中文回答用户的问题。';
  }
}

// Chat endpoint - No authentication required for now
// TODO: Add authentication when user system is implemented
router.post('/',
  aiModelLimiter,
  [
    body('message')
      .isString()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    body('history')
      .optional()
      .isArray({ max: 20 })
      .withMessage('History must be an array with maximum 20 messages')
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { message, history = [] }: ChatRequest = req.body;
      
      // Generate a simple user ID for LINE promotion tracking
      // In a real app, this would come from authentication
      const userId = req.ip || 'anonymous';

      logger.info('Chat request received', {
        userId,
        messageLength: message.length,
        historyLength: history.length
      });

      // Check if Gemini API key is configured
      if (!geminiConfig.apiKey) {
        logger.error('Gemini API key not configured');
        return res.status(500).json({
          success: false,
          message: 'AI service not configured'
        });
      }

      // Get system prompt
      const systemPromptContent = await getSystemPrompt();
      logger.info('System prompt loaded for chat', {
        promptLength: systemPromptContent.length,
        promptPreview: systemPromptContent.substring(0, 100) + '...'
      });
      
      // Convert chat history to Gemini format and add system prompt at the beginning
      const conversationHistory = [
        {
          role: 'user',
          parts: [{ text: systemPromptContent }]
        },
        {
          role: 'model',
          parts: [{ text: '我明白了。我是一个专业的股票分析AI助手，能够分析全球股票市场，包括美国、日本、中国等各大交易所的股票。我会使用MCP工具获取实时股票数据，并用中文回答您的问题。在分析股票时我会严格按照JSON格式输出分析数据。请问您需要什么帮助？' }]
        },
        ...history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ];

      // Check if message contains stock symbol and fetch data before sending to AI
      let enhancedMessage = message;
      
      // Support both US stocks (AAPL, TSLA, etc.) and Japanese stocks (7203.T or 2501)
      const usStockRegex = /\b[A-Z]{1,5}\b/g;
      const jpStockRegex = /\b\d{4}(\.T)?\b/g;
      
      const usStocks = message.match(usStockRegex)?.filter(symbol => 
        symbol.length >= 1 && symbol.length <= 5 && 
        !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BUT', 'HIS', 'HAS', 'HOW', 'WHO', 'OIL', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'ITS', 'DID', 'YES', 'GET', 'MAY', 'HIM', 'DAY', 'USE', 'MAN', 'SHE', 'TOO', 'ANY', 'SAY', 'SIX', 'TEN', 'TOP', 'TRY', 'WIN', 'BUY', 'PUT', 'END', 'WHY', 'LET', 'OLD', 'SEE', 'HIM', 'TWO', 'HOW', 'ITS', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HER', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'OLD', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'].includes(symbol)
      ) || [];
      const jpStocks = message.match(jpStockRegex)?.map(symbol => 
        symbol.endsWith('.T') ? symbol : symbol + '.T'
      ) || [];
      
      const allStockSymbols = [...usStocks, ...jpStocks];
      
      if (allStockSymbols.length > 0) {
        logger.info('Stock symbols detected in message', { stockSymbols: allStockSymbols });
        
        let stockDataContext = '';
        
        for (const symbol of allStockSymbols) {
          try {
            logger.info('Attempting to fetch stock data via MCP', { symbol });
            
            // Call MCP tool to get stock price
             const stockPriceResult = await mcpStockClient.getStockPrice(symbol);
             logger.info('MCP stock price result', { symbol, result: stockPriceResult });
             
             if (stockPriceResult.success && stockPriceResult.data) {
               stockDataContext += `\n\n[实时股票数据 - ${symbol}]\n`;
               stockDataContext += `当前价格: $${stockPriceResult.data}\n`;
               stockDataContext += `数据来源: MCP yfinance服务器\n`;
             } else {
               stockDataContext += `\n\n[股票数据获取失败 - ${symbol}]\n错误: ${stockPriceResult.error || '未知错误'}\n`;
             }
            
          } catch (error) {
            logger.error('Failed to fetch stock data via MCP', { symbol, error });
            stockDataContext += `\n\n[股票数据获取失败 - ${symbol}]\n错误: ${error instanceof Error ? error.message : String(error)}\n`;
          }
        }
        
        if (stockDataContext) {
          enhancedMessage += stockDataContext;
          enhancedMessage += `\n\n[系统指令：请基于上述实时股票数据进行分析。如果有多个股票代码，请为每个股票生成完整的JSON格式分析数据。必须严格按照系统提示中的JSON格式输出，包含所有必需字段。请确保JSON格式正确且完整。]`;
        }
      }

      // Initialize Google AI with current API key
      logger.info('Initializing Gemini API', {
        model: geminiConfig.model,
        conversationHistoryLength: conversationHistory.length,
        messagePreview: enhancedMessage.substring(0, 100) + '...'
      });
      
      const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
      const model = genAI.getGenerativeModel({ model: geminiConfig.model });

      // Start chat with conversation history
      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 4000,  // Increased for longer responses
          temperature: 0.7,       // Slightly higher for creativity
          topP: 0.9,             // Higher for better quality
          topK: 40,              // Increased for better generation
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT' as any,
            threshold: 'BLOCK_NONE' as any
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH' as any,
            threshold: 'BLOCK_NONE' as any
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any,
            threshold: 'BLOCK_NONE' as any
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any,
            threshold: 'BLOCK_NONE' as any
          }
        ]
      });

      // Send enhanced message and get response
      let aiResponse;
      try {
        const result = await chat.sendMessage(enhancedMessage);
        const response = await result.response;
        
        // Log the full response for debugging
        logger.info('Gemini API response details', {
          candidates: response.candidates?.length || 0,
          finishReason: response.candidates?.[0]?.finishReason,
          safetyRatings: response.candidates?.[0]?.safetyRatings
        });
        
        aiResponse = await response.text();
        
        // Check if response is empty and handle accordingly
        if (!aiResponse || aiResponse.trim().length === 0) {
          logger.warn('Gemini API returned empty response, using fallback');
          aiResponse = `您好！我是您的日本股市分析AI助手。请告诉我您想分析的股票代码或公司名称，例如 '丰田汽车' 或 '7203.T'，我将为您提供详细的分析报告。`;
        }
      } catch (error) {
        logger.error('Gemini API call failed, using fallback response', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Fallback response when Gemini API is not accessible
        aiResponse = `抱歉，目前无法连接到AI服务。这可能是由于网络连接问题。请稍后再试。\n\n如果您需要股票信息，建议您：\n1. 检查网络连接\n2. 稍后重试\n3. 联系技术支持\n\n感谢您的理解。`;
      }
      
      logger.info('Received response from Gemini API', {
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 100)
      });

      logger.info('Chat response generated', {
        userId,
        responseLength: aiResponse.length
      });

      // Check if LINE promotion should be shown
      const linePromotionResult = await checkLinePromotionTrigger(userId, message, aiResponse, history);

      return res.json({
        success: true,
        response: aiResponse,
        showLinePromo: linePromotionResult.shouldShow,
        lineConfig: linePromotionResult.shouldShow ? linePromotionResult.config : undefined
      });

    } catch (error) {
      logger.error('Chat error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
);

// Get chat history (optional feature for future) - No authentication required
router.get('/history',
  async (req: Request, res: Response) => {
    try {
      // This could be implemented to store and retrieve chat history
      // For now, return empty array
      res.json({
        success: true,
        history: []
      });
    } catch (error) {
      logger.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat history'
      });
    }
  }
);

export default router;