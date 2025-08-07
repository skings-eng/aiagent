#!/usr/bin/env python3
import yfinance as yf
import pandas as pd

# Test what type of dates we're getting
ticker = yf.Ticker("AAPL")
data = ticker.history(period="1mo", interval="1d")

print("Data index type:", type(data.index))
print("First few index values:", data.index[:3])
print("Index value types:", [type(x) for x in data.index[:3]])

# Test timestamp conversion
dates = []
for ts in data.index[-10:]:
    try:
        timestamp = int(ts.timestamp())
        dates.append(timestamp)
        print(f"Converted {ts} to {timestamp}")
    except Exception as e:
        print(f"Failed to convert {ts}: {e}")
        dates.append(0)

print("Final dates:", dates)