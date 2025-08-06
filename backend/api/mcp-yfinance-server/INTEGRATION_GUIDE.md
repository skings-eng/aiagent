# MCP YFinance服务器集成指南

## 概述

本项目已成功部署了基于Yahoo Finance的MCP服务器，为股票分析系统提供强大的数据支撑。该服务器提供17个专业的股票分析工具，包括实时价格获取、技术指标分析、趋势分析等功能。

## 功能特性

### 🔥 核心功能
- ✅ **实时股票价格获取** - 支持全球股票市场
- 📈 **技术指标分析** - RSI, MACD, 移动平均线, 布林带等
- 📊 **波动率分析** - ATR指标和历史波动率
- 🔍 **趋势分析** - 价格趋势和模式识别
- 📋 **股票监控列表** - 实时价格监控
- 📉 **支撑阻力位** - 关键价格水平检测
- 🎯 **技术分析总结** - 综合技术信号

### 🛠️ 可用工具列表

1. `get_stock_price` - 获取实时股票价格
2. `get_moving_averages` - 计算移动平均线
3. `get_rsi` - 计算RSI相对强弱指标
4. `get_macd` - 计算MACD指标
5. `get_bollinger_bands` - 计算布林带
6. `get_volatility_analysis` - 波动率分析
7. `get_support_resistance` - 支撑阻力位分析
8. `get_trend_analysis` - 趋势分析
9. `get_technical_summary` - 技术分析总结
10. `get_stock_history` - 获取历史数据
11. `compare_stocks` - 股票对比分析
12. `add_to_watchlist` - 添加到监控列表
13. `remove_from_watchlist` - 从监控列表移除
14. `get_watchlist` - 获取监控列表
15. `get_watchlist_prices` - 获取监控列表价格
16. `get_realtime_watchlist_prices` - 实时监控价格
17. `analyze_stock` - 综合股票分析

## 部署状态

✅ **已完成的部署步骤:**

1. **项目克隆** - 从GitHub成功克隆mcp-yfinance-server项目
2. **环境配置** - 创建Python 3.13虚拟环境
3. **依赖安装** - 安装所有必需的Python包
4. **类型修复** - 修复pydantic类型注解问题
5. **功能测试** - 验证所有核心功能正常工作
6. **配置文件** - 创建MCP服务器配置
7. **启动脚本** - 创建便捷的启动脚本

## 测试结果

✅ **功能验证通过:**

- 苹果股票(AAPL)价格获取: **成功**
- 丰田汽车(7203.T)价格获取: **成功**
- 移动平均线计算: **成功**
- RSI指标计算: **成功** (当前值: 36.31)
- 技术分析总结: **成功**

## 使用方法

### 1. 启动MCP服务器

```bash
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
./start_server.sh
```

### 2. 在代码中使用

```python
# 直接导入使用
from yf_server import get_stock_price, get_technical_summary

# 获取股票价格
price = get_stock_price("AAPL")
print(f"苹果股价: ${price:.2f}")

# 获取技术分析
summary = get_technical_summary("7203.T")
print(f"技术信号: {summary['overall_signal']}")
```

### 3. MCP客户端集成

使用配置文件 `mcp_config.json` 将服务器集成到MCP客户端中。

## 集成到现有系统

### 与当前股票分析系统集成

1. **替换数据源**: 可以将现有的股票数据获取逻辑替换为MCP服务器调用
2. **增强分析能力**: 利用17个专业工具提供更深入的技术分析
3. **实时监控**: 使用watchlist功能实现股票实时监控
4. **API代理**: 通过现有的API路由代理MCP服务器功能

### 建议的集成方案

1. **数据层集成**: 在backend/api中创建MCP客户端包装器
2. **API路由扩展**: 添加新的API端点调用MCP工具
3. **前端功能增强**: 在前端添加技术指标图表和分析面板
4. **缓存优化**: 实现数据缓存减少API调用频率

## 技术规格

- **Python版本**: 3.13.5
- **核心依赖**: yfinance, mcp, pandas, numpy
- **部署路径**: `/Users/sking/aiagent/backend/api/mcp-yfinance-server`
- **虚拟环境**: 已配置并激活
- **启动方式**: 通过start_server.sh脚本

## 下一步建议

1. **集成到主系统**: 将MCP服务器集成到现有的股票分析API中
2. **前端界面**: 开发技术指标可视化界面
3. **数据缓存**: 实现Redis缓存提高性能
4. **监控告警**: 基于技术指标设置价格告警
5. **扩展功能**: 添加更多金融数据源和分析工具

## 支持的股票市场

- 🇺🇸 美国股市 (NASDAQ, NYSE)
- 🇯🇵 日本股市 (TSE) - 如7203.T (丰田汽车)
- 🌍 全球主要股票交易所

---

**状态**: ✅ 部署完成，功能验证通过，可投入使用
**维护**: 定期更新依赖包，监控服务器运行状态