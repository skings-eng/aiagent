#!/bin/bash

# MCP Stock Server Startup Script
echo "Starting MCP Stock Server..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Virtual environment activated"
source venv/bin/activate

# Check Python version
echo "Using Python: $(which python)"
echo "Python version: $(python --version)"

# Install dependencies if needed
if [ ! -f "venv/.deps_installed" ]; then
    echo "Installing dependencies..."
    pip install -e .
    touch venv/.deps_installed
fi

# Check if MCP module is available
if python -c "import mcp" 2>/dev/null; then
    echo "MCP module found"
else
    echo "MCP module not found, installing..."
    pip install mcp
fi

# Start the MCP server
echo "Starting simple_stock_server.py..."
exec python simple_stock_server.py