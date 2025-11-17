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
# Edit .env with your GITHUB_ORGANIZATION and MCP_SERVER_PATH

# 3. Run
python main.py
# Server starts at http://localhost:3001
# API docs at http://localhost:3001/docs
```

## Architecture

```
React Frontend (:5173) → MCP Bridge (:3001) → MCP Server (stdio) → GitHub API
                          [FastAPI]           [separate repo]
```

**Key Points:**
- Bridge is in **this repo** (monorepo with frontend)
- MCP Server is **separate repo** at `/home/user/GitHub_MCP_Server/`
- Communication via stdio protocol

## Project Structure

```
mcp-bridge/
├── main.py              # FastAPI app with REST endpoints
├── models.py            # Pydantic data models
├── cache.py             # In-memory cache (5-min TTL)
├── mcp_client.py        # MCP stdio client
├── requirements.txt     # Dependencies
├── .env.example         # Config template
├── tests/               # Unit tests (62 tests)
│   ├── conftest.py
│   ├── test_api.py
│   ├── test_cache.py
│   ├── test_mcp_client.py
│   └── test_models.py
└── venv/                # Virtual environment (git-ignored)
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
MCP_SERVER_PATH=/home/user/GitHub_MCP_Server/main.py

# Optional
PORT=3001
HOST=0.0.0.0
CACHE_TTL_SECONDS=300
CACHE_ENABLED=true
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
LOG_LEVEL=INFO
GITHUB_TOKEN=your-token  # For MCP Server
```

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
