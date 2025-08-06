#!/bin/bash

# MCP YFinance服务器启动脚本
# 用于为股票分析系统提供数据支撑

echo "启动MCP YFinance服务器..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 切换到项目目录
cd "$SCRIPT_DIR"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "错误: 虚拟环境不存在，请先运行安装脚本"
    exit 1
fi

# 激活虚拟环境
source venv/bin/activate

# 检查依赖是否安装
if ! python -c "import yfinance, mcp" 2>/dev/null; then
    echo "错误: 依赖未正确安装，请先运行安装脚本"
    exit 1
fi

echo "MCP YFinance服务器正在启动..."
echo "服务器提供以下功能:"
echo "  - 实时股票价格获取"
echo "  - 技术指标分析 (RSI, MACD, 移动平均线等)"
echo "  - 波动率分析和趋势分析"
echo "  - 股票监控列表管理"
echo "  - 支撑阻力位检测"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动MCP服务器
python source/yf_server.py