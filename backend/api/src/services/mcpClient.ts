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
    this.serverPath = process.env.MCP_SERVER_PATH || '/Users/sking/aiagent/backend/api/mcp-yfinance-server/demo_stock_price_server.py';
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
      
      // 创建临时脚本来调用MCP工具
      const tempScript = `
import sys
sys.path.append('${serverDir}')
from ${path.basename(this.serverPath, '.py')} import ${toolName}
import json

try:
    args = ${JSON.stringify(args)}
    if len(args) == 0:
        result = ${toolName}()
    elif len(args) == 1:
        result = ${toolName}(list(args.values())[0])
    elif len(args) == 2:
        values = list(args.values())
        result = ${toolName}(values[0], values[1])
    else:
        result = ${toolName}(**args)
    print(json.dumps({"success": True, "result": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
      
      const child = spawn(this.pythonPath, ['-c', tempScript], {
        cwd: serverDir,
        env: { ...process.env, PYTHONPATH: serverDir }
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
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
        
        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve(result.result);
          } else {
            reject(new Error(result.error));
          }
        } catch (parseError) {
          logger.error('解析MCP工具输出失败:', parseError, '原始输出:', output);
          reject(new Error('解析MCP工具输出失败'));
        }
      });
      
      child.on('error', (error) => {
        logger.error('启动MCP工具进程失败:', error);
        reject(error);
      });
      
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
