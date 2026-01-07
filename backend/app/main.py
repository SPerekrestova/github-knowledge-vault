"""
FastAPI Application - Main entry point.

Endpoints:
- GET /health - Health check
- GET /api/repos - List repositories
- GET /api/repos/{name}/tree - Get repository file tree
- GET /api/repos/{name}/files/{path:path} - Get file content
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Any

from app.config import settings
from app.mcp import mcp_client


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
