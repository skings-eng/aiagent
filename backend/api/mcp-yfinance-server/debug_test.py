#!/usr/bin/env python3

import sys
sys.path.append('/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.11/site-packages')

import yfinance as yf
import pandas as pd
import numpy as np

def test_format_issue():
    try:
        # Test the exact same operations as in get_trend_analysis
        ticker = yf.Ticker("AAPL")
        data = ticker.history(period="1mo", interval="1d")
        
        if data.empty:
            print("No data found")
            return
            
        print("Data retrieved successfully")
        
        # Test moving averages
        ma_short = data['Close'].rolling(window=20).mean()
        ma_long = data['Close'].rolling(window=50).mean()
        
        print("Moving averages calculated")
        
        # Test current values
        current_price = data['Close'].iloc[-1]
        current_ma_short = ma_short.iloc[-1]
        current_ma_long = ma_long.iloc[-1]
        
        print(f"Current price: {float(current_price)}")
        print(f"Current MA short: {float(current_ma_short) if not pd.isna(current_ma_short) else None}")
        print(f"Current MA long: {float(current_ma_long) if not pd.isna(current_ma_long) else None}")
        
        # Test price changes
        price_change_1d = float((data['Close'].iloc[-1] - data['Close'].iloc[-2]) / data['Close'].iloc[-2] * 100) if len(data) >= 2 else 0.0
        print(f"Price change 1d: {price_change_1d}")
        
        # Test timestamp conversion
        dates = []
        for ts in data.index[-10:]:
            try:
                dates.append(int(ts.timestamp()))
            except Exception as e:
                print(f"Timestamp error: {e}")
                dates.append(0)
                
        print(f"Dates converted: {len(dates)} items")
        
        # Test the result dictionary
        result = {
            "symbol": "AAPL",
            "current_price": float(current_price),
            "ma_20": float(current_ma_short) if not pd.isna(current_ma_short) else None,
            "ma_50": float(current_ma_long) if not pd.isna(current_ma_long) else None,
            "price_change_1d": price_change_1d,
            "dates": dates
        }
        
        print("Result dictionary created successfully")
        print(result)
        
    except Exception as e:
        print(f"Error in test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_format_issue()