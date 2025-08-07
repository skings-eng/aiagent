import yfinance as yf
from mcp.server.fastmcp import FastMCP
import threading
import time
from typing import Dict, List, Union, Optional, Tuple, Any

# Initialize MCP server
mcp = FastMCP("Stock Price Server")

# Global variables for watchlist
watchlist = set()
watchlist_prices = {}

def fetch_ticker(symbol: str):
    """Fetch ticker object safely"""
    return yf.Ticker(symbol)

def safe_get_price(ticker) -> float:
    """Safely get current price from ticker"""
    try:
        # Try different methods to get current price
        info = ticker.info
        if 'currentPrice' in info and info['currentPrice']:
            return float(info['currentPrice'])
        elif 'regularMarketPrice' in info and info['regularMarketPrice']:
            return float(info['regularMarketPrice'])
        elif 'previousClose' in info and info['previousClose']:
            return float(info['previousClose'])
        else:
            # Fallback to history
            hist = ticker.history(period="1d")
            if not hist.empty:
                return float(hist['Close'].iloc[-1])
            return 0.0
    except Exception as e:
        print(f"Error getting price for {ticker}: {e}")
        return 0.0

@mcp.tool()
def get_stock_price(symbol: str) -> float:
    """
    Retrieve the current stock price for the given ticker symbol.
    Returns the latest closing price as a float.
    """
    try:
        ticker = fetch_ticker(symbol)
        return safe_get_price(ticker)
    except Exception as e:
        return 0.0

@mcp.tool()
def analyze_stock(ticker: str) -> dict:
    """
    Perform 1-month trend analysis for any stock ticker.

    Parameters:
        ticker (str): Stock ticker symbol (e.g., 'AAPL', 'TSLA')
    """
    try:
        # Download stock data
        stock = yf.Ticker(ticker)
        df = stock.history(period="1mo")
        
        if df.empty:
            return {"error": f"No data found for ticker: {ticker}"}

        # Convert to basic Python types immediately
        close_prices = df['Close'].tolist()
        dates = [d.strftime('%Y-%m-%d') for d in df.index]
        
        # Get basic info using list operations
        latest_close = close_prices[-1]
        first_close = close_prices[0]
        price_change = ((latest_close - first_close) / first_close) * 100
        
        # Simple moving average calculation
        ma_20 = None
        if len(close_prices) >= 20:
            ma_20 = sum(close_prices[-20:]) / 20

        # Return summary as dictionary
        return {
            "ticker": ticker.upper(),
            "period": "1 Month",
            "latest_close": round(latest_close, 2),
            "price_change_percent": round(price_change, 2),
            "ma_20": round(ma_20, 2) if ma_20 is not None else None,
            "analysis_date": dates[-1],
            "data_points": len(close_prices)
        }
    except Exception as e:
        return {"error": f"Error analyzing {ticker}: {str(e)}"}

@mcp.tool()
def get_stock_history(symbol: str, period: str = "1mo") -> str:
    """
    Retrieve historical stock data in CSV format.
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)
        return data.to_csv()
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def compare_stocks(symbol1: str, symbol2: str) -> str:
    """
    Compare two stock prices.
    """
    try:
        price1 = get_stock_price(symbol1)
        price2 = get_stock_price(symbol2)
        
        if price1 > price2:
            return f"{symbol1} (${price1:.2f}) is higher than {symbol2} (${price2:.2f})"
        elif price2 > price1:
            return f"{symbol2} (${price2:.2f}) is higher than {symbol1} (${price1:.2f})"
        else:
            return f"{symbol1} and {symbol2} have the same price: ${price1:.2f}"
    except Exception as e:
        return f"Error comparing stocks: {str(e)}"

@mcp.tool()
def add_to_watchlist(symbol: str) -> str:
    watchlist.add(symbol.upper())
    return f"Added {symbol.upper()} to watchlist"

@mcp.tool()
def remove_from_watchlist(symbol: str) -> str:
    watchlist.discard(symbol.upper())
    return f"Removed {symbol.upper()} from watchlist"

@mcp.tool()
def get_watchlist() -> list:
    return list(watchlist)

@mcp.tool()
def get_watchlist_prices() -> dict:
    """Get the most recent prices for all stocks in the watchlist."""
    prices = {}
    for symbol in watchlist:
        try:
            prices[symbol] = get_stock_price(symbol)
        except Exception as e:
            prices[symbol] = f"Error: {str(e)}"
    return prices

def update_prices():
    """Background task to update watchlist prices"""
    while True:
        try:
            for symbol in watchlist.copy():  # Use copy to avoid modification during iteration
                watchlist_prices[symbol] = get_stock_price(symbol)
            time.sleep(60)  # Update every minute
        except Exception as e:
            print(f"Error updating prices: {e}")
            time.sleep(60)

@mcp.tool()
def get_realtime_watchlist_prices() -> dict:
    """
    Get real-time cached prices from the background updater.
    """
    return watchlist_prices.copy()

# Start background price updater
price_update_thread = threading.Thread(target=update_prices, daemon=True)
price_update_thread.start()

if __name__ == "__main__":
    mcp.run()