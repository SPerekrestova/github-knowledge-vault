# GitHub Knowledge Vault - Backend

FastAPI backend for the GitHub Knowledge Vault project. Provides AI-powered documentation search and chat capabilities using Claude and the Model Context Protocol (MCP).

## Features

- **REST API** - Browse repositories and retrieve documentation
- **WebSocket Chat** - Real-time conversations with Claude about your documentation
- **Streaming Responses** - See Claude's responses in real-time as they're generated
- **Tool Execution** - Automatic integration with MCP server for documentation search
- **Repository Context** - Scope conversations to specific repositories

## Quick Start

### Prerequisites

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) package manager
- Anthropic API key
- Running MCP server (optional for full functionality)

## API Endpoints

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repos` | List all repositories |
| GET | `/api/repos/{name}/tree` | Get repository file tree |
| GET | `/api/repos/{name}/files/{path}` | Get file content |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/{id}/messages` | Get conversation history |

### WebSocket Endpoint

**`WS /ws/chat/{conversation_id}`** - Real-time chat with Claude

**Client sends:**
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

## Available Tools (MCP Integration)

The backend provides Claude with these tools for documentation access:

1. **`list_repositories`** - List all available repositories
2. **`search_documentation`** - Search across all documentation
   - Optional: `repo` parameter to limit search scope
3. **`get_documentation`** - Retrieve specific document content
   - Requires: `repo` and `path` parameters
4. **`list_repo_docs`** - List all docs in a repository
   - Requires: `repo` parameter
