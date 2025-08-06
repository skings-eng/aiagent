# MCP服务添加到IDE集成指南

## 概述

本指南将帮助您将已部署的MCP YFinance服务器集成到各种IDE和AI助手中，包括Claude Desktop、Cursor、Trae AI等。

## 🎯 支持的IDE和平台

### 1. Claude Desktop (推荐)
### 2. Cursor IDE
### 3. Trae AI
### 4. 其他支持MCP的IDE

---

## 📋 前置条件

✅ **确认MCP服务器已部署**
- 服务器路径: `/Users/sking/aiagent/backend/api/mcp-yfinance-server`
- 启动脚本: `start_server.sh`
- 配置文件: `mcp_config.json`

✅ **测试服务器功能**
```bash
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
./start_server.sh
```

---

## 🔧 Claude Desktop 集成

### 步骤1: 找到配置文件

Claude Desktop的配置文件位置：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 步骤2: 创建或编辑配置文件

如果配置文件不存在，请创建它：

```bash
# macOS
mkdir -p "~/Library/Application Support/Claude"
touch "~/Library/Application Support/Claude/claude_desktop_config.json"
```

### 步骤3: 添加MCP服务器配置

将以下配置添加到 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
      "env": {
        "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
      }
    }
  }
}
```

### 步骤4: 重启Claude Desktop

完全退出并重新启动Claude Desktop应用程序。

### 步骤5: 验证集成

在Claude Desktop中测试以下命令：

```
获取苹果公司(AAPL)的当前股价
```

```
分析特斯拉(TSLA)的技术指标，包括RSI和MACD
```

---

## 🎨 Cursor IDE 集成

### 步骤1: 打开Cursor设置

1. 打开Cursor IDE
2. 按 `Cmd+,` (macOS) 或 `Ctrl+,` (Windows/Linux)
3. 搜索 "MCP" 或 "Model Context Protocol"

### 步骤2: 添加MCP服务器

在MCP设置中添加新服务器：

```json
{
  "name": "YFinance Stock Server",
  "command": "python",
  "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
  "env": {
    "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
  }
}
```

### 步骤3: 重启Cursor

重启Cursor IDE以加载新的MCP配置。

---

## 🚀 Trae AI 集成

### 步骤1: 访问MCP设置

1. 在Trae AI中打开设置面板
2. 找到 "MCP Servers" 或 "External Tools" 选项

### 步骤2: 添加服务器配置

```json
{
  "serverName": "yfinance-stock-analysis",
  "command": "python",
  "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
  "workingDirectory": "/Users/sking/aiagent/backend/api/mcp-yfinance-server",
  "environment": {
    "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
  }
}
```

---

## 🛠️ 通用MCP客户端集成

### 使用MCP CLI工具测试

```bash
# 安装MCP CLI
pip install mcp

# 测试服务器连接
mcp dev /Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py
```

### 自定义客户端集成

如果您使用自定义的MCP客户端，可以使用以下Python代码：

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def connect_to_yfinance_server():
    server_params = StdioServerParameters(
        command="python",
        args=["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"],
        env={
            "PYTHONPATH": "/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.13/site-packages"
        }
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # 获取可用工具
            tools = await session.list_tools()
            print("可用工具:", [tool.name for tool in tools.tools])
            
            # 调用工具
            result = await session.call_tool("get_stock_price", {"symbol": "AAPL"})
            print("苹果股价:", result.content)

# 运行
asyncio.run(connect_to_yfinance_server())
```

---

## 🔍 可用的MCP工具

集成成功后，您将可以使用以下17个专业股票分析工具：

### 📊 基础数据工具
- `get_stock_price` - 获取实时股票价格
- `get_stock_history` - 获取历史数据
- `compare_stocks` - 股票对比分析

### 📈 技术指标工具
- `get_moving_averages` - 移动平均线
- `get_rsi` - RSI相对强弱指标
- `get_macd` - MACD指标
- `get_bollinger_bands` - 布林带
- `get_volatility_analysis` - 波动率分析
- `get_support_resistance` - 支撑阻力位

### 🎯 分析工具
- `get_trend_analysis` - 趋势分析
- `get_technical_summary` - 技术分析总结
- `analyze_stock` - 综合股票分析

### 📋 监控工具
- `add_to_watchlist` - 添加到监控列表
- `remove_from_watchlist` - 从监控列表移除
- `get_watchlist` - 获取监控列表
- `get_watchlist_prices` - 获取监控列表价格
- `get_realtime_watchlist_prices` - 实时监控价格

---

## 🧪 测试示例

### 基础测试
```
获取苹果公司(AAPL)的当前股价和基本信息
```

### 技术分析测试
```
分析特斯拉(TSLA)的技术指标，包括RSI、MACD和移动平均线
```

### 对比分析测试
```
比较苹果(AAPL)和微软(MSFT)的股票表现
```

### 监控列表测试
```
将AAPL、TSLA、MSFT添加到我的股票监控列表，并获取实时价格
```

---

## ⚠️ 故障排除

### 常见问题

**1. 服务器无法启动**
```bash
# 检查虚拟环境
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
source venv/bin/activate
python -c "import yfinance, mcp"
```

**2. 工具调用失败**
- 确认网络连接正常
- 检查股票代码格式是否正确
- 验证Yahoo Finance API可访问性

**3. IDE无法识别MCP服务器**
- 检查配置文件路径是否正确
- 确认JSON格式无误
- 重启IDE应用程序

### 调试命令

```bash
# 测试服务器直接运行
cd /Users/sking/aiagent/backend/api/mcp-yfinance-server
source venv/bin/activate
python source/yf_server.py

# 使用MCP开发工具
mcp dev source/yf_server.py
```

---

## 📚 进阶配置

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
        "YF_TIMEOUT": "30"
      }
    }
  }
}
```

### 多服务器配置

```json
{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": ["/Users/sking/aiagent/backend/api/mcp-yfinance-server/source/yf_server.py"]
    },
    "other-mcp-server": {
      "command": "node",
      "args": ["/path/to/other/server.js"]
    }
  }
}
```

---

## 🎉 成功集成确认

当您成功集成MCP服务后，您应该能够：

✅ 在IDE中直接询问股票价格  
✅ 请求技术指标分析  
✅ 创建和管理股票监控列表  
✅ 获取实时股票数据  
✅ 进行股票对比分析  

---

## 📞 支持和帮助

如果在集成过程中遇到问题：

1. **检查日志**: 查看IDE的错误日志
2. **验证配置**: 确认JSON配置格式正确
3. **测试服务器**: 使用命令行直接测试MCP服务器
4. **重启应用**: 完全重启IDE应用程序

---

**🚀 现在您可以在IDE中享受强大的股票分析功能了！**