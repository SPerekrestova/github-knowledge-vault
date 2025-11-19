# MCP Bridge

REST API bridge that translates HTTP requests from the React frontend into MCP protocol calls to the MCP Server.

## Quick Start

```bash
# 1. Setup
cd mcp-bridge
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env with your GITHUB_ORGANIZATION and GITHUB_TOKEN

# 2.5. Pull MCP Server Docker image
docker pull ghcr.io/sperekrestova/github-mcp-server:latest

# 3. Run
python main.py
# Server starts at http://localhost:3001
# API docs at http://localhost:3001/docs
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check + MCP status |
| GET | `/api/repos` | List repos with /doc folders |
| GET | `/api/repos/{repo}/docs` | List doc files in repo |
| GET | `/api/content/{repo}` | Get all content from repo |
| GET | `/api/content/all` | Get content from all repos |
| POST | `/api/search` | Search documentation |
| POST | `/api/cache/clear` | Clear cache |
| DELETE | `/api/cache/{key}` | Invalidate cache key |

**Interactive Docs:**
- Swagger UI: `http://localhost:3001/docs`
- ReDoc: `http://localhost:3001/redoc`

## Configuration

Environment variables in `.env`:

```bash
# Required
GITHUB_ORGANIZATION=your-org-name
GITHUB_TOKEN=your-token  # For MCP Server
MCP_SERVER_IMAGE=ghcr.io/sperekrestova/github-mcp-server:latest

# Optional
PORT=3001
HOST=0.0.0.0
CACHE_TTL_SECONDS=300
CACHE_ENABLED=true
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
LOG_LEVEL=INFO
```

**Important:**
- The MCP Server runs as a Docker container spawned by the bridge
- Make sure Docker is installed and running
- The bridge needs access to the Docker socket to run MCP Server containers
- Pull the MCP Server image before starting: `docker pull ghcr.io/sperekrestova/github-mcp-server:latest`

## Development

### Running in Development

```bash
# With auto-reload
uvicorn main:app --reload --port 3001 --log-level debug
```

### Caching Strategy

| Data | Cache Key | TTL |
|------|-----------|-----|
| Repos list | `repos:all` | 5 min |
| Repo docs | `docs:{repo}` | 5 min |
| Repo content | `content:{repo}` | 5 min |
| All content | `content:all` | 5 min |

**Note:** Search results are NOT cached.

## License

Part of the GitHub Knowledge Vault project.
