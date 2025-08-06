# Trae AI MCP YFinance服务器快速配置指南

## 🚀 一键自动配置

运行自动配置脚本（推荐）：

```bash
./setup_trae_ai.sh
```

## 📋 手动配置步骤

如果自动配置失败，请按以下步骤手动配置：

### 1. 找到Trae AI配置目录

**macOS:**
```bash
~/Library/Application Support/Trae AI/
# 或
~/.config/trae-ai/
```

**Linux:**
```bash
~/.config/trae-ai/
```

**Windows:**
```bash
%APPDATA%/Trae AI/
```

### 2. 创建或编辑MCP配置文件

在配置目录中创建或编辑 `mcp_config.json` 文件：

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "name": "YFinance Stock Analysis",
      "description": "Yahoo Finance股票数据分析服务器，提供实时股价、技术指标分析等功能",
      "command": "python",
      "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
      "cwd": "/Users/sking/aiagent/backend/api/mcp-yfinance-server",
      "env": {
        "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
      },
      "enabled": true,
      "timeout": 30,
      "retries": 3
    }
  }
}
```

> ⚠️ **重要**: 请将上述路径替换为您的实际项目路径

### 3. 重启Trae AI

完全关闭并重新启动Trae AI IDE。

### 4. 验证配置

在Trae AI中输入以下测试命令：

```
获取苹果公司(AAPL)的当前股价
```

## 🛠️ 可用的MCP工具

配置成功后，您可以使用以下17个专业工具：

### 📊 基础数据
- **get_stock_price** - 获取实时股价和基本信息
- **get_stock_info** - 获取详细股票信息
- **get_historical_data** - 获取历史价格数据

### 📈 技术分析
- **get_technical_summary** - 技术分析总结
- **get_rsi** - RSI相对强弱指标
- **get_macd** - MACD指标
- **get_bollinger_bands** - 布林带指标
- **get_moving_averages** - 移动平均线
- **get_support_resistance** - 支撑阻力位

### 📊 高级分析
- **get_volatility** - 波动率分析
- **get_trend_analysis** - 趋势分析
- **get_volume_analysis** - 成交量分析
- **calculate_correlation** - 股票相关性分析

### 📋 监控管理
- **add_to_watchlist** - 添加到监控列表
- **remove_from_watchlist** - 从监控列表移除
- **get_watchlist** - 获取监控列表
- **get_watchlist_summary** - 监控列表摘要

## 💬 使用示例

### 基础查询
```
获取特斯拉(TSLA)的当前股价和基本信息
```

### 技术分析
```
分析苹果公司(AAPL)的技术指标，包括RSI、MACD和移动平均线
```

### 股票对比
```
计算苹果(AAPL)和微软(MSFT)的相关性
```

### 监控列表
```
将AAPL、TSLA、MSFT添加到我的股票监控列表
```

### 趋势分析
```
分析谷歌(GOOGL)最近30天的价格趋势和波动率
```

## 🌍 支持的股票市场

- **美国股市**: AAPL, TSLA, MSFT, GOOGL, AMZN, META等
- **日本股市**: 7203.T (丰田), 6758.T (索尼), 9984.T (软银)等
- **香港股市**: 0700.HK (腾讯), 0941.HK (中国移动), 1299.HK (友邦保险)等
- **欧洲股市**: ASML.AS (阿斯麦), SAP.DE (SAP)等
- **其他市场**: 全球主要交易所的股票代码

## 🔧 故障排除

### 问题1: MCP服务器无法启动
**解决方案:**
1. 检查Python虚拟环境是否激活
2. 确认所有依赖已安装: `pip install -r requirements.txt`
3. 验证路径配置是否正确

### 问题2: 工具无法调用
**解决方案:**
1. 重启Trae AI IDE
2. 检查MCP配置文件格式是否正确
3. 查看Trae AI的MCP设置页面

### 问题3: 股票数据获取失败
**解决方案:**
1. 检查网络连接
2. 确认股票代码格式正确
3. 验证Yahoo Finance API可访问性

### 问题4: 配置文件位置不确定
**解决方案:**
运行以下命令查找配置目录：
```bash
find ~ -name "*trae*" -type d 2>/dev/null
```

## 📞 获取帮助

如果遇到问题：

1. 查看详细文档: `setup_trae_ai.md`
2. 检查服务器日志
3. 验证Trae AI的MCP设置
4. 确认所有依赖已正确安装

## 🎯 下一步

配置完成后，您可以：

1. 探索所有17个可用工具
2. 创建自定义股票分析工作流
3. 集成到您的投资决策流程
4. 设置定期监控和报告

---

**配置完成后，重启Trae AI并开始您的股票分析之旅！** 🚀📈