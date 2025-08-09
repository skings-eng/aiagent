#!/bin/bash

# 在远程服务器上直接运行的MCP修复脚本
# 使用方法：将此脚本上传到远程服务器并执行

echo "=== MCP服务器修复脚本（远程服务器版本） ==="

# 设置工作目录 - 根据当前用户动态确定
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "ubuntu" ]; then
    DEPLOY_PATH="/home/ubuntu/aiagent"
elif [ "$CURRENT_USER" = "root" ]; then
    DEPLOY_PATH="/root/aiagent"
else
    DEPLOY_PATH="$HOME/aiagent"
fi
MCP_DIR="$DEPLOY_PATH/backend/api/mcp-yfinance-server"

echo "检查MCP服务器目录: $MCP_DIR"

# 检查目录是否存在
if [ ! -d "$MCP_DIR" ]; then
    echo "错误: MCP目录不存在: $MCP_DIR"
    exit 1
fi

cd "$MCP_DIR"

# 检查文件状态
echo "检查文件状态..."
echo "当前目录: $(pwd)"
echo "文件列表:"
ls -la *.py 2>/dev/null || echo "未找到Python文件"

# 检查simple_stock_server.py是否存在
if [ ! -f "simple_stock_server.py" ]; then
    echo "错误: simple_stock_server.py 文件不存在"
    echo "请检查MCP服务器安装是否正确"
    exit 1
fi

# 创建server.py符号链接
echo "创建server.py符号链接..."
if [ -L "server.py" ]; then
    echo "移除现有的server.py符号链接"
    rm server.py
elif [ -f "server.py" ]; then
    echo "备份现有的server.py文件"
    mv server.py server.py.backup
fi

# 创建新的符号链接
ln -s simple_stock_server.py server.py
echo "✓ 已创建符号链接: server.py -> simple_stock_server.py"

# 验证符号链接
if [ -L "server.py" ] && [ -f "server.py" ]; then
    echo "✓ 符号链接创建成功"
    ls -la server.py
else
    echo "✗ 符号链接创建失败"
    exit 1
fi

# 检查虚拟环境
echo "检查Python虚拟环境..."
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
echo "激活虚拟环境并检查依赖..."
source venv/bin/activate

# 检查是否需要安装依赖
if ! python -c "import yfinance" 2>/dev/null; then
    echo "安装MCP服务器依赖..."
    pip install .
else
    echo "✓ 依赖已安装"
fi

deactivate

# 检查start_mcp.sh脚本
if [ -f "start_mcp.sh" ]; then
    chmod +x start_mcp.sh
    echo "✓ start_mcp.sh 脚本权限已设置"
else
    echo "警告: start_mcp.sh 脚本不存在"
fi

# 重启API服务
echo "重启API服务..."
cd "$DEPLOY_PATH"

# 检查PM2状态
if command -v pm2 &> /dev/null; then
    echo "当前PM2状态:"
    pm2 status
    
    echo "重启所有服务..."
    pm2 restart all
    
    echo "等待服务启动..."
    sleep 3
    
    echo "重启后PM2状态:"
    pm2 status
else
    echo "警告: PM2未安装，请手动重启API服务"
fi

echo "=== 修复完成 ==="
echo "请测试MCP功能是否正常工作"
echo "如果问题仍然存在，请检查:"
echo "1. MCP配置文件是否正确"
echo "2. Python虚拟环境是否正常"
echo "3. API服务日志中的错误信息"