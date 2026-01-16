# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the FastAPI backend for the GitHub Knowledge Vault project. It provides:
- **REST API** for repository browsing and documentation retrieval
- **WebSocket Chat** for real-time AI conversations with LLM
- **MCP Integration** for external documentation server communication
- **Streaming LLM** responses with automatic tool execution via litellm
- **Multi-provider support** (OpenRouter, Anthropic, OpenAI, 100+ models)

The backend uses a 3-layer architecture:
1. **FastAPI Layer** (`app/main.py`) - HTTP/WebSocket endpoints
2. **LLM Layer** (`app/llm.py`) - litellm streaming + tool orchestration
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
2. Add your `OPENROUTER_API_KEY` (required - get at https://openrouter.ai/keys)
3. Configure optional settings (model name, MCP server URL, CORS origins)

**Free Models Available:**
- `openrouter/meta-llama/llama-3.3-70b-instruct` - Best overall (recommended)
- `openrouter/qwen/qwen-coder-turbo` - Best for code
- `openrouter/deepseek/deepseek-r1` - Best for reasoning

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

Run tests with verbose output:
```bash
uv run pytest -v
```

Run tests with coverage:
```bash
uv run pytest --cov=app
```

Run specific test file:
```bash
uv run pytest tests/test_rest_api.py -v
```

**Test Configuration:**
- Tests use a mock MCP server on port 3002
- pytest.ini is configured for asyncio auto mode
- All 24 tests must pass before committing

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
- Health check with service status

**2. LLM Layer** (`app/llm.py`)
- **litellm** integration for multi-provider support
- Streaming chat with OpenAI-compatible API
- Tool definitions in OpenAI format (required by litellm)
- Automatic tool execution loop
- Event translation layer (maintains WebSocket compatibility)
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
- `GET /health` - Health check with service status (provider, model, MCP)
- `GET /config` - Current configuration (excluding secrets)
- `GET /api/repos` - List all repositories
- `GET /api/repos/{name}/tree` - Get repository file tree
- `GET /api/repos/{name}/files/{path}` - Get file content
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}/messages` - Get conversation history

**WebSocket Endpoint**
- `WS /ws/chat/{conversation_id}` - Real-time chat with streaming LLM

### Configuration Pattern
The application uses Pydantic Settings (`app/config.py`) for environment-based configuration:
- Settings are loaded from `.env` file
- All environment variables are case-insensitive
- Default values are provided where appropriate
- The `settings` singleton instance should be imported and used throughout the app

### Key Dependencies
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **litellm**: Multi-provider LLM library (OpenRouter, Anthropic, OpenAI, 100+ models)
- **httpx**: Async HTTP client for MCP server communication
- **Pydantic Settings**: Configuration management
- **WebSockets**: Real-time communication support
- **pytest**: Testing framework with asyncio support

## Common Patterns

### Settings Access
```python
from app.config import settings

# Access configuration
api_key = settings.OPENROUTER_API_KEY
model = settings.MODEL_NAME
api_base = settings.API_BASE
max_tokens = settings.MAX_TOKENS
```

### Environment Variables
All configuration is environment-driven. See `.env.example` for available options:
- `OPENROUTER_API_KEY` (required) - Get at https://openrouter.ai/keys
- `MODEL_NAME` (optional) - defaults to `openrouter/meta-llama/llama-3.3-70b-instruct`
- `API_BASE` (optional) - defaults to `https://openrouter.ai/api/v1`
- `MAX_TOKENS` (optional) - defaults to 4096
- `MCP_SERVER_URL` (optional) - defaults to `http://mcp-server:3000`
- `MCP_TIMEOUT` (optional) - defaults to 30 seconds
- `CORS_ORIGINS` (optional) - defaults to localhost development ports

## Module Documentation

### `app/config.py` - Configuration
Pydantic Settings for environment-based configuration:
```python
from app.config import settings

# Access any setting
api_key = settings.OPENROUTER_API_KEY
model = settings.MODEL_NAME
api_base = settings.API_BASE
cors = settings.CORS_ORIGINS
```

**Settings:**
- `OPENROUTER_API_KEY`: API key for OpenRouter
- `MODEL_NAME`: Model identifier (e.g., `openrouter/meta-llama/llama-3.3-70b-instruct`)
- `API_BASE`: API base URL for litellm
- `MAX_TOKENS`: Maximum tokens for LLM responses
- `MCP_SERVER_URL`: URL for MCP server
- `MCP_TIMEOUT`: Timeout for MCP requests in seconds
- `CORS_ORIGINS`: List of allowed CORS origins

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
Multi-provider LLM client using litellm with streaming and tool execution:
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
- `{"type": "text", "content": "..."}` - Text chunk from LLM
- `{"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}` - Tool execution begins
- `{"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}` - Tool execution completes

**System Prompt:**
- Base prompt explains available tools and behavior
- When `context.scope == "repo"`, adds repository-specific instructions
- Automatically built with `build_system_prompt(context)`

**Tool Format:**
- Tools are defined in OpenAI format (required by litellm)
- litellm handles conversion between provider formats automatically
- Tools are executed via MCP client

**Streaming:**
- Uses litellm's `acompletion` with `stream=True`
- Handles tool execution loop with continuation
- Maintains backward-compatible event format for WebSocket clients

### `app/main.py` - FastAPI Application
Main application with REST and WebSocket endpoints:
```python
# See API Endpoints section above for available routes
```

**Health Check:**
Returns provider, model, and service status:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "mcp_server": {"status": "connected"},
    "llm_api": {
      "status": "available",
      "provider": "openrouter",
      "model": "openrouter/meta-llama/llama-3.3-70b-instruct"
    }
  }
}
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
  "toolId": "tool_123",
  "name": "list_repositories",
  "input": {}
}
```

**Tool execution completed:**
```json
{
  "type": "tool_result",
  "toolId": "tool_123",
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

## Testing

### Test Structure
- `tests/test_rest_api.py` - REST endpoint tests (health, repos, conversations)
- `tests/test_websocket.py` - WebSocket chat tests with mocked LLM
- `tests/test_integration.py` - End-to-end workflow tests
- `tests/test_error_scenarios.py` - Error handling and edge cases
- `tests/conftest.py` - Pytest fixtures and configuration
- `tests/mock_mcp_server.py` - Mock MCP server for testing

### Running Tests in IDE
1. Configure pytest as test runner in IDE settings
2. Mark `tests` directory as Test Sources Root
3. Set environment variables in run configuration:
   - `MCP_SERVER_URL=http://localhost:3002`
   - `OPENROUTER_API_KEY=test-key-12345`
4. Run/debug individual tests by clicking play button in gutter

### Test Coverage
All 24 tests must pass:
- ✅ 4 error scenario tests
- ✅ 8 integration workflow tests
- ✅ 10 REST API tests
- ✅ 6 WebSocket tests

## Migration Notes

### From Anthropic SDK to litellm
The backend was migrated from direct Anthropic SDK to litellm for:
- **Multi-provider support**: OpenRouter, Anthropic, OpenAI, 100+ models
- **Cost reduction**: Access to free models via OpenRouter
- **Flexibility**: Easy model switching via environment variables

**Key Changes:**
- `ANTHROPIC_API_KEY` → `OPENROUTER_API_KEY`
- `CLAUDE_MODEL` → `MODEL_NAME`
- Tool format: Anthropic format → OpenAI format (required by litellm)
- Streaming: `anthropic.messages.stream()` → `litellm.acompletion(stream=True)`
- Event format: Maintained backward compatibility via translation layer

**Benefits:**
- Free tier models available (Llama 3.3 70B, Qwen Coder, DeepSeek)
- Can switch between providers without code changes
- Same WebSocket protocol for frontend compatibility
- All tests continue to pass
