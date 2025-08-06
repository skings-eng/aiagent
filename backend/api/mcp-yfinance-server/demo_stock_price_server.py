from mcp.server.fastmcp import FastMCP
import yfinance as yf
import threading
import time

# Create the MCP server
mcp = FastMCP("Stock Price Server")

# In-memory watchlist and real-time price cache
watchlist = set()
watchlist_prices = {}

# Function to get current stock price using yfinance
@mcp.tool()
def get_stock_price(symbol: str) -> float:
    """
    Retrieve the current stock price for the given ticker symbol.
    Returns the latest closing price as a float.
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if not data.empty:
            price = data['Close'].iloc[-1]
            return float(price)
        else:
            info = ticker.info
            price = info.get('regularMarketPrice')
            if price is not None:
                return float(price)
            else:
                raise ValueError("Price data is not available.")
    except Exception as e:
        raise ValueError(f"Error retrieving stock price: {e}")

# Resource endpoint for a stock symbol
@mcp.resource("stock://{symbol}")
def stock_resource(symbol: str) -> str:
    """
    Expose stock price data as a resource.
    Returns a formatted string with the current stock price.
    """
    price = get_stock_price(symbol)
    return f"The current price of {symbol.upper()} is ${price:.2f}"

# Tool to retrieve historical stock data as CSV
@mcp.tool()
def get_stock_history(symbol: str, period: str = "1mo") -> str:
    """
    Retrieve historical stock data in CSV format.
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)
        if data.empty:
            return f"No historical data found for '{symbol}' over '{period}'."
        return data.to_csv()
    except Exception as e:
        return f"Error fetching historical data: {e}"

# Tool to compare two stocks
@mcp.tool()
def compare_stocks(symbol1: str, symbol2: str) -> str:
    """
    Compare two stock prices.
    """
    try:
        price1 = get_stock_price(symbol1)
        price2 = get_stock_price(symbol2)
        if price1 > price2:
            return f"{symbol1.upper()} (${price1:.2f}) is higher than {symbol2.upper()} (${price2:.2f})."
        elif price1 < price2:
            return f"{symbol1.upper()} (${price1:.2f}) is lower than {symbol2.upper()} (${price2:.2f})."
        else:
            return f"{symbol1.upper()} and {symbol2.upper()} have the same price (${price1:.2f})."
    except Exception as e:
        return f"Error comparing stocks: {e}"

# --- Watchlist Management ---

@mcp.tool()
def add_to_watchlist(symbol: str) -> str:
    symbol = symbol.upper()
    watchlist.add(symbol)
    return f"Added {symbol} to the watchlist."

@mcp.tool()
def remove_from_watchlist(symbol: str) -> str:
    symbol = symbol.upper()
    if symbol in watchlist:
        watchlist.remove(symbol)
        return f"Removed {symbol} from the watchlist."
    else:
        return f"{symbol} is not in the watchlist."

@mcp.tool()
def get_watchlist() -> list:
    return sorted(watchlist)

@mcp.tool()
def get_watchlist_prices() -> dict:
    """
    Get the most recent prices for all stocks in the watchlist.
    """
    prices = {}
    for symbol in watchlist:
        try:
            price = get_stock_price(symbol)
            prices[symbol] = round(price, 2)
        except Exception as e:
            prices[symbol] = f"Error: {e}"
    return prices

# --- Simulated Real-Time Updates ---

def update_prices():
    """
    Background thread to update watchlist prices every 30 seconds.
    """
    while True:
        for symbol in watchlist:
            try:
                price = get_stock_price(symbol)
                watchlist_prices[symbol] = round(price, 2)
            except Exception as e:
                watchlist_prices[symbol] = f"Error: {e}"
        time.sleep(30)  # Update interval

@mcp.tool()
def get_realtime_watchlist_prices() -> dict:
    """
    Get real-time cached prices from the background updater.
    """
    return watchlist_prices

# Start the server
if __name__ == "__main__":
    threading.Thread(target=update_prices, daemon=True).start()
    mcp.run()
