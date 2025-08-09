#!/usr/bin/env python3
"""
标准MCP股票服务器实现
使用官方MCP Python SDK而不是FastMCP
"""

import asyncio
import json
import sys
from typing import Any, Dict, List, Optional

import yfinance as yf
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.lowlevel import NotificationOptions
import mcp.server.stdio
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    ListToolsRequest,
    TextContent,
    Tool,
)

# 创建服务器实例
server = Server("yfinance-stock-server")

# 全局关注列表
watchlist = set()


def safe_get_stock_price(symbol: str) -> float:
    """安全获取股票价格"""
    try:
        ticker = yf.Ticker(symbol.upper())
        data = ticker.history(period="1d")
        if not data.empty:
            return float(data['Close'].iloc[-1])
        
        # 尝试从info获取价格
        info = ticker.info
        price = info.get('regularMarketPrice')
        if price is not None:
            return float(price)
            
        raise ValueError("Price data not available")
    except Exception as e:
        raise ValueError(f"Error retrieving stock price for {symbol}: {str(e)}")


@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """返回可用工具列表"""
    return [
        Tool(
            name="get_stock_price",
            description="获取指定股票代码的当前价格",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "股票代码，如AAPL, TSLA等"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_stock_history",
            description="获取股票历史数据",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "股票代码"
                    },
                    "period": {
                        "type": "string",
                        "description": "时间周期，如1mo, 3mo, 1y等",
                        "default": "1mo"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="compare_stocks",
            description="比较两只股票的价格",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol1": {
                        "type": "string",
                        "description": "第一只股票代码"
                    },
                    "symbol2": {
                        "type": "string",
                        "description": "第二只股票代码"
                    }
                },
                "required": ["symbol1", "symbol2"]
            }
        ),
        Tool(
            name="add_to_watchlist",
            description="添加股票到关注列表",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "要添加的股票代码"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="remove_from_watchlist",
            description="从关注列表移除股票",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "要移除的股票代码"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_watchlist",
            description="获取当前关注列表",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_watchlist_prices",
            description="获取关注列表中所有股票的当前价格",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="get_realtime_watchlist_prices",
            description="获取关注列表的实时价格",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="analyze_stock",
            description="分析股票的1个月趋势",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticker": {
                        "type": "string",
                        "description": "股票代码"
                    }
                },
                "required": ["ticker"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
    """处理工具调用"""
    try:
        if name == "get_stock_price":
            symbol = arguments.get("symbol")
            if not symbol:
                raise ValueError("Missing required parameter: symbol")
            
            price = safe_get_stock_price(symbol)
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=str(price)
                    )
                ]
            )
            
        elif name == "get_stock_history":
            symbol = arguments.get("symbol")
            period = arguments.get("period", "1mo")
            
            if not symbol:
                raise ValueError("Missing required parameter: symbol")
            
            ticker = yf.Ticker(symbol.upper())
            data = ticker.history(period=period)
            
            if data.empty:
                raise ValueError(f"No historical data found for {symbol}")
            
            # 转换为CSV格式字符串
            csv_data = data.to_csv()
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=csv_data
                    )
                ]
            )
            
        elif name == "compare_stocks":
            symbol1 = arguments.get("symbol1")
            symbol2 = arguments.get("symbol2")
            
            if not symbol1 or not symbol2:
                raise ValueError("Missing required parameters: symbol1, symbol2")
            
            price1 = safe_get_stock_price(symbol1)
            price2 = safe_get_stock_price(symbol2)
            
            comparison = {
                "symbol1": symbol1.upper(),
                "price1": price1,
                "symbol2": symbol2.upper(),
                "price2": price2,
                "difference": price1 - price2,
                "percentage_diff": ((price1 - price2) / price2) * 100 if price2 != 0 else 0
            }
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(comparison, indent=2)
                    )
                ]
            )
            
        elif name == "add_to_watchlist":
            symbol = arguments.get("symbol")
            if not symbol:
                raise ValueError("Missing required parameter: symbol")
            
            watchlist.add(symbol.upper())
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Added {symbol.upper()} to watchlist"
                    )
                ]
            )
            
        elif name == "remove_from_watchlist":
            symbol = arguments.get("symbol")
            if not symbol:
                raise ValueError("Missing required parameter: symbol")
            
            watchlist.discard(symbol.upper())
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Removed {symbol.upper()} from watchlist"
                    )
                ]
            )
            
        elif name == "get_watchlist":
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(list(watchlist))
                    )
                ]
            )
            
        elif name == "get_watchlist_prices":
            prices = {}
            for symbol in watchlist:
                try:
                    prices[symbol] = safe_get_stock_price(symbol)
                except Exception as e:
                    prices[symbol] = f"Error: {str(e)}"
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(prices, indent=2)
                    )
                ]
            )
            
        elif name == "get_realtime_watchlist_prices":
            # 与get_watchlist_prices相同的实现
            prices = {}
            for symbol in watchlist:
                try:
                    prices[symbol] = safe_get_stock_price(symbol)
                except Exception as e:
                    prices[symbol] = f"Error: {str(e)}"
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(prices, indent=2)
                    )
                ]
            )
            
        elif name == "analyze_stock":
            ticker = arguments.get("ticker")
            if not ticker:
                raise ValueError("Missing required parameter: ticker")
            
            # 简单的1个月趋势分析
            stock = yf.Ticker(ticker.upper())
            data = stock.history(period="1mo")
            
            if data.empty:
                raise ValueError(f"No data found for {ticker}")
            
            # 计算基本统计信息
            current_price = float(data['Close'].iloc[-1])
            start_price = float(data['Close'].iloc[0])
            high_price = float(data['High'].max())
            low_price = float(data['Low'].min())
            
            change = current_price - start_price
            change_percent = (change / start_price) * 100
            
            analysis = {
                "symbol": ticker.upper(),
                "period": "1mo",
                "current_price": current_price,
                "start_price": start_price,
                "high_price": high_price,
                "low_price": low_price,
                "change": change,
                "change_percent": change_percent,
                "trend": "上涨" if change > 0 else "下跌" if change < 0 else "持平"
            }
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(analysis, indent=2, ensure_ascii=False)
                    )
                ]
            )
            
        else:
            raise ValueError(f"Unknown tool: {name}")
            
    except Exception as e:
        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=f"Error: {str(e)}"
                )
            ],
            isError=True
        )


async def main():
    """主函数"""
    # 使用stdio传输运行服务器
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="yfinance-stock-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())