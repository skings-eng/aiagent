#!/bin/bash
# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 确保虚拟环境被正确激活
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
else
    echo "Virtual environment not found!"
    exit 1
fi

# 验证 Python 路径
echo "Using Python: $(which python)"
echo "Python version: $(python --version)"

# 验证 mcp 模块
if python -c "import mcp" 2>/dev/null; then
    echo "MCP module found"
else
    echo "MCP module not found!"
    exit 1
fi

# 启动服务器
python simple_stock_server.py