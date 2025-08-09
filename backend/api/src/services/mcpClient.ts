import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';

interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

class MCPStockClient {
  private pythonPath: string;
  private serverPath: string;
  private timeout: number;
  private retryCount: number;

  constructor() {
    this.pythonPath = process.env.MCP_PYTHON_PATH || '/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/bin/python';
    this.serverPath = process.env.MCP_SERVER_PATH || '/Users/sking/aiagent/backend/api/mcp-yfinance-server/simple_stock_server.py';
    this.timeout = parseInt(process.env.MCP_TIMEOUT || '30000');
    this.retryCount = parseInt(process.env.MCP_RETRY_COUNT || '3');
  }

  async getStockPrice(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_stock_price', { symbol });
  }

  async getStockHistory(symbol: string, period: string = '1mo'): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_stock_history', { symbol, period });
  }

  async compareStocks(symbol1: string, symbol2: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('compare_stocks', { symbol1, symbol2 });
  }

  async addToWatchlist(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('add_to_watchlist', { symbol });
  }

  async removeFromWatchlist(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('remove_from_watchlist', { symbol });
  }

  async getWatchlist(): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_watchlist', {});
  }

  async getWatchlistPrices(): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_watchlist_prices', {});
  }

  async getRealtimeWatchlistPrices(): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_realtime_watchlist_prices', {});
  }

  async getMovingAverages(symbol: string, period: string = '6mo', interval: string = '1d', windows: number[] = [20, 50, 200]): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_moving_averages', { symbol, period, interval, windows });
  }

  async getRSI(symbol: string, period: string = '6mo', interval: string = '1d', window: number = 14): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_rsi', { symbol, period, interval, window });
  }

  async getMACD(symbol: string, period: string = '6mo', interval: string = '1d', fast_period: number = 12, slow_period: number = 26, signal_period: number = 9): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_macd', { symbol, period, interval, fast_period, slow_period, signal_period });
  }

  async getBollingerBands(symbol: string, period: string = '6mo', interval: string = '1d', window: number = 20, num_std: number = 2): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_bollinger_bands', { symbol, period, interval, window, num_std });
  }

  async getVolatilityAnalysis(symbol: string, period: string = '1y', interval: string = '1d'): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_volatility_analysis', { symbol, period, interval });
  }

  async getSupportResistance(symbol: string, period: string = '1y', interval: string = '1d', window: number = 20): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_support_resistance', { symbol, period, interval, window });
  }

  async getTrendAnalysis(symbol: string, period: string = '1y', interval: string = '1d'): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_trend_analysis', { symbol, period, interval });
  }

  async getTechnicalSummary(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_technical_summary', { symbol });
  }

  async analyzeStock(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('analyze_stock', { ticker: symbol });
  }

  async getFundamentalData(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_fundamental_data', { symbol });
  }

  async getComprehensiveStockData(symbol: string): Promise<MCPToolResult> {
    return this.callMCPToolWithRetry('get_comprehensive_stock_data', { symbol });
  }

  async getComprehensiveAnalysis(symbol: string): Promise<MCPToolResult> {
    try {
      logger.info('开始获取综合股票分析', { symbol });
      
      // 并行获取多个数据源
      const [priceResult, historyResult] = await Promise.allSettled([
        this.getStockPrice(symbol),
        this.getStockHistory(symbol)
      ]);
      
      const analysis: any = {
        symbol,
        timestamp: new Date().toISOString(),
        dataSources: []
      };
      
      // 整合价格数据
      if (priceResult.status === 'fulfilled' && priceResult.value.success) {
        analysis.price = priceResult.value.data;
        analysis.dataSources.push('price');
      }
      
      // 整合历史数据
      if (historyResult.status === 'fulfilled' && historyResult.value.success) {
        analysis.history = historyResult.value.data;
        analysis.dataSources.push('history');
      }
      
      logger.info('综合股票分析完成', { 
        symbol, 
        dataSources: analysis.dataSources,
        hasPrice: !!analysis.price,
        hasHistory: !!analysis.history
      });
      
      return {
        success: true,
        data: analysis
      };
      
    } catch (error) {
      logger.error('综合股票分析失败', { symbol, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async callMCPToolWithRetry(toolName: string, args: any): Promise<MCPToolResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        logger.info('调用MCP工具', { toolName, args, attempt, maxAttempts: this.retryCount });
        
        const startTime = Date.now();
        const result = await this.callMCPTool(toolName, args);
        const duration = Date.now() - startTime;
        
        logger.info('MCP工具调用成功', { toolName, duration: duration + 'ms', attempt });
        
        return {
          success: true,
          data: result
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('MCP工具调用失败，准备重试', { 
          toolName, 
          attempt, 
          maxAttempts: this.retryCount,
          error: lastError.message 
        });
        
        if (attempt < this.retryCount) {
          // 指数退避重试
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    logger.error('MCP工具调用最终失败', { toolName, error: lastError?.message });
    
    return {
      success: false,
      error: lastError?.message || 'Unknown error'
    };
  }

  private async callMCPTool(toolName: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const serverDir = path.dirname(this.serverPath);
      
      // 启动MCP服务器进程
      const child = spawn(this.pythonPath, [this.serverPath], {
        cwd: serverDir,
        env: { ...process.env, PYTHONPATH: serverDir },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 构建MCP请求
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };
      
      // 发送初始化请求
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'aiagent-api',
            version: '1.0.0'
          }
        }
      };
      
      let output = '';
      let errorOutput = '';
      let initialized = false;
      
      child.stdout.on('data', (data) => {
        output += data.toString();
        
        // 处理可能的多行JSON响应
        const lines = output.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line) {
            try {
              const response = JSON.parse(line);
              
              // 处理初始化响应
              if (response.id === 1 && !initialized) {
                initialized = true;
                // 发送初始化完成通知
                const initializedNotification = {
                  jsonrpc: '2.0',
                  method: 'notifications/initialized'
                };
                child.stdin.write(JSON.stringify(initializedNotification) + '\n');
                // 发送工具调用请求
                child.stdin.write(JSON.stringify(mcpRequest) + '\n');
              }
              // 处理工具调用响应
              else if (response.id === mcpRequest.id) {
                if (response.error) {
                  reject(new Error(response.error.message || 'MCP工具调用失败'));
                } else {
                  resolve(response.result?.content?.[0]?.text || response.result);
                }
                child.kill();
                return;
              }
            } catch (parseError) {
              // 忽略解析错误，继续等待完整的JSON
            }
          }
        }
        // 保留最后一行（可能是不完整的JSON）
        output = lines[lines.length - 1];
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          logger.error('MCP工具执行失败:', errorOutput);
          reject(new Error(`MCP工具执行失败: ${errorOutput}`));
          return;
        }
        
        if (!initialized) {
          reject(new Error('MCP服务器初始化失败'));
        }
      });
      
      child.on('error', (error) => {
        logger.error('启动MCP工具进程失败:', error);
        reject(error);
      });
      
      // 发送初始化请求
      child.stdin.write(JSON.stringify(initRequest) + '\n');
      
      // 设置超时
      setTimeout(() => {
        child.kill();
        reject(new Error('MCP工具调用超时'));
      }, this.timeout);
    });
  }
}

export const mcpStockClient = new MCPStockClient();
export { MCPToolResult };
