#!/bin/bash

# Trae AI MCP配置自动设置脚本
# 用于将YFinance MCP服务器添加到Trae AI IDE

echo "🚀 Trae AI MCP配置设置脚本"
echo "======================================"

# 获取当前脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Trae AI配置文件可能的路径
TRAE_CONFIG_DIRS=(
    "$HOME/.config/trae-ai"
    "$HOME/.trae-ai"
    "$HOME/Library/Application Support/Trae AI"
    "$HOME/Library/Preferences/Trae AI"
)

TRAE_CONFIG_FILE=""

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到macOS系统"
    # macOS优先路径
    TRAE_CONFIG_DIRS=(
        "$HOME/Library/Application Support/Trae AI"
        "$HOME/.config/trae-ai"
        "$HOME/.trae-ai"
    )
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ 检测到Linux系统"
    # Linux优先路径
    TRAE_CONFIG_DIRS=(
        "$HOME/.config/trae-ai"
        "$HOME/.trae-ai"
    )
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "✅ 检测到Windows系统"
    # Windows路径
    TRAE_CONFIG_DIRS=(
        "$APPDATA/Trae AI"
        "$HOME/.config/trae-ai"
    )
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 查找现有的Trae AI配置目录
echo "🔍 查找Trae AI配置目录..."
for dir in "${TRAE_CONFIG_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ 找到配置目录: $dir"
        TRAE_CONFIG_FILE="$dir/mcp_config.json"
        break
    fi
done

# 如果没有找到配置目录，创建默认目录
if [ -z "$TRAE_CONFIG_FILE" ]; then
    DEFAULT_DIR="${TRAE_CONFIG_DIRS[0]}"
    echo "📁 创建默认配置目录: $DEFAULT_DIR"
    mkdir -p "$DEFAULT_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ 配置目录创建成功"
        TRAE_CONFIG_FILE="$DEFAULT_DIR/mcp_config.json"
    else
        echo "❌ 配置目录创建失败"
        exit 1
    fi
fi

echo "📄 配置文件路径: $TRAE_CONFIG_FILE"

# 检查MCP服务器是否可用
echo "🧪 检查MCP服务器状态..."
cd "$SCRIPT_DIR"
if [ ! -f "source/yf_server.py" ]; then
    echo "❌ MCP服务器文件不存在: source/yf_server.py"
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "❌ 虚拟环境不存在，请先运行安装脚本"
    exit 1
fi

# 测试虚拟环境和依赖
source venv/bin/activate
if ! python -c "import yfinance, mcp" 2>/dev/null; then
    echo "❌ 依赖检查失败，请确保已正确安装所有依赖"
    exit 1
fi
echo "✅ MCP服务器依赖检查通过"

# MCP服务器配置
MCP_CONFIG='{
  "mcpServers": {
    "yfinance-stock-server": {
      "name": "YFinance Stock Analysis",
      "description": "Yahoo Finance股票数据分析服务器，提供实时股价、技术指标分析等功能",
      "command": "python",
      "args": ["'$SCRIPT_DIR'/source/yf_server.py"],
      "cwd": "'$SCRIPT_DIR'",
      "env": {
        "PYTHONPATH": "'$SCRIPT_DIR'/venv/lib/python3.13/site-packages"
      },
      "enabled": true,
      "timeout": 30,
      "retries": 3
    }
  }
}'

# 检查配置文件是否存在
if [ -f "$TRAE_CONFIG_FILE" ]; then
    echo "📄 发现现有配置文件"
    
    # 备份现有配置
    BACKUP_FILE="${TRAE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$TRAE_CONFIG_FILE" "$BACKUP_FILE"
    echo "💾 已备份现有配置到: $BACKUP_FILE"
    
    # 检查是否已经配置了yfinance服务器
    if grep -q "yfinance-stock-server" "$TRAE_CONFIG_FILE"; then
        echo "⚠️  检测到已存在yfinance-stock-server配置"
        echo "是否要覆盖现有配置? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo "🔄 更新现有配置..."
        else
            echo "❌ 取消配置更新"
            exit 0
        fi
    fi
    
    # 使用Python合并配置
    echo "🔄 合并MCP服务器配置..."
    python3 << EOF
import json
import sys

try:
    # 读取现有配置
    with open('$TRAE_CONFIG_FILE', 'r') as f:
        existing_config = json.load(f)
    
    # 新的MCP配置
    new_mcp_config = {
        "yfinance-stock-server": {
            "name": "YFinance Stock Analysis",
            "description": "Yahoo Finance股票数据分析服务器，提供实时股价、技术指标分析等功能",
            "command": "python",
            "args": ["$SCRIPT_DIR/source/yf_server.py"],
            "cwd": "$SCRIPT_DIR",
            "env": {
                "PYTHONPATH": "$SCRIPT_DIR/venv/lib/python3.13/site-packages"
            },
            "enabled": True,
            "timeout": 30,
            "retries": 3
        }
    }
    
    # 确保mcpServers键存在
    if 'mcpServers' not in existing_config:
        existing_config['mcpServers'] = {}
    
    # 添加或更新yfinance服务器配置
    existing_config['mcpServers'].update(new_mcp_config)
    
    # 写回配置文件
    with open('$TRAE_CONFIG_FILE', 'w') as f:
        json.dump(existing_config, f, indent=2)
    
    print("✅ 配置合并成功")
except Exception as e:
    print(f"❌ 配置合并失败: {e}")
    sys.exit(1)
EOF
    
    if [ $? -ne 0 ]; then
        echo "❌ 配置合并失败，恢复备份"
        cp "$BACKUP_FILE" "$TRAE_CONFIG_FILE"
        exit 1
    fi
    
else
    echo "📄 创建新的配置文件..."
    echo "$MCP_CONFIG" > "$TRAE_CONFIG_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ 配置文件创建成功"
    else
        echo "❌ 配置文件创建失败"
        exit 1
    fi
fi

# 验证配置文件格式
echo "🔍 验证配置文件格式..."
python3 -m json.tool "$TRAE_CONFIG_FILE" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 配置文件格式正确"
else
    echo "❌ 配置文件格式错误"
    if [ -f "$BACKUP_FILE" ]; then
        echo "🔄 恢复备份配置"
        cp "$BACKUP_FILE" "$TRAE_CONFIG_FILE"
    fi
    exit 1
fi

# 测试MCP服务器启动
echo "🧪 测试MCP服务器启动..."
cd "$SCRIPT_DIR"
source venv/bin/activate

# 使用timeout命令测试服务器启动
timeout 10s python source/yf_server.py --test 2>/dev/null &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ MCP服务器启动测试通过"
    kill $SERVER_PID 2>/dev/null
else
    echo "⚠️  MCP服务器启动测试失败，但配置已完成"
    echo "   请手动验证服务器是否可以正常启动"
fi

# 创建Trae AI特定的使用说明
cat > "$SCRIPT_DIR/TRAE_AI_USAGE.md" << 'EOL'
# Trae AI中使用MCP YFinance服务器

## 快速开始

在Trae AI中，您可以直接使用自然语言与MCP服务器交互：

### 基础查询
```
获取苹果公司(AAPL)的当前股价
```

### 技术分析
```
分析特斯拉(TSLA)的技术指标，包括RSI、MACD和移动平均线
```

### 股票对比
```
比较苹果(AAPL)和微软(MSFT)的股票表现
```

### 监控列表
```
将AAPL、TSLA、MSFT添加到我的股票监控列表，并获取实时价格
```

## 可用工具

- get_stock_price - 获取实时股价
- get_technical_summary - 技术分析总结
- get_rsi - RSI指标
- get_macd - MACD指标
- add_to_watchlist - 添加到监控列表
- 以及其他12个专业工具

## 支持的股票市场

- 美国股市: AAPL, TSLA, MSFT, GOOGL等
- 日本股市: 7203.T (丰田), 6758.T (索尼)等
- 香港股市: 0700.HK (腾讯), 0941.HK (中国移动)等
- 其他全球主要交易所
EOL

echo ""
echo "🎉 Trae AI MCP配置完成！"
echo "======================================"
echo "📋 下一步操作:"
echo "   1. 重启Trae AI IDE"
echo "   2. 在Trae AI中测试: '获取苹果公司(AAPL)的股价'"
echo "   3. 查看可用工具: '显示所有可用的股票分析工具'"
echo ""
echo "📄 配置文件位置: $TRAE_CONFIG_FILE"
echo "📚 使用指南: $SCRIPT_DIR/TRAE_AI_USAGE.md"
echo "🔧 详细文档: $SCRIPT_DIR/setup_trae_ai.md"
echo ""
echo "🧪 测试命令示例:"
echo "   - 获取苹果公司(AAPL)的当前股价和基本信息"
echo "   - 分析特斯拉(TSLA)的技术指标，包括RSI和MACD"
echo "   - 将AAPL、TSLA、MSFT添加到监控列表并获取实时价格"
echo "   - 比较苹果和微软的股票表现"
echo ""
echo "📞 如遇问题，请查看故障排除指南或检查Trae AI的MCP设置"
echo "======================================"