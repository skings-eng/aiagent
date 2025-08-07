#!/usr/bin/env python3

import sys
sys.path.append('/Users/sking/aiagent/backend/api/mcp-yfinance-server/venv/lib/python3.11/site-packages')

# Import the functions from simple_stock_server
from simple_stock_server import analyze_stock, get_trend_analysis

def test_analyze_stock():
    try:
        print("Testing analyze_stock function...")
        result = analyze_stock("AAPL")
        print("analyze_stock completed successfully")
        print(f"Result type: {type(result)}")
        print(f"Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
        
        # Try to convert to JSON to see if that's where the error occurs
        import json
        json_result = json.dumps(result)
        print("JSON serialization successful")
        
    except Exception as e:
        print(f"Error in analyze_stock: {e}")
        import traceback
        traceback.print_exc()

def test_trend_analysis():
    try:
        print("\nTesting get_trend_analysis function...")
        result = get_trend_analysis("AAPL", period="1mo")
        print("get_trend_analysis completed successfully")
        print(f"Result type: {type(result)}")
        print(f"Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
        
        # Try to convert to JSON to see if that's where the error occurs
        import json
        json_result = json.dumps(result)
        print("JSON serialization successful")
        
    except Exception as e:
        print(f"Error in get_trend_analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analyze_stock()
    test_trend_analysis()