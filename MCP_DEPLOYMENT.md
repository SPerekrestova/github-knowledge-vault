# MCP Server Deployment Guide

## 🎯 Challenge: Deploying MCP Server + Bridge Together

The MCP architecture uses **stdio** (standard input/output) for communication between:
- **MCP Bridge** (FastAPI) ↔ **MCP Server** (FastMCP) ↔ GitHub API

For cloud deployment, both components need to run in the same environment.

---

## 📦 Deployment Options

### Option 1: Monorepo (Recommended for Free Platforms)

**Structure your repository to include both components:**

```
github-knowledge-vault/
├── src/                    # Frontend
├── mcp-bridge/            # MCP Bridge
└── mcp-server/            # MCP Server (copied here)
    ├── main.py
    ├── requirements.txt
    └── ...
```

**Steps:**

1. **Copy MCP Server into your repository:**

```bash
cd /home/user/github-knowledge-vault

# Clone or copy the MCP Server
git clone https://github.com/YourOrg/GitHub_MCP_Server.git mcp-server

# OR if it's in a sibling directory
cp -r ../GitHub_MCP_Server ./mcp-server

# Add to git
git add mcp-server
git commit -m "Add MCP Server for deployment"
git push
```

2. **Update MCP Bridge configuration:**

Edit `mcp-bridge/.env`:
```bash
# Point to the bundled MCP Server
MCP_SERVER_PATH=../mcp-server/main.py
```

3. **Update requirements.txt:**

`mcp-bridge/requirements.txt` should include:
```txt
# Web Framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# MCP SDK
mcp>=0.1.0

# Add any MCP Server dependencies here
# (copy from mcp-server/requirements.txt)
```

---

### Option 2: Git Submodule (Clean Separation)

**Keep MCP Server as a separate repo but link it:**

```bash
cd /home/user/github-knowledge-vault

# Add MCP Server as submodule
git submodule add https://github.com/YourOrg/GitHub_MCP_Server.git mcp-server

# Initialize submodule
git submodule update --init --recursive

# Commit
git add .gitmodules mcp-server
git commit -m "Add MCP Server as submodule"
git push
```

**For cloud platforms, add to build command:**
```bash
git submodule update --init --recursive && pip install -r requirements.txt
```

---

### Option 3: Download During Build

**Download MCP Server during deployment:**

Create `mcp-bridge/download-server.sh`:
```bash
#!/bin/bash
echo "📥 Downloading MCP Server..."

# Download from GitHub release or clone
if [ ! -d "../mcp-server" ]; then
    cd ..
    git clone https://github.com/YourOrg/GitHub_MCP_Server.git mcp-server
    cd mcp-bridge
fi

echo "✅ MCP Server ready"
```

Update build command:
```bash
chmod +x download-server.sh && ./download-server.sh && pip install -r requirements.txt
```

---

## 🚀 Platform-Specific Deployment

### Render.com (Recommended)

**Configuration:**

1. **Build Command:**
```bash
# Option A: Monorepo (if MCP Server is committed)
pip install -r requirements.txt

# Option B: Git Submodule
git submodule update --init --recursive && pip install -r requirements.txt && pip install -r ../mcp-server/requirements.txt
```

2. **Start Command:**
```bash
python main.py
```

3. **Environment Variables:**
```
GITHUB_TOKEN=your_token
GITHUB_ORGANIZATION=SPerekrestova
MCP_SERVER_PATH=../mcp-server/main.py
PORT=10000
CACHE_ENABLED=true
CORS_ORIGINS=*
```

**Blueprint (render.yaml):**
```yaml
services:
  - type: web
    name: github-knowledge-vault-bridge
    runtime: python
    plan: free
    buildCommand: |
      pip install -r requirements.txt
      pip install -r ../mcp-server/requirements.txt || echo "MCP Server deps already installed"
    startCommand: python main.py
    envVars:
      - key: PORT
        value: 10000
      - key: GITHUB_TOKEN
        sync: false
      - key: GITHUB_ORGANIZATION
        sync: false
      - key: MCP_SERVER_PATH
        value: ../mcp-server/main.py
      - key: CACHE_TTL_SECONDS
        value: 300
      - key: CACHE_ENABLED
        value: true
      - key: CORS_ORIGINS
        value: "*"
```

---

### Railway.app

**Dockerfile approach (best for Railway):**

Create `mcp-bridge/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy both components
COPY mcp-bridge/ ./mcp-bridge/
COPY mcp-server/ ./mcp-server/

# Install dependencies
RUN pip install --no-cache-dir -r mcp-bridge/requirements.txt
RUN pip install --no-cache-dir -r mcp-server/requirements.txt

# Set working directory
WORKDIR /app/mcp-bridge

# Environment variables will be set in Railway dashboard
ENV MCP_SERVER_PATH=../mcp-server/main.py

# Run
CMD ["python", "main.py"]
```

**Railway Configuration:**
- Point to `mcp-bridge/Dockerfile`
- Set environment variables in dashboard
- Railway will build and deploy

---

### Fly.io (Good for Multi-Process)

**Fly.toml:**
```toml
app = "github-knowledge-vault-bridge"

[build]
  dockerfile = "mcp-bridge/Dockerfile"

[env]
  PORT = "8080"
  MCP_SERVER_PATH = "../mcp-server/main.py"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## ✅ Verification Checklist

Before deploying, ensure:

- [ ] MCP Server is accessible in your repository (committed, submodule, or downloaded)
- [ ] `MCP_SERVER_PATH` points to correct location
- [ ] All dependencies installed (Bridge + Server)
- [ ] Environment variables configured
- [ ] Build command includes both components
- [ ] Test locally first: `cd mcp-bridge && python main.py`

---

## 🧪 Local Testing with Full Stack

**Test the full deployment setup locally:**

```bash
# Navigate to bridge
cd /home/user/github-knowledge-vault/mcp-bridge

# Ensure MCP Server is available
ls -la ../mcp-server/main.py  # Should exist

# Set environment variables
export GITHUB_TOKEN=your_token
export GITHUB_ORGANIZATION=SPerekrestova
export MCP_SERVER_PATH=../mcp-server/main.py

# Start bridge (it will spawn MCP Server)
python main.py
```

**Check it works:**
```bash
# Health check
curl http://localhost:3001/health
# Should show: mcp_connected: true

# Test repos
curl http://localhost:3001/api/repos
```

---

## 🐛 Troubleshooting

### "MCP Server not found"
**Cause:** `MCP_SERVER_PATH` is incorrect

**Solution:**
```bash
# Check file exists
ls -la $MCP_SERVER_PATH

# Update path in .env
MCP_SERVER_PATH=../mcp-server/main.py  # Adjust as needed
```

### "Module not found" errors
**Cause:** MCP Server dependencies not installed

**Solution:**
```bash
# Install both sets of dependencies
pip install -r mcp-bridge/requirements.txt
pip install -r mcp-server/requirements.txt
```

### "mcp_connected: false"
**Cause:** MCP Server failed to start

**Solution:**
Check bridge logs for error messages from MCP Server startup.

---

## 💡 Recommended Approach

**For free deployment to Render:**

1. ✅ **Use Monorepo approach** (copy MCP Server into repo)
2. ✅ Update `MCP_SERVER_PATH=../mcp-server/main.py`
3. ✅ Deploy to Render as single web service
4. ✅ Both components run in same container

**Repository structure:**
```
github-knowledge-vault/
├── src/                    # Frontend
├── mcp-bridge/            # Bridge (FastAPI)
│   ├── main.py
│   ├── mcp_client.py
│   ├── requirements.txt
│   └── .env
├── mcp-server/            # Server (FastMCP) ← Add this
│   ├── main.py
│   ├── requirements.txt
│   └── ...
└── README.md
```

This way, Render deploys everything together in one service (free tier).

---

## 🎉 Result

Once deployed:
```
User → Frontend (Vercel/Render)
         ↓ HTTPS
      MCP Bridge (Render)
         ↓ stdio
      MCP Server (same container)
         ↓ API
      GitHub API
```

All running on **free tier**, fully functional MCP architecture! 🚀
