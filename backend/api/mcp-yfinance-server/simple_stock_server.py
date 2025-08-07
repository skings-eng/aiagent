#!/usr/bin/env python3
"""
简单的股票数据服务器，提供可直接导入的函数
兼容现有的MCP客户端调用方式
"""

from mcp.server.fastmcp import FastMCP
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta

# 创建MCP实例
mcp = FastMCP("Stock Analysis Server")

# 全局变量存储关注列表
watchlist = set()

@mcp.tool()
def get_stock_price(symbol: str) -> float:
    """获取股票当前价格"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        return float(data['Close'].iloc[-1])
    except Exception as e:
        raise Exception(f"Error getting stock price for {symbol}: {str(e)}")

@mcp.tool()
def get_stock_history(symbol: str, period: str = "1mo") -> str:
    """获取股票历史数据，返回CSV格式字符串"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        return data.to_csv()
    except Exception as e:
        raise Exception(f"Error getting stock history for {symbol}: {str(e)}")

@mcp.tool()
def compare_stocks(symbol1: str, symbol2: str) -> Dict[str, Any]:
    """比较两只股票的价格"""
    try:
        price1 = get_stock_price(symbol1)
        price2 = get_stock_price(symbol2)
        
        return {
            symbol1: price1,
            symbol2: price2,
            "difference": price1 - price2,
            "percentage_difference": ((price1 - price2) / price2) * 100 if price2 != 0 else 0
        }
    except Exception as e:
        raise Exception(f"Error comparing stocks {symbol1} and {symbol2}: {str(e)}")

@mcp.tool()
def add_to_watchlist(symbol: str) -> Dict[str, Any]:
    """添加股票到关注列表"""
    global watchlist
    watchlist.add(symbol.upper())
    return {"message": f"Added {symbol} to watchlist", "watchlist": list(watchlist)}

@mcp.tool()
def remove_from_watchlist(symbol: str) -> Dict[str, Any]:
    """从关注列表移除股票"""
    global watchlist
    watchlist.discard(symbol.upper())
    return {"message": f"Removed {symbol} from watchlist", "watchlist": list(watchlist)}

@mcp.tool()
def get_watchlist() -> List[str]:
    """获取关注列表"""
    global watchlist
    return list(watchlist)

@mcp.tool()
def get_watchlist_prices() -> Dict[str, float]:
    """获取关注列表中所有股票的价格"""
    global watchlist
    prices = {}
    for symbol in watchlist:
        try:
            prices[symbol] = get_stock_price(symbol)
        except Exception as e:
            prices[symbol] = f"Error: {str(e)}"
    return prices

@mcp.tool()
def get_realtime_watchlist_prices() -> Dict[str, float]:
    """获取关注列表实时价格（与get_watchlist_prices相同）"""
    return get_watchlist_prices()

@mcp.tool()
def get_moving_averages(symbol: str, period: str = "6mo", interval: str = "1d", windows: List[int] = None) -> Dict[str, Any]:
    """计算移动平均线"""
    if windows is None:
        windows = [20, 50, 200]
    
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 强制转换为整数时间戳
        dates = []
        for ts in data.index[-10:]:
            # 确保返回整数时间戳
            timestamp = int(ts.timestamp())
            dates.append(timestamp)
        
        result = {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "moving_averages": {},
            "current_price": float(data['Close'].iloc[-1]),
            "dates": dates  # 最近10个日期的时间戳
        }
        
        for window in windows:
            if len(data) >= window:
                ma = data['Close'].rolling(window=window).mean()
                result["moving_averages"][f"MA{window}"] = {
                    "current": float(ma.iloc[-1]) if not pd.isna(ma.iloc[-1]) else None,
                    "values": ma.dropna().tail(10).tolist()  # 最近10个值
                }
        
        return result
    except Exception as e:
        raise Exception(f"Error calculating moving averages for {symbol}: {str(e)}")

@mcp.tool()
def get_rsi(symbol: str, period: str = "6mo", interval: str = "1d", window: int = 14) -> Dict[str, Any]:
    """计算RSI指标"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 计算RSI
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "window": window,
            "current_rsi": float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else None,
            "rsi_values": rsi.dropna().tail(10).tolist(),
            "dates": [int(ts.timestamp()) if hasattr(ts, 'timestamp') else 0 for ts in data.index[-10:]]
        }
    except Exception as e:
        raise Exception(f"Error calculating RSI for {symbol}: {str(e)}")

@mcp.tool()
def get_macd(symbol: str, period: str = "6mo", interval: str = "1d", fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Dict[str, Any]:
    """计算MACD指标"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 计算MACD
        ema_fast = data['Close'].ewm(span=fast_period).mean()
        ema_slow = data['Close'].ewm(span=slow_period).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period).mean()
        histogram = macd_line - signal_line
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "fast_period": fast_period,
            "slow_period": slow_period,
            "signal_period": signal_period,
            "current_macd": float(macd_line.iloc[-1]) if not pd.isna(macd_line.iloc[-1]) else None,
            "current_signal": float(signal_line.iloc[-1]) if not pd.isna(signal_line.iloc[-1]) else None,
            "current_histogram": float(histogram.iloc[-1]) if not pd.isna(histogram.iloc[-1]) else None,
            "macd_values": macd_line.dropna().tail(10).tolist(),
            "signal_values": signal_line.dropna().tail(10).tolist(),
            "histogram_values": histogram.dropna().tail(10).tolist(),
            "dates": [int(ts.timestamp()) if hasattr(ts, 'timestamp') else 0 for ts in data.index[-10:]]
        }
    except Exception as e:
        raise Exception(f"Error calculating MACD for {symbol}: {str(e)}")

@mcp.tool()
def get_bollinger_bands(symbol: str, period: str = "6mo", interval: str = "1d", window: int = 20, num_std: float = 2) -> Dict[str, Any]:
    """计算布林带"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 计算布林带
        sma = data['Close'].rolling(window=window).mean()
        std = data['Close'].rolling(window=window).std()
        upper_band = sma + (std * num_std)
        lower_band = sma - (std * num_std)
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "window": window,
            "num_std": num_std,
            "current_price": float(data['Close'].iloc[-1]),
            "current_sma": float(sma.iloc[-1]) if not pd.isna(sma.iloc[-1]) else None,
            "current_upper": float(upper_band.iloc[-1]) if not pd.isna(upper_band.iloc[-1]) else None,
            "current_lower": float(lower_band.iloc[-1]) if not pd.isna(lower_band.iloc[-1]) else None,
            "sma_values": sma.dropna().tail(10).tolist(),
            "upper_values": upper_band.dropna().tail(10).tolist(),
            "lower_values": lower_band.dropna().tail(10).tolist(),
            "dates": [int(ts.timestamp()) if hasattr(ts, 'timestamp') else 0 for ts in data.index[-10:]]
        }
    except Exception as e:
        raise Exception(f"Error calculating Bollinger Bands for {symbol}: {str(e)}")

@mcp.tool()
def get_volatility_analysis(symbol: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
    """计算波动率分析"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 计算日收益率
        returns = data['Close'].pct_change().dropna()
        
        # 计算各种波动率指标
        daily_volatility = returns.std()
        annualized_volatility = daily_volatility * np.sqrt(252)  # 假设252个交易日
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "daily_volatility": float(daily_volatility),
            "annualized_volatility": float(annualized_volatility),
            "max_return": float(returns.max()),
            "min_return": float(returns.min()),
            "mean_return": float(returns.mean()),
            "recent_returns": returns.tail(10).tolist(),
            "dates": [int(ts.timestamp()) if hasattr(ts, 'timestamp') else 0 for ts in data.index[-10:]]
        }
    except Exception as e:
        raise Exception(f"Error calculating volatility analysis for {symbol}: {str(e)}")

@mcp.tool()
def get_support_resistance(symbol: str, period: str = "1y", interval: str = "1d", window: int = 20) -> Dict[str, Any]:
    """计算支撑和阻力位"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 简单的支撑阻力计算（基于局部最高点和最低点）
        highs = data['High'].rolling(window=window, center=True).max()
        lows = data['Low'].rolling(window=window, center=True).min()
        
        # 找到最近的支撑和阻力位
        recent_high = data['High'].tail(window).max()
        recent_low = data['Low'].tail(window).min()
        current_price = data['Close'].iloc[-1]
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "window": window,
            "current_price": float(current_price),
            "resistance_level": float(recent_high),
            "support_level": float(recent_low),
            "distance_to_resistance": float((recent_high - current_price) / current_price * 100),
            "distance_to_support": float((current_price - recent_low) / current_price * 100),
            "dates": [int(ts.timestamp()) if hasattr(ts, 'timestamp') else 0 for ts in data.index[-10:]]
        }
    except Exception as e:
        raise Exception(f"Error calculating support/resistance for {symbol}: {str(e)}")

@mcp.tool()
def get_trend_analysis(symbol: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
    """趋势分析"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        # 计算短期和长期移动平均线
        ma_short = data['Close'].rolling(window=20).mean()
        ma_long = data['Close'].rolling(window=50).mean()
        
        # 确定趋势方向
        current_price = data['Close'].iloc[-1]
        current_ma_short = ma_short.iloc[-1]
        current_ma_long = ma_long.iloc[-1]
        
        if current_price > current_ma_short > current_ma_long:
            trend = "上升趋势"
        elif current_price < current_ma_short < current_ma_long:
            trend = "下降趋势"
        else:
            trend = "横盘整理"
        
        # 计算价格变化
        try:
            price_change_1d = float((data['Close'].iloc[-1] - data['Close'].iloc[-2]) / data['Close'].iloc[-2] * 100) if len(data) >= 2 else 0.0
        except:
            price_change_1d = 0.0
            
        try:
            price_change_1w = float((data['Close'].iloc[-1] - data['Close'].iloc[-5]) / data['Close'].iloc[-5] * 100) if len(data) >= 5 else 0.0
        except:
            price_change_1w = 0.0
            
        try:
            price_change_1m = float((data['Close'].iloc[-1] - data['Close'].iloc[-20]) / data['Close'].iloc[-20] * 100) if len(data) >= 20 else 0.0
        except:
            price_change_1m = 0.0
        
        # 安全地转换时间戳
        try:
            dates = []
            for ts in data.index[-10:]:
                try:
                    dates.append(int(ts.timestamp()))
                except:
                    dates.append(0)
        except:
            dates = []
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "current_price": float(current_price),
            "trend_direction": trend,
            "ma_20": float(current_ma_short) if not pd.isna(current_ma_short) else None,
            "ma_50": float(current_ma_long) if not pd.isna(current_ma_long) else None,
            "price_change_1d": price_change_1d,
            "price_change_1w": price_change_1w,
            "price_change_1m": price_change_1m,
            "dates": dates
        }
    except Exception as e:
        raise Exception(f"Error calculating trend analysis for {symbol}: {str(e)}")

@mcp.tool()
def get_technical_summary(symbol: str) -> Dict[str, Any]:
    """获取技术分析摘要"""
    try:
        # 获取各种技术指标
        ma_data = get_moving_averages(symbol)
        rsi_data = get_rsi(symbol)
        macd_data = get_macd(symbol)
        bb_data = get_bollinger_bands(symbol)
        try:
            trend_data = get_trend_analysis(symbol)
            trend = trend_data.get("trend_direction", "未知趋势")
        except Exception as e:
            trend = "未知趋势"
        
        # 生成技术分析摘要
        summary = {
            "symbol": symbol,
            "current_price": ma_data["current_price"],
            "trend": trend_data["trend_direction"],
            "rsi": rsi_data["current_rsi"],
            "macd_signal": "买入" if macd_data["current_macd"] > macd_data["current_signal"] else "卖出",
            "bollinger_position": "上轨附近" if ma_data["current_price"] > bb_data["current_upper"] else "下轨附近" if ma_data["current_price"] < bb_data["current_lower"] else "中轨附近",
            "moving_averages": ma_data["moving_averages"],
            "price_changes": {
                "1d": trend_data["price_change_1d"],
                "1w": trend_data["price_change_1w"],
                "1m": trend_data["price_change_1m"]
            }
        }
        
        return summary
    except Exception as e:
        raise Exception(f"Error generating technical summary for {symbol}: {str(e)}")

@mcp.tool()
def get_fundamental_data(symbol: str) -> Dict[str, Any]:
    """获取股票基本面数据，包括市盈率、投资回报率等"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # 获取基本面数据
        fundamental_data = {
            "symbol": symbol,
            "pe_ratio": info.get('trailingPE', None),  # 市盈率
            "forward_pe": info.get('forwardPE', None),  # 预期市盈率
            "peg_ratio": info.get('pegRatio', None),  # PEG比率
            "price_to_book": info.get('priceToBook', None),  # 市净率
            "return_on_equity": info.get('returnOnEquity', None),  # 净资产收益率(ROE)
            "return_on_assets": info.get('returnOnAssets', None),  # 资产收益率(ROA)
            "profit_margin": info.get('profitMargins', None),  # 利润率
            "operating_margin": info.get('operatingMargins', None),  # 营业利润率
            "debt_to_equity": info.get('debtToEquity', None),  # 负债权益比
            "current_ratio": info.get('currentRatio', None),  # 流动比率
            "quick_ratio": info.get('quickRatio', None),  # 速动比率
            "dividend_yield": info.get('dividendYield', None),  # 股息收益率
            "market_cap": info.get('marketCap', None),  # 市值
            "enterprise_value": info.get('enterpriseValue', None),  # 企业价值
            "revenue_growth": info.get('revenueGrowth', None),  # 营收增长率
            "earnings_growth": info.get('earningsGrowth', None),  # 盈利增长率
            "book_value": info.get('bookValue', None),  # 每股净资产
            "earnings_per_share": info.get('trailingEps', None),  # 每股收益
            "revenue_per_share": info.get('revenuePerShare', None),  # 每股营收
        }
        
        # 计算投资回报率(ROIC) - 如果数据可用
        if info.get('returnOnEquity') and info.get('debtToEquity'):
            try:
                roe = info.get('returnOnEquity', 0)
                debt_to_equity = info.get('debtToEquity', 0)
                # 简化的ROIC计算
                roic = roe / (1 + debt_to_equity) if debt_to_equity > 0 else roe
                fundamental_data['return_on_invested_capital'] = roic
            except:
                fundamental_data['return_on_invested_capital'] = None
        else:
            fundamental_data['return_on_invested_capital'] = None
            
        return fundamental_data
        
    except Exception as e:
        raise Exception(f"Error getting fundamental data for {symbol}: {str(e)}")

@mcp.tool()
def analyze_stock(ticker: str) -> Dict[str, Any]:
    """1个月趋势分析"""
    try:
        return get_trend_analysis(ticker, period="1mo")
    except Exception as e:
        raise Exception(f"Error analyzing stock {ticker}: {str(e)}")

@mcp.tool()
def get_comprehensive_stock_data(symbol: str) -> Dict[str, Any]:
    """获取股票的综合数据，包括技术分析和基本面数据"""
    try:
        # 获取基本面数据
        fundamental = get_fundamental_data(symbol)
        
        # 获取技术分析数据
        technical = get_technical_summary(symbol)
        
        # 获取当前价格
        current_price = get_stock_price(symbol)
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "fundamental": fundamental,
            "technical": technical,
            "timestamp": datetime.now().isoformat(),
            "data_source": {
                "pe": "Yahoo Finance",
                "rsi": "Yahoo Finance", 
                "valuation": "Yahoo Finance"
            }
        }
        
    except Exception as e:
        raise Exception(f"Error getting comprehensive stock data for {symbol}: {str(e)}")

if __name__ == "__main__":
    # 启动MCP服务器
    mcp.run()