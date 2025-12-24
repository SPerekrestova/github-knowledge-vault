# GitHub Knowledge Vault - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER / BROWSER                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Port 80/5173)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  React 18 + TypeScript + Vite                                          │ │
│  │  ─────────────────────────────────                                     │ │
│  │                                                                         │ │
│  │  UI Components (shadcn/ui + Tailwind CSS)                              │ │
│  │  ├─ Sidebar: Repository & content type filters                         │ │
│  │  ├─ SearchBar: Real-time search with debounce                          │ │
│  │  ├─ RepositoryGrid: Overview of all repos                              │ │
│  │  ├─ ContentList: Filtered documentation                                │ │
│  │  └─ ContentViewer: Markdown/Mermaid/Postman/OpenAPI renderer           │ │
│  │                                                                         │ │
│  │  State Management                                                      │ │
│  │  ├─ React Query: Server state, caching, background updates             │ │
│  │  ├─ useRepos(): Fetches repositories                                   │ │
│  │  ├─ useContent(): Fetches documentation (lazy loading)                 │ │
│  │  └─ URL Params: Single source of truth for filters                     │ │
│  │                                                                         │ │
│  │  Configuration (src/config/github.ts)                                  │ │
│  │  ├─ VITE_MCP_BRIDGE_URL: http://localhost:3001                         │ │
│  │  └─ VITE_GITHUB_ORGANIZATION: your-org                                 │ │
│  │                                                                         │ │
│  │  ⚠️ NO GitHub token stored in frontend (security)                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API (HTTP)
                                      │ src/utils/mcpService.ts
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP BRIDGE (Port 3001)                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI + Python 3.10                                                 │ │
│  │  ──────────────────────────                                            │ │
│  │                                                                         │ │
│  │  REST API Endpoints                                                    │ │
│  │  ├─ GET  /health              → Health + MCP status                    │ │
│  │  ├─ GET  /api/repos           → List repositories                      │ │
│  │  ├─ GET  /api/content/{repo}  → Get repo documentation                 │ │
│  │  ├─ GET  /api/content/all     → Get all documentation                  │ │
│  │  ├─ POST /api/search          → Search documentation                   │ │
│  │  └─ POST /api/cache/clear     → Clear cache                            │ │
│  │                                                                         │ │
│  │  Core Components                                                       │ │
│  │  ├─ main.py: FastAPI app, lifespan management                          │ │
│  │  ├─ mcp_client.py: MCP protocol client (Docker-based) ✨               │ │
│  │  ├─ cache.py: In-memory cache (5-min TTL)                              │ │
│  │  └─ models.py: Pydantic models for validation                          │ │
│  │                                                                         │ │
│  │  Environment Variables                                                 │ │
│  │  ├─ MCP_SERVER_IMAGE: ghcr.io/sperekrestova/github-mcp-server:latest  │ │
│  │  ├─ GITHUB_ORGANIZATION: your-org                                      │ │
│  │  ├─ GITHUB_TOKEN: ghp_xxx (for MCP Server)                             │ │
│  │  └─ CACHE_TTL_SECONDS: 300                                             │ │
│  │                                                                         │ │
│  │  Caching Strategy                                                      │ │
│  │  ├─ repos:all → 5 min                                                  │ │
│  │  ├─ docs:{repo} → 5 min                                                │ │
│  │  ├─ content:{repo} → 5 min                                             │ │
│  │  └─ Search: NOT cached                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ MCP Protocol (stdio)
                                      │ Docker Spawn
                                      ↓
                      ┌───────────────────────────────┐
                      │   Docker Command Execution    │
                      │   ─────────────────────────   │
                      │   docker run -i --rm \        │
                      │     -e GITHUB_TOKEN=xxx \     │
                      │     -e GITHUB_ORG=xxx \       │
                      │     ghcr.io/sperekrestova/    │
                      │     github-mcp-server:latest  │
                      └───────────────────────────────┘
                                      │
                                      │ stdin/stdout (MCP)
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   MCP SERVER (Docker Container)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  FastMCP + Python 3.10                                                 │ │
│  │  ──────────────────────                                                │ │
│  │                                                                         │ │
│  │  Image: ghcr.io/sperekrestova/github-mcp-server:latest                │ │
│  │  Repo: https://github.com/SPerekrestova/GitHub_MCP_Server             │ │
│  │                                                                         │ │
│  │  MCP Tools (Protocol Methods)                                          │ │
│  │  ├─ get_org_repos(org)                                                 │ │
│  │  │  └─ Lists repos, checks for /doc folder                             │ │
│  │  ├─ get_repo_docs(org, repo)                                           │ │
│  │  │  └─ Finds .md, .mmd, .svg, postman.json, openapi.yml                │ │
│  │  ├─ get_file_content(org, repo, path)                                  │ │
│  │  │  └─ Fetches file, decodes base64                                    │ │
│  │  └─ search_documentation(org, query)                                   │ │
│  │     └─ Searches across all docs                                        │ │
│  │                                                                         │ │
│  │  MCP Resources                                                         │ │
│  │  ├─ documentation://{org}/{repo}                                       │ │
│  │  └─ content://{org}/{repo}/{path}                                      │ │
│  │                                                                         │ │
│  │  Container Behavior                                                    │ │
│  │  ├─ Spawned on-demand by MCP Bridge                                    │ │
│  │  ├─ Communicates via stdin/stdout (stdio)                              │ │
│  │  ├─ Receives GITHUB_TOKEN and GITHUB_ORG as env vars                   │ │
│  │  └─ Auto-removed after use (--rm flag)                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS REST API
                                      │ Authorization: token ghp_xxx
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GITHUB API (api.github.com)                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  GitHub REST API v3                                                    │ │
│  │  ───────────────────                                                   │ │
│  │                                                                         │ │
│  │  Endpoints Used                                                        │ │
│  │  ├─ GET /orgs/{org}/repos                                              │ │
│  │  │  └─ List organization repositories                                  │ │
│  │  ├─ GET /repos/{org}/{repo}/contents/{path}                            │ │
│  │  │  └─ Get repository contents (recursive for /doc)                    │ │
│  │  ├─ GET /repos/{org}/{repo}/git/trees/{sha}?recursive=1                │ │
│  │  │  └─ Get file tree                                                   │ │
│  │  └─ GET /search/code                                                   │ │
│  │     └─ Search code across organization                                 │ │
│  │                                                                         │ │
│  │  Authentication                                                        │ │
│  │  └─ Personal Access Token (PAT)                                        │ │
│  │     Required scopes: repo, read:org, read:user                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Returns JSON
                                      ↓
                              ┌──────────────────┐
                              │  Repository Data │
                              │  Documentation   │
                              │  File Contents   │
                              └──────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                             DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

User Request: "Show all Markdown files in my-repo"

1. USER clicks "my-repo" filter
   ↓
2. FRONTEND (useContent hook)
   - Calls: mcpService.getRepoContent("my-repo")
   - URL: http://localhost:3001/api/content/my-repo
   ↓
3. MCP BRIDGE receives request
   - Checks cache (key: "content:my-repo")
   - Cache miss → calls MCP Server
   - Spawns: docker run -i --rm -e GITHUB_TOKEN=xxx ghcr.io/.../mcp-server
   ↓
4. MCP SERVER container starts
   - Receives MCP tool call via stdin: get_repo_docs(org="my-org", repo="my-repo")
   - Makes GitHub API call: GET /repos/my-org/my-repo/contents/doc
   - For each file: GET /repos/my-org/my-repo/contents/doc/{file}
   - Returns JSON via stdout
   - Container exits (auto-removed by --rm)
   ↓
5. MCP BRIDGE receives response
   - Caches result (5 min TTL)
   - Returns JSON to frontend
   ↓
6. FRONTEND receives data
   - React Query caches in memory
   - Filters by type: "markdown"
   - Renders in ContentList component
   ↓
7. USER sees list of Markdown files


═══════════════════════════════════════════════════════════════════════════════
                            DEPLOYMENT OPTIONS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  Option 1: Docker Compose (Recommended)                                     │
│  ────────────────────────────────────                                       │
│                                                                              │
│  docker-compose up                                                           │
│                                                                              │
│  Services:                                                                   │
│  ├─ frontend (port 80)                                                       │
│  │  └─ Nginx serving React build                                            │
│  ├─ mcp-bridge (port 3001)                                                   │
│  │  ├─ FastAPI server                                                       │
│  │  └─ Mounts: /var/run/docker.sock (to spawn MCP containers)               │
│  └─ mcp-server (spawned on-demand)                                           │
│     └─ Docker container (auto-created/destroyed)                            │
│                                                                              │
│  Network: mcp-network (bridge)                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Option 2: Manual / Development                                             │
│  ────────────────────────────────                                           │
│                                                                              │
│  Terminal 1: npm run dev          # Frontend (port 5173)                    │
│  Terminal 2: python main.py       # MCP Bridge (port 3001)                  │
│  Docker:     Auto-spawned         # MCP Server (on-demand)                  │
│                                                                              │
│  Requirements:                                                               │
│  ├─ Docker installed & running                                               │
│  ├─ Image pulled: docker pull ghcr.io/sperekrestova/github-mcp-server       │
│  └─ Environment: .env with GITHUB_TOKEN                                      │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          KEY ARCHITECTURAL DECISIONS
═══════════════════════════════════════════════════════════════════════════════

1. ✅ SECURITY: GitHub token only in backend (MCP Server)
   - Frontend has NO access to GitHub token
   - Token passed to MCP Server via environment variable
   - MCP Server runs in isolated Docker container

2. ✅ PERFORMANCE: Multi-layer caching
   - React Query: Client-side (5 min stale time)
   - MCP Bridge: Server-side (5 min TTL)
   - Lazy loading: Only fetch content when filtered

3. ✅ SCALABILITY: Stateless architecture
   - Frontend: Static files (Nginx)
   - MCP Bridge: Stateless FastAPI (horizontal scaling)
   - MCP Server: Ephemeral containers (auto-cleanup)

4. ✅ MAINTAINABILITY: Docker-based MCP Server
   - No local dependencies
   - Published image: ghcr.io/sperekrestova/github-mcp-server
   - Version control via image tags
   - Easy updates: docker pull latest

5. ✅ PROTOCOL: MCP (Model Context Protocol)
   - Standardized AI tool communication
   - stdio-based (works in Docker)
   - JSON-RPC style tool calls
   - Designed for AI/LLM integration


═══════════════════════════════════════════════════════════════════════════════
                            SUPPORTED CONTENT TYPES
═══════════════════════════════════════════════════════════════════════════════

📄 Markdown (.md)
   └─ Rendered with syntax highlighting, GFM support

📊 Mermaid Diagrams (.mmd, .mermaid)
   └─ Flowcharts, sequence diagrams, class diagrams

🔷 SVG Images (.svg)
   └─ Scalable vector graphics

📮 Postman Collections (postman*.json)
   └─ API endpoint collections with request/response examples

📘 OpenAPI Specs (.yml, .yaml)
   └─ REST API documentation (Swagger/OpenAPI 3.0)


═══════════════════════════════════════════════════════════════════════════════
                              VERSION HISTORY
═══════════════════════════════════════════════════════════════════════════════

v1.0 (Initial): MCP Server as local Python file
   └─ Required: GitHub_MCP_Server cloned locally

v2.0 (Current): MCP Server as Docker image ✨
   ├─ Uses: ghcr.io/sperekrestova/github-mcp-server:latest
   ├─ Spawns containers on-demand
   ├─ Auto-cleanup with --rm flag
   └─ No local MCP Server code needed


═══════════════════════════════════════════════════════════════════════════════
                                TECH STACK
═══════════════════════════════════════════════════════════════════════════════

Frontend:
  ├─ React 18.3
  ├─ TypeScript 5.5
  ├─ Vite 5.4
  ├─ Tailwind CSS 3.4
  ├─ shadcn/ui
  ├─ React Query (TanStack) 5.56
  ├─ React Router 6.26
  └─ Mermaid 11.6

Backend (MCP Bridge):
  ├─ FastAPI 0.104+
  ├─ Uvicorn (ASGI server)
  ├─ Pydantic 2.0+
  ├─ MCP SDK 0.1+
  └─ Python 3.10

Backend (MCP Server):
  ├─ FastMCP
  ├─ Python 3.10
  ├─ Docker image
  └─ Published: GitHub Container Registry

Infrastructure:
  ├─ Docker & Docker Compose
  ├─ Nginx (production frontend)
  └─ Bridge network (Docker)
```
