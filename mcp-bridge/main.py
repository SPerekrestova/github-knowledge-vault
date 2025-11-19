#!/usr/bin/env python3
"""
MCP Bridge - REST API to MCP Protocol Bridge
FastAPI-based server that translates HTTP requests to MCP calls
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    Repository,
    DocumentFile,
    ContentItem,
    SearchQuery,
    SearchResult,
    HealthResponse,
    ErrorResponse
)
from cache import InMemoryCache
from mcp_client import MCPClient

# Load environment variables
load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", "3001"))
HOST = os.getenv("HOST", "0.0.0.0")
GITHUB_ORG = os.getenv("GITHUB_ORGANIZATION", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
MCP_SERVER_IMAGE = os.getenv("MCP_SERVER_IMAGE", "ghcr.io/sperekrestova/github-mcp-server:latest")
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances (will be initialized in lifespan)
mcp_client: Optional[MCPClient] = None
cache: Optional[InMemoryCache] = None


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan (startup and shutdown)

    Startup:
    - Initialize MCP client
    - Connect to MCP Server
    - Initialize cache

    Shutdown:
    - Disconnect MCP client
    - Clear cache
    """
    global mcp_client, cache

    # Startup
    logger.info("Starting MCP Bridge...")
    logger.info(f"   Organization: {GITHUB_ORG}")
    logger.info(f"   MCP Server Image: {MCP_SERVER_IMAGE}")
    logger.info(f"   Cache: {'Enabled' if CACHE_ENABLED else 'Disabled'} (TTL: {CACHE_TTL}s)")

    # Validate configuration
    if not GITHUB_ORG:
        logger.error("GITHUB_ORGANIZATION not set in environment")
        raise ValueError("GITHUB_ORGANIZATION is required")

    # Initialize cache
    if CACHE_ENABLED:
        cache = InMemoryCache(ttl_seconds=CACHE_TTL)
        logger.info("Cache initialized")

    # Initialize and connect MCP client
    try:
        mcp_client = MCPClient(MCP_SERVER_IMAGE, GITHUB_ORG, GITHUB_TOKEN)
        await mcp_client.connect()
        logger.info("MCP Client connected")
    except Exception as e:
        logger.error(f"Failed to connect to MCP Server: {e}")
        logger.warning("Bridge will start but MCP calls will fail")
        logger.warning(f"Make sure Docker is installed and image is available: {MCP_SERVER_IMAGE}")
        # Don't raise, allow server to start for testing

    logger.info("MCP Bridge ready")

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down MCP Bridge...")

    if mcp_client:
        await mcp_client.disconnect()
        logger.info("MCP Client disconnected")

    if cache:
        cache.clear()
        logger.info("Cache cleared")

    logger.info("MCP Bridge stopped")


# Create FastAPI app
app = FastAPI(
    title="MCP Bridge API",
    description="REST API bridge for GitHub MCP Server",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS enabled for origins: {CORS_ORIGINS}")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns server status, cache size, and MCP connection status
    """
    return HealthResponse(
        status="ok",
        cache_size=cache.size() if cache else 0,
        mcp_connected=mcp_client is not None and mcp_client.session is not None
    )


@app.get("/api/repos", response_model=List[Repository])
async def get_repositories():
    """
    Get all repositories from the organization

    Returns list of repositories with hasDocFolder flag
    Uses cache if enabled (5-minute TTL)
    """
    cache_key = "repos:all"

    # Check cache
    if cache and CACHE_ENABLED:
        cached = cache.get(cache_key)
        if cached:
            logger.info("Returning cached repositories")
            return cached

    # Fetch from MCP
    try:
        if not mcp_client or not mcp_client.session:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MCP Server not connected. Please check server configuration."
            )

        logger.info("Fetching repositories from MCP Server")
        repos = await mcp_client.get_repositories()

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, repos)

        logger.info(f"Returned {len(repos)} repositories")
        return repos

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )


@app.get("/api/repos/{repo_name}/docs", response_model=List[DocumentFile])
async def get_repo_docs(repo_name: str):
    """
    Get documentation files from a specific repository

    Args:
        repo_name: Repository name

    Returns list of documentation files in /doc folder
    """
    cache_key = f"docs:{repo_name}"

    # Check cache
    if cache and CACHE_ENABLED:
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached docs for {repo_name}")
            return cached

    # Fetch from MCP
    try:
        if not mcp_client or not mcp_client.session:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MCP Server not connected. Please check server configuration."
            )

        logger.info(f"Fetching docs for {repo_name} from MCP Server")
        docs = await mcp_client.get_repo_documentation(repo_name)

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, docs)

        logger.info(f"Returned {len(docs)} docs for {repo_name}")
        return docs

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch docs for {repo_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documentation: {str(e)}"
        )


@app.get("/api/content/{repo_name}", response_model=List[ContentItem])
async def get_repo_content(repo_name: str):
    """
    Get all content from a repository's documentation

    Args:
        repo_name: Repository name

    Returns list of content items with file data
    This endpoint fetches the actual content of each file (slower)
    """
    cache_key = f"content:{repo_name}"

    # Check cache
    if cache and CACHE_ENABLED:
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached content for {repo_name}")
            return cached

    # Fetch from MCP
    try:
        if not mcp_client or not mcp_client.session:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MCP Server not connected. Please check server configuration."
            )

        logger.info(f"Fetching content for {repo_name} from MCP Server")

        # Get list of docs first
        docs = await mcp_client.get_repo_documentation(repo_name)
        logger.info(f"Found {len(docs)} docs in {repo_name}")

        # Fetch content for each doc
        content_items = []
        for doc in docs:
            try:
                file_content = await mcp_client.get_file_content(repo_name, doc["path"])

                content_items.append({
                    "id": doc["id"],
                    "repoId": repo_name,  # Using repo name as ID
                    "name": doc["name"],
                    "path": doc["path"],
                    "type": doc["type"],
                    "content": file_content["content"],
                    "lastUpdated": datetime.utcnow().isoformat()
                })

            except Exception as e:
                logger.warning(f"Failed to fetch content for {doc['path']}: {e}")
                continue

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, content_items)

        logger.info(f"Returned {len(content_items)} content items for {repo_name}")
        return content_items

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch content for {repo_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch content: {str(e)}"
        )


@app.get("/api/content/all", response_model=List[ContentItem])
async def get_all_content():
    """
    Get content from all repositories with documentation

    Returns list of all content items across all repos
    WARNING: This can be slow for organizations with many repos
    """
    cache_key = "content:all"

    # Check cache
    if cache and CACHE_ENABLED:
        cached = cache.get(cache_key)
        if cached:
            logger.info("Returning cached all content")
            return cached

    # Fetch from MCP
    try:
        if not mcp_client or not mcp_client.session:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MCP Server not connected. Please check server configuration."
            )

        logger.info("Fetching all content from MCP Server")

        # Get repositories first
        repos = await mcp_client.get_repositories()
        repos_with_docs = [r for r in repos if r.get("hasDocFolder")]

        logger.info(f"Found {len(repos_with_docs)} repos with /doc folders")

        # Fetch content from each repo
        all_content = []
        for repo in repos_with_docs:
            try:
                repo_content = await get_repo_content(repo["name"])
                all_content.extend(repo_content)
            except Exception as e:
                logger.warning(f"Failed to fetch content from {repo['name']}: {e}")
                continue

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, all_content)

        logger.info(f"Returned {len(all_content)} total content items")
        return all_content

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch all content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch all content: {str(e)}"
        )


@app.post("/api/search", response_model=List[SearchResult])
async def search_documentation(query: SearchQuery):
    """
    Search documentation across all repositories

    Args:
        query: Search query (JSON body)

    Returns list of search results
    Note: Search results are NOT cached (queries vary)
    """
    try:
        if not mcp_client or not mcp_client.session:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MCP Server not connected. Please check server configuration."
            )

        logger.info(f"Searching for: '{query.query}'")

        results = await mcp_client.search_documentation(query.query)

        logger.info(f"Found {len(results)} search results")
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


# Cache management endpoints
@app.post("/api/cache/clear")
async def clear_cache():
    """Clear entire cache"""
    if cache:
        cache.clear()
        logger.info("Cache cleared via API")
        return {"message": "Cache cleared", "size": 0}
    return {"message": "Cache not enabled", "size": 0}


@app.delete("/api/cache/{key}")
async def invalidate_cache_key(key: str):
    """Invalidate specific cache key"""
    if cache:
        cache.invalidate(key)
        logger.info(f"Cache key invalidated: {key}")
        return {"message": f"Cache key '{key}' invalidated"}
    return {"message": "Cache not enabled"}


# ============================================================================
# Application Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    logger.info("=" * 60)
    logger.info("MCP Bridge Starting")
    logger.info("=" * 60)
    logger.info(f"Host: {HOST}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Organization: {GITHUB_ORG}")
    logger.info(f"CORS: {CORS_ORIGINS}")
    logger.info("=" * 60)

    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        log_level=LOG_LEVEL.lower(),
        reload=False  # Set to True for development
    )
