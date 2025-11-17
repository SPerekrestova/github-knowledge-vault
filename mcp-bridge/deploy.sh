#!/bin/bash
# Deployment script for cloud platforms
# This script sets up and runs both MCP Server and MCP Bridge

set -e

echo "🚀 Starting MCP Bridge + MCP Server deployment"

# Check if MCP Server exists
if [ ! -f "../GitHub_MCP_Server/main.py" ]; then
    echo "⚠️  MCP Server not found at ../GitHub_MCP_Server/"
    echo "📥 Cloning MCP Server..."

    cd ..
    git clone https://github.com/YourOrg/GitHub_MCP_Server.git || {
        echo "❌ Failed to clone MCP Server"
        echo "💡 You need to make the MCP Server available in the repository"
        exit 1
    }
    cd mcp-bridge
fi

# Install MCP Server dependencies if needed
if [ -f "../GitHub_MCP_Server/requirements.txt" ]; then
    echo "📦 Installing MCP Server dependencies..."
    pip install -q -r ../GitHub_MCP_Server/requirements.txt
fi

# Install Bridge dependencies
echo "📦 Installing MCP Bridge dependencies..."
pip install -q -r requirements.txt

# Start MCP Bridge (which will spawn MCP Server)
echo "✅ Starting MCP Bridge with embedded MCP Server..."
python main.py
