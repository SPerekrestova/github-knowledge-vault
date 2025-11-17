# Frontend Integration - Detailed Step-by-Step Guide

## Overview

This guide provides granular, step-by-step instructions for integrating the React frontend with the MCP Bridge. We'll **completely replace** direct GitHub API calls with MCP Bridge REST API calls.

**Strategy:** Direct migration with breaking changes (no backward compatibility needed)

**Estimated Total Time:** 1.5-2 hours
**Difficulty:** Intermediate
**Prerequisites:** MCP Server and MCP Bridge implemented and tested

---

## Architecture Change

### Before (Direct GitHub API)
```
React Frontend → GitHub API (token in browser ❌)
```

### After (MCP-Based)
```
React Frontend → MCP Bridge → MCP Server → GitHub API (token secure ✅)
```

**Breaking Changes:** Yes - requires MCP Bridge to be running

---

## Part 1: Configuration & Environment (15 minutes)

### Step 1.1: Update Environment Variables

**What:** Replace GitHub API configuration with MCP Bridge configuration

**Why:** Connect to bridge instead of GitHub directly, improve security

**Location:** `.env` (project root)

**Before:**
```bash
VITE_GITHUB_OWNER=your-org-name
VITE_GITHUB_OWNER_TYPE=org
VITE_GITHUB_API_BASE_URL=https://api.github.com
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # ❌ Token exposed in browser
```

**After:**
```bash
# MCP Bridge Configuration
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
```

**Key Changes:**
- ✅ `VITE_MCP_BRIDGE_URL` - MCP Bridge endpoint
- ✅ `VITE_GITHUB_ORGANIZATION` - GitHub organization name
- ❌ Remove all `VITE_GITHUB_*` variables (no longer needed)

**Commands:**
```bash
cd /home/user/github-knowledge-vault

# Backup existing .env
cp .env .env.backup

# Replace .env content
cat > .env << 'EOF'
# MCP Bridge Configuration
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
EOF
```

**Verification:**
```bash
cat .env
# Should show only MCP configuration
```

---

### Step 1.2: Update .env.example

**What:** Update template for team members

**Why:** Help others configure their environment

**Commands:**
```bash
cat > .env.example << 'EOF'
# MCP Bridge Configuration
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-or-username
EOF
```

---

### Step 1.3: Update GitHub Configuration File

**What:** Simplify configuration to only support MCP Bridge

**Why:** Remove unnecessary complexity

**Location:** `src/config/github.ts`

**Replace entire file with:**
```typescript
/**
 * MCP Bridge Configuration
 */

export const githubConfig = {
  // MCP Bridge endpoint
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_URL || 'http://localhost:3001',

  // GitHub organization name
  organization: import.meta.env.VITE_GITHUB_ORGANIZATION || '',
} as const;

// Validation
if (!githubConfig.organization) {
  console.error('❌ VITE_GITHUB_ORGANIZATION is required');
  throw new Error('Missing required environment variable: VITE_GITHUB_ORGANIZATION');
}

if (!githubConfig.mcpBridgeUrl) {
  console.error('❌ VITE_MCP_BRIDGE_URL is required');
  throw new Error('Missing required environment variable: VITE_MCP_BRIDGE_URL');
}

// Log configuration (development only)
if (import.meta.env.DEV) {
  console.log('📋 Configuration:', {
    mcpBridgeUrl: githubConfig.mcpBridgeUrl,
    organization: githubConfig.organization,
  });
}
```

**Key Changes:**
- Removed all legacy GitHub API config
- Removed feature flag
- Added validation that throws errors if config missing
- Simplified to just 2 variables

**Commands:**
```bash
cat > src/config/github.ts << 'EOF'
[paste code above]
EOF
```

**Verification:**
```bash
# Check TypeScript compiles
npm run build:dev
```

---

## Part 2: Replace GitHub Service with MCP Service (30-40 minutes)

### Step 2.1: Delete Old GitHub Service (Optional but Recommended)

**What:** Remove the old `githubService.ts` file

**Why:** Prevent confusion, force use of MCP service

**Commands:**
```bash
# Backup first
cp src/utils/githubService.ts src/utils/githubService.ts.backup

# Delete (we'll create new mcpService)
# Don't delete yet - we'll reference it for the interface
```

---

### Step 2.2: Create MCP Service

**What:** Create new service that calls MCP Bridge API

**Why:** Encapsulate all MCP Bridge communication

**Location:** Create `src/utils/mcpService.ts`

**Full Implementation:**
```typescript
/**
 * MCP Service - REST API client for MCP Bridge
 *
 * Replaces githubService with MCP Bridge communication
 */

import { githubConfig } from '@/config/github';
import type {
  Repository,
  ContentItem,
  ContentFetchResult,
  ContentType
} from '@/types';
import { APIError, NetworkError } from './errors';

class MCPService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = githubConfig.mcpBridgeUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new APIError(
          response.status,
          `MCP Bridge error: ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Cannot connect to MCP Bridge. Is it running?');
      }

      throw new NetworkError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch all repositories from the organization
   */
  async getRepositories(): Promise<Repository[]> {
    console.log('🔄 Fetching repositories from MCP Bridge');

    const repos = await this.fetchWithErrorHandling<Repository[]>(
      `${this.baseUrl}/api/repos`
    );

    console.log(`✅ Received ${repos.length} repositories`);
    return repos;
  }

  /**
   * Check if repository has /doc folder
   * (Info already available from getRepositories)
   */
  async checkDocsFolderExists(repoId: string): Promise<boolean> {
    const repos = await this.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    return repo?.hasDocFolder ?? false;
  }

  /**
   * Fetch content from a specific repository
   */
  async getRepoContent(repoId: string): Promise<ContentFetchResult> {
    console.log(`🔄 Fetching content for repo: ${repoId}`);

    // Get repo name from ID
    const repos = await this.getRepositories();
    const repo = repos.find(r => r.id === repoId);

    if (!repo) {
      throw new APIError(404, `Repository not found: ${repoId}`);
    }

    // Fetch content from MCP Bridge
    const content = await this.fetchWithErrorHandling<ContentItem[]>(
      `${this.baseUrl}/api/content/${repo.name}`
    );

    console.log(`✅ Received ${content.length} content items`);

    return {
      content,
      skippedFiles: {}, // Bridge handles filtering
    };
  }

  /**
   * Fetch content from all repositories
   */
  async getAllContentWithSkipped(): Promise<ContentFetchResult> {
    console.log('🔄 Fetching all content from MCP Bridge');

    const content = await this.fetchWithErrorHandling<ContentItem[]>(
      `${this.baseUrl}/api/content/all`
    );

    console.log(`✅ Received ${content.length} total content items`);

    return {
      content,
      skippedFiles: {},
    };
  }

  /**
   * Filter content by type (client-side)
   */
  getContentByType(
    contentType: ContentType | null,
    content: ContentItem[]
  ): ContentItem[] {
    if (!contentType) return content;
    return content.filter(item => item.type === contentType);
  }

  /**
   * Get content item by ID
   */
  getContentById(id: string, content: ContentItem[]): ContentItem | undefined {
    return content.find(item => item.id === id);
  }

  /**
   * Get content metadata (file counts per repository)
   */
  async getContentMetadata(): Promise<Record<string, number>> {
    console.log('🔄 Fetching content metadata');

    const repos = await this.getRepositories();
    const metadata: Record<string, number> = {};

    for (const repo of repos.filter(r => r.hasDocFolder)) {
      try {
        const docs = await this.fetchWithErrorHandling<any[]>(
          `${this.baseUrl}/api/repos/${repo.name}/docs`
        );
        metadata[repo.id] = docs.length;
      } catch (error) {
        console.warn(`Failed to fetch metadata for ${repo.name}:`, error);
        metadata[repo.id] = 0;
      }
    }

    return metadata;
  }

  /**
   * Search documentation across organization
   */
  async searchDocumentation(query: string): Promise<any[]> {
    console.log(`🔍 Searching for: "${query}"`);

    const results = await this.fetchWithErrorHandling<any[]>(
      `${this.baseUrl}/api/search`,
      {
        method: 'POST',
        body: JSON.stringify({ query }),
      }
    );

    console.log(`✅ Found ${results.length} search results`);
    return results;
  }

  /**
   * Clear MCP Bridge cache
   */
  async clearCache(): Promise<void> {
    console.log('🗑️ Clearing MCP Bridge cache');

    await this.fetchWithErrorHandling(
      `${this.baseUrl}/api/cache/clear`,
      { method: 'POST' }
    );

    console.log('✅ Cache cleared');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    cache_size: number;
    mcp_connected: boolean;
  }> {
    return await this.fetchWithErrorHandling(
      `${this.baseUrl}/health`
    );
  }
}

// Export singleton instance
export const mcpService = new MCPService();

// Export default for compatibility
export default mcpService;
```

**Create the file:**
```bash
cat > src/utils/mcpService.ts << 'EOF'
[paste code above]
EOF
```

**Verification:**
```bash
npx tsc --noEmit
npm run build:dev
```

---

### Step 2.3: Update Service Exports (if applicable)

**What:** Update barrel exports to use mcpService

**Why:** Make imports consistent

**Location:** `src/utils/index.ts` (if it exists)

**If file exists, update to:**
```typescript
// Remove old export
// export { githubService } from './githubService';

// Add new export
export { mcpService } from './mcpService';
export { default as githubService } from './mcpService'; // Alias for compatibility
```

**Or create if it doesn't exist:**
```bash
cat > src/utils/index.ts << 'EOF'
export { mcpService } from './mcpService';
export { default as githubService } from './mcpService';
EOF
```

---

## Part 3: Update React Hooks (20-30 minutes)

### Step 3.1: Update useRepos Hook

**What:** Replace githubService with mcpService

**Why:** Use MCP Bridge for repository fetching

**Location:** `src/hooks/useRepos.tsx`

**Replace imports:**
```typescript
// Before
import { githubService } from '@/utils/githubService';

// After
import { mcpService } from '@/utils/mcpService';
```

**Updated Implementation:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';
import type { Repository } from '@/types';

/**
 * Hook to fetch repositories via MCP Bridge
 */
export const useRepos = () => {
  return useQuery<Repository[], Error>({
    queryKey: ['repositories'],
    queryFn: () => mcpService.getRepositories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**Commands:**
```bash
# Update the file
cat > src/hooks/useRepos.tsx << 'EOF'
[paste code above]
EOF
```

**Verification:**
```bash
npx tsc --noEmit
```

---

### Step 3.2: Update useContent Hook

**What:** Replace githubService with mcpService

**Why:** Use MCP Bridge for content fetching

**Location:** `src/hooks/useContent.tsx`

**Replace imports:**
```typescript
// Before
import { githubService } from '@/utils/githubService';

// After
import { mcpService } from '@/utils/mcpService';
```

**Updated Implementation:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { mcpService } from '@/utils/mcpService';
import type { ContentItem, ContentType } from '@/types';

/**
 * Hook to fetch and filter content via MCP Bridge
 */
export const useContent = (
  repoId: string | null,
  contentType: ContentType | null,
  searchQuery: string
) => {
  // Determine if we should fetch content
  const shouldFetch = !!repoId || contentType !== null || searchQuery !== '';

  // Fetch content via MCP Bridge
  const { data: fetchResult, ...queryState } = useQuery({
    queryKey: ['content', repoId || 'all'],
    queryFn: async () => {
      if (repoId) {
        return await mcpService.getRepoContent(repoId);
      } else {
        return await mcpService.getAllContentWithSkipped();
      }
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const allContent = fetchResult?.content || [];
  const skippedFiles = fetchResult?.skippedFiles || {};

  // Client-side filtering
  const filteredContent = useMemo(() => {
    let content = allContent;

    // Filter by content type
    if (contentType) {
      content = mcpService.getContentByType(contentType, content);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      content = content.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
      );
    }

    return content;
  }, [allContent, contentType, searchQuery]);

  return {
    content: filteredContent,
    skippedFiles,
    ...queryState,
  };
};
```

**Commands:**
```bash
cat > src/hooks/useContent.tsx << 'EOF'
[paste code above]
EOF
```

**Verification:**
```bash
npx tsc --noEmit
```

---

### Step 3.3: Update Other Hooks

**What:** Check for and update any other hooks using githubService

**Why:** Ensure consistency

**Find all hooks:**
```bash
grep -r "githubService" src/hooks/
```

**For each hook found, replace:**
```typescript
// Old import
import { githubService } from '@/utils/githubService';

// New import
import { mcpService } from '@/utils/mcpService';

// Update usage
// githubService.method() → mcpService.method()
```

---

## Part 4: Optional Enhancements (15-20 minutes)

### Step 4.1: Add MCP Status Indicator

**What:** Visual indicator showing MCP Bridge connection status

**Why:** Help users know if bridge is running

**Location:** Create `src/components/MCPStatusIndicator.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';

export const MCPStatusIndicator = () => {
  const { data: health } = useQuery({
    queryKey: ['mcp-health'],
    queryFn: () => mcpService.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  const isConnected = health?.mcp_connected ?? false;
  const cacheSize = health?.cache_size ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className="text-xs"
      >
        {isConnected ? '🔌 MCP Connected' : '⚠️ MCP Disconnected'}
      </Badge>

      {isConnected && (
        <span className="text-xs text-muted-foreground">
          Cache: {cacheSize} items
        </span>
      )}
    </div>
  );
};
```

**Usage (add to Header or Sidebar):**
```typescript
import { MCPStatusIndicator } from '@/components/MCPStatusIndicator';

export const Header = () => {
  return (
    <header>
      {/* ... other content ... */}
      <MCPStatusIndicator />
    </header>
  );
};
```

---

### Step 4.2: Add Cache Management

**What:** Button to manually clear MCP Bridge cache

**Why:** Useful for development and troubleshooting

**Location:** Create `src/components/ClearCacheButton.tsx`

```typescript
import { Button } from '@/components/ui/button';
import { mcpService } from '@/utils/mcpService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const ClearCacheButton = () => {
  const queryClient = useQueryClient();

  const handleClearCache = async () => {
    try {
      // Clear MCP Bridge cache
      await mcpService.clearCache();

      // Clear React Query cache
      queryClient.invalidateQueries();

      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
      console.error(error);
    }
  };

  return (
    <Button onClick={handleClearCache} variant="outline" size="sm">
      🗑️ Clear Cache
    </Button>
  );
};
```

---

## Part 5: Testing & Validation (20-30 minutes)

### Step 5.1: Startup Validation

**What:** Ensure services are running before testing

**Why:** Prevent confusion with connection errors

**Checklist:**
```bash
# 1. Start MCP Server
cd /home/user/GitHub_MCP_Server
source venv/bin/activate
python main.py &

# 2. Start MCP Bridge
cd /home/user/github-knowledge-vault/mcp-bridge
source venv/bin/activate
python main.py &

# 3. Verify both are running
curl http://localhost:3001/health
# Should return: {"status":"ok","cache_size":0,"mcp_connected":true}

# 4. Start Frontend
cd /home/user/github-knowledge-vault
npm run dev
```

---

### Step 5.2: Manual Testing Checklist

**Core Functionality:**

- [ ] **Application Loads**
  - Navigate to http://localhost:5173
  - No console errors
  - Application renders

- [ ] **Repository List**
  - Repositories load and display
  - Count matches expected
  - Click on repository works

- [ ] **Content Display**
  - Content files appear when repo selected
  - Correct file types shown
  - Click on file opens viewer

- [ ] **Content Filtering**
  - Filter by type (Markdown, Mermaid, etc.) works
  - Search functionality works
  - Results update correctly

- [ ] **Content Viewing**
  - Markdown renders correctly
  - Mermaid diagrams display
  - SVG images show
  - Postman/OpenAPI files render

- [ ] **Refresh Functionality**
  - Refresh button reloads data
  - Data updates correctly

**Security Verification:**

- [ ] **Network Tab Check**
  - Open DevTools → Network
  - Requests go to `localhost:3001` (NOT `api.github.com`)
  - No `Authorization` headers with GitHub tokens visible
  - All API calls proxied through bridge

**Performance:**

- [ ] **Cache Working**
  - First load: Slower (fetching from GitHub)
  - Second load: Faster (cached)
  - Check MCP Bridge logs for "Cache hit" messages

**Error Handling:**

- [ ] **Bridge Offline**
  - Stop MCP Bridge: `pkill -f "python main.py"`
  - Frontend shows appropriate error
  - Error message is user-friendly

- [ ] **Bridge Recovery**
  - Restart MCP Bridge
  - Frontend recovers and works again

---

### Step 5.3: Automated Test Script

**What:** Quick script to verify everything works

**Why:** Fast validation of integration

**Create `scripts/test-mcp-integration.sh`:**
```bash
#!/bin/bash

echo "🧪 Testing MCP Integration"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test MCP Bridge health
echo "1️⃣  Testing MCP Bridge health..."
HEALTH=$(curl -s http://localhost:3001/health)
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
REPOS=$(curl -s http://localhost:3001/api/repos)
if [ $? -eq 0 ]; then
    REPO_COUNT=$(echo $REPOS | jq '. | length' 2>/dev/null || echo "unknown")
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
```

**Make executable and run:**
```bash
chmod +x scripts/test-mcp-integration.sh
./scripts/test-mcp-integration.sh
```

---

### Step 5.4: Remove Old GitHub Service

**What:** Delete the old githubService.ts file

**Why:** Prevent accidental usage, clean up codebase

**Commands:**
```bash
# Verify no imports remain
grep -r "githubService" src/ | grep -v "mcpService"
# Should show only exports/re-exports, not imports

# If clean, remove old service
rm src/utils/githubService.ts

# Remove backup if everything works
rm src/utils/githubService.ts.backup
```

---

## Part 6: Production Deployment (20-30 minutes)

### Step 6.1: Production Environment Variables

**What:** Configure production MCP Bridge URL

**Why:** Connect to production infrastructure

**Create `.env.production`:**
```bash
cat > .env.production << 'EOF'
VITE_MCP_BRIDGE_URL=https://mcp-bridge.yourdomain.com
VITE_GITHUB_ORGANIZATION=your-org-name
EOF
```

**Build for production:**
```bash
npm run build -- --mode production
```

---

### Step 6.2: Docker Configuration

**What:** Update Dockerfile for production

**Why:** Containerized deployment

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build arguments
ARG VITE_MCP_BRIDGE_URL
ARG VITE_GITHUB_ORGANIZATION

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (if you have custom config)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build:**
```bash
docker build \
  --build-arg VITE_MCP_BRIDGE_URL=http://mcp-bridge:3001 \
  --build-arg VITE_GITHUB_ORGANIZATION=your-org \
  -t github-knowledge-vault-frontend \
  .
```

---

### Step 6.3: Complete Docker Compose

**What:** Orchestrate all services

**Why:** Single-command deployment

**Updated `docker-compose.yml` (project root):**
```yaml
version: '3.8'

services:
  # MCP Server
  mcp-server:
    build: ../GitHub_MCP_Server
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_API_BASE_URL=https://api.github.com
    networks:
      - mcp-network
    restart: unless-stopped

  # MCP Bridge
  mcp-bridge:
    build: ./mcp-bridge
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - GITHUB_ORGANIZATION=${GITHUB_ORGANIZATION}
      - MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
      - CACHE_TTL_SECONDS=300
      - CACHE_ENABLED=true
      - CORS_ORIGINS=http://localhost,https://yourdomain.com
      - LOG_LEVEL=INFO
    depends_on:
      - mcp-server
    networks:
      - mcp-network
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_MCP_BRIDGE_URL=http://mcp-bridge:3001
        - VITE_GITHUB_ORGANIZATION=${GITHUB_ORGANIZATION}
    ports:
      - "80:80"
    depends_on:
      - mcp-bridge
    networks:
      - mcp-network
    restart: unless-stopped

networks:
  mcp-network:
    driver: bridge
```

**Create `.env` for Docker Compose:**
```bash
cat > .env << 'EOF'
GITHUB_TOKEN=ghp_your_actual_token
GITHUB_ORGANIZATION=your-org-name
EOF
```

**Run all services:**
```bash
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## Part 7: Documentation & Cleanup (15 minutes)

### Step 7.1: Update Project README

**What:** Document new MCP architecture

**Why:** Help team understand changes

**Add to `README.md`:**

```markdown
## Architecture

This application uses a 3-tier MCP architecture:

```
React Frontend → MCP Bridge (FastAPI) → MCP Server (FastMCP) → GitHub API
```

### Security

✅ **GitHub token is now secure** - stored only on backend, never exposed in browser

### Development Setup

**Prerequisites:**
- Python 3.10+
- Node.js 18+
- GitHub personal access token

**Steps:**

1. **Start MCP Server:**
   ```bash
   cd ../GitHub_MCP_Server
   source venv/bin/activate
   python main.py
   ```

2. **Start MCP Bridge:**
   ```bash
   cd mcp-bridge
   source venv/bin/activate
   python main.py
   ```

3. **Start Frontend:**
   ```bash
   npm run dev
   ```

**Quick Start (Docker):**
```bash
docker-compose up
```

### Environment Variables

**Frontend** (`.env`):
```bash
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
```

**No GitHub token needed in frontend!**

### Troubleshooting

**"Cannot connect to MCP Bridge"**
- Check MCP Bridge is running: `curl http://localhost:3001/health`
- Check VITE_MCP_BRIDGE_URL in .env
- Restart frontend dev server

**"No repositories showing"**
- Check MCP Bridge logs for errors
- Verify organization name is correct
- Test bridge directly: `curl http://localhost:3001/api/repos`
```

---

### Step 7.2: Update package.json Scripts

**What:** Add helpful npm scripts

**Why:** Simplify development workflow

**Add to `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",

    "dev:bridge": "cd mcp-bridge && source venv/bin/activate && python main.py",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:bridge\"",

    "test:integration": "./scripts/test-mcp-integration.sh",

    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

**Install concurrently if needed:**
```bash
npm install -D concurrently
```

**Usage:**
```bash
# Start both frontend and bridge
npm run dev:all

# Run integration tests
npm run test:integration

# Docker commands
npm run docker:up
npm run docker:logs
```

---

### Step 7.3: Final Git Commit

**What:** Commit all changes

**Why:** Version control

```bash
cd /home/user/github-knowledge-vault

git add .

git commit -m "feat: Replace GitHub API with MCP Bridge integration

Complete migration from direct GitHub API to MCP Bridge architecture.

BREAKING CHANGES:
- Requires MCP Bridge to be running
- Removed VITE_GITHUB_TOKEN (now on backend)
- Removed githubService.ts (replaced with mcpService.ts)

Changes:
- Replace all GitHub API calls with MCP Bridge REST API
- Create mcpService.ts for MCP Bridge communication
- Update all hooks (useRepos, useContent) to use mcpService
- Simplify configuration (only MCP Bridge URL needed)
- Add MCP status indicator component
- Add cache management functionality
- Update environment variables
- Remove GitHub token from frontend (security improvement)
- Add Docker Compose orchestration
- Update documentation

New Architecture:
React → MCP Bridge (FastAPI) → MCP Server (FastMCP) → GitHub API

Security: GitHub token now secure on backend only
Performance: 5-minute caching on bridge layer
Features: All existing functionality maintained

Testing: Manual testing checklist passed
Deployment: Docker Compose ready"

git push
```

---

## Verification Checklist

**Before marking complete:**

- [ ] Environment variables updated (no GitHub token)
- [ ] `.env.example` updated
- [ ] `src/config/github.ts` simplified
- [ ] `src/utils/mcpService.ts` created
- [ ] All hooks updated to use mcpService
- [ ] Old `githubService.ts` deleted
- [ ] TypeScript compiles without errors
- [ ] Frontend runs (`npm run dev`)
- [ ] Repositories load from MCP Bridge
- [ ] Content loads correctly
- [ ] Filters and search work
- [ ] **No GitHub token in Network tab** ✅
- [ ] Requests go to `localhost:3001` only
- [ ] MCP status indicator works (if added)
- [ ] Cache is functioning
- [ ] Error handling works
- [ ] Production build succeeds
- [ ] Docker Compose works
- [ ] README updated
- [ ] Team notified

---

## Troubleshooting

### Issue: "Cannot connect to MCP Bridge"

**Cause:** Bridge not running or wrong URL

**Solution:**
```bash
# Check bridge is running
curl http://localhost:3001/health

# Check .env has correct URL
cat .env | grep VITE_MCP_BRIDGE_URL

# Restart dev server (env changes need restart)
npm run dev
```

---

### Issue: "Configuration error: Missing VITE_GITHUB_ORGANIZATION"

**Cause:** Environment variable not set

**Solution:**
```bash
# Check .env
cat .env

# Should have:
# VITE_GITHUB_ORGANIZATION=your-org-name

# Restart dev server
npm run dev
```

---

### Issue: "No repositories showing"

**Cause:** Organization name incorrect or MCP Server issue

**Solution:**
```bash
# Test bridge directly
curl http://localhost:3001/api/repos

# Check bridge logs
cd mcp-bridge
# Look for errors

# Verify organization name
cat .env | grep GITHUB_ORGANIZATION
```

---

### Issue: "TypeScript errors"

**Cause:** Missing types or import errors

**Solution:**
```bash
# Reinstall dependencies
npm install

# Check for import errors
npx tsc --noEmit

# Restart TypeScript server in IDE
```

---

### Issue: "Old GitHub service still being used"

**Cause:** Cached imports or not all files updated

**Solution:**
```bash
# Find any remaining imports
grep -r "from '@/utils/githubService'" src/

# Update any files found
# Replace with: from '@/utils/mcpService'

# Clear build cache
rm -rf node_modules/.vite
npm run dev
```

---

## Performance Expectations

### Expected Behavior

**First Load:**
- Slightly slower than before (extra hop to bridge)
- ~500ms - 2s for repositories
- ~1-3s for content

**Subsequent Loads (Cached):**
- Much faster (bridge cache)
- ~50-200ms for repositories
- ~100-500ms for content

**Cache Benefits:**
- 5-minute TTL on bridge
- Reduces GitHub API calls by ~80%
- Better rate limit management

---

## Time Breakdown Summary

| Part | Task | Time |
|------|------|------|
| 1 | Configuration & Environment | 15 min |
| 2 | MCP Service Implementation | 30-40 min |
| 3 | Update Hooks | 20-30 min |
| 4 | Optional Enhancements | 15-20 min |
| 5 | Testing & Validation | 20-30 min |
| 6 | Production Deployment | 20-30 min |
| 7 | Documentation | 15 min |
| **Total** | | **~2-3 hours** |

**Faster than gradual migration approach** because:
- No feature flag logic
- No backward compatibility code
- Simpler configuration
- Direct replacement

---

## What You've Accomplished 🎉

✅ **Security:** GitHub token removed from frontend completely

✅ **Architecture:** Clean 3-tier MCP architecture implemented

✅ **Simplicity:** No feature flags or backward compatibility complexity

✅ **Performance:** Server-side caching improves response times

✅ **Maintainability:** Single service (mcpService) to maintain

✅ **Production Ready:** Docker Compose configuration complete

**Result:**
```
Before: React → GitHub API (token in browser ❌)
After:  React → MCP Bridge → MCP Server → GitHub API (token secure ✅)
```

---

## Next Steps

**Immediate:**
1. Test thoroughly in development
2. Monitor for any edge cases
3. Verify all features work

**Soon:**
1. Deploy to staging environment
2. Performance monitoring
3. Error tracking setup

**Future Enhancements:**
1. Add Redis cache to bridge
2. Implement WebSocket for real-time updates
3. Add Claude AI integration
4. Advanced monitoring/analytics

---

**You're ready for production!** 🚀
