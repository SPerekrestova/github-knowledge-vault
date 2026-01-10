# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the FastAPI backend for the GitHub Knowledge Vault project. It provides:
- **REST API** for repository browsing and documentation retrieval
- **WebSocket Chat** for real-time AI conversations with Claude
- **MCP Integration** for external documentation server communication
- **Streaming LLM** responses with automatic tool execution

The backend uses a 3-layer architecture:
1. **FastAPI Layer** (`app/main.py`) - HTTP/WebSocket endpoints
2. **LLM Layer** (`app/llm.py`) - Claude streaming + tool orchestration
3. **MCP Layer** (`app/mcp.py`) - External MCP server communication

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

### 3-Layer Design

**1. FastAPI Layer** (`app/main.py`)
- REST API endpoints for repository/documentation browsing
- WebSocket endpoint for real-time chat
- Conversation management (in-memory storage)
- Application lifespan management (startup/shutdown)
- CORS middleware configuration

**2. LLM Layer** (`app/llm.py`)
- Claude API integration with streaming support
- Tool definitions for documentation operations
- Automatic tool execution loop
- System prompt builder with repository context
- Singleton `llm_client` instance

**3. MCP Layer** (`app/mcp.py`)
- HTTP client for MCP server communication
- Tool execution endpoint integration
- Connection management and health checks
- Singleton `mcp_client` instance

### API Endpoints

**REST Endpoints**
- `GET /` - Root endpoint
- `GET /health` - Health check with service status
- `GET /config` - Current configuration (excluding secrets)
- `GET /api/repos` - List all repositories
- `GET /api/repos/{name}/tree` - Get repository file tree
- `GET /api/repos/{name}/files/{path}` - Get file content
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}/messages` - Get conversation history

**WebSocket Endpoint**
- `WS /ws/chat/{conversation_id}` - Real-time chat with Claude

### Configuration Pattern
The application uses Pydantic Settings (`app/config.py`) for environment-based configuration:
- Settings are loaded from `.env` file
- All environment variables are case-insensitive
- Default values are provided where appropriate
- The `settings` singleton instance should be imported and used throughout the app

### Key Dependencies
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **Anthropic SDK**: Claude API integration with streaming
- **httpx**: Async HTTP client for MCP server communication
- **Pydantic Settings**: Configuration management
- **WebSockets**: Real-time communication support

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

## Module Documentation

### `app/config.py` - Configuration
Pydantic Settings for environment-based configuration:
```python
from app.config import settings

# Access any setting
api_key = settings.ANTHROPIC_API_KEY
model = settings.CLAUDE_MODEL
cors = settings.CORS_ORIGINS
```

### `app/mcp.py` - MCP Client
HTTP client for MCP server communication:
```python
from app.mcp import mcp_client

# Connect on startup (done automatically in lifespan)
await mcp_client.connect()

# Call a tool
result = await mcp_client.call_tool("list_repositories", {})
result = await mcp_client.call_tool("search_documentation", {"query": "FastAPI"})

# Check health
health = await mcp_client.health_check()

# Disconnect on shutdown (done automatically in lifespan)
await mcp_client.disconnect()
```

**Available MCP Tools:**
- `list_repositories` - List all repositories with doc counts
- `search_documentation` - Search across documentation (optional: `repo` param)
- `get_documentation` - Get specific document (requires: `repo`, `path`)
- `list_repo_docs` - List all docs in a repository (requires: `repo`)

### `app/llm.py` - LLM Client
Claude API client with streaming and tool execution:
```python
from app.llm import llm_client

# Stream chat with automatic tool execution
messages = [{"role": "user", "content": "What repos are available?"}]
context = {"scope": "repo", "repoName": "my-repo"}  # Optional

async for event in llm_client.chat_stream(messages, context):
    if event["type"] == "text":
        print(event["content"], end="", flush=True)
    elif event["type"] == "tool_use_start":
        print(f"\nUsing tool: {event['name']}")
    elif event["type"] == "tool_result":
        print(f"Tool completed in {event['duration']}ms")
```

**Event Types:**
- `{"type": "text", "content": "..."}` - Text chunk from Claude
- `{"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}` - Tool execution begins
- `{"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}` - Tool execution completes

**System Prompt:**
- Base prompt explains available tools and behavior
- When `context.scope == "repo"`, adds repository-specific instructions
- Automatically built with `build_system_prompt(context)`

### `app/main.py` - FastAPI Application
Main application with REST and WebSocket endpoints:
```python
# See API Endpoints section above for available routes
```

## WebSocket Protocol

### Connection
```javascript
const ws = new WebSocket(`ws://localhost:3001/ws/chat/${conversationId}`);
```

### Client → Server Messages

**Send a chat message:**
```json
{
  "type": "message",
  "content": "What repositories are available?",
  "context": {
    "scope": "repo",
    "repoName": "my-repo"
  }
}
```

**Send a ping:**
```json
{"type": "ping"}
```

### Server → Client Messages

**Text chunk:**
```json
{"type": "text", "content": "Here are the available..."}
```

**Tool execution started:**
```json
{
  "type": "tool_use_start",
  "toolId": "toolu_123",
  "name": "list_repositories",
  "input": {}
}
```

**Tool execution completed:**
```json
{
  "type": "tool_result",
  "toolId": "toolu_123",
  "name": "list_repositories",
  "result": [...],
  "duration": 234
}
```

**Message completed:**
```json
{"type": "done", "messageId": "msg_456"}
```

**Error:**
```json
{"type": "error", "message": "Error description"}
```

**Pong response:**
```json
{"type": "pong"}
```
