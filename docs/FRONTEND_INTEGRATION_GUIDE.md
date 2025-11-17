# Frontend Integration - Detailed Step-by-Step Guide

## Overview

This guide provides granular, step-by-step instructions for integrating the React frontend with the MCP Bridge. We'll replace direct GitHub API calls with MCP Bridge REST API calls while maintaining all existing functionality.

**Strategy:** Feature-flag based gradual migration for safe rollback

**Estimated Total Time:** 2-3 hours
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

---

## Part 1: Configuration & Environment (20 minutes)

### Step 1.1: Update Environment Variables

**What:** Add MCP Bridge configuration and remove GitHub token from frontend

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
# MCP Bridge Configuration (Primary)
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
VITE_USE_MCP=true

# Legacy GitHub API Configuration (Fallback - optional during migration)
VITE_GITHUB_OWNER=your-org-name
VITE_GITHUB_OWNER_TYPE=org
VITE_GITHUB_API_BASE_URL=https://api.github.com
# VITE_GITHUB_TOKEN=ghp_xxx  # ✅ Remove or comment out - not needed with MCP!
```

**Key Changes:**
- ✅ `VITE_MCP_BRIDGE_URL` - Where frontend connects to
- ✅ `VITE_GITHUB_ORGANIZATION` - Org name (used by bridge)
- ✅ `VITE_USE_MCP` - Feature flag for gradual migration
- ❌ `VITE_GITHUB_TOKEN` - **REMOVE** (stays on backend only)

**Commands:**
```bash
cd /home/user/github-knowledge-vault

# Backup existing .env
cp .env .env.backup

# Edit .env
cat >> .env << 'EOF'

# MCP Bridge Configuration
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
VITE_USE_MCP=true
EOF

# Optional: Comment out VITE_GITHUB_TOKEN
sed -i 's/^VITE_GITHUB_TOKEN=/#VITE_GITHUB_TOKEN=/' .env
```

**Verification:**
```bash
cat .env | grep -E "VITE_MCP|VITE_USE_MCP"
# Should show MCP configuration

cat .env | grep "^VITE_GITHUB_TOKEN"
# Should return nothing (commented out)
```

---

### Step 1.2: Update .env.example

**What:** Document new environment variables for other developers

**Why:** Help team members configure their local environment

**Add to `.env.example`:**
```bash
# MCP Bridge Configuration (Recommended)
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-or-username
VITE_USE_MCP=true

# Legacy GitHub API Configuration (Optional - for fallback)
VITE_GITHUB_OWNER=your-org-or-username
VITE_GITHUB_OWNER_TYPE=org
VITE_GITHUB_API_BASE_URL=https://api.github.com
# VITE_GITHUB_TOKEN=ghp_your_token_here  # Not needed when using MCP
```

**Commands:**
```bash
cat > .env.example << 'EOF'
# MCP Bridge Configuration (Recommended)
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-or-username
VITE_USE_MCP=true

# Legacy GitHub API Configuration (Optional - for fallback)
VITE_GITHUB_OWNER=your-org-or-username
VITE_GITHUB_OWNER_TYPE=org
VITE_GITHUB_API_BASE_URL=https://api.github.com
# VITE_GITHUB_TOKEN=  # Not needed when using MCP
EOF
```

---

### Step 1.3: Update GitHub Configuration File

**What:** Add MCP-related configuration to `src/config/github.ts`

**Why:** Centralize all configuration, enable feature flagging

**Location:** `src/config/github.ts`

**Read current file:**
```bash
cat src/config/github.ts
```

**Update to:**
```typescript
/**
 * GitHub and MCP Bridge Configuration
 * Supports both direct GitHub API and MCP Bridge modes
 */

export const githubConfig = {
  // MCP Bridge Configuration (Primary)
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_URL || 'http://localhost:3001',
  organization: import.meta.env.VITE_GITHUB_ORGANIZATION || '',

  // Feature flag for gradual migration
  useMCP: import.meta.env.VITE_USE_MCP === 'true',

  // Legacy GitHub API Configuration (Fallback)
  owner: import.meta.env.VITE_GITHUB_OWNER || '',
  ownerType: import.meta.env.VITE_GITHUB_OWNER_TYPE as 'org' | 'user' || 'org',
  apiBaseUrl: import.meta.env.VITE_GITHUB_API_BASE_URL || 'https://api.github.com',
  token: import.meta.env.VITE_GITHUB_TOKEN || '',
} as const;

// Validation
if (githubConfig.useMCP && !githubConfig.organization) {
  console.warn('⚠️ VITE_GITHUB_ORGANIZATION is not set but VITE_USE_MCP is true');
}

if (!githubConfig.useMCP && !githubConfig.token) {
  console.warn('⚠️ VITE_GITHUB_TOKEN is not set and MCP is disabled');
}

// Log configuration (development only)
if (import.meta.env.DEV) {
  console.log('📋 Configuration:', {
    mode: githubConfig.useMCP ? 'MCP Bridge' : 'Direct GitHub API',
    mcpBridgeUrl: githubConfig.mcpBridgeUrl,
    organization: githubConfig.organization,
    tokenPresent: githubConfig.useMCP ? 'N/A (server-side)' : !!githubConfig.token,
  });
}
```

**Key Features:**
- Feature flag (`useMCP`) to switch between modes
- Validation warnings in development
- Clear separation of MCP vs legacy config
- Development logging for debugging

**Verification:**
```bash
# Check TypeScript compiles
npm run build:dev

# Should see no errors
```

---

## Part 2: Create MCP Service Layer (45-60 minutes)

### Step 2.1: Create MCP Service File

**What:** Create new service that calls MCP Bridge API

**Why:** Encapsulate MCP Bridge communication, maintain same interface as githubService

**Location:** Create `src/utils/mcpService.ts`

**Full Implementation:**
```typescript
/**
 * MCP Service - REST API client for MCP Bridge
 *
 * Provides the same interface as githubService but calls MCP Bridge
 * instead of GitHub API directly.
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
   * Maps to: GET /api/repos
   */
  async getRepositories(): Promise<Repository[]> {
    console.log('🔄 Fetching repositories from MCP Bridge');

    const repos = await this.fetchWithErrorHandling<Repository[]>(
      `${this.baseUrl}/api/repos`
    );

    console.log(`✅ Received ${repos.length} repositories from MCP Bridge`);
    return repos;
  }

  /**
   * Check if repository has /doc folder
   * Not needed with MCP Bridge (hasDocFolder comes from API)
   */
  async checkDocsFolderExists(repoId: string): Promise<boolean> {
    // With MCP, this info comes from getRepositories
    const repos = await this.getRepositories();
    const repo = repos.find(r => r.id === repoId);
    return repo?.hasDocFolder ?? false;
  }

  /**
   * Fetch content from a specific repository
   * Maps to: GET /api/content/{repo_name}
   */
  async getRepoContent(repoId: string): Promise<ContentFetchResult> {
    console.log(`🔄 Fetching content for repo: ${repoId}`);

    // First, get repo name from ID
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

    // MCP Bridge handles file filtering server-side
    return {
      content,
      skippedFiles: {}, // Bridge filters files, so no skipped files
    };
  }

  /**
   * Fetch content from all repositories with /doc folders
   * Maps to: GET /api/content/all
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
   * Same interface as githubService
   */
  getContentByType(
    contentType: ContentType | null,
    content: ContentItem[]
  ): ContentItem[] {
    if (!contentType) return content;
    return content.filter(item => item.type === contentType);
  }

  /**
   * Get content item by ID (client-side)
   * Same interface as githubService
   */
  getContentById(id: string, content: ContentItem[]): ContentItem | undefined {
    return content.find(item => item.id === id);
  }

  /**
   * Get content metadata (file counts per repository)
   * Lightweight version - just counts, no content
   */
  async getContentMetadata(): Promise<Record<string, number>> {
    console.log('🔄 Fetching content metadata from MCP Bridge');

    const repos = await this.getRepositories();
    const metadata: Record<string, number> = {};

    // Fetch doc counts for each repo with /doc folder
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
   * Maps to: POST /api/search
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
   * Maps to: POST /api/cache/clear
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
   * Maps to: GET /health
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
```

**Key Points:**
- ✅ Same interface as existing `githubService` (drop-in replacement)
- ✅ Proper error handling with `APIError` and `NetworkError`
- ✅ Comprehensive logging for debugging
- ✅ Type-safe with TypeScript
- ✅ Singleton pattern (one instance)

**Create the file:**
```bash
cat > src/utils/mcpService.ts << 'EOF'
[paste the code above]
EOF
```

**Verification:**
```bash
# Check TypeScript compiles
npm run build:dev

# Check for syntax errors
npx tsc --noEmit
```

---

### Step 2.2: Update Service Index (if exists)

**What:** Export mcpService alongside githubService

**Why:** Make it easy to import either service

**Location:** `src/utils/index.ts` (if it exists)

**If file exists, add:**
```typescript
export { githubService } from './githubService';
export { mcpService } from './mcpService';
```

**If file doesn't exist, skip this step.**

---

## Part 3: Update React Hooks (30-45 minutes)

### Step 3.1: Update useRepos Hook

**What:** Modify hook to use either MCP or GitHub service based on feature flag

**Why:** Enable gradual migration with safe rollback

**Location:** `src/hooks/useRepos.tsx`

**Read current implementation:**
```bash
cat src/hooks/useRepos.tsx
```

**Updated Implementation:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { githubService } from '@/utils/githubService';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';
import type { Repository } from '@/types';

/**
 * Hook to fetch repositories
 *
 * Automatically uses MCP Bridge or GitHub API based on configuration
 */
export const useRepos = () => {
  // Select service based on feature flag
  const service = githubConfig.useMCP ? mcpService : githubService;

  console.log(`🔧 useRepos using: ${githubConfig.useMCP ? 'MCP Bridge' : 'GitHub API'}`);

  return useQuery<Repository[], Error>({
    queryKey: ['repositories'],
    queryFn: () => service.getRepositories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**Key Changes:**
- Line 2-3: Import both services
- Line 13: Select service based on `githubConfig.useMCP`
- Line 15: Debug logging to show which service is used
- Rest: Unchanged (same query configuration)

**Verification:**
```bash
# Check TypeScript
npx tsc --noEmit

# Check no breaking changes
npm run build:dev
```

---

### Step 3.2: Update useContent Hook

**What:** Modify content hook to use MCP or GitHub service

**Why:** Fetch content from MCP Bridge instead of GitHub directly

**Location:** `src/hooks/useContent.tsx`

**Read current implementation:**
```bash
cat src/hooks/useContent.tsx
```

**Updated Implementation:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { githubService } from '@/utils/githubService';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';
import type { ContentItem, ContentType } from '@/types';

/**
 * Hook to fetch and filter content
 *
 * Features:
 * - Lazy loading (only fetches when needed)
 * - Client-side filtering by type and search query
 * - Debounced search
 * - Automatic service selection (MCP vs GitHub)
 */
export const useContent = (
  repoId: string | null,
  contentType: ContentType | null,
  searchQuery: string
) => {
  // Select service based on feature flag
  const service = githubConfig.useMCP ? mcpService : githubService;

  console.log(`🔧 useContent using: ${githubConfig.useMCP ? 'MCP Bridge' : 'GitHub API'}`);

  // Determine if we should fetch content
  const shouldFetch = !!repoId || contentType !== null || searchQuery !== '';

  // Fetch content
  const { data: fetchResult, ...queryState } = useQuery({
    queryKey: ['content', repoId || 'all'],
    queryFn: async () => {
      if (repoId) {
        // Fetch specific repo content
        return await service.getRepoContent(repoId);
      } else {
        // Fetch all content
        return await service.getAllContentWithSkipped();
      }
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Extract content and skipped files from result
  const allContent = fetchResult?.content || [];
  const skippedFiles = fetchResult?.skippedFiles || {};

  // Client-side filtering
  const filteredContent = useMemo(() => {
    let content = allContent;

    // Filter by content type
    if (contentType) {
      content = service.getContentByType(contentType, content);
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
  }, [allContent, contentType, searchQuery, service]);

  return {
    content: filteredContent,
    skippedFiles,
    ...queryState,
  };
};
```

**Key Changes:**
- Line 3-5: Import both services
- Line 23: Select service based on feature flag
- Line 25: Debug logging
- Line 35-41: Use selected service's methods
- Line 54-56: Use service's `getContentByType` method
- Rest: Unchanged

**Verification:**
```bash
npx tsc --noEmit
npm run build:dev
```

---

### Step 3.3: Update Other Hooks (if any)

**What:** Check if other hooks use githubService

**Why:** Ensure consistency across all hooks

**Check for other hooks:**
```bash
# Find all hooks that import githubService
grep -r "githubService" src/hooks/
```

**For each hook found:**
1. Import both services
2. Add service selection based on feature flag
3. Replace `githubService` with `service` variable
4. Test

**Common pattern:**
```typescript
import { githubService } from '@/utils/githubService';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';

export const useYourHook = () => {
  const service = githubConfig.useMCP ? mcpService : githubService;

  // Use 'service' instead of 'githubService'
  // ...
};
```

---

## Part 4: Component Updates (Optional) (20-30 minutes)

### Step 4.1: Add MCP Status Indicator

**What:** Create component to show if MCP is enabled

**Why:** Visual feedback for developers/users

**Location:** Create `src/components/MCPStatusIndicator.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { githubConfig } from '@/config/github';
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';

export const MCPStatusIndicator = () => {
  // Don't show if MCP is disabled
  if (!githubConfig.useMCP) {
    return null;
  }

  // Health check query
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

**Usage in Header/Sidebar:**
```typescript
import { MCPStatusIndicator } from '@/components/MCPStatusIndicator';

export const Header = () => {
  return (
    <header>
      {/* ... other header content ... */}
      <MCPStatusIndicator />
    </header>
  );
};
```

---

### Step 4.2: Add Cache Clear Button (Optional)

**What:** Allow users to manually clear MCP Bridge cache

**Why:** Useful for development and troubleshooting

**Location:** Add to settings or header

```typescript
import { Button } from '@/components/ui/button';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const ClearCacheButton = () => {
  const queryClient = useQueryClient();

  if (!githubConfig.useMCP) {
    return null;
  }

  const handleClearCache = async () => {
    try {
      // Clear MCP Bridge cache
      await mcpService.clearCache();

      // Clear React Query cache
      queryClient.invalidateQueries();

      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
      console.error('Cache clear error:', error);
    }
  };

  return (
    <Button
      onClick={handleClearCache}
      variant="outline"
      size="sm"
    >
      🗑️ Clear Cache
    </Button>
  );
};
```

---

## Part 5: Testing & Validation (30-45 minutes)

### Step 5.1: Environment Validation Script

**What:** Create script to validate environment is configured correctly

**Why:** Catch configuration issues before runtime

**Location:** Create `src/utils/validateConfig.ts`

```typescript
/**
 * Configuration Validation
 * Validates environment variables at startup
 */

import { githubConfig } from '@/config/github';

export function validateConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // MCP Mode validation
  if (githubConfig.useMCP) {
    if (!githubConfig.mcpBridgeUrl) {
      errors.push('VITE_MCP_BRIDGE_URL is required when VITE_USE_MCP=true');
    }

    if (!githubConfig.organization) {
      errors.push('VITE_GITHUB_ORGANIZATION is required when VITE_USE_MCP=true');
    }

    if (githubConfig.token) {
      warnings.push('VITE_GITHUB_TOKEN is set but not needed in MCP mode');
    }
  } else {
    // GitHub API mode validation
    if (!githubConfig.token) {
      errors.push('VITE_GITHUB_TOKEN is required when not using MCP');
    }

    if (!githubConfig.owner) {
      errors.push('VITE_GITHUB_OWNER is required when not using MCP');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Auto-validate in development
if (import.meta.env.DEV) {
  const result = validateConfiguration();

  if (result.errors.length > 0) {
    console.error('❌ Configuration Errors:');
    result.errors.forEach(err => console.error(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:');
    result.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  if (result.isValid) {
    console.log('✅ Configuration valid');
  }
}
```

**Import in `src/main.tsx`:**
```typescript
import './utils/validateConfig'; // Add this line at the top
```

---

### Step 5.2: Manual Testing Checklist

**What:** Test all functionality with MCP enabled

**Why:** Ensure nothing broke during migration

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

# 3. Start Frontend
cd /home/user/github-knowledge-vault
npm run dev
```

**Test Cases:**

- [ ] **Page Loads**
  - Navigate to http://localhost:5173
  - No console errors
  - MCP status indicator shows "Connected"

- [ ] **Repository List**
  - Repositories load and display
  - Count matches expected
  - "hasDocFolder" flag works

- [ ] **Content Filtering**
  - Click on a repository
  - Documentation files appear
  - Filter by type (Markdown, Mermaid, etc.)
  - Search works

- [ ] **Content Viewing**
  - Click on a file
  - Content loads and renders
  - Markdown renders correctly
  - Mermaid diagrams render
  - SVG images display

- [ ] **Search**
  - Use search bar
  - Results appear
  - Results are relevant

- [ ] **Refresh**
  - Click refresh button
  - Data reloads
  - Cache works (second load faster)

- [ ] **Network Tab**
  - Open DevTools → Network
  - Requests go to `localhost:3001` (not api.github.com)
  - No authorization headers with GitHub token visible

- [ ] **Error Handling**
  - Stop MCP Bridge
  - Frontend shows appropriate error
  - Restart bridge
  - Frontend recovers

**Verification Script:**

Create `scripts/test-frontend.sh`:
```bash
#!/bin/bash

echo "🧪 Testing Frontend MCP Integration"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test MCP Bridge is running
echo "1. Checking MCP Bridge..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} MCP Bridge is running"
else
    echo -e "${RED}✗${NC} MCP Bridge is not running"
    exit 1
fi

# Test repositories endpoint
echo "2. Testing repositories endpoint..."
REPOS=$(curl -s http://localhost:3001/api/repos)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Repositories endpoint works"
else
    echo -e "${RED}✗${NC} Repositories endpoint failed"
    exit 1
fi

# Test frontend is running
echo "3. Checking Frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${RED}✗${NC} Frontend is not running"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:5173 in browser"
echo "  2. Open DevTools → Console"
echo "  3. Check for 'MCP Bridge' in logs"
echo "  4. Open DevTools → Network"
echo "  5. Verify requests go to localhost:3001"
```

Make executable and run:
```bash
chmod +x scripts/test-frontend.sh
./scripts/test-frontend.sh
```

---

### Step 5.3: Automated E2E Tests (Optional)

**What:** Playwright or Cypress tests for MCP integration

**Why:** Automated regression testing

**Example with Playwright:**

Create `tests/e2e/mcp-integration.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('MCP Integration', () => {
  test('should load repositories from MCP Bridge', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for repositories to load
    await page.waitForSelector('[data-testid="repository-list"]');

    // Check repositories are displayed
    const repos = await page.locator('[data-testid="repository-item"]').count();
    expect(repos).toBeGreaterThan(0);
  });

  test('should fetch content via MCP Bridge', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click first repository
    await page.click('[data-testid="repository-item"]:first-child');

    // Wait for content to load
    await page.waitForSelector('[data-testid="content-item"]');

    // Verify content loaded
    const content = await page.locator('[data-testid="content-item"]').count();
    expect(content).toBeGreaterThan(0);
  });

  test('should not expose GitHub token', async ({ page }) => {
    // Intercept network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Verify no requests to api.github.com
    const githubRequests = requests.filter(url => url.includes('api.github.com'));
    expect(githubRequests.length).toBe(0);

    // Verify requests go to MCP Bridge
    const mcpRequests = requests.filter(url => url.includes('localhost:3001'));
    expect(mcpRequests.length).toBeGreaterThan(0);
  });
});
```

---

## Part 6: Migration Strategy & Rollback (15 minutes)

### Step 6.1: Feature Flag Testing

**What:** Test both MCP and direct GitHub modes

**Why:** Ensure rollback capability if issues arise

**Test MCP Mode:**
```bash
# .env
VITE_USE_MCP=true

# Restart dev server
npm run dev

# Test thoroughly
```

**Test GitHub Mode (Fallback):**
```bash
# .env
VITE_USE_MCP=false
VITE_GITHUB_TOKEN=ghp_your_token  # Temporarily uncomment

# Restart dev server
npm run dev

# Verify same functionality
```

**Comparison Test:**
```bash
# Create script: scripts/compare-modes.sh
#!/bin/bash

echo "Testing both modes..."

# Test MCP mode
echo "VITE_USE_MCP=true" > .env.test
npm run dev &
PID1=$!
sleep 5
curl http://localhost:5173 > /tmp/mcp-output.html
kill $PID1

# Test GitHub mode
echo "VITE_USE_MCP=false" > .env.test
npm run dev &
PID2=$!
sleep 5
curl http://localhost:5173 > /tmp/github-output.html
kill $PID2

# Compare outputs
diff /tmp/mcp-output.html /tmp/github-output.html
```

---

### Step 6.2: Rollback Plan

**What:** Document how to quickly rollback if needed

**Why:** Safety net for production issues

**Rollback Steps:**

**Option 1: Feature Flag (Instant)**
```bash
# Change .env
VITE_USE_MCP=false

# Restart frontend
# No code changes needed!
```

**Option 2: Git Revert**
```bash
# Revert to previous commit
git revert HEAD

# Rebuild and deploy
npm run build
```

**Option 3: Environment Variable Override**
```bash
# Production deployment
docker run -e VITE_USE_MCP=false your-frontend-image
```

---

## Part 7: Production Deployment (30 minutes)

### Step 7.1: Update Build Configuration

**What:** Ensure production build includes MCP configuration

**Why:** Proper production deployment

**Check `vite.config.ts`:**

No changes needed - Vite automatically includes `VITE_*` variables.

**Verify:**
```bash
npm run build

# Check built files reference MCP Bridge
grep -r "localhost:3001" dist/
# Should find references (will be overridden by production env)
```

---

### Step 7.2: Production Environment Variables

**What:** Configure production environment

**Why:** Connect to production MCP Bridge

**Production `.env.production`:**
```bash
VITE_MCP_BRIDGE_URL=https://mcp-bridge.yourdomain.com
VITE_GITHUB_ORGANIZATION=your-org-name
VITE_USE_MCP=true
```

**Build for production:**
```bash
npm run build -- --mode production

# Or with inline env
VITE_MCP_BRIDGE_URL=https://mcp-bridge.yourdomain.com npm run build
```

---

### Step 7.3: Docker Configuration (if using)

**What:** Update Dockerfile for MCP mode

**Why:** Production containerization

**Dockerfile (Multi-stage for frontend):**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with production env
ARG VITE_MCP_BRIDGE_URL
ARG VITE_GITHUB_ORGANIZATION
ARG VITE_USE_MCP=true

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

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

### Step 7.4: Complete docker-compose.yml

**What:** Orchestrate all services together

**Why:** Single-command deployment

**Updated `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  # MCP Server (separate repo)
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
    depends_on:
      - mcp-server
    networks:
      - mcp-network
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: .
      args:
        - VITE_MCP_BRIDGE_URL=http://mcp-bridge:3001
        - VITE_GITHUB_ORGANIZATION=${GITHUB_ORGANIZATION}
        - VITE_USE_MCP=true
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

**Run:**
```bash
# Create .env with secrets
cat > .env << EOF
GITHUB_TOKEN=ghp_your_token
GITHUB_ORGANIZATION=your-org
EOF

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## Part 8: Documentation & Finalization (20 minutes)

### Step 8.1: Update Project README

**What:** Document MCP integration in main README

**Why:** Help team understand new architecture

**Add to `README.md`:**

```markdown
## Architecture

This application uses a 3-tier architecture:

```
React Frontend → MCP Bridge (FastAPI) → MCP Server (FastMCP) → GitHub API
```

### Security Improvement

✅ **GitHub token is now secure on the backend** - no longer exposed in browser

### Development Setup

1. Start MCP Server:
   ```bash
   cd ../GitHub_MCP_Server
   source venv/bin/activate
   python main.py
   ```

2. Start MCP Bridge:
   ```bash
   cd mcp-bridge
   source venv/bin/activate
   python main.py
   ```

3. Start Frontend:
   ```bash
   npm run dev
   ```

### Environment Variables

```bash
# MCP Mode (Recommended)
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
VITE_USE_MCP=true

# Legacy Mode (Fallback)
VITE_USE_MCP=false
VITE_GITHUB_TOKEN=ghp_xxx
```

### Feature Flag

Toggle between MCP and direct GitHub API:
- `VITE_USE_MCP=true` - Use MCP Bridge (secure, recommended)
- `VITE_USE_MCP=false` - Direct GitHub API (legacy, requires token in browser)
```

---

### Step 8.2: Create Migration Checklist

**What:** Checklist for team to verify migration

**Why:** Ensure nothing is missed

**Create `docs/MIGRATION_CHECKLIST.md`:**

```markdown
# Frontend MCP Migration Checklist

## Pre-Migration

- [ ] MCP Server implemented and tested
- [ ] MCP Bridge implemented and tested
- [ ] Both services running locally
- [ ] All endpoints tested with curl/Postman

## Code Changes

- [ ] `.env` updated with MCP configuration
- [ ] `.env.example` updated with new variables
- [ ] `src/config/github.ts` updated with MCP config
- [ ] `src/utils/mcpService.ts` created
- [ ] `src/hooks/useRepos.tsx` updated
- [ ] `src/hooks/useContent.tsx` updated
- [ ] Other hooks updated (if any)
- [ ] Configuration validation added
- [ ] TypeScript compiles without errors

## Testing

- [ ] Manual testing completed
- [ ] All features work with VITE_USE_MCP=true
- [ ] All features work with VITE_USE_MCP=false (fallback)
- [ ] No GitHub token in browser Network tab
- [ ] Requests go to localhost:3001
- [ ] Cache works correctly
- [ ] Error handling works
- [ ] E2E tests pass (if implemented)

## Deployment

- [ ] Production environment variables configured
- [ ] Docker configuration updated
- [ ] docker-compose.yml tested
- [ ] All services start correctly
- [ ] Health checks pass
- [ ] Monitoring/logging configured

## Documentation

- [ ] README updated
- [ ] Migration checklist completed
- [ ] Team trained on new architecture
- [ ] Rollback plan documented

## Post-Migration

- [ ] Monitor for errors in production
- [ ] Verify performance improvements
- [ ] Remove VITE_GITHUB_TOKEN from production env
- [ ] Update CI/CD pipelines
```

---

### Step 8.3: Final Git Commit

**What:** Commit all frontend changes

**Why:** Version control and collaboration

```bash
cd /home/user/github-knowledge-vault

# Check changes
git status

# Add all changes
git add .

# Commit with detailed message
git commit -m "feat: Integrate frontend with MCP Bridge

Migrate from direct GitHub API calls to MCP Bridge for improved security.

Changes:
- Add MCP service layer (mcpService.ts)
- Update configuration with feature flag
- Modify hooks to support both MCP and GitHub modes
- Add MCP status indicator component
- Add cache management capabilities
- Update environment variables (remove token from frontend)
- Add configuration validation
- Update documentation

Features:
- Feature flag for gradual migration (VITE_USE_MCP)
- Backward compatible with direct GitHub API
- Improved security (token on backend only)
- Same functionality maintained
- Better error handling
- Health monitoring

Breaking Changes: None (feature flagged)
Rollback: Set VITE_USE_MCP=false in .env

Testing:
- All manual tests passed
- Both modes verified working
- No token exposure in browser
- Cache functioning correctly"

# Push
git push
```

---

## Verification Checklist

**Before considering migration complete:**

- [ ] Environment variables configured correctly
- [ ] MCP service created and exports properly
- [ ] All hooks updated to use service selection
- [ ] TypeScript compiles without errors
- [ ] Development server starts successfully
- [ ] Repositories load from MCP Bridge
- [ ] Content loads from MCP Bridge
- [ ] Search works via MCP Bridge
- [ ] Filters and search work correctly
- [ ] No GitHub token visible in Network tab
- [ ] Requests go to localhost:3001 (not api.github.com)
- [ ] MCP status indicator shows connected
- [ ] Cache is functioning (check logs)
- [ ] Error handling works (test by stopping bridge)
- [ ] Fallback mode works (VITE_USE_MCP=false)
- [ ] Production build succeeds
- [ ] Docker configuration works
- [ ] Documentation updated
- [ ] Team informed of changes

---

## Troubleshooting

### Issue: "Cannot connect to MCP Bridge"

**Symptoms:** Network errors, connection refused

**Solutions:**
1. Check MCP Bridge is running: `curl http://localhost:3001/health`
2. Check VITE_MCP_BRIDGE_URL in .env
3. Check CORS_ORIGINS in bridge .env includes frontend URL
4. Check browser console for specific error
5. Restart both bridge and frontend

---

### Issue: "No repositories showing"

**Symptoms:** Empty repository list

**Solutions:**
1. Check browser console for errors
2. Check bridge logs for errors
3. Verify GITHUB_ORGANIZATION is correct in bridge .env
4. Test bridge directly: `curl http://localhost:3001/api/repos`
5. Check MCP Server is connected to bridge

---

### Issue: "TypeScript errors after changes"

**Symptoms:** Build fails, red squiggles in IDE

**Solutions:**
1. Run `npm install` (may need new types)
2. Restart TypeScript server in IDE
3. Check imports are correct
4. Verify types are exported from mcpService
5. Run `npx tsc --noEmit` to see all errors

---

### Issue: "Feature flag not working"

**Symptoms:** Still using GitHub API when VITE_USE_MCP=true

**Solutions:**
1. Restart dev server (env changes need restart)
2. Check .env file has no typos
3. Verify githubConfig.useMCP is true in console
4. Clear browser cache
5. Check no .env.local overriding values

---

### Issue: "Different data from MCP vs GitHub"

**Symptoms:** Data mismatch between modes

**Solutions:**
1. Check organization name matches in both configs
2. Clear both caches (MCP Bridge + React Query)
3. Verify MCP Server is calling correct GitHub org
4. Check for GitHub API rate limiting
5. Compare raw API responses

---

## Performance Considerations

### Expected Improvements

**With MCP Bridge:**
- ✅ **First load:** Similar or slightly slower (extra hop)
- ✅ **Cached loads:** Much faster (5-minute cache)
- ✅ **Concurrent requests:** Better (bridge handles batching)
- ✅ **Rate limiting:** Better (centralized management)

**Metrics to monitor:**
- Time to first repository list
- Time to load content
- Cache hit rate (check bridge logs)
- Error rate

---

## Next Steps After Migration

1. **Monitor Production:**
   - Set up error tracking (Sentry, etc.)
   - Monitor bridge performance
   - Track cache effectiveness

2. **Optimize Further:**
   - Implement Redis cache in bridge
   - Add request batching
   - Add WebSocket for real-time updates

3. **Cleanup:**
   - Remove GitHub API mode after stable period
   - Remove feature flag
   - Remove githubService.ts (if no longer needed)

4. **Enhance:**
   - Add more MCP tools
   - Implement webhook integration
   - Add Claude AI integration

---

## Time Breakdown Summary

| Part | Task | Time |
|------|------|------|
| 1 | Configuration & Environment | 20 min |
| 2 | MCP Service Layer | 45-60 min |
| 3 | Update Hooks | 30-45 min |
| 4 | Component Updates | 20-30 min |
| 5 | Testing & Validation | 30-45 min |
| 6 | Migration Strategy | 15 min |
| 7 | Production Deployment | 30 min |
| 8 | Documentation | 20 min |
| **Total** | | **3.5-4.5 hours** |

---

**Congratulations! 🎉**

You've successfully integrated the frontend with MCP Bridge!

**What you've accomplished:**
- ✅ Removed GitHub token from frontend (major security improvement)
- ✅ Added MCP Bridge integration with feature flag
- ✅ Maintained all existing functionality
- ✅ Added health monitoring
- ✅ Implemented safe rollback mechanism
- ✅ Documented everything thoroughly

**Result:**
```
Before: React → GitHub API (token in browser ❌)
After:  React → MCP Bridge → MCP Server → GitHub API (token secure ✅)
```

Ready for production deployment!
