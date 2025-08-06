#!/bin/bash

# Claude Desktop MCP配置自动设置脚本
# 用于将YFinance MCP服务器添加到Claude Desktop

echo "🚀 Claude Desktop MCP配置设置脚本"
echo "======================================"

# 获取当前脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Claude Desktop配置文件路径
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到macOS系统"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "✅ 检测到Linux系统"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "✅ 检测到Windows系统"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

echo "📁 配置目录: $CLAUDE_CONFIG_DIR"
echo "📄 配置文件: $CLAUDE_CONFIG_FILE"

# 创建配置目录（如果不存在）
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📁 创建Claude配置目录..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ 配置目录创建成功"
    else
        echo "❌ 配置目录创建失败"
        exit 1
    fi
else
    echo "✅ 配置目录已存在"
fi

# MCP服务器配置
MCP_CONFIG='{
  "mcpServers": {
    "yfinance-stock-server": {
      "command": "python",
      "args": ["'$SCRIPT_DIR'/source/yf_server.py"],
      "env": {
        "PYTHONPATH": "'$SCRIPT_DIR'/venv/lib/python3.13/site-packages"
      }
    }
  }
}'

# 检查配置文件是否存在
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📄 发现现有配置文件"
    
    # 备份现有配置
    BACKUP_FILE="${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE"
    echo "💾 已备份现有配置到: $BACKUP_FILE"
    
    # 检查是否已经配置了yfinance服务器
    if grep -q "yfinance-stock-server" "$CLAUDE_CONFIG_FILE"; then
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
    
    # 尝试合并配置
    echo "🔄 合并MCP服务器配置..."
    
    # 使用Python来合并JSON配置
    python3 << EOF
import json
import sys

try:
    # 读取现有配置
    with open('$CLAUDE_CONFIG_FILE', 'r') as f:
        existing_config = json.load(f)
    
    # 新的MCP配置
    new_mcp_config = {
        "yfinance-stock-server": {
            "command": "python",
            "args": ["$SCRIPT_DIR/source/yf_server.py"],
            "env": {
                "PYTHONPATH": "$SCRIPT_DIR/venv/lib/python3.13/site-packages"
            }
        }
    }
    
    # 确保mcpServers键存在
    if 'mcpServers' not in existing_config:
        existing_config['mcpServers'] = {}
    
    # 添加或更新yfinance服务器配置
    existing_config['mcpServers'].update(new_mcp_config)
    
    # 写回配置文件
    with open('$CLAUDE_CONFIG_FILE', 'w') as f:
        json.dump(existing_config, f, indent=2)
    
    print("✅ 配置合并成功")
except Exception as e:
    print(f"❌ 配置合并失败: {e}")
    sys.exit(1)
EOF
    
    if [ $? -ne 0 ]; then
        echo "❌ 配置合并失败，恢复备份"
        cp "$BACKUP_FILE" "$CLAUDE_CONFIG_FILE"
        exit 1
    fi
    
else
    echo "📄 创建新的配置文件..."
    echo "$MCP_CONFIG" > "$CLAUDE_CONFIG_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ 配置文件创建成功"
    else
        echo "❌ 配置文件创建失败"
        exit 1
    fi
fi

# 验证配置文件格式
echo "🔍 验证配置文件格式..."
python3 -m json.tool "$CLAUDE_CONFIG_FILE" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 配置文件格式正确"
else
    echo "❌ 配置文件格式错误"
    if [ -f "$BACKUP_FILE" ]; then
        echo "🔄 恢复备份配置"
        cp "$BACKUP_FILE" "$CLAUDE_CONFIG_FILE"
    fi
    exit 1
fi

# 检查MCP服务器是否可以启动
echo "🧪 测试MCP服务器..."
cd "$SCRIPT_DIR"
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    timeout 10s python source/yf_server.py --test 2>/dev/null
    if [ $? -eq 0 ] || [ $? -eq 124 ]; then  # 124 是timeout的退出码
        echo "✅ MCP服务器测试通过"
    else
        echo "⚠️  MCP服务器测试失败，但配置已完成"
        echo "   请确保虚拟环境和依赖已正确安装"
    fi
else
    echo "⚠️  虚拟环境未找到，请先运行安装脚本"
fi

echo ""
echo "🎉 Claude Desktop MCP配置完成！"
echo "======================================"
echo "📋 下一步操作:"
echo "   1. 完全退出Claude Desktop应用程序"
echo "   2. 重新启动Claude Desktop"
echo "   3. 在Claude中测试: '获取苹果公司(AAPL)的股价'"
echo ""
echo "📄 配置文件位置: $CLAUDE_CONFIG_FILE"
echo "🔧 如需修改配置，请编辑上述文件"
echo ""
echo "🧪 测试命令示例:"
echo "   - 获取苹果公司(AAPL)的当前股价"
echo "   - 分析特斯拉(TSLA)的技术指标"
echo "   - 将AAPL和MSFT添加到监控列表"
echo ""
echo "📚 更多信息请查看: IDE_INTEGRATION_GUIDE.md"
echo "======================================"