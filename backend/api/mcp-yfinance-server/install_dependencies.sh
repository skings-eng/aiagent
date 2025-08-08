#!/bin/bash

# Install dependencies for mcp-yfinance-server
# This script installs all required Python packages for the MCP server

set -e  # Exit on any error

echo "Starting MCP dependencies installation..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Working directory: $SCRIPT_DIR"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install required packages
echo "Installing required packages..."

# Core MCP packages
python -m pip install "mcp[cli]>=1.6.0"
python -m pip install "fastmcp>=2.0.0"

# Data processing packages
python -m pip install "yfinance>=0.2.55"
python -m pip install "pandas>=2.0.0"
python -m pip install "numpy>=1.24.0"

# HTTP and networking
python -m pip install "httpx>=0.25.0"
python -m pip install "requests>=2.31.0"

# Text processing
python -m pip install "textblob>=0.17.0"

# Visualization
python -m pip install "matplotlib>=3.7.0"

# Development tools
python -m pip install "ipython>=8.0.0"

# Additional dependencies from pyproject.toml
python -m pip install "typing-extensions>=4.8.0"
python -m pip install "pydantic>=2.0.0"
python -m pip install "uvicorn>=0.23.0"
python -m pip install "starlette>=0.27.0"

echo "Verifying installations..."

# Verify critical packages
echo "Checking MCP installation..."
python -c "import mcp; print(f'MCP version: {mcp.__version__}')"

echo "Checking yfinance installation..."
python -c "import yfinance; print('yfinance: OK')"

echo "Checking pandas installation..."
python -c "import pandas; print(f'pandas version: {pandas.__version__}')"

echo "Checking numpy installation..."
python -c "import numpy; print(f'numpy version: {numpy.__version__}')"

echo "Checking httpx installation..."
python -c "import httpx; print(f'httpx version: {httpx.__version__}')"

echo "All dependencies installed successfully!"
echo "Virtual environment is ready at: $SCRIPT_DIR/venv"
echo "To activate: source $SCRIPT_DIR/venv/bin/activate"

# Make the script executable
chmod +x "$SCRIPT_DIR/start_mcp.sh"

echo "Installation complete!"