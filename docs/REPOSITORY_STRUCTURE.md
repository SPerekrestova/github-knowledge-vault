# Repository Structure - Architectural Decision

## Question: Should MCP Bridge be a separate repository or together with the frontend?

## TL;DR Recommendation

**Keep MCP Bridge in the same repo as the frontend (monorepo approach).**

**Keep MCP Server as a separate repository.**

---

## Recommended Architecture

```
/home/user/
│
├── GitHub_MCP_Server/              ← SEPARATE REPOSITORY
│   ├── .git/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── README.md
│   └── tests/
│
│   Purpose: Reusable MCP Server for GitHub API
│   Can be used by: Claude Desktop, other frontends, CLI tools
│   Versioning: Independent (stable, less frequent changes)
│
└── github-knowledge-vault/         ← MAIN REPOSITORY (Monorepo)
    ├── .git/
    │
    ├── src/                        ← Frontend (React/TypeScript)
    │   ├── components/
    │   ├── hooks/
    │   ├── utils/
    │   └── ...
    │
    ├── mcp-bridge/                 ← Bridge (Python/FastAPI)
    │   ├── main.py
    │   ├── models.py
    │   ├── cache.py
    │   ├── mcp_client.py
    │   ├── requirements.txt
    │   ├── .env
    │   ├── README.md
    │   └── tests/
    │
    ├── docs/
    ├── package.json
    ├── vite.config.ts
    ├── README.md
    └── docker-compose.yml          ← Can orchestrate both frontend & bridge

    Purpose: Knowledge Vault application
    Contains: Frontend + Bridge (tightly coupled)
    Versioning: Together (deployed as a unit)
```

---

## Decision Matrix

| Criteria | Same Repo (Monorepo) | Separate Repos | Winner |
|----------|---------------------|----------------|---------|
| **Development Speed** | ✅ Faster - one clone, one workflow | ❌ Slower - sync multiple repos | Monorepo |
| **Type Sharing** | ✅ Easy to share types/models | ❌ Need to duplicate or package | Monorepo |
| **Local Development** | ✅ Simple - everything in one place | ❌ Complex - clone multiple, link | Monorepo |
| **Deployment** | ✅ Single pipeline, atomic deploys | ❌ Need to coordinate deploys | Monorepo |
| **API Contract Sync** | ✅ Changes together, less drift | ❌ Can get out of sync | Monorepo |
| **Build Complexity** | ⚠️ Mixed languages (Python + TS) | ✅ Clean separation | Separate |
| **Independent Scaling** | ❌ Deploy together | ✅ Scale independently | Separate |
| **Reusability** | ❌ Bridge tied to this frontend | ✅ Bridge could serve others | Separate |
| **Team Structure** | ⚠️ Full-stack team needed | ✅ Separate frontend/backend teams | Separate |
| **Versioning** | ⚠️ Shared version number | ✅ Independent versions | Separate |

**Score: 6-4 in favor of Monorepo**

---

## Detailed Analysis

### ✅ Reasons to Keep Bridge in Same Repo (RECOMMENDED)

#### 1. **Tight Coupling**
The MCP Bridge exists solely to serve this specific frontend. The API endpoints are designed for the exact data shapes the React app needs:
```python
# Bridge models.py
class ContentItem(BaseModel):
    repoId: str  # Exact match for frontend's useContent hook

# Frontend types/index.ts
interface ContentItem {
    repoId: string;  // Direct match!
}
```

#### 2. **Atomic Changes**
When you add a new feature, you can update frontend + bridge in a single commit:
```bash
git commit -m "feat: Add file history endpoint

- Add GET /api/history/:file to bridge
- Add useFileHistory hook in frontend
- Update ContentViewer to show history"
```

One PR, one review, one deploy. Everything stays in sync.

#### 3. **Simplified Development Workflow**
```bash
# Developer setup (monorepo)
git clone github-knowledge-vault
cd github-knowledge-vault
npm install                    # Frontend deps
cd mcp-bridge && pip install   # Bridge deps
npm run dev:all                # Start both!

# vs. Separate repos
git clone github-knowledge-vault
git clone mcp-bridge
cd github-knowledge-vault && npm install
cd ../mcp-bridge && pip install
# Need to start both in separate terminals, manage ports...
```

#### 4. **Easier Type Sharing**
With tooling, you can share types:
```bash
# Generate Python Pydantic models from TypeScript types
npm run generate:bridge-types

# Or vice versa - generate TS types from FastAPI OpenAPI spec
npm run generate:frontend-types
```

Much easier when everything is in one repo.

#### 5. **Deployment Simplicity**
One `docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: .
    depends_on: [bridge]

  bridge:
    build: ./mcp-bridge
    depends_on: [mcp-server]

  mcp-server:
    # ...
```

Single deployment unit, no coordination needed.

#### 6. **This is a Small-to-Medium Project**
- Single purpose: documentation aggregation
- Small team (likely 1-3 developers)
- Not a multi-tenant SaaS with complex scaling needs
- Monorepo overhead is minimal

---

### ❌ Reasons Against Monorepo (Why you might choose separate)

#### 1. **Language Mixing**
You have two different ecosystems:
```
github-knowledge-vault/
├── package.json         # Node.js
├── tsconfig.json        # TypeScript
└── mcp-bridge/
    └── requirements.txt # Python
```

Some developers find this messy. But it's manageable.

#### 2. **Cannot Scale Independently**
If bridge becomes a bottleneck, you can't scale it separately from frontend. But:
- Frontend is static files (no scaling needed with CDN)
- Bridge is lightweight proxy (unlikely to bottleneck)
- You can still containerize separately even in monorepo

#### 3. **Harder to Reuse Bridge**
If you later want to build:
- Mobile app using same bridge
- CLI tool using same bridge
- Different frontend using same bridge

Separate repo makes this easier. But:
- Current scope doesn't need this
- Can extract later if needed (not hard)

---

### 🎯 Why MCP Server Should Be Separate

**Completely different story for MCP Server!**

✅ **Keep MCP Server in separate repo** because:

1. **General Purpose Tool**
   - Not specific to this frontend
   - Can be used by Claude Desktop
   - Could be published to MCP registry
   - Other teams might want to use it

2. **Different Lifecycle**
   - Server: Stable, infrequent changes (focused on GitHub API)
   - Frontend: Frequent UI changes, new features
   - No need to version together

3. **Different Deployment**
   - Server could run on different infrastructure
   - Might need different security/access controls
   - Could be deployed to PyPI as a package

4. **Clear Interface**
   - MCP protocol is the contract
   - Well-defined, stable boundary
   - No tight coupling like bridge→frontend

---

## Real-World Examples

### Monorepos with Mixed Languages

**Successful examples:**
- **Vercel's turbo repo** - Next.js (TS) + Rust
- **Google's monorepo** - Everything (40+ languages)
- **Facebook's monorepo** - React (JS) + backend services (various)

**Tools that help:**
- `nx` - Monorepo management
- `turbo` - Build orchestration
- `docker-compose` - Local development

### When to Split

You should consider separating bridge later if:
- You need to build a second frontend (mobile app)
- Bridge becomes complex (>5000 lines)
- Different teams own frontend vs bridge
- Need independent scaling/deployment

But you can **always extract later**. It's easier to split than to merge.

---

## Practical Monorepo Structure

```
github-knowledge-vault/
├── .github/
│   └── workflows/
│       ├── frontend.yml          # CI for frontend
│       ├── bridge.yml            # CI for bridge
│       └── integration.yml       # E2E tests
│
├── src/                          # Frontend
│   └── ...
│
├── mcp-bridge/                   # Bridge
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile                # Bridge-specific Docker
│   └── README.md                 # Bridge-specific docs
│
├── docs/                         # Shared documentation
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── scripts/                      # Development scripts
│   ├── dev.sh                    # Start both frontend & bridge
│   ├── test-integration.sh       # Test together
│   └── deploy.sh                 # Deploy both
│
├── docker-compose.yml            # Orchestrate all services
├── docker-compose.dev.yml        # Development overrides
├── package.json                  # Frontend dependencies
├── README.md                     # Main project README
└── .env.example                  # All environment vars
```

### Development Workflow

**package.json** can include bridge commands:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:bridge": "cd mcp-bridge && python main.py",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:bridge\"",
    "test": "vitest",
    "test:bridge": "cd mcp-bridge && pytest",
    "test:all": "npm run test && npm run test:bridge"
  }
}
```

Single command to start everything:
```bash
npm run dev:all
```

---

## Migration Path

If you later decide to separate:

**Easy extraction:**
```bash
# Create new repo
git subtree split -P mcp-bridge -b bridge-branch
cd ../mcp-bridge-repo
git init
git pull ../github-knowledge-vault bridge-branch

# History is preserved!
```

**Then in main repo:**
```bash
# Replace with git submodule or npm dependency
git rm -rf mcp-bridge
git submodule add https://github.com/you/mcp-bridge
```

This is a well-trodden path. Many projects start monorepo and split later.

---

## Final Recommendation

### For Your Project

```
✅ KEEP TOGETHER:
   - github-knowledge-vault (frontend)
   - mcp-bridge (bridge)

   Reason: Tightly coupled, same deployment, simpler development

✅ KEEP SEPARATE:
   - GitHub_MCP_Server (server)

   Reason: Reusable, general-purpose, different lifecycle
```

### Structure
```
/home/user/
├── GitHub_MCP_Server/          # Repo 1: Reusable MCP Server
└── github-knowledge-vault/     # Repo 2: Monorepo (Frontend + Bridge)
    ├── src/
    └── mcp-bridge/
```

### When to Reconsider

Split bridge to separate repo when:
- [ ] Building a second client (mobile app, CLI)
- [ ] Different teams own frontend vs. bridge
- [ ] Bridge >5000 lines or has complex logic
- [ ] Need to publish bridge as reusable package
- [ ] Independent scaling requirements

Until then, **monorepo is the pragmatic choice**.

---

## Implementation Impact

This decision affects:

1. **Directory structure** (already planned for monorepo in guides)
2. **Docker Compose** (easier with monorepo)
3. **CI/CD** (can have separate workflows in monorepo)
4. **Documentation** (shared docs/ folder)

All my guides assumed monorepo structure, which is the right choice for this project.

---

**Bottom Line:** Keep bridge with frontend, keep server separate. You can always split later if needed.
