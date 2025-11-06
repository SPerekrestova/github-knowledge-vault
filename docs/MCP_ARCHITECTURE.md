# GitHub Knowledge Vault - MCP Integration Architecture

## Executive Summary

This document outlines the target architecture for integrating a Model Context Protocol (MCP) Server with the GitHub Knowledge Vault application, replacing direct GitHub API calls with MCP-mediated requests for improved security, caching, and AI integration capabilities.

---

## 1. Current vs Target Architecture

### Current Architecture (Direct API Calls)

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Frontend (Vite)                     │ │
│  │                                                        │ │
│  │  ┌──────────────┐      ┌──────────────┐             │ │
│  │  │   UI Layer   │      │  React Query │             │ │
│  │  │  Components  │◄─────┤    Hooks     │             │ │
│  │  └──────────────┘      └───────┬──────┘             │ │
│  │                                 │                     │ │
│  │                        ┌────────▼────────┐           │ │
│  │                        │ githubService   │           │ │
│  │                        │  (API Layer)    │           │ │
│  │                        └────────┬────────┘           │ │
│  └─────────────────────────────────┼────────────────────┘ │
│                                     │                      │
│  ⚠️  SECURITY ISSUE:                │                      │
│  GitHub Token exposed in browser    │                      │
└─────────────────────────────────────┼──────────────────────┘
                                      │
                              HTTPS   │  Authorization: token ghp_xxx
                                      │
                         ┌────────────▼────────────┐
                         │   GitHub REST API v3    │
                         │   (api.github.com)      │
                         └─────────────────────────┘
```

**Problems:**
- ❌ GitHub token exposed in browser (security risk)
- ❌ No server-side caching (higher API rate limit usage)
- ❌ No AI integration capabilities
- ❌ Limited transformation/enrichment of data
- ❌ Browser CORS limitations

---

### Target Architecture (MCP-Based)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser Environment                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (Vite)                       │  │
│  │                                                                │  │
│  │  ┌──────────────┐      ┌──────────────┐                      │  │
│  │  │   UI Layer   │      │  React Query │                      │  │
│  │  │  Components  │◄─────┤    Hooks     │                      │  │
│  │  └──────────────┘      └───────┬──────┘                      │  │
│  │                                 │                              │  │
│  │                        ┌────────▼────────┐                    │  │
│  │                        │  MCP Client API │  ← Modified        │  │
│  │                        │   (REST calls)  │                    │  │
│  │                        └────────┬────────┘                    │  │
│  └─────────────────────────────────┼────────────────────────────┘  │
└─────────────────────────────────────┼─────────────────────────────┘
                                      │
                              HTTP    │  No auth token in browser
                                      │
┌─────────────────────────────────────▼─────────────────────────────┐
│                      Backend Environment                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              MCP Bridge/Adapter (Node.js/Python)            │  │
│  │                                                             │  │
│  │  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐  │  │
│  │  │ REST API     │    │ MCP Client   │   │   Cache      │  │  │
│  │  │ Endpoints    │───►│ (connects to │───┤   (Redis/    │  │  │
│  │  │ (Express/    │    │  MCP server) │   │   Memory)    │  │  │
│  │  │  FastAPI)    │    └──────┬───────┘   └──────────────┘  │  │
│  │  └──────────────┘           │                              │  │
│  │                              │ MCP Protocol                 │  │
│  │                              │ (stdio/HTTP)                 │  │
│  └──────────────────────────────┼──────────────────────────────┘  │
│                                 │                                  │
│  ┌──────────────────────────────▼──────────────────────────────┐  │
│  │          MCP Server (Python + FastMCP)                      │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────┐    │  │
│  │  │  MCP Tools:                                        │    │  │
│  │  │  • get_org_repos(org: str) → List[Repository]     │    │  │
│  │  │  • get_repo_docs(org: str, repo: str) → List[Doc] │    │  │
│  │  │  • get_file_content(org, repo, path) → Content    │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────┐    │  │
│  │  │  MCP Resources:                                    │    │  │
│  │  │  • documentation://{org}/{repo} → Doc Listing      │    │  │
│  │  │  • content://{org}/{repo}/{path} → File Content    │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  │                                                             │  │
│  │  🔐 SECURE: Token in .env                                  │  │
│  └─────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │
                          HTTPS   │  Authorization: token ghp_xxx
                                  │
                     ┌────────────▼────────────┐
                     │   GitHub REST API v3    │
                     │   (api.github.com)      │
                     └─────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                      AI Integration (Optional)                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Claude Desktop / Claude API                       │  │
│  │                                                                │  │
│  │  Connects to MCP Server directly via MCP protocol             │  │
│  │  Can query: "What documentation exists in acme-org?"          │  │
│  │  Can access: Resources and Tools for AI-powered analysis      │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ GitHub token secure on backend
- ✅ Server-side caching reduces API calls
- ✅ Claude AI can directly query GitHub data
- ✅ Data transformation/enrichment capabilities
- ✅ No CORS issues
- ✅ Centralized rate limiting management
- ✅ Potential for webhook integration

---

## 2. Component Specifications

### 2.1 MCP Server (Python + FastMCP)

**Location:** `/home/user/GitHub_MCP_Server/` (new repository)

**Purpose:** Core GitHub API integration via MCP protocol

**Technology Stack:**
- Python 3.10+
- FastMCP framework
- aiohttp for async HTTP
- python-dotenv for config

**Capabilities:**

#### Tools (Callable Functions)
```python
@mcp.tool()
async def get_org_repos(org: str) -> List[Repository]:
    """Fetch all repositories from a GitHub organization"""

@mcp.tool()
async def get_repo_docs(org: str, repo: str) -> List[DocumentFile]:
    """Get all documentation files from /doc folder in a repository"""

@mcp.tool()
async def get_file_content(org: str, repo: str, path: str) -> FileContent:
    """Fetch specific file content with base64 decoding"""

@mcp.tool()
async def search_docs(org: str, query: str) -> List[SearchResult]:
    """Search across all documentation files in organization"""
```

#### Resources (URI-accessible data)
```python
@mcp.resource("documentation://{org}/{repo}")
async def documentation_resource(uri: str) -> List[str]:
    """List documentation files in a repository"""

@mcp.resource("content://{org}/{repo}/{path}")
async def content_resource(uri: str) -> str:
    """Get content of a specific file"""
```

**Environment Variables:**
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_API_BASE_URL=https://api.github.com
MCP_SERVER_PORT=8000
```

---

### 2.2 MCP Bridge/Adapter (Node.js + TypeScript)

**Location:** `/home/user/github-knowledge-vault/mcp-bridge/` (new directory)

**Purpose:** Translate HTTP REST requests from React frontend to MCP protocol calls

**Technology Stack:**
- Node.js 18+ with TypeScript
- Express.js or Fastify for REST API
- @modelcontextprotocol/sdk for MCP client
- ioredis for caching (optional)

**API Endpoints:**
```typescript
// Repository endpoints
GET  /api/repos              → Calls get_org_repos tool
GET  /api/repos/:repoId/docs → Calls get_repo_docs tool

// Content endpoints
GET  /api/content/:repoId    → Fetches all docs for a repo
GET  /api/content/all        → Fetches content from all repos
POST /api/content/search     → Calls search_docs tool

// Metadata endpoints
GET  /api/metadata/:repoId   → Returns file counts only
```

**Example Implementation:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class MCPBridge {
  private client: Client;

  async initialize() {
    const transport = new StdioClientTransport({
      command: 'python',
      args: ['../GitHub_MCP_Server/main.py']
    });

    this.client = new Client({
      name: 'github-knowledge-vault-bridge',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(transport);
  }

  async getRepositories(org: string) {
    const result = await this.client.callTool({
      name: 'get_org_repos',
      arguments: { org }
    });
    return result.content;
  }
}
```

**Environment Variables:**
```bash
PORT=3001
MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
CACHE_TTL=300  # 5 minutes
CORS_ORIGIN=http://localhost:5173  # Vite dev server
```

---

### 2.3 React Frontend (Modified)

**Location:** `/home/user/github-knowledge-vault/src/`

**Changes Required:**

#### Modified: `src/config/github.ts`
```typescript
export const githubConfig = {
  // Remove direct GitHub API config
  // owner: import.meta.env.VITE_GITHUB_OWNER,
  // token: import.meta.env.VITE_GITHUB_TOKEN,

  // Add MCP Bridge config
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_URL || 'http://localhost:3001',
  organization: import.meta.env.VITE_GITHUB_ORGANIZATION
};
```

#### Modified: `src/utils/githubService.ts` → `src/utils/mcpService.ts`
```typescript
class MCPService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = githubConfig.mcpBridgeUrl;
  }

  async getRepositories(): Promise<Repository[]> {
    const response = await fetch(`${this.baseUrl}/api/repos`);
    if (!response.ok) throw new APIError(response.status, response.statusText);
    return response.json();
  }

  async getRepoContent(repoId: string): Promise<ContentItem[]> {
    const response = await fetch(`${this.baseUrl}/api/content/${repoId}`);
    if (!response.ok) throw new APIError(response.status, response.statusText);
    return response.json();
  }

  // ... other methods
}

export const mcpService = new MCPService();
```

#### Modified: `src/hooks/useRepos.tsx`
```typescript
// Change import
import { mcpService } from '@/utils/mcpService';

export const useRepos = () => {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: () => mcpService.getRepositories(), // Changed from githubService
    // ... rest unchanged
  });
};
```

**New Environment Variables:**
```bash
VITE_MCP_BRIDGE_URL=http://localhost:3001
VITE_GITHUB_ORGANIZATION=your-org-name
# Remove: VITE_GITHUB_TOKEN (no longer needed in frontend!)
```

---

## 3. Data Flow Diagrams

### 3.1 Repository Fetching Flow

```
User clicks "Refresh"
       │
       ▼
┌──────────────────┐
│  React Component │
│  (Repository     │
│   Grid)          │
└────────┬─────────┘
         │
         │ Triggers refetch
         ▼
┌──────────────────┐
│   useRepos()     │
│   Hook           │
└────────┬─────────┘
         │
         │ Calls mcpService.getRepositories()
         ▼
┌──────────────────┐      HTTP GET /api/repos       ┌──────────────────┐
│  mcpService.ts   │─────────────────────────────────►│  MCP Bridge      │
│  (Frontend)      │                                  │  (Node.js)       │
└──────────────────┘                                  └────────┬─────────┘
                                                               │
                                                               │ Calls MCP tool
                                                               ▼
                                                      ┌──────────────────┐
                                                      │  MCP Server      │
                                                      │  get_org_repos() │
                                                      └────────┬─────────┘
                                                               │
                                                               │ GitHub API call
                                                               ▼
                                                      ┌──────────────────┐
                                                      │  GitHub API      │
                                                      │  /orgs/{org}/    │
                                                      │  repos           │
                                                      └────────┬─────────┘
                                                               │
                    Response flows back                       │
                    ◄─────────────────────────────────────────┘
```

### 3.2 Content Fetching Flow (with Caching)

```
User selects a repo
       │
       ▼
┌──────────────────┐
│  useContent()    │
│  Hook            │
└────────┬─────────┘
         │
         │ Calls mcpService.getRepoContent(repoId)
         ▼
┌──────────────────┐   HTTP GET /api/content/:id   ┌──────────────────┐
│  mcpService.ts   │────────────────────────────────►│  MCP Bridge      │
└──────────────────┘                                 └────────┬─────────┘
                                                              │
                                                              │ Check cache
                                                              ▼
                                                     ┌──────────────────┐
                                         Cache Hit?  │  Redis/Memory    │
                                                     │  Cache           │
                                                     └────────┬─────────┘
                                                              │
                                                 Yes          │          No
                                    ┌────────────────────────┼────────────┐
                                    │                        │            │
                                    ▼                        ▼            │
                          Return cached data      Call MCP Server         │
                                    │              get_repo_docs()        │
                                    │                        │            │
                                    │                        ▼            │
                                    │              ┌──────────────────┐   │
                                    │              │  GitHub API      │   │
                                    │              │  /repos/{org}/   │   │
                                    │              │  {repo}/contents │   │
                                    │              └────────┬─────────┘   │
                                    │                       │             │
                                    │                       │ Store       │
                                    │                       ▼             │
                                    │              ┌──────────────────┐   │
                                    │              │  Cache           │   │
                                    │              │  (5 min TTL)     │   │
                                    │              └────────┬─────────┘   │
                                    │                       │             │
                                    └───────────────────────┴─────────────┘
                                                    │
                                                    ▼
                                            Return to Frontend
```

---

## 4. Security Improvements

### Before (Current)
```javascript
// ❌ Token exposed in browser
const response = await fetch('https://api.github.com/orgs/myorg/repos', {
  headers: {
    'Authorization': `token ghp_xxxxxxxxxxxxx` // Visible in DevTools!
  }
});
```

### After (MCP)
```javascript
// ✅ No token in browser
const response = await fetch('http://localhost:3001/api/repos');
// Token stays on backend MCP server
```

**Additional Security Benefits:**
1. **Rate Limit Protection:** Backend can implement request throttling
2. **Input Validation:** Bridge validates all inputs before MCP calls
3. **Error Sanitization:** Backend filters sensitive error details
4. **Audit Logging:** All GitHub API calls logged server-side
5. **Token Rotation:** Easy to rotate tokens without frontend deployment

---

## 5. AI Integration Capabilities

### Claude Desktop Integration

Claude Desktop can connect directly to the MCP Server:

**Claude Desktop Config (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "github-knowledge-vault": {
      "command": "python",
      "args": ["/home/user/GitHub_MCP_Server/main.py"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxx"
      }
    }
  }
}
```

**Example AI Interactions:**
```
User: "What documentation exists in the acme-org GitHub organization?"

Claude: [Calls get_org_repos('acme-org') via MCP]
        [Calls get_repo_docs() for each repo]

Response: "I found documentation in 5 repositories:
- acme-api: REST API docs (12 files)
- acme-sdk: SDK documentation (8 files)
- acme-platform: Architecture diagrams (15 files)
..."
```

**Use Cases:**
- **Documentation Q&A:** "How does authentication work in acme-api?"
- **Code Analysis:** "Find all Mermaid diagrams related to payments"
- **Comparison:** "Compare API endpoints across all repos"
- **Summarization:** "Summarize recent changes in documentation"

---

## 6. Performance Optimizations

### Caching Strategy

**Level 1: Browser Cache (React Query)**
- TTL: 5 minutes
- Scope: Per-session
- Storage: Memory

**Level 2: MCP Bridge Cache (Redis/Memory)**
- TTL: 15 minutes
- Scope: All users
- Storage: Redis or in-memory

**Level 3: MCP Server Cache (Optional)**
- TTL: 1 hour (for static resources)
- Scope: All MCP clients
- Storage: In-memory LRU cache

### Request Batching

The MCP Bridge can batch multiple frontend requests:

```typescript
// Frontend makes 3 parallel requests for different repos
Promise.all([
  mcpService.getRepoContent('repo-1'),
  mcpService.getRepoContent('repo-2'),
  mcpService.getRepoContent('repo-3')
]);

// Bridge batches into single MCP call
await mcpServer.callTool('get_multiple_repo_docs', {
  repos: ['repo-1', 'repo-2', 'repo-3']
});
```

---

## 7. Migration Path

### Phase 1: Parallel Run (Recommended)
- Keep existing `githubService.ts`
- Add new `mcpService.ts`
- Feature flag to switch between them
- Compare results for validation

### Phase 2: Gradual Migration
- Migrate one hook at a time (`useRepos` first, then `useContent`)
- Monitor performance and errors
- Rollback capability

### Phase 3: Full Cutover
- Remove `githubService.ts`
- Remove frontend GitHub token
- Deploy MCP infrastructure

---

## 8. Infrastructure Requirements

### Development Environment
```yaml
Services:
  - React Frontend (Vite): http://localhost:5173
  - MCP Bridge (Node.js): http://localhost:3001
  - MCP Server (Python): stdio or http://localhost:8000
  - Redis (optional): redis://localhost:6379
```

### Production Environment
```yaml
Option A: Single Server
  - MCP Bridge + MCP Server on same machine
  - Process manager (PM2/systemd)
  - Nginx reverse proxy

Option B: Containerized (Docker Compose)
  - Frontend container (nginx)
  - MCP Bridge container
  - MCP Server container
  - Redis container
  - Orchestrated with docker-compose

Option C: Serverless
  - Frontend: Vercel/Netlify
  - MCP Bridge: Vercel/AWS Lambda
  - MCP Server: AWS Lambda with function URLs
  - Cache: AWS ElastiCache/Upstash Redis
```

---

## 9. Technology Decision Matrix

| Component | Option 1 | Option 2 | Recommendation |
|-----------|----------|----------|----------------|
| **MCP Bridge** | Node.js + Express | Python + FastAPI | Node.js (matches frontend ecosystem) |
| **MCP Server** | Python + FastMCP | Node.js + MCP SDK | Python (per your existing spec) |
| **Cache** | Redis | In-memory | Redis (persistent, scalable) |
| **Communication** | MCP over stdio | MCP over HTTP | stdio (simpler, local dev) |
| **Deployment** | Docker Compose | Systemd services | Docker (portability) |

---

## 10. Risk Mitigation

### Identified Risks

1. **MCP Protocol Complexity**
   - *Risk:* Steep learning curve
   - *Mitigation:* Start with minimal tools, expand incrementally

2. **Performance Overhead**
   - *Risk:* Extra network hop (Frontend → Bridge → MCP → GitHub)
   - *Mitigation:* Aggressive caching at all levels

3. **Single Point of Failure**
   - *Risk:* MCP Bridge/Server down = app broken
   - *Mitigation:* Fallback to direct GitHub API, health checks

4. **Development Complexity**
   - *Risk:* Three codebases to maintain
   - *Mitigation:* Monorepo structure, shared TypeScript types

---

## 11. Success Metrics

**Security:**
- [ ] GitHub token removed from frontend code
- [ ] No credentials in browser DevTools/Network tab

**Performance:**
- [ ] 50% reduction in GitHub API calls (via caching)
- [ ] Response time < 500ms for cached requests
- [ ] Response time < 2s for uncached requests

**Functionality:**
- [ ] All existing features work identically
- [ ] No data loss or corruption
- [ ] Claude AI can query documentation

**Developer Experience:**
- [ ] Setup time < 10 minutes for new devs
- [ ] Clear error messages
- [ ] Good TypeScript types across stack

---

## Next Steps

See `docs/MCP_IMPLEMENTATION_PLAN.md` for detailed implementation steps.
