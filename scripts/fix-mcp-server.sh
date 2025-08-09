#!/bin/bash

# 快速修复MCP服务器文件路径问题的脚本

echo "=== MCP服务器快速修复脚本 ==="

# 检查远程服务器连接
if ! command -v ssh &> /dev/null; then
    echo "错误: 未找到ssh命令"
    exit 1
fi

# 远程服务器信息（请根据实际情况修改）
REMOTE_HOST="root@your-server-ip"
DEPLOY_PATH="/root/aiagent"

echo "连接到远程服务器: $REMOTE_HOST"

# 在远程服务器上执行修复命令
ssh $REMOTE_HOST << 'EOF'
echo "检查MCP服务器目录..."
cd /root/aiagent/backend/api/mcp-yfinance-server

# 检查文件是否存在
if [ -f "simple_stock_server.py" ]; then
    echo "找到 simple_stock_server.py 文件"
    
    # 创建符号链接作为临时解决方案
    if [ ! -f "server.py" ]; then
        echo "创建符号链接: server.py -> simple_stock_server.py"
        ln -s simple_stock_server.py server.py
        echo "符号链接创建成功"
    else
        echo "server.py 已存在"
    fi
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        echo "创建Python虚拟环境..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -e .
        deactivate
        echo "虚拟环境创建完成"
    else
        echo "虚拟环境已存在"
    fi
    
    # 重启API服务
    echo "重启API服务..."
    cd /root/aiagent
    pm2 restart aiagent-api
    
    echo "修复完成！"
    echo "请测试MCP功能是否正常工作"
    
else
    echo "错误: 未找到 simple_stock_server.py 文件"
    echo "请检查部署是否完整"
    exit 1
fi
EOF

echo "=== 修复脚本执行完成 ==="
echo "请在远程服务器上测试MCP功能"
echo "如果问题仍然存在，请运行完整的重新部署"