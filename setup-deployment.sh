#!/bin/bash
# Setup script for cloud deployment
# This prepares your repository to include the MCP Server

set -e

echo "🚀 GitHub Knowledge Vault - Deployment Setup"
echo "=============================================="
echo ""

# Check if mcp-server already exists
if [ -d "mcp-server" ]; then
    echo "✅ MCP Server already exists in repository"
    exit 0
fi

echo "📦 MCP Server is required for deployment"
echo ""
echo "Choose how to add MCP Server:"
echo "  1) Copy from sibling directory (../GitHub_MCP_Server)"
echo "  2) Add as git submodule (requires MCP Server git URL)"
echo "  3) Skip (I'll add it manually later)"
echo ""
read -p "Select option [1-3]: " option

case $option in
    1)
        if [ -d "../GitHub_MCP_Server" ]; then
            echo "📁 Copying MCP Server from ../GitHub_MCP_Server..."
            cp -r ../GitHub_MCP_Server ./mcp-server
            echo "✅ MCP Server copied successfully"

            # Add to git
            git add mcp-server
            echo "📝 MCP Server staged for commit"
            echo ""
            echo "Next steps:"
            echo "  git commit -m 'Add MCP Server for deployment'"
            echo "  git push"
        else
            echo "❌ ../GitHub_MCP_Server directory not found"
            echo "💡 Make sure GitHub_MCP_Server is cloned in the parent directory"
            exit 1
        fi
        ;;

    2)
        echo ""
        read -p "Enter MCP Server git URL: " git_url

        if [ -z "$git_url" ]; then
            echo "❌ No URL provided"
            exit 1
        fi

        echo "📥 Adding MCP Server as git submodule..."
        git submodule add "$git_url" mcp-server
        git submodule update --init --recursive

        echo "✅ MCP Server added as submodule"
        echo ""
        echo "Next steps:"
        echo "  git commit -m 'Add MCP Server as submodule'"
        echo "  git push"
        ;;

    3)
        echo "⏭️  Skipping MCP Server setup"
        echo ""
        echo "⚠️  Remember to add MCP Server before deploying:"
        echo "  - Copy it: cp -r ../GitHub_MCP_Server ./mcp-server"
        echo "  - Or add as submodule: git submodule add <url> mcp-server"
        exit 0
        ;;

    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Your repository structure:"
tree -L 2 -I 'node_modules|dist|.git' || ls -la

echo ""
echo "📚 Next: Read deployment guide"
echo "   cat DEPLOYMENT.md"
echo "   cat MCP_DEPLOYMENT.md"
