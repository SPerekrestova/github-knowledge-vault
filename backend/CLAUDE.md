# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the FastAPI backend for the GitHub Knowledge Vault project. The backend is currently in initial setup phase and will provide API endpoints for interacting with Claude via the Anthropic API and an MCP (Model Context Protocol) server.

## Development Setup

### Package Management
This project uses `uv` for Python package management (requires Python 3.14+).

Install dependencies:
```bash
uv sync
```

Install with dev dependencies:
```bash
uv sync --all-extras
```

Add a new dependency:
```bash
uv add package-name
```

Add a dev dependency:
```bash
uv add --dev package-name
```

### Environment Configuration
1. Copy `.env.example` to `.env`
2. Add your `ANTHROPIC_API_KEY` (required)
3. Configure optional settings (Claude model, MCP server URL, CORS origins)

### Running the Application

Development server with auto-reload:
```bash
uv run uvicorn app.main:app --reload --port 3001
```

Or activate the virtual environment first:
```bash
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 3001
```

Note: The main application entry point will be `app/main.py` (not yet created). The current `main.py` in the root is a placeholder.

### Testing

Run tests:
```bash
uv run pytest
```

Run tests with coverage:
```bash
uv run pytest --cov=app
```

### Docker

Build the image:
```bash
docker build -t github-knowledge-vault-backend .
```

Run the container:
```bash
docker run -p 3001:3001 --env-file .env github-knowledge-vault-backend
```

## Architecture

### Configuration Pattern
The application uses Pydantic Settings (`app/config.py`) for environment-based configuration:
- Settings are loaded from `.env` file
- All environment variables are case-insensitive
- Default values are provided where appropriate
- The `settings` singleton instance should be imported and used throughout the app

### Key Dependencies
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **Anthropic SDK**: Claude API integration
- **httpx**: Async HTTP client for MCP server communication
- **Pydantic Settings**: Configuration management
- **WebSockets**: Real-time communication support

### Expected Structure
The backend will integrate:
1. **Claude API** - Using the Anthropic SDK for AI-powered responses
2. **MCP Server** - External service for model context protocol operations
3. **Frontend** - CORS-enabled API for local development (ports 5173, 3000)

## Common Patterns

### Settings Access
```python
from app.config import settings

# Access configuration
api_key = settings.ANTHROPIC_API_KEY
model = settings.CLAUDE_MODEL
```

### Environment Variables
All configuration is environment-driven. See `.env.example` for available options:
- `ANTHROPIC_API_KEY` (required)
- `CLAUDE_MODEL` (optional, defaults to claude-sonnet-4-20250514)
- `CLAUDE_MAX_TOKENS` (optional, defaults to 4096)
- `MCP_SERVER_URL` (optional, defaults to http://mcp-server:3000)
- `MCP_TIMEOUT` (optional, defaults to 30 seconds)
- `CORS_ORIGINS` (optional, defaults to localhost development ports)
