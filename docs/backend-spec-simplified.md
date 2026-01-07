# GitHub Knowledge Vault - Backend Specification (Simplified v1)

## 📋 Overview

This is the **simplified backend specification** for the first iteration of GitHub Knowledge Vault. It focuses on the core functionality needed to get a working prototype with Claude AI and GitHub documentation access.

**Philosophy:** Start minimal, add complexity only when needed.

---

## 🎯 V1 Scope

### ✅ Included
- Health check endpoint (for frontend startup validation)
- WebSocket chat with Claude
- MCP tool execution (GitHub access)
- Streaming responses
- Basic REST endpoints for repo/file browsing

### ❌ Deferred to v2+
- Redis caching
- SQLite persistence
- Conversation history storage
- Rate limiting
- Complex health monitoring
- Separate service layer abstractions

---

## 🏗️ Simplified Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                     (React + TypeScript)                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
       GET /health        WS /ws/chat         GET /api/repos
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                               ▼                                      │
│                    BACKEND (FastAPI)                                 │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐     │
│    │                      main.py                              │     │
│    │  • FastAPI app setup                                      │     │
│    │  • CORS middleware                                        │     │
│    │  • GET /health                                            │     │
│    │  • GET /api/repos                                         │     │
│    │  • GET /api/repos/{name}/tree                             │     │
│    │  • WS /ws/chat/{id}                                       │     │
│    └──────────────────────────────────────────────────────────┘     │
│                          │                                           │
│              ┌───────────┴───────────┐                              │
│              ▼                       ▼                              │
│    ┌──────────────────┐    ┌──────────────────┐                    │
│    │     llm.py       │    │     mcp.py       │                    │
│    │                  │    │                  │                    │
│    │ • Claude client  │───▶│ • HTTP client    │                    │
│    │ • Tool definitions│   │ • Tool execution │                    │
│    │ • Streaming      │    │ • Health check   │                    │
│    └──────────────────┘    └──────────────────┘                    │
│              │                       │                              │
│    ┌─────────┴─────────┐             │                              │
│    │    config.py      │             │                              │
│    │ • Environment vars│             │                              │
│    └───────────────────┘             │                              │
│                                      │                              │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
                 ▼                                           ▼
      ┌───────────────────┐                     ┌───────────────────┐
      │   ANTHROPIC API   │                     │    MCP SERVER     │
      │                   │                     │    (Docker)       │
      │  Claude Sonnet 4  │                     │                   │
      │  • Streaming      │                     │  • list_repos     │
      │  • Tool calling   │                     │  • search_docs    │
      └───────────────────┘                     │  • get_doc        │
                                                │  • list_repo_docs │
                                                └─────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌───────────────────┐
                                                │    GITHUB API     │
                                                └───────────────────┘
```

---

## 📁 File Structure

```
backend/
├── app/
│   ├── __init__.py          # Empty, marks as package
│   ├── main.py              # FastAPI app, routes, WebSocket
│   ├── config.py            # Settings from environment
│   ├── llm.py               # Claude client with streaming
│   └── mcp.py               # MCP client for tool execution
│
├── requirements.txt         # Python dependencies
├── Dockerfile               # Container build
└── .env.example             # Environment template
```

**Total: 5 Python files (~350 lines)**

---

## 🔧 Complete Implementation

### 1. config.py

```python
"""
Application configuration from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Minimal settings for v1."""
    
    # Anthropic
    ANTHROPIC_API_KEY: str
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    CLAUDE_MAX_TOKENS: int = 4096
    
    # MCP Server
    MCP_SERVER_URL: str = "http://mcp-server:3000"
    MCP_TIMEOUT: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

---

### 2. mcp.py

```python
"""
MCP Client - Simple HTTP client for MCP Server communication.
"""
import httpx
from typing import Any, Optional
from app.config import settings


class MCPClient:
    """Minimal MCP client using HTTP."""
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._connected: bool = False
    
    async def connect(self) -> None:
        """Initialize HTTP client and test connection."""
        self._client = httpx.AsyncClient(
            base_url=settings.MCP_SERVER_URL,
            timeout=settings.MCP_TIMEOUT
        )
        
        try:
            response = await self._client.get("/health")
            self._connected = response.status_code == 200
            print(f"MCP Server: {'Connected' if self._connected else 'Failed'}")
        except Exception as e:
            print(f"MCP Server connection failed: {e}")
            self._connected = False
    
    async def disconnect(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
        self._connected = False
    
    @property
    def is_connected(self) -> bool:
        return self._connected
    
    async def call_tool(self, name: str, arguments: dict) -> Any:
        """
        Execute a tool on the MCP Server.
        
        Args:
            name: Tool name (e.g., 'list_repositories')
            arguments: Tool arguments dict
            
        Returns:
            Tool execution result
            
        Raises:
            RuntimeError: If MCP call fails
        """
        if not self._client:
            raise RuntimeError("MCP client not initialized")
        
        try:
            response = await self._client.post(
                "/tools/execute",
                json={"name": name, "arguments": arguments}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("result", data)
            
        except httpx.TimeoutException:
            raise RuntimeError(f"MCP tool '{name}' timed out")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"MCP tool '{name}' failed: {e.response.text}")
        except Exception as e:
            raise RuntimeError(f"MCP tool '{name}' error: {str(e)}")
    
    async def health_check(self) -> dict:
        """Check MCP Server health status."""
        if not self._client:
            return {"status": "disconnected"}
        
        try:
            response = await self._client.get("/health")
            if response.status_code == 200:
                return {"status": "connected"}
            return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "disconnected", "error": str(e)}


# Singleton instance
mcp_client = MCPClient()
```

---

### 3. llm.py

```python
"""
LLM Client - Claude API with streaming and tool execution.
"""
from anthropic import AsyncAnthropic
from typing import AsyncGenerator, Optional, List
import json
import time

from app.config import settings
from app.mcp import mcp_client


# Tool definitions for Claude
TOOLS = [
    {
        "name": "list_repositories",
        "description": "List all available repositories in the organization with their documentation counts.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "search_documentation",
        "description": "Search across all documentation. Returns matching documents with snippets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query string"
                },
                "repo": {
                    "type": "string",
                    "description": "Optional: Limit search to specific repository"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_documentation",
        "description": "Retrieve the full content of a specific documentation file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo": {
                    "type": "string",
                    "description": "Repository name"
                },
                "path": {
                    "type": "string",
                    "description": "File path within the repository"
                }
            },
            "required": ["repo", "path"]
        }
    },
    {
        "name": "list_repo_docs",
        "description": "List all documentation files in a specific repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo": {
                    "type": "string",
                    "description": "Repository name"
                }
            },
            "required": ["repo"]
        }
    }
]


def build_system_prompt(context: Optional[dict] = None) -> str:
    """Build system prompt with optional repo context."""
    
    base = """You are a helpful documentation assistant for a GitHub organization.

You have access to tools to search and retrieve documentation:
- list_repositories: List all available repositories
- search_documentation: Search across documentation
- get_documentation: Get a specific document's content  
- list_repo_docs: List all documents in a repository

When answering questions:
1. Use tools to find relevant documentation
2. Cite specific documents when providing information
3. If information is not found, clearly state that
4. Provide accurate, helpful responses based on the documentation"""
    
    if context and context.get("scope") == "repo" and context.get("repoName"):
        repo = context["repoName"]
        base += f"""

IMPORTANT: The user is currently focused on the '{repo}' repository.
When searching for documentation:
1. Search within '{repo}' first
2. If not found there, mention you're expanding to other repositories
3. Always clarify which repository information comes from"""
    
    return base


class LLMClient:
    """Claude API client with streaming and tool execution."""
    
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS
    
    async def chat_stream(
        self,
        messages: List[dict],
        context: Optional[dict] = None
    ) -> AsyncGenerator[dict, None]:
        """
        Stream chat response from Claude with tool execution.
        
        Args:
            messages: Conversation history [{"role": "user/assistant", "content": "..."}]
            context: Optional context {"scope": "repo", "repoName": "..."}
            
        Yields:
            Events:
            - {"type": "text", "content": "..."}
            - {"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}
            - {"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}
        """
        system_prompt = build_system_prompt(context)
        
        # Initial Claude request
        current_messages = list(messages)
        
        while True:
            # Collect full response for potential continuation
            assistant_content = []
            tool_use_block = None
            tool_input_json = ""
            
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=current_messages,
                tools=TOOLS,
            ) as stream:
                
                async for event in stream:
                    
                    if event.type == "content_block_start":
                        if event.content_block.type == "tool_use":
                            tool_use_block = {
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                            }
                            tool_input_json = ""
                            yield {
                                "type": "tool_use_start",
                                "toolId": event.content_block.id,
                                "name": event.content_block.name,
                                "input": {}
                            }
                    
                    elif event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            yield {"type": "text", "content": event.delta.text}
                        elif hasattr(event.delta, "partial_json"):
                            tool_input_json += event.delta.partial_json
                    
                    elif event.type == "content_block_stop":
                        if tool_use_block:
                            # Parse accumulated JSON and execute tool
                            try:
                                tool_input = json.loads(tool_input_json) if tool_input_json else {}
                            except json.JSONDecodeError:
                                tool_input = {}
                            
                            # Execute the tool
                            start_time = time.time()
                            try:
                                result = await mcp_client.call_tool(
                                    tool_use_block["name"],
                                    tool_input
                                )
                            except Exception as e:
                                result = {"error": str(e)}
                            
                            duration = int((time.time() - start_time) * 1000)
                            
                            yield {
                                "type": "tool_result",
                                "toolId": tool_use_block["id"],
                                "name": tool_use_block["name"],
                                "result": result,
                                "duration": duration
                            }
                            
                            # Store for continuation
                            assistant_content.append({
                                "type": "tool_use",
                                "id": tool_use_block["id"],
                                "name": tool_use_block["name"],
                                "input": tool_input
                            })
                            
                            tool_use_block = None
                            tool_input_json = ""
                
                # Get final message to check stop reason
                final_message = await stream.get_final_message()
            
            # Check if we need to continue (tool_use stop reason)
            if final_message.stop_reason == "tool_use":
                # Build tool results for continuation
                tool_results = []
                for block in final_message.content:
                    if block.type == "tool_use":
                        # Find the result we already computed
                        try:
                            result = await mcp_client.call_tool(block.name, block.input)
                        except Exception as e:
                            result = {"error": str(e)}
                        
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result) if isinstance(result, (dict, list)) else str(result)
                        })
                
                # Update messages for next iteration
                current_messages = current_messages + [
                    {"role": "assistant", "content": final_message.content},
                    {"role": "user", "content": tool_results}
                ]
                
                # Continue the loop for Claude's response to tool results
            else:
                # Normal end (end_turn or max_tokens)
                break


# Singleton instance  
llm_client = LLMClient()
```

---

### 4. main.py

```python
"""
FastAPI Application - Main entry point.

Endpoints:
- GET /health - Health check
- GET /api/repos - List repositories  
- GET /api/repos/{name}/tree - Get repository file tree
- WS /ws/chat/{conversation_id} - Chat WebSocket
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Any
import uuid

from app.config import settings
from app.mcp import mcp_client
from app.llm import llm_client


# ============================================================
# APPLICATION SETUP
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown."""
    print("🚀 Starting GitHub Knowledge Vault Backend...")
    await mcp_client.connect()
    yield
    print("👋 Shutting down...")
    await mcp_client.disconnect()


app = FastAPI(
    title="GitHub Knowledge Vault API",
    description="AI-powered documentation assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for frontend startup validation.
    
    Returns:
        status: "healthy" | "degraded" | "unhealthy"
        services: Status of MCP and Claude
    """
    mcp_ok = mcp_client.is_connected
    claude_ok = bool(settings.ANTHROPIC_API_KEY)
    
    if mcp_ok and claude_ok:
        status = "healthy"
    elif claude_ok:  # Claude works, MCP down
        status = "degraded"
    else:
        status = "unhealthy"
    
    return {
        "status": status,
        "version": "1.0.0",
        "services": {
            "mcp_server": {
                "status": "connected" if mcp_ok else "disconnected"
            },
            "claude_api": {
                "status": "available" if claude_ok else "unavailable",
                "model": settings.CLAUDE_MODEL
            }
        }
    }


# ============================================================
# REST API - Repository Browsing
# ============================================================

@app.get("/api/repos")
async def list_repositories() -> List[Dict[str, Any]]:
    """
    List all available repositories.
    
    Returns:
        List of repositories with name and doc count
    """
    if not mcp_client.is_connected:
        raise HTTPException(status_code=503, detail="MCP Server not available")
    
    try:
        result = await mcp_client.call_tool("list_repositories", {})
        return result if isinstance(result, list) else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/repos/{repo_name}/tree")
async def get_repository_tree(repo_name: str) -> List[Dict[str, Any]]:
    """
    Get file tree for a repository.
    
    Args:
        repo_name: Repository name
        
    Returns:
        List of files/folders in the repository
    """
    if not mcp_client.is_connected:
        raise HTTPException(status_code=503, detail="MCP Server not available")
    
    try:
        result = await mcp_client.call_tool("list_repo_docs", {"repo": repo_name})
        return result if isinstance(result, list) else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/repos/{repo_name}/files/{path:path}")
async def get_file_content(repo_name: str, path: str) -> Dict[str, Any]:
    """
    Get content of a specific file.
    
    Args:
        repo_name: Repository name
        path: File path within repository
        
    Returns:
        Document content and metadata
    """
    if not mcp_client.is_connected:
        raise HTTPException(status_code=503, detail="MCP Server not available")
    
    try:
        result = await mcp_client.call_tool("get_documentation", {
            "repo": repo_name,
            "path": path
        })
        if not result:
            raise HTTPException(status_code=404, detail="Document not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# WEBSOCKET CHAT
# ============================================================

# In-memory conversation storage (per session, not persisted)
conversations: Dict[str, List[dict]] = {}


@app.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    """
    WebSocket endpoint for real-time chat with Claude.
    
    Client -> Server messages:
    - {"type": "message", "content": "...", "context": {"scope": "repo", "repoName": "..."}}
    - {"type": "cancel"} (not implemented in v1)
    - {"type": "ping"}
    
    Server -> Client messages:
    - {"type": "text", "content": "..."}
    - {"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}
    - {"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}
    - {"type": "done", "messageId": "..."}
    - {"type": "error", "message": "..."}
    - {"type": "pong"}
    """
    await websocket.accept()
    
    # Initialize conversation history if new
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    messages = conversations[conversation_id]
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            # Handle ping
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue
            
            # Handle chat message
            if msg_type == "message":
                content = data.get("content", "").strip()
                context = data.get("context")
                
                if not content:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Empty message"
                    })
                    continue
                
                # Add user message to history
                messages.append({"role": "user", "content": content})
                
                # Stream response from Claude
                full_response = ""
                
                try:
                    async for event in llm_client.chat_stream(messages, context):
                        await websocket.send_json(event)
                        
                        if event["type"] == "text":
                            full_response += event["content"]
                    
                    # Add assistant response to history
                    if full_response:
                        messages.append({"role": "assistant", "content": full_response})
                    
                    # Send done event
                    await websocket.send_json({
                        "type": "done",
                        "messageId": str(uuid.uuid4())
                    })
                    
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Chat error: {str(e)}"
                    })
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {conversation_id}")
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


# ============================================================
# OPTIONAL: Create new conversation endpoint
# ============================================================

@app.post("/api/conversations")
async def create_conversation() -> Dict[str, str]:
    """Create a new conversation and return its ID."""
    conversation_id = str(uuid.uuid4())
    conversations[conversation_id] = []
    return {"id": conversation_id}


@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str) -> List[dict]:
    """Get messages for a conversation (from in-memory storage)."""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations[conversation_id]
```

---

### 5. requirements.txt

```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Settings
pydantic-settings==2.1.0

# HTTP Client (for MCP)
httpx==0.26.0

# Anthropic SDK
anthropic==0.18.1

# WebSocket support (included with uvicorn[standard])
websockets==12.0
```

---

### 6. Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Expose port
EXPOSE 3001

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]
```

---

### 7. .env.example

```env
# ============================================================
# ANTHROPIC (Required)
# ============================================================
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Model (optional, defaults shown)
# CLAUDE_MODEL=claude-sonnet-4-20250514
# CLAUDE_MAX_TOKENS=4096

# ============================================================
# MCP SERVER (Required)
# ============================================================
# MCP_SERVER_URL=http://mcp-server:3000
# MCP_TIMEOUT=30

# ============================================================
# CORS (Optional)
# ============================================================
# CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

---

### 8. docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend (React + Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3001
      - VITE_WS_URL=ws://localhost:3001
    depends_on:
      - backend
    networks:
      - app-network

  # Backend (FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - MCP_SERVER_URL=http://mcp-server:3000
    depends_on:
      - mcp-server
    networks:
      - app-network

  # MCP Server (GitHub connector)
  mcp-server:
    image: ghcr.io/github/github-mcp-server:latest
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_ORG=${GITHUB_ORG}
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | Health check | `{status, services}` |
| `GET` | `/api/repos` | List repositories | `[{name, doc_count}]` |
| `GET` | `/api/repos/{name}/tree` | Get file tree | `[{path, type}]` |
| `GET` | `/api/repos/{name}/files/{path}` | Get file content | `{content, metadata}` |
| `POST` | `/api/conversations` | Create conversation | `{id}` |
| `GET` | `/api/conversations/{id}/messages` | Get messages | `[{role, content}]` |

### WebSocket Protocol

**Endpoint:** `ws://localhost:3001/ws/chat/{conversation_id}`

**Client → Server:**
```json
{"type": "message", "content": "What APIs are in payment-service?", "context": {"scope": "repo", "repoName": "payment-service"}}
{"type": "ping"}
```

**Server → Client:**
```json
{"type": "text", "content": "I'll search for..."}
{"type": "tool_use_start", "toolId": "123", "name": "list_repo_docs", "input": {"repo": "payment-service"}}
{"type": "tool_result", "toolId": "123", "name": "list_repo_docs", "result": [...], "duration": 234}
{"type": "text", "content": "I found 12 documents..."}
{"type": "done", "messageId": "abc-123"}
{"type": "pong"}
{"type": "error", "message": "Something went wrong"}
```

---

## 🚀 Quick Start

### Development

```bash
# 1. Clone and navigate
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# 5. Run (assuming MCP server is running)
uvicorn app.main:app --reload --port 3001
```

### Docker

```bash
# From project root
cp .env.example .env
# Edit .env with ANTHROPIC_API_KEY, GITHUB_TOKEN, GITHUB_ORG

docker-compose up -d
```

### Verify

```bash
# Health check
curl http://localhost:3001/health

# List repos
curl http://localhost:3001/api/repos

# WebSocket test (use websocat or browser)
websocat ws://localhost:3001/ws/chat/test-123
```

---

## 📊 Comparison: Original vs Simplified

| Aspect | Original Spec | Simplified v1 |
|--------|---------------|---------------|
| **Python files** | 15-20 | 5 |
| **Lines of code** | ~1500 | ~350 |
| **External services** | Redis + SQLite + MCP | MCP only |
| **Docker containers** | 4 | 3 |
| **Persistence** | SQLite | In-memory |
| **Caching** | Redis | None |
| **Service abstractions** | Multiple layers | Direct calls |
| **Setup time** | 30+ minutes | 5 minutes |

---

## ✅ Implementation Checklist

- [ ] Create `backend/` directory structure
- [ ] Create `app/__init__.py` (empty file)
- [ ] Create `app/config.py`
- [ ] Create `app/mcp.py`
- [ ] Create `app/llm.py`
- [ ] Create `app/main.py`
- [ ] Create `requirements.txt`
- [ ] Create `Dockerfile`
- [ ] Create `.env` with API key
- [ ] Test health endpoint
- [ ] Test WebSocket chat
- [ ] Test repo listing

---

## 🔮 Migration to v2

When you need more features:

| Need | Add |
|------|-----|
| Persist conversations | Add SQLite + conversation_service.py |
| Improve performance | Add Redis + cache_service.py |
| Better monitoring | Expand health checks |
| Rate limiting | Add slowapi middleware |
| Multiple users | Add authentication |

---

## 🎯 Summary

This simplified backend:

- **5 files** instead of 20+
- **~350 lines** instead of 1500+
- **No external databases** (Redis, SQLite deferred)
- **In-memory conversation** storage per session
- **Direct MCP calls** without service abstraction
- **Works immediately** with just an API key

Perfect for getting a working prototype quickly!
