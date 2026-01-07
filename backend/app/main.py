"""
FastAPI Application - Main entry point.

Endpoints:
- GET /health - Health check
- GET /api/repos - List repositories
- GET /api/repos/{name}/tree - Get repository file tree
- GET /api/repos/{name}/files/{path:path} - Get file content
- WS /ws/chat/{conversation_id} - Chat WebSocket
- POST /api/conversations - Create new conversation
- GET /api/conversations/{id}/messages - Get conversation messages
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
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
# CONVERSATION MANAGEMENT
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
