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
  "name_ja": "日文公司名称",
  "code": "股票代码",
  "price": 当前价格,
  "industry": "行业",
  "technical": {
    "trend_score": "★★★★☆",
    "trend_reason": "技术分析说明",
    "support_levels": [支撑位数组],
    "resistance_levels": [阻力位数组],
    "rsi": "RSI值",
    "macd": "MACD信号"
  },
  "fundamental": {
    "pe": "市盈率",
    "peg": "PEG比率",
    "roic": "投资回报率",
    "revenue_growth": "营收增长率",
    "fcf_trend": "现金流趋势",
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
      "risk": "★★★☆☆"
    },
    "suggestion": "投资建议"
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
      
      // Add safety check for message to prevent undefined errors
      if (!message || typeof message !== 'string') {
        logger.error('Invalid message received', { message, type: typeof message });
        return res.status(400).json({
          success: false,
          message: 'Invalid message format'
        });
      }
      
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
            
            // Determine what type of analysis is requested based on the message content
            const messageContent = message.toLowerCase();
            const isRequestingTechnicalAnalysis = 
              messageContent.includes('技术分析') || 
              messageContent.includes('技术指标') ||
              messageContent.includes('移动平均') ||
              messageContent.includes('rsi') ||
              messageContent.includes('macd') ||
              messageContent.includes('布林带') ||
              messageContent.includes('波动率') ||
              messageContent.includes('支撑') ||
              messageContent.includes('阻力') ||
              messageContent.includes('趋势') ||
              messageContent.includes('分析') ||
              messageContent.includes('摘要');
            
            logger.info('Technical analysis detection', { 
              symbol, 
              messageContent, 
              isRequestingTechnicalAnalysis 
            });
            
            // Always get basic stock price
            const stockPriceResult = await mcpStockClient.getStockPrice(symbol);
            logger.info('MCP stock price result', { symbol, result: stockPriceResult });
            
            // Get fundamental data (PE ratio, ROIC, etc.)
            const fundamentalResult = await mcpStockClient.getFundamentalData(symbol);
            logger.info('MCP fundamental data result', { symbol, result: fundamentalResult });
            
            if (stockPriceResult.success && stockPriceResult.data) {
              stockDataContext += `\n\n[实时股票数据 - ${symbol}]\n`;
              stockDataContext += `当前价格: $${stockPriceResult.data}\n`;
              
              // Add fundamental data if available
              if (fundamentalResult.success && fundamentalResult.data) {
                const fundamental = fundamentalResult.data;
                stockDataContext += `\n[基本面数据]\n`;
                if (fundamental.pe_ratio) stockDataContext += `市盈率(PE): ${fundamental.pe_ratio}\n`;
                if (fundamental.pb_ratio) stockDataContext += `市净率(PB): ${fundamental.pb_ratio}\n`;
                if (fundamental.dividend_yield) stockDataContext += `股息收益率: ${(fundamental.dividend_yield * 100).toFixed(2)}%\n`;
                if (fundamental.market_cap) stockDataContext += `市值: $${(fundamental.market_cap / 1e9).toFixed(2)}B\n`;
                if (fundamental.roic) stockDataContext += `投资回报率(ROIC): ${(fundamental.roic * 100).toFixed(2)}%\n`;
                if (fundamental.roe) stockDataContext += `净资产收益率(ROE): ${(fundamental.roe * 100).toFixed(2)}%\n`;
                if (fundamental.debt_to_equity) stockDataContext += `负债权益比: ${fundamental.debt_to_equity}\n`;
                if (fundamental.current_ratio) stockDataContext += `流动比率: ${fundamental.current_ratio}\n`;
                if (fundamental.quick_ratio) stockDataContext += `速动比率: ${fundamental.quick_ratio}\n`;
                if (fundamental.gross_margin) stockDataContext += `毛利率: ${(fundamental.gross_margin * 100).toFixed(2)}%\n`;
                if (fundamental.operating_margin) stockDataContext += `营业利润率: ${(fundamental.operating_margin * 100).toFixed(2)}%\n`;
                if (fundamental.profit_margin) stockDataContext += `净利润率: ${(fundamental.profit_margin * 100).toFixed(2)}%\n`;
                stockDataContext += `数据来源: ${fundamental.data_source || 'Yahoo Finance'}\n`;
              }
              
              // If technical analysis is requested, fetch additional data
              if (isRequestingTechnicalAnalysis) {
                try {
                  // Get technical summary
                  const technicalResult = await mcpStockClient.getTechnicalSummary(symbol);
                  if (technicalResult.success && technicalResult.data) {
                    const tech = technicalResult.data;
                    stockDataContext += `\n[技术分析数据]\n`;
                    stockDataContext += `趋势: ${tech.trend || '未知'}\n`;
                    stockDataContext += `RSI: ${tech.rsi ? tech.rsi.toFixed(2) : '未知'}\n`;
                    stockDataContext += `MACD信号: ${tech.macd_signal || '未知'}\n`;
                    stockDataContext += `布林带位置: ${tech.bollinger_position || '未知'}\n`;
                    
                    if (tech.moving_averages) {
                      stockDataContext += `移动平均线:\n`;
                      if (tech.moving_averages.MA20) {
                        stockDataContext += `  MA20: $${tech.moving_averages.MA20.current?.toFixed(2) || '未知'}\n`;
                      }
                      if (tech.moving_averages.MA50) {
                        stockDataContext += `  MA50: $${tech.moving_averages.MA50.current?.toFixed(2) || '未知'}\n`;
                      }
                    }
                    
                    if (tech.price_changes) {
                      stockDataContext += `价格变化:\n`;
                      stockDataContext += `  1日: ${tech.price_changes['1d']?.toFixed(2) || '未知'}%\n`;
                      stockDataContext += `  1周: ${tech.price_changes['1w']?.toFixed(2) || '未知'}%\n`;
                      stockDataContext += `  1月: ${tech.price_changes['1m']?.toFixed(2) || '未知'}%\n`;
                    }
                  }
                  
                  // Get additional technical indicators if specifically requested
                  if (messageContent.includes('移动平均')) {
                    const maResult = await mcpStockClient.getMovingAverages(symbol);
                    if (maResult.success && maResult.data) {
                      stockDataContext += `\n[移动平均线详细数据]\n`;
                      const ma = maResult.data.moving_averages;
                      Object.keys(ma).forEach(key => {
                        stockDataContext += `${key}: $${ma[key].current?.toFixed(2) || '未知'}\n`;
                      });
                    }
                  }
                  
                  if (messageContent.includes('rsi')) {
                    const rsiResult = await mcpStockClient.getRSI(symbol);
                    if (rsiResult.success && rsiResult.data) {
                      stockDataContext += `\n[RSI详细数据]\n`;
                      stockDataContext += `当前RSI: ${rsiResult.data.current_rsi?.toFixed(2) || '未知'}\n`;
                      stockDataContext += `RSI周期: ${rsiResult.data.window}\n`;
                    }
                  }
                  
                  if (messageContent.includes('macd')) {
                    const macdResult = await mcpStockClient.getMACD(symbol);
                    if (macdResult.success && macdResult.data) {
                      stockDataContext += `\n[MACD详细数据]\n`;
                      stockDataContext += `MACD线: ${macdResult.data.current_macd?.toFixed(4) || '未知'}\n`;
                      stockDataContext += `信号线: ${macdResult.data.current_signal?.toFixed(4) || '未知'}\n`;
                      stockDataContext += `柱状图: ${macdResult.data.current_histogram?.toFixed(4) || '未知'}\n`;
                    }
                  }
                  
                } catch (techError) {
                  logger.warn('Failed to fetch technical analysis data', { symbol, error: techError });
                  stockDataContext += `\n[技术分析数据获取部分失败]\n`;
                }
              }
              
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
        // Enhanced error logging with detailed information
        const errorDetails = {
          timestamp: new Date().toISOString(),
          userId: userId,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          geminiConfig: {
            hasApiKey: !!geminiConfig.apiKey,
            model: geminiConfig.model,
            apiKeyLength: geminiConfig.apiKey ? geminiConfig.apiKey.length : 0
          },
          requestInfo: {
            messageLength: message.length,
            historyLength: history.length,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        };

        logger.error('Gemini API call failed, using fallback response', errorDetails);
        
        // Fallback response when Gemini API is not accessible
        aiResponse = `抱歉，目前无法连接到AI服务。这可能是由于网络连接问题。请稍后再试。\n\n如果您需要股票信息，建议您：\n1. 检查网络连接\n2. 稍后重试\n3. 联系技术支持\n\n感谢您的理解。`;
        
        // Enhanced console log with detailed AI service error information
        console.log('=== AI Service Connection Error - Detailed Log ===');
        console.log('Timestamp:', errorDetails.timestamp);
        console.log('User ID:', errorDetails.userId);
        console.log('Error Type:', errorDetails.errorType);
        console.log('Error Message:', errorDetails.errorMessage);
        console.log('Gemini Config Status:');
        console.log('  - Has API Key:', errorDetails.geminiConfig.hasApiKey);
        console.log('  - Model:', errorDetails.geminiConfig.model);
        console.log('  - API Key Length:', errorDetails.geminiConfig.apiKeyLength);
        console.log('Request Info:');
        console.log('  - Message Length:', errorDetails.requestInfo.messageLength);
        console.log('  - History Length:', errorDetails.requestInfo.historyLength);
        console.log('  - User Agent:', errorDetails.requestInfo.userAgent);
        console.log('  - IP Address:', errorDetails.requestInfo.ip);
        if (errorDetails.errorStack) {
          console.log('Error Stack:');
          console.log(errorDetails.errorStack);
        }
        console.log('Fallback Response:', aiResponse);
        console.log('=== End of AI Service Error Log ===');
      }
      
      logger.info('Received response from Gemini API', {
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 100)
      });

      logger.info('Chat response generated', {
        userId,
        responseLength: aiResponse.length
      });

      // Check if response contains AI service connection error message and log to console
      if (aiResponse.includes('抱歉，目前无法连接到AI服务')) {
        console.log('AI Service Connection Error Response:', {
          timestamp: new Date().toISOString(),
          userId: userId,
          message: 'Returning AI service connection error response to user',
          response: aiResponse
        });
      }

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