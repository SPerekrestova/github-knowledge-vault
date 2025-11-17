#!/bin/bash

echo "🧪 Testing MCP Integration"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test MCP Bridge health
echo "1️⃣  Testing MCP Bridge health..."
HEALTH=$(curl -s http://localhost:3001/health 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} MCP Bridge is running"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}✗${NC} MCP Bridge is not running"
    echo -e "${YELLOW}   Start it with: cd mcp-bridge && python main.py${NC}"
    exit 1
fi

# Test repositories endpoint
echo ""
echo "2️⃣  Testing repositories endpoint..."
REPOS=$(curl -s http://localhost:3001/api/repos 2>&1)
if [ $? -eq 0 ]; then
    # Try to count repos (requires jq, but works without it)
    if command -v jq &> /dev/null; then
        REPO_COUNT=$(echo "$REPOS" | jq '. | length' 2>/dev/null || echo "unknown")
    else
        REPO_COUNT="unknown (install jq for count)"
    fi
    echo -e "${GREEN}✓${NC} Repositories endpoint works"
    echo "   Found $REPO_COUNT repositories"
else
    echo -e "${RED}✗${NC} Repositories endpoint failed"
    exit 1
fi

# Test frontend
echo ""
echo "3️⃣  Testing frontend..."
FRONTEND=$(curl -s http://localhost:5173 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${RED}✗${NC} Frontend is not running"
    echo -e "${YELLOW}   Start it with: npm run dev${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:5173 in browser"
echo "  2. Open DevTools → Console (check for MCP logs)"
echo "  3. Open DevTools → Network (verify requests to localhost:3001)"
echo "  4. Test all features manually"
