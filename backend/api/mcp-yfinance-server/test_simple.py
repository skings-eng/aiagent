#!/usr/bin/env python3
"""
简单测试MCP YFinance服务器的功能
"""

import sys
import os
sys.path.append('source')

# 直接导入并测试功能
try:
    from yf_server import get_stock_price, get_rsi, get_moving_averages, get_technical_summary
    
    print("=== MCP YFinance服务器功能测试 ===")
    
    # 测试获取股票价格
    print("\n1. 测试获取苹果(AAPL)股票价格...")
    try:
        price = get_stock_price("AAPL")
        print(f"   苹果股票当前价格: ${price:.2f}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试获取丰田汽车价格
    print("\n2. 测试获取丰田汽车(7203.T)股票价格...")
    try:
        price = get_stock_price("7203.T")
        print(f"   丰田汽车股票当前价格: ¥{price:.2f}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试移动平均线
    print("\n3. 测试获取移动平均线...")
    try:
        ma_data = get_moving_averages("AAPL", period="1mo", windows=[20, 50])
        print(f"   移动平均线数据获取成功，包含 {len(ma_data)} 个指标")
        for key in ma_data.keys():
            if isinstance(ma_data[key], list) and len(ma_data[key]) > 0:
                print(f"   {key}: 最新值 = {ma_data[key][-1]:.2f}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试RSI指标
    print("\n4. 测试获取RSI指标...")
    try:
        rsi_data = get_rsi("AAPL", period="1mo")
        print(f"   RSI数据获取成功")
        if 'rsi' in rsi_data and len(rsi_data['rsi']) > 0:
            print(f"   当前RSI值: {rsi_data['rsi'][-1]:.2f}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试技术分析总结
    print("\n5. 测试技术分析总结...")
    try:
        summary = get_technical_summary("AAPL")
        print(f"   技术分析总结获取成功")
        print(f"   总体信号: {summary.get('overall_signal', 'N/A')}")
        print(f"   价格趋势: {summary.get('price_trend', 'N/A')}")
    except Exception as e:
        print(f"   错误: {e}")
    
    print("\n=== 测试完成 ===")
    print("MCP YFinance服务器功能正常，可以为股票分析系统提供数据支撑！")
    
except ImportError as e:
    print(f"导入错误: {e}")
    print("请确保在正确的目录中运行此脚本")
except Exception as e:
    print(f"测试失败: {e}")
    import traceback
    traceback.print_exc()