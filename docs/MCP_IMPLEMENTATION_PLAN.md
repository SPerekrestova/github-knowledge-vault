# MCP Integration - Implementation Plan

## Overview

This document provides a step-by-step implementation plan for integrating the Model Context Protocol (MCP) Server with the GitHub Knowledge Vault application.

**Estimated Total Time:** 12-16 hours
**Difficulty:** Intermediate
**Prerequisites:** Node.js 18+, Python 3.10+, GitHub account with personal access token

---

## Implementation Phases

```
Phase 1: MCP Server Setup (3-4 hours)
    ↓
Phase 2: MCP Bridge Development (4-5 hours)
    ↓
Phase 3: Frontend Integration (2-3 hours)
    ↓
Phase 4: Testing & Validation (2-3 hours)
    ↓
Phase 5: Deployment & Documentation (1-2 hours)
```

---

## Phase 1: MCP Server Setup

### Step 1.1: Create MCP Server Project Structure

**Time:** 30 minutes

```bash
# Create project directory
mkdir -p /home/user/GitHub_MCP_Server
cd /home/user/GitHub_MCP_Server

# Initialize git repository
git init

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Create project files
touch main.py
touch requirements.txt
touch .env
touch .gitignore
touch README.md
```

**.gitignore:**
```
venv/
__pycache__/
*.pyc
.env
.DS_Store
.idea/
```

**requirements.txt:**
```
fastmcp>=0.1.0
aiohttp>=3.9.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

**Installation:**
```bash
pip install -r requirements.txt
```

---

### Step 1.2: Implement Core MCP Server

**Time:** 2-3 hours

**main.py:**
```python
#!/usr/bin/env python3
"""
GitHub MCP Server
Provides GitHub API access via Model Context Protocol
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import aiohttp
from dotenv import load_dotenv
from fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("GitHub Knowledge Vault MCP Server")

# Configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE_URL", "https://api.github.com")


async def create_headers() -> Dict[str, str]:
    """Create GitHub API request headers with authentication"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitHub-MCP-Server"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


@mcp.tool()
async def get_org_repos(org: str) -> List[Dict[str, Any]]:
    """
    Fetch all repositories from a GitHub organization

    Args:
        org: GitHub organization name

    Returns:
        List of repositories with name, description, url, and hasDocFolder
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()

        # Use search API to find repos with /doc folder (more efficient)
        search_url = f"{GITHUB_API_BASE}/search/code"
        params = {
            "q": f"org:{org} path:/doc",
            "per_page": 100
        }

        try:
            async with session.get(search_url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    # Extract unique repositories from search results
                    repos_with_docs = {}
                    for item in data.get("items", []):
                        repo_info = item.get("repository", {})
                        repo_name = repo_info.get("name")
                        if repo_name and repo_name not in repos_with_docs:
                            repos_with_docs[repo_name] = {
                                "id": str(repo_info.get("id", "")),
                                "name": repo_name,
                                "description": repo_info.get("description", ""),
                                "url": repo_info.get("html_url", ""),
                                "hasDocFolder": True
                            }
                    return list(repos_with_docs.values())
        except Exception as e:
            print(f"Search API failed, falling back to list repos: {e}")

        # Fallback: Fetch all repos and check each one
        repos_url = f"{GITHUB_API_BASE}/orgs/{org}/repos"
        all_repos = []
        page = 1

        while True:
            async with session.get(
                repos_url,
                headers=headers,
                params={"per_page": 100, "page": page}
            ) as response:
                if response.status != 200:
                    raise Exception(f"GitHub API error: {response.status}")

                repos = await response.json()
                if not repos:
                    break

                all_repos.extend(repos)
                page += 1

                # Stop if we got less than 100 (last page)
                if len(repos) < 100:
                    break

        # Check each repo for /doc folder
        result = []
        for repo in all_repos:
            has_doc = await check_doc_folder(session, org, repo["name"])
            result.append({
                "id": str(repo["id"]),
                "name": repo["name"],
                "description": repo.get("description", ""),
                "url": repo["html_url"],
                "hasDocFolder": has_doc
            })

        return result


async def check_doc_folder(session: aiohttp.ClientSession, org: str, repo: str) -> bool:
    """Check if repository has a /doc folder"""
    headers = await create_headers()
    url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/doc"

    async with session.get(url, headers=headers) as response:
        return response.status == 200


@mcp.tool()
async def get_repo_docs(org: str, repo: str) -> List[Dict[str, Any]]:
    """
    Get all documentation files from a repository's /doc folder

    Args:
        org: GitHub organization name
        repo: Repository name

    Returns:
        List of documentation files with metadata
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/doc"

        async with session.get(url, headers=headers) as response:
            if response.status == 404:
                return []
            if response.status != 200:
                raise Exception(f"GitHub API error: {response.status}")

            contents = await response.json()

            # Filter for supported file types
            supported_extensions = [
                '.md', '.mmd', '.mermaid', '.svg',
                '.yml', '.yaml', '.json'
            ]

            docs = []
            for item in contents:
                if item["type"] == "file":
                    name = item["name"]
                    if any(name.endswith(ext) for ext in supported_extensions):
                        # Determine content type
                        content_type = determine_content_type(name)

                        docs.append({
                            "id": item["sha"],
                            "name": name,
                            "path": item["path"],
                            "type": content_type,
                            "size": item["size"],
                            "url": item["html_url"],
                            "download_url": item["download_url"],
                            "sha": item["sha"]
                        })

            return docs


def determine_content_type(filename: str) -> str:
    """Determine content type from filename"""
    lower_name = filename.lower()

    if lower_name.endswith(('.mmd', '.mermaid')):
        return 'mermaid'
    elif lower_name.endswith('.md'):
        return 'markdown'
    elif lower_name.endswith('.svg'):
        return 'svg'
    elif lower_name.endswith(('.yml', '.yaml')):
        return 'openapi'
    elif lower_name.startswith('postman') and lower_name.endswith('.json'):
        return 'postman'
    elif lower_name.endswith('.json'):
        return 'openapi'  # Could be OpenAPI JSON
    else:
        return 'unknown'


@mcp.tool()
async def get_file_content(org: str, repo: str, path: str) -> Dict[str, Any]:
    """
    Fetch content of a specific file from GitHub

    Args:
        org: GitHub organization name
        repo: Repository name
        path: File path within repository

    Returns:
        File content with metadata
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/{path}"

        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                raise Exception(f"GitHub API error: {response.status}")

            data = await response.json()

            # Decode base64 content if present
            import base64
            content = ""
            if "content" in data and data["content"]:
                content = base64.b64decode(data["content"]).decode('utf-8')

            return {
                "name": data["name"],
                "path": data["path"],
                "content": content,
                "size": data["size"],
                "sha": data["sha"],
                "encoding": data.get("encoding", "base64")
            }


@mcp.tool()
async def search_documentation(org: str, query: str) -> List[Dict[str, Any]]:
    """
    Search for documentation files across all repositories in an organization

    Args:
        org: GitHub organization name
        query: Search query string

    Returns:
        List of matching documentation files
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        search_url = f"{GITHUB_API_BASE}/search/code"
        params = {
            "q": f"org:{org} path:/doc {query}",
            "per_page": 50
        }

        async with session.get(search_url, headers=headers, params=params) as response:
            if response.status != 200:
                raise Exception(f"GitHub API error: {response.status}")

            data = await response.json()
            results = []

            for item in data.get("items", []):
                repo_info = item.get("repository", {})
                results.append({
                    "name": item["name"],
                    "path": item["path"],
                    "repository": repo_info.get("name", ""),
                    "url": item["html_url"],
                    "sha": item["sha"]
                })

            return results


# MCP Resources
@mcp.resource("documentation://{org}/{repo}")
async def documentation_resource(org: str, repo: str) -> str:
    """
    MCP Resource: List documentation files in a repository

    URI: documentation://org-name/repo-name
    """
    docs = await get_repo_docs(org, repo)

    if not docs:
        return "No documentation found in /doc folder"

    # Format as readable list
    lines = [f"Documentation in {org}/{repo}:", ""]
    for doc in docs:
        lines.append(f"- {doc['name']} ({doc['type']}) - {doc['size']} bytes")

    return "\n".join(lines)


@mcp.resource("content://{org}/{repo}/{path:path}")
async def content_resource(org: str, repo: str, path: str) -> str:
    """
    MCP Resource: Get content of a specific file

    URI: content://org-name/repo-name/path/to/file.md
    """
    file_data = await get_file_content(org, repo, path)
    return file_data["content"]


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
```

**.env:**
```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_API_BASE_URL=https://api.github.com
```

---

### Step 1.3: Test MCP Server Locally

**Time:** 30 minutes

**Test script (test_mcp_server.py):**
```python
#!/usr/bin/env python3
import asyncio
from main import get_org_repos, get_repo_docs, get_file_content

async def test():
    # Replace with your test organization
    TEST_ORG = "your-org-name"

    print("Testing get_org_repos...")
    repos = await get_org_repos(TEST_ORG)
    print(f"Found {len(repos)} repositories")
    for repo in repos[:3]:
        print(f"  - {repo['name']}: hasDocFolder={repo['hasDocFolder']}")

    if repos:
        print(f"\nTesting get_repo_docs for {repos[0]['name']}...")
        docs = await get_repo_docs(TEST_ORG, repos[0]['name'])
        print(f"Found {len(docs)} documentation files")
        for doc in docs[:3]:
            print(f"  - {doc['name']} ({doc['type']})")

        if docs:
            print(f"\nTesting get_file_content for {docs[0]['path']}...")
            content = await get_file_content(TEST_ORG, repos[0]['name'], docs[0]['path'])
            print(f"Content preview: {content['content'][:100]}...")

if __name__ == "__main__":
    asyncio.run(test())
```

**Run test:**
```bash
python test_mcp_server.py
```

---

## Phase 2: MCP Bridge Development

### Step 2.1: Setup MCP Bridge Project

**Time:** 30 minutes

```bash
# Navigate to project root
cd /home/user/github-knowledge-vault

# Create bridge directory
mkdir -p mcp-bridge
cd mcp-bridge

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/express @types/cors @types/node
npm install --save-dev tsx nodemon

# Initialize TypeScript
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

### Step 2.2: Implement MCP Bridge Server

**Time:** 3-4 hours

**src/types.ts:**
```typescript
export interface Repository {
  id: string;
  name: string;
  description: string;
  url: string;
  hasDocFolder: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  path: string;
  type: 'markdown' | 'mermaid' | 'postman' | 'openapi' | 'svg';
  size: number;
  url: string;
  download_url: string;
  sha: string;
}

export interface FileContent {
  name: string;
  path: string;
  content: string;
  size: number;
  sha: string;
  encoding: string;
}

export interface ContentItem {
  id: string;
  repoId: string;
  name: string;
  path: string;
  type: string;
  content: string;
  lastUpdated: string;
}
```

**src/mcp-client.ts:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Repository, DocumentFile, FileContent } from './types.js';

export class MCPClient {
  private client: Client | null = null;
  private org: string;
  private mcpServerPath: string;

  constructor(org: string, mcpServerPath: string) {
    this.org = org;
    this.mcpServerPath = mcpServerPath;
  }

  async initialize() {
    const transport = new StdioClientTransport({
      command: 'python',
      args: [this.mcpServerPath]
    });

    this.client = new Client(
      {
        name: 'github-knowledge-vault-bridge',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    await this.client.connect(transport);
    console.log('✅ Connected to MCP Server');
  }

  async getRepositories(): Promise<Repository[]> {
    if (!this.client) throw new Error('MCP Client not initialized');

    const result = await this.client.callTool({
      name: 'get_org_repos',
      arguments: { org: this.org }
    });

    return JSON.parse(result.content[0].text);
  }

  async getRepoDocumentation(repoName: string): Promise<DocumentFile[]> {
    if (!this.client) throw new Error('MCP Client not initialized');

    const result = await this.client.callTool({
      name: 'get_repo_docs',
      arguments: { org: this.org, repo: repoName }
    });

    return JSON.parse(result.content[0].text);
  }

  async getFileContent(repoName: string, path: string): Promise<FileContent> {
    if (!this.client) throw new Error('MCP Client not initialized');

    const result = await this.client.callTool({
      name: 'get_file_content',
      arguments: { org: this.org, repo: repoName, path }
    });

    return JSON.parse(result.content[0].text);
  }

  async searchDocumentation(query: string): Promise<any[]> {
    if (!this.client) throw new Error('MCP Client not initialized');

    const result = await this.client.callTool({
      name: 'search_documentation',
      arguments: { org: this.org, query }
    });

    return JSON.parse(result.content[0].text);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('✅ Disconnected from MCP Server');
    }
  }
}
```

**src/cache.ts:**
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

**src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { MCPClient } from './mcp-client.js';
import { MemoryCache } from './cache.js';
import type { ContentItem } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10);

// Initialize cache
const cache = new MemoryCache(CACHE_TTL);

// Initialize MCP Client
const mcpClient = new MCPClient(
  process.env.GITHUB_ORGANIZATION || '',
  process.env.MCP_SERVER_PATH || path.join(__dirname, '../../GitHub_MCP_Server/main.py')
);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', cache_size: cache.size() });
});

// Get all repositories
app.get('/api/repos', async (req, res) => {
  try {
    const cacheKey = 'repos:all';
    let repos = cache.get(cacheKey);

    if (!repos) {
      console.log('Cache miss: fetching repositories from MCP');
      repos = await mcpClient.getRepositories();
      cache.set(cacheKey, repos);
    } else {
      console.log('Cache hit: returning cached repositories');
    }

    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get documentation files for a specific repository
app.get('/api/repos/:repoName/docs', async (req, res) => {
  try {
    const { repoName } = req.params;
    const cacheKey = `docs:${repoName}`;
    let docs = cache.get(cacheKey);

    if (!docs) {
      console.log(`Cache miss: fetching docs for ${repoName}`);
      docs = await mcpClient.getRepoDocumentation(repoName);
      cache.set(cacheKey, docs);
    } else {
      console.log(`Cache hit: returning cached docs for ${repoName}`);
    }

    res.json(docs);
  } catch (error) {
    console.error(`Error fetching docs for ${req.params.repoName}:`, error);
    res.status(500).json({ error: 'Failed to fetch documentation' });
  }
});

// Get content for all files in a repository
app.get('/api/content/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const cacheKey = `content:${repoName}`;
    let content = cache.get<ContentItem[]>(cacheKey);

    if (!content) {
      console.log(`Cache miss: fetching content for ${repoName}`);

      // Get list of docs first
      const docs = await mcpClient.getRepoDocumentation(repoName);

      // Fetch content for each file
      const contentItems: ContentItem[] = [];
      for (const doc of docs) {
        try {
          const fileContent = await mcpClient.getFileContent(repoName, doc.path);
          contentItems.push({
            id: doc.id,
            repoId: repoName,
            name: doc.name,
            path: doc.path,
            type: doc.type,
            content: fileContent.content,
            lastUpdated: new Date().toISOString()
          });
        } catch (err) {
          console.error(`Failed to fetch content for ${doc.path}:`, err);
        }
      }

      content = contentItems;
      cache.set(cacheKey, content);
    } else {
      console.log(`Cache hit: returning cached content for ${repoName}`);
    }

    res.json(content);
  } catch (error) {
    console.error(`Error fetching content for ${req.params.repoName}:`, error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get content for all repositories
app.get('/api/content/all', async (req, res) => {
  try {
    const cacheKey = 'content:all';
    let allContent = cache.get<ContentItem[]>(cacheKey);

    if (!allContent) {
      console.log('Cache miss: fetching all content');

      const repos = await mcpClient.getRepositories();
      const reposWithDocs = repos.filter(r => r.hasDocFolder);

      const contentPromises = reposWithDocs.map(repo =>
        mcpClient.getRepoDocumentation(repo.name)
          .then(async docs => {
            const items: ContentItem[] = [];
            for (const doc of docs) {
              try {
                const fileContent = await mcpClient.getFileContent(repo.name, doc.path);
                items.push({
                  id: doc.id,
                  repoId: repo.id,
                  name: doc.name,
                  path: doc.path,
                  type: doc.type,
                  content: fileContent.content,
                  lastUpdated: new Date().toISOString()
                });
              } catch (err) {
                console.error(`Failed to fetch ${doc.path}:`, err);
              }
            }
            return items;
          })
      );

      const contentArrays = await Promise.all(contentPromises);
      allContent = contentArrays.flat();
      cache.set(cacheKey, allContent);
    } else {
      console.log('Cache hit: returning all cached content');
    }

    res.json(allContent);
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({ error: 'Failed to fetch all content' });
  }
});

// Search documentation
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const results = await mcpClient.searchDocumentation(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching documentation:', error);
    res.status(500).json({ error: 'Failed to search documentation' });
  }
});

// Cache management
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared' });
});

app.delete('/api/cache/:key', (req, res) => {
  cache.invalidate(req.params.key);
  res.json({ message: 'Cache key invalidated' });
});

// Start server
async function start() {
  try {
    await mcpClient.initialize();

    app.listen(PORT, () => {
      console.log(`✅ MCP Bridge running on http://localhost:${PORT}`);
      console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✅ Cache TTL: ${CACHE_TTL} seconds`);
    });
  } catch (error) {
    console.error('Failed to start MCP Bridge:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mcpClient.close();
  process.exit(0);
});

start();
```

**.env:**
```bash
PORT=3001
GITHUB_ORGANIZATION=your-org-name
MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
CACHE_TTL=300
CORS_ORIGIN=http://localhost:5173
```

---

### Step 2.3: Test MCP Bridge

**Time:** 30 minutes

```bash
# Start the bridge
npm run dev

# In another terminal, test endpoints
curl http://localhost:3001/health

curl http://localhost:3001/api/repos

curl http://localhost:3001/api/repos/YOUR_REPO_NAME/docs

curl http://localhost:3001/api/content/YOUR_REPO_NAME
```

---

## Phase 3: Frontend Integration

### Step 3.1: Create MCP Service Layer

**Time:** 1 hour

**src/utils/mcpService.ts:**
```typescript
import { githubConfig } from '@/config/github';
import type { Repository, ContentItem, ContentFetchResult } from '@/types';
import { APIError } from './errors';

class MCPService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = githubConfig.mcpBridgeUrl || 'http://localhost:3001';
  }

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new APIError(
          response.status,
          `API request failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'Network error: Could not connect to MCP Bridge');
    }
  }

  async getRepositories(): Promise<Repository[]> {
    return this.fetchWithErrorHandling<Repository[]>(`${this.baseUrl}/api/repos`);
  }

  async getRepoContent(repoName: string): Promise<ContentItem[]> {
    return this.fetchWithErrorHandling<ContentItem[]>(
      `${this.baseUrl}/api/content/${repoName}`
    );
  }

  async getAllContent(): Promise<ContentItem[]> {
    return this.fetchWithErrorHandling<ContentItem[]>(`${this.baseUrl}/api/content/all`);
  }

  async getRepoDocumentation(repoName: string) {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/api/repos/${repoName}/docs`
    );
  }

  async searchDocumentation(query: string) {
    return this.fetchWithErrorHandling(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
  }

  async clearCache() {
    return this.fetchWithErrorHandling(`${this.baseUrl}/api/cache/clear`, {
      method: 'POST'
    });
  }

  // Compatibility methods (to maintain existing interface)
  async getAllContentWithSkipped(): Promise<ContentFetchResult> {
    const content = await this.getAllContent();
    return {
      content,
      skippedFiles: {} // MCP bridge handles filtering server-side
    };
  }

  getContentByType(contentType: string | null, content: ContentItem[]): ContentItem[] {
    if (!contentType) return content;
    return content.filter(item => item.type === contentType);
  }

  getContentById(id: string, content: ContentItem[]): ContentItem | undefined {
    return content.find(item => item.id === id);
  }

  async getContentMetadata() {
    const repos = await this.getRepositories();
    const metadata: Record<string, number> = {};

    for (const repo of repos.filter(r => r.hasDocFolder)) {
      const docs = await this.getRepoDocumentation(repo.name);
      metadata[repo.id] = docs.length;
    }

    return metadata;
  }
}

export const mcpService = new MCPService();
```

---

### Step 3.2: Update Configuration

**Time:** 15 minutes

**src/config/github.ts:**
```typescript
export const githubConfig = {
  // MCP Bridge configuration
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_URL || 'http://localhost:3001',
  organization: import.meta.env.VITE_GITHUB_ORGANIZATION || '',

  // Legacy: Keep for backward compatibility during migration
  owner: import.meta.env.VITE_GITHUB_OWNER || '',
  ownerType: import.meta.env.VITE_GITHUB_OWNER_TYPE || 'org',
  apiBaseUrl: import.meta.env.VITE_GITHUB_API_BASE_URL || 'https://api.github.com',
  token: import.meta.env.VITE_GITHUB_TOKEN || '',

  // Feature flag for gradual migration
  useMCP: import.meta.env.VITE_USE_MCP === 'true'
};
```

**.env:**
```bash
# MCP Configuration
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
VITE_USE_MCP=true

# Legacy (can be removed after full migration)
# VITE_GITHUB_OWNER=your-org-name
# VITE_GITHUB_OWNER_TYPE=org
# VITE_GITHUB_TOKEN=ghp_xxx  # ✅ NO LONGER NEEDED!
# VITE_GITHUB_API_BASE_URL=https://api.github.com
```

---

### Step 3.3: Update React Hooks

**Time:** 30 minutes

**src/hooks/useRepos.tsx:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';
import { githubService } from '@/utils/githubService'; // Keep for fallback

export const useRepos = () => {
  const service = githubConfig.useMCP ? mcpService : githubService;

  return useQuery({
    queryKey: ['repositories'],
    queryFn: () => service.getRepositories(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**src/hooks/useContent.tsx:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { mcpService } from '@/utils/mcpService';
import { githubConfig } from '@/config/github';
import { githubService } from '@/utils/githubService'; // Keep for fallback
import type { ContentItem } from '@/types';

export const useContent = (
  repoId: string | null,
  contentType: string | null,
  searchQuery: string
) => {
  const service = githubConfig.useMCP ? mcpService : githubService;

  const { data: allContent, ...queryState } = useQuery({
    queryKey: ['content', repoId || 'all'],
    queryFn: async () => {
      if (repoId) {
        // Find repo name from ID (may need to fetch repos first)
        const repos = await service.getRepositories();
        const repo = repos.find(r => r.id === repoId);
        if (!repo) throw new Error('Repository not found');

        if (githubConfig.useMCP) {
          return await mcpService.getRepoContent(repo.name);
        } else {
          const result = await githubService.getRepoContent(repoId);
          return result.content;
        }
      } else {
        if (githubConfig.useMCP) {
          return await mcpService.getAllContent();
        } else {
          const result = await githubService.getAllContentWithSkipped();
          return result.content;
        }
      }
    },
    enabled: !!repoId || (contentType !== null || searchQuery !== ''),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Client-side filtering
  const filteredContent = React.useMemo(() => {
    let content = allContent || [];

    if (contentType) {
      content = service.getContentByType(contentType, content);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      content = content.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
      );
    }

    return content;
  }, [allContent, contentType, searchQuery, service]);

  return {
    content: filteredContent,
    ...queryState
  };
};
```

---

### Step 3.4: Update Components (Optional UI Improvements)

**Time:** 30 minutes

Add an indicator showing whether MCP is enabled:

**src/components/MCPStatusIndicator.tsx:**
```typescript
import { Badge } from '@/components/ui/badge';
import { githubConfig } from '@/config/github';

export const MCPStatusIndicator = () => {
  if (!githubConfig.useMCP) return null;

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      🔌 MCP Enabled
    </Badge>
  );
};
```

Add to header or sidebar to show MCP status.

---

## Phase 4: Testing & Validation

### Step 4.1: Integration Testing

**Time:** 1-2 hours

**Test checklist:**

```bash
# 1. Start all services
cd /home/user/GitHub_MCP_Server
source venv/bin/activate
python main.py &

cd /home/user/github-knowledge-vault/mcp-bridge
npm run dev &

cd /home/user/github-knowledge-vault
npm run dev
```

**Manual test scenarios:**

- [ ] Navigate to app (http://localhost:5173)
- [ ] Verify repositories load correctly
- [ ] Click on a repository, verify docs appear
- [ ] Filter by content type (Markdown, Mermaid, etc.)
- [ ] Search for content
- [ ] Open individual documents
- [ ] Verify no GitHub token in browser DevTools Network tab
- [ ] Check browser console for errors
- [ ] Test refresh functionality
- [ ] Verify caching (check MCP Bridge logs)

**Performance comparison:**

```bash
# Test with MCP
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/repos

# Test direct GitHub API (old way)
curl -w "@curl-format.txt" -o /dev/null -s \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/orgs/YOUR_ORG/repos
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

---

### Step 4.2: Automated Testing

**Time:** 1 hour

**mcp-bridge/src/__tests__/api.test.ts:**
```typescript
import request from 'supertest';
import app from '../index';

describe('MCP Bridge API', () => {
  test('GET /health returns ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/repos returns repositories', async () => {
    const response = await request(app).get('/api/repos');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/repos/:name/docs returns docs', async () => {
    const response = await request(app).get('/api/repos/test-repo/docs');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

---

## Phase 5: Deployment & Documentation

### Step 5.1: Docker Setup

**Time:** 1 hour

**docker-compose.yml** (project root):
```yaml
version: '3.8'

services:
  mcp-server:
    build:
      context: ./GitHub_MCP_Server
      dockerfile: Dockerfile
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_API_BASE_URL=https://api.github.com
    networks:
      - mcp-network

  mcp-bridge:
    build:
      context: ./mcp-bridge
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - GITHUB_ORGANIZATION=${GITHUB_ORGANIZATION}
      - MCP_SERVER_PATH=/mcp-server/main.py
      - CACHE_TTL=300
      - CORS_ORIGIN=http://localhost:5173
    depends_on:
      - mcp-server
    networks:
      - mcp-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    environment:
      - VITE_MCP_BRIDGE_URL=http://mcp-bridge:3001
      - VITE_GITHUB_ORGANIZATION=${GITHUB_ORGANIZATION}
      - VITE_USE_MCP=true
    depends_on:
      - mcp-bridge
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

**GitHub_MCP_Server/Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
```

**mcp-bridge/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

---

### Step 5.2: Documentation

**Time:** 30 minutes

Create comprehensive README files:

**GitHub_MCP_Server/README.md** - Document MCP server setup
**mcp-bridge/README.md** - Document bridge setup
**docs/MCP_DEPLOYMENT.md** - Deployment instructions

---

## Troubleshooting Guide

### Common Issues

**1. MCP Client connection fails**
```
Error: Failed to connect to MCP Server
```
**Solution:** Check MCP server path, ensure Python virtual environment is activated

**2. CORS errors in browser**
```
Access to fetch at 'http://localhost:3001' has been blocked by CORS policy
```
**Solution:** Check CORS_ORIGIN in mcp-bridge .env matches frontend URL

**3. GitHub API rate limit**
```
GitHub API error: 403 (Rate limit exceeded)
```
**Solution:** Ensure GITHUB_TOKEN is set, check cache is working

**4. Empty repositories list**
```
GET /api/repos returns []
```
**Solution:** Verify GITHUB_ORGANIZATION is correct, check token permissions

**5. Content not loading**
```
GET /api/content/:repo returns empty array
```
**Solution:** Verify repository has /doc folder, check file types are supported

---

## Rollback Plan

If issues arise, you can quickly rollback:

```bash
# In .env file
VITE_USE_MCP=false

# Restart frontend
npm run dev
```

This will switch back to direct GitHub API calls while you debug the MCP setup.

---

## Next Steps After Implementation

1. **Monitor Performance:**
   - Set up logging/monitoring for MCP Bridge
   - Track API call reduction
   - Measure response times

2. **Enhance Caching:**
   - Implement Redis for persistent cache
   - Add cache warming on startup
   - Implement smart cache invalidation

3. **Claude AI Integration:**
   - Configure Claude Desktop to use MCP Server
   - Test AI-powered documentation queries
   - Create custom prompts for documentation analysis

4. **Advanced Features:**
   - Webhook support for auto-refresh
   - Batch API endpoints
   - GraphQL layer
   - Real-time updates via WebSockets

5. **Security Hardening:**
   - Add API authentication to MCP Bridge
   - Implement rate limiting
   - Add request logging and monitoring
   - Security scanning of dependencies

---

## Success Criteria

- [ ] All existing features work identically
- [ ] GitHub token not visible in frontend
- [ ] Response times < 500ms for cached requests
- [ ] 50%+ reduction in GitHub API calls
- [ ] Claude AI can query documentation via MCP
- [ ] Zero data loss or corruption
- [ ] Comprehensive error handling
- [ ] Full test coverage
- [ ] Documentation complete

---

## Estimated Timeline Summary

| Phase | Time | Cumulative |
|-------|------|------------|
| Phase 1: MCP Server | 3-4h | 3-4h |
| Phase 2: MCP Bridge | 4-5h | 7-9h |
| Phase 3: Frontend | 2-3h | 9-12h |
| Phase 4: Testing | 2-3h | 11-15h |
| Phase 5: Deployment | 1-2h | 12-17h |

**Total: 12-17 hours**

For a single developer working focused, this could be completed in 2-3 days.

---

## Resources

- **MCP SDK Documentation:** https://github.com/modelcontextprotocol/sdk
- **FastMCP Documentation:** https://github.com/jlowin/fastmcp
- **GitHub API Documentation:** https://docs.github.com/en/rest
- **Claude Desktop MCP Setup:** https://docs.anthropic.com/claude/docs/mcp

---

**Questions or issues? Refer to the troubleshooting guide or open an issue in the repository.**
