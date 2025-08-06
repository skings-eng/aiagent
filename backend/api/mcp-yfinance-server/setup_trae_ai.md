# Trae AI IDE MCP服务集成指南

## 概述

本指南专门针对Trae AI IDE，帮助您将MCP YFinance服务器集成到Trae AI中，实现强大的股票分析功能。

## 🎯 Trae AI MCP集成步骤

### 步骤1: 确认MCP服务器状态

首先确认MCP服务器已正确部署：

```bash
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
./start_server.sh
```

### 步骤2: 在Trae AI中配置MCP服务器

#### 方法1: 通过Trae AI设置界面

1. **打开Trae AI设置**
   - 在Trae AI中按 `Cmd+,` (macOS) 打开设置
   - 或点击右上角的设置图标

2. **找到MCP服务器配置**
   - 在设置中搜索 "MCP" 或 "Model Context Protocol"
   - 找到 "MCP Servers" 或 "External Tools" 选项

3. **添加新的MCP服务器**
   - 点击 "Add Server" 或 "+" 按钮
   - 填入以下配置信息：

```json
{
  "name": "YFinance Stock Analysis",
  "description": "Yahoo Finance股票数据分析服务器",
  "command": "python",
  "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
  "cwd": "/Users/sking/aiagent/backend/api/mcp-yfinance-server",
  "env": {
    "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
  }
}
```

#### 方法2: 通过配置文件

如果Trae AI支持配置文件，通常位于：
- **macOS**: `~/.config/trae-ai/mcp_config.json`
- **Linux**: `~/.config/trae-ai/mcp_config.json`
- **Windows**: `%APPDATA%\Trae AI\mcp_config.json`

创建或编辑配置文件：

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
      "cwd": "/Users/sking/aiagent/backend/api/mcp-yfinance-server",
      "env": {
        "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
      },
      "description": "Yahoo Finance股票数据分析服务器",
      "enabled": true
    }
  }
}
```

### 步骤3: 重启Trae AI

完成配置后，重启Trae AI IDE以加载新的MCP服务器配置。

### 步骤4: 验证集成

在Trae AI中测试以下功能：

#### 基础测试
```
获取苹果公司(AAPL)的当前股价
```

#### 技术分析测试
```
分析特斯拉(TSLA)的RSI和MACD指标
```

#### 监控列表测试
```
将AAPL、TSLA、MSFT添加到股票监控列表
```

## 🛠️ 可用的MCP工具

集成成功后，您可以在Trae AI中使用以下17个专业工具：

### 📊 实时数据工具
- `get_stock_price` - 获取实时股票价格
- `get_stock_history` - 获取历史数据
- `compare_stocks` - 股票对比分析

### 📈 技术指标工具
- `get_moving_averages` - 移动平均线分析
- `get_rsi` - RSI相对强弱指标
- `get_macd` - MACD指标分析
- `get_bollinger_bands` - 布林带分析
- `get_volatility_analysis` - 波动率分析
- `get_support_resistance` - 支撑阻力位分析

### 🎯 高级分析工具
- `get_trend_analysis` - 趋势分析
- `get_technical_summary` - 技术分析总结
- `analyze_stock` - 综合股票分析

### 📋 监控管理工具
- `add_to_watchlist` - 添加到监控列表
- `remove_from_watchlist` - 从监控列表移除
- `get_watchlist` - 获取监控列表
- `get_watchlist_prices` - 获取监控列表价格
- `get_realtime_watchlist_prices` - 实时监控价格更新

## 🧪 Trae AI中的使用示例

### 1. 基础股价查询
```
请帮我查询苹果公司(AAPL)的当前股价和基本信息
```

### 2. 技术指标分析
```
分析特斯拉(TSLA)的技术指标，包括：
- RSI指标
- MACD指标
- 20日和50日移动平均线
- 布林带分析
```

### 3. 股票对比分析
```
比较苹果(AAPL)和微软(MSFT)的股票表现，包括：
- 当前价格对比
- 技术指标对比
- 趋势分析对比
```

### 4. 监控列表管理
```
请帮我：
1. 将AAPL、TSLA、MSFT添加到监控列表
2. 获取监控列表中所有股票的实时价格
3. 分析监控列表中表现最好的股票
```

### 5. 综合分析报告
```
为特斯拉(TSLA)生成一份综合技术分析报告，包括：
- 当前价格和基本信息
- 主要技术指标分析
- 支撑阻力位
- 趋势分析
- 投资建议
```

## ⚠️ 故障排除

### 常见问题及解决方案

#### 1. MCP服务器无法连接
**症状**: Trae AI显示无法连接到MCP服务器

**解决方案**:
```bash
# 检查服务器是否正常运行
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
source venv/bin/activate
python source/yf_server.py
```

#### 2. 工具调用失败
**症状**: 工具调用返回错误或超时

**解决方案**:
- 检查网络连接
- 验证股票代码格式
- 确认Yahoo Finance API可访问

#### 3. 配置不生效
**症状**: 重启后仍无法使用MCP工具

**解决方案**:
- 检查配置文件路径是否正确
- 验证JSON格式是否有效
- 确认Python环境路径正确

### 调试命令

```bash
# 测试MCP服务器直接运行
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
source venv/bin/activate
python source/yf_server.py

# 检查虚拟环境
python -c "import yfinance, mcp; print('Dependencies OK')"

# 测试股票数据获取
python -c "import yfinance as yf; print(yf.Ticker('AAPL').info['regularMarketPrice'])"
```

## 🚀 高级配置

### 自定义环境变量

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
      "env": {
        "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages",
        "YF_CACHE_DIR": "/tmp/yfinance_cache",
        "YF_TIMEOUT": "30",
        "YF_MAX_WORKERS": "4"
      }
    }
  }
}
```

### 性能优化配置

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": [
        "/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py",
        "--cache-enabled",
        "--max-concurrent=5"
      ],
      "timeout": 30,
      "retries": 3
    }
  }
}
```

## 📊 支持的股票市场

- 🇺🇸 **美国股市**: NASDAQ, NYSE (如: AAPL, TSLA, MSFT)
- 🇯🇵 **日本股市**: TSE (如: 7203.T - 丰田汽车)
- 🇭🇰 **香港股市**: HKEX (如: 0700.HK - 腾讯)
- 🇬🇧 **英国股市**: LSE (如: SHEL.L - 壳牌)
- 🇩🇪 **德国股市**: XETRA (如: SAP.DE - SAP)
- 🌍 **其他全球主要交易所**

## 🎉 成功集成确认

当您成功在Trae AI中集成MCP服务后，您应该能够：

✅ **直接查询股票数据**: "获取AAPL的当前价格"  
✅ **技术指标分析**: "分析TSLA的RSI和MACD"  
✅ **创建监控列表**: "将这些股票添加到监控列表"  
✅ **实时数据更新**: "获取监控列表的实时价格"  
✅ **综合分析报告**: "为MSFT生成技术分析报告"  

## 📞 技术支持

如果在Trae AI集成过程中遇到问题：

1. **检查Trae AI日志**: 查看IDE的错误日志和控制台输出
2. **验证MCP服务器**: 使用命令行直接测试服务器功能
3. **检查配置格式**: 确认JSON配置文件格式正确
4. **重启IDE**: 完全重启Trae AI应用程序
5. **查看文档**: 参考Trae AI官方MCP集成文档

---

**🚀 现在您可以在Trae AI中享受专业的股票分析功能了！**

通过这个集成，您可以直接在代码编辑过程中获取实时股票数据、进行技术分析，大大提升开发效率和分析能力。