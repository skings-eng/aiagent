#!/usr/bin/env python3
"""
测试MCP YFinance服务器的功能
"""

import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_mcp_server():
    """测试MCP服务器的基本功能"""
    try:
        # 连接到MCP服务器
        server_params = StdioServerParameters(
            command="python",
            args=["source/yf_server.py"]
        )
        
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # 初始化
                await session.initialize()
                
                # 获取可用工具列表
                tools = await session.list_tools()
                print("可用工具:")
                for tool in tools.tools:
                    print(f"  - {tool.name}: {tool.description}")
                
                # 测试获取股票价格
                print("\n测试获取苹果股票价格...")
                result = await session.call_tool(
                    "get_stock_price",
                    {"symbol": "AAPL"}
                )
                print(f"苹果股票价格: {result.content}")
                
                # 测试获取技术指标
                print("\n测试获取RSI指标...")
                rsi_result = await session.call_tool(
                    "get_rsi",
                    {"symbol": "AAPL", "period": "1mo"}
                )
                print(f"RSI指标: {rsi_result.content}")
                
    except Exception as e:
        print(f"测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcp_server())