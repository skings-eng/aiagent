import { logger } from './logger';

interface MCPCallMetrics {
  toolName: string;
  symbol: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class MCPMonitor {
  private metrics: MCPCallMetrics[] = [];
  private readonly maxMetrics = 1000;
  
  logCall(metrics: Omit<MCPCallMetrics, 'timestamp'>) {
    const fullMetrics: MCPCallMetrics = {
      ...metrics,
      timestamp: new Date()
    };
    
    this.metrics.push(fullMetrics);
    
    logger.info('MCP工具调用记录', {
      tool: metrics.toolName,
      symbol: metrics.symbol,
      duration: metrics.duration + 'ms',
      success: metrics.success,
      error: metrics.error
    });
    
    // 保持最近的记录
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  getSuccessRate(toolName?: string, timeWindow?: number): number {
    let filtered = this.metrics;
    
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      filtered = filtered.filter(m => m.timestamp > cutoff);
    }
    
    if (toolName) {
      filtered = filtered.filter(m => m.toolName === toolName);
    }
    
    if (filtered.length === 0) return 0;
    
    const successful = filtered.filter(m => m.success).length;
    return Math.round((successful / filtered.length) * 100 * 100) / 100;
  }
  
  getAverageDuration(toolName?: string, timeWindow?: number): number {
    let filtered = this.metrics.filter(m => m.success);
    
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      filtered = filtered.filter(m => m.timestamp > cutoff);
    }
    
    if (toolName) {
      filtered = filtered.filter(m => m.toolName === toolName);
    }
    
    if (filtered.length === 0) return 0;
    
    const totalDuration = filtered.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(totalDuration / filtered.length);
  }
  
  getStats(timeWindow?: number) {
    const oneHour = 60 * 60 * 1000;
    const window = timeWindow || oneHour;
    
    return {
      totalCalls: this.metrics.length,
      successRate: this.getSuccessRate(undefined, window),
      averageDuration: this.getAverageDuration(undefined, window),
      toolStats: this.getToolStats(window),
      recentErrors: this.getRecentErrors(10)
    };
  }
  
  private getToolStats(timeWindow: number) {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const toolStats: Record<string, any> = {};
    
    recentMetrics.forEach(metric => {
      if (!toolStats[metric.toolName]) {
        toolStats[metric.toolName] = {
          calls: 0,
          successes: 0,
          totalDuration: 0,
          errors: []
        };
      }
      
      const stats = toolStats[metric.toolName];
      stats.calls++;
      
      if (metric.success) {
        stats.successes++;
        stats.totalDuration += metric.duration;
      } else if (metric.error) {
        stats.errors.push(metric.error);
      }
    });
    
    // 计算每个工具的统计信息
    Object.keys(toolStats).forEach(toolName => {
      const stats = toolStats[toolName];
      stats.successRate = stats.calls > 0 ? Math.round((stats.successes / stats.calls) * 100 * 100) / 100 : 0;
      stats.averageDuration = stats.successes > 0 ? Math.round(stats.totalDuration / stats.successes) : 0;
      stats.errors = stats.errors.slice(-5); // 保留最近5个错误
    });
    
    return toolStats;
  }
  
  private getRecentErrors(count: number) {
    return this.metrics
      .filter(m => !m.success && m.error)
      .slice(-count)
      .map(m => ({
        toolName: m.toolName,
        symbol: m.symbol,
        error: m.error,
        timestamp: m.timestamp
      }));
  }
}

export const mcpMonitor = new MCPMonitor();
export { MCPCallMetrics };
