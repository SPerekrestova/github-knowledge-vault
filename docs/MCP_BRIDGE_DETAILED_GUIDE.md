# MCP Bridge - Detailed Step-by-Step Implementation Guide (Python)

## Overview

This guide provides granular, step-by-step instructions for implementing the MCP Bridge using **Python + FastAPI**. The bridge translates HTTP REST requests from the React frontend into MCP protocol calls to the MCP Server.

**Tech Stack Change:** Originally planned for Node.js, but **Python is more feasible** because:
- ✅ MCP Server is already in Python (easier integration)
- ✅ Can run in same process or communicate via stdio
- ✅ FastAPI provides async REST API (similar to Express)
- ✅ Single language stack simplifies deployment
- ✅ Better type sharing with MCP Server

**Estimated Total Time:** 2-3 hours
**Difficulty:** Intermediate
**Prerequisites:** Python 3.10+, completed MCP Server, basic FastAPI knowledge

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                            │
│  http://localhost:5173                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP REST (JSON)
                       │ GET /api/repos
                       │ GET /api/content/:repo
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Bridge (Python + FastAPI)                              │
│  http://localhost:3001                                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐   │
│  │ FastAPI      │    │ MCP Client   │   │ In-Memory    │   │
│  │ REST API     │───►│ (stdio)      │   │ Cache        │   │
│  │ Endpoints    │    └──────┬───────┘   │ (TTL: 5 min) │   │
│  └──────────────┘           │           └──────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                              │
                              │ MCP Protocol (stdio)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (Python + FastMCP)                              │
│  /home/user/GitHub_MCP_Server/main.py                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Project Setup & Environment (30 minutes)

### Step 1.1: Create MCP Bridge Directory

**What:** Set up the bridge project within the main repository

**Why:** Keep bridge code organized alongside frontend

**Commands:**
```bash
# Navigate to main project
cd /home/user/github-knowledge-vault

# Create bridge directory
mkdir -p mcp-bridge
cd mcp-bridge

# Verify location
pwd
# Should output: /home/user/github-knowledge-vault/mcp-bridge
```

**Verification:**
```bash
ls -la
# Should show empty directory
```

---

### Step 1.2: Create Python Virtual Environment

**What:** Isolate bridge dependencies from system Python

**Why:** Avoid conflicts with MCP Server dependencies

**Commands:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Verify
which python
# Should output: .../github-knowledge-vault/mcp-bridge/venv/bin/python
```

**Note:** This is a separate venv from the MCP Server.

---

### Step 1.3: Create Project Files

**What:** Set up all necessary files for the bridge

**Why:** Establish complete project structure

**Commands:**
```bash
# Create main files
touch main.py
touch models.py
touch cache.py
touch mcp_client.py
touch requirements.txt
touch .env
touch .gitignore
touch README.md

# Create a tests directory
mkdir tests
touch tests/__init__.py
touch tests/test_api.py

# Verify
ls -la
# Should show: main.py, models.py, cache.py, mcp_client.py, requirements.txt, etc.
```

---

### Step 1.4: Configure .gitignore

**What:** Prevent committing unnecessary files

**Why:** Keep repository clean

**Content for `.gitignore`:**
```
# Virtual Environment
venv/
env/

# Python Cache
__pycache__/
*.pyc
*.pyo
.Python

# Environment Variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log
```

**Create:**
```bash
cat > .gitignore << 'EOF'
venv/
__pycache__/
*.pyc
.env
.DS_Store
.idea/
.pytest_cache/
*.log
EOF
```

---

### Step 1.5: Set Up requirements.txt

**What:** List all Python dependencies for the bridge

**Why:** Enable reproducible installation

**Content for `requirements.txt`:**
```
# Web Framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# MCP SDK
mcp>=0.1.0

# Data Validation
pydantic>=2.0.0
pydantic-settings>=2.0.0

# Environment Variables
python-dotenv>=1.0.0

# CORS Support
fastapi-cors>=0.0.6

# HTTP Client (if needed)
httpx>=0.25.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx  # For testing FastAPI
```

**Create:**
```bash
cat > requirements.txt << 'EOF'
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
mcp>=0.1.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
httpx>=0.25.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
EOF
```

---

### Step 1.6: Install Dependencies

**What:** Install all required Python packages

**Why:** Make libraries available for development

**Commands:**
```bash
# Ensure venv is activated
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep -E "fastapi|uvicorn|mcp|pydantic"
```

**Troubleshooting:**
- If `mcp` package not found, try: `pip install modelcontextprotocol` or `pip install mcp-sdk`
- Check Python version: `python --version` (should be 3.10+)

---

### Step 1.7: Configure Environment Variables

**What:** Set up configuration for the bridge

**Why:** Externalize configuration, enable flexibility

**Content for `.env`:**
```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0

# GitHub Organization
GITHUB_ORGANIZATION=your-org-name

# MCP Server Configuration
MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
MCP_SERVER_TYPE=stdio  # or 'http' if MCP server runs standalone

# Cache Configuration
CACHE_TTL_SECONDS=300  # 5 minutes
CACHE_ENABLED=true

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
CORS_ALLOW_CREDENTIALS=true

# Logging
LOG_LEVEL=INFO
```

**Create:**
```bash
cat > .env << 'EOF'
PORT=3001
HOST=0.0.0.0
GITHUB_ORGANIZATION=your-org-name
MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
MCP_SERVER_TYPE=stdio
CACHE_TTL_SECONDS=300
CACHE_ENABLED=true
CORS_ORIGINS=http://localhost:5173
CORS_ALLOW_CREDENTIALS=true
LOG_LEVEL=INFO
EOF
```

**⚠️ Important:** Replace `your-org-name` with your actual GitHub organization.

---

### Step 1.8: Create Basic README

**What:** Document the MCP Bridge project

**Why:** Help developers understand the bridge

**Content for `README.md`:**
```markdown
# MCP Bridge

REST API bridge that translates HTTP requests to MCP protocol calls.

## Architecture

```
Frontend (React) → MCP Bridge (FastAPI) → MCP Server (FastMCP) → GitHub API
```

## Features

- FastAPI-based REST API
- Async/await for performance
- In-memory caching (5-minute TTL)
- CORS support for frontend
- Automatic API documentation (Swagger/OpenAPI)

## Setup

1. Create virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Run server:
   ```bash
   python main.py
   # or
   uvicorn main:app --reload --port 3001
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /api/repos` - Get all repositories
- `GET /api/repos/{repo_name}/docs` - Get documentation files
- `GET /api/content/{repo_name}` - Get all content for a repository
- `GET /api/content/all` - Get content from all repositories
- `POST /api/search` - Search documentation

## Environment Variables

See `.env` file for all configuration options.

## Testing

```bash
pytest
```

## API Documentation

When running, visit:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc
```

**Create:**
```bash
cat > README.md << 'EOF'
# MCP Bridge

REST API bridge that translates HTTP requests to MCP protocol calls.

## Setup

1. Create virtual environment: `python3 -m venv venv && source venv/bin/activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Configure `.env` file
4. Run: `python main.py`

See documentation for details.
EOF
```

---

### Step 1.9: Initial Git Commit

**What:** Save bridge project setup

**Why:** Track changes from the beginning

**Commands:**
```bash
# From mcp-bridge directory
git status

# Add files (from project root)
cd /home/user/github-knowledge-vault
git add mcp-bridge/.gitignore mcp-bridge/requirements.txt mcp-bridge/README.md

# Commit
git commit -m "chore: Initialize MCP Bridge project with Python/FastAPI

- Set up project structure
- Add dependencies (FastAPI, uvicorn, MCP SDK)
- Configure environment variables
- Add README documentation"

# Verify
git log --oneline -1
```

---

## Part 2: Core MCP Bridge Implementation (2-3 hours)

### Step 2.1: Create Data Models

**What:** Define Pydantic models for request/response data

**Why:** Type safety, validation, automatic API docs

**Add to `models.py`:**
```python
"""
Data models for MCP Bridge
Pydantic models for request/response validation and serialization
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class Repository(BaseModel):
    """Repository model matching frontend expectations"""
    id: str
    name: str
    description: str
    url: str
    hasDocFolder: bool = Field(alias="hasDocFolder")

    class Config:
        populate_by_name = True


class DocumentFile(BaseModel):
    """Documentation file metadata"""
    id: str
    name: str
    path: str
    type: Literal["markdown", "mermaid", "postman", "openapi", "svg"]
    size: int
    url: str
    download_url: str = Field(alias="download_url")
    sha: str

    class Config:
        populate_by_name = True


class ContentItem(BaseModel):
    """Content item with file data"""
    id: str
    repoId: str = Field(alias="repoId")
    name: str
    path: str
    type: str
    content: str
    lastUpdated: str = Field(alias="lastUpdated")

    class Config:
        populate_by_name = True


class SearchQuery(BaseModel):
    """Search request body"""
    query: str = Field(..., min_length=1, max_length=200)


class SearchResult(BaseModel):
    """Search result item"""
    name: str
    path: str
    repository: str
    url: str
    sha: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    cache_size: int
    mcp_connected: bool


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
```

**Understanding the models:**
- `Repository`: Matches what frontend expects from `useRepos` hook
- `ContentItem`: Matches frontend `ContentItem` type
- `SearchQuery`: Validates search requests
- Field aliases handle camelCase ↔ snake_case conversion

**Verification:**
```bash
# Test import
python -c "from models import Repository, ContentItem; print('✅ Models imported')"
```

---

### Step 2.2: Implement In-Memory Cache

**What:** Create simple cache with TTL support

**Why:** Reduce duplicate MCP calls, improve performance

**Add to `cache.py`:**
```python
"""
In-memory cache with TTL (Time To Live) support
Simple dictionary-based cache for MCP responses
"""

import time
from typing import Any, Optional, Dict
import logging

logger = logging.getLogger(__name__)


class CacheEntry:
    """Cache entry with data and timestamp"""
    def __init__(self, data: Any):
        self.data = data
        self.timestamp = time.time()


class InMemoryCache:
    """
    Simple in-memory cache with TTL support

    Features:
    - Automatic expiration based on TTL
    - Pattern-based invalidation
    - Thread-safe (single-threaded async context)
    """

    def __init__(self, ttl_seconds: int = 300):
        """
        Initialize cache

        Args:
            ttl_seconds: Time to live in seconds (default: 300 = 5 minutes)
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._ttl = ttl_seconds
        logger.info(f"Cache initialized with TTL: {ttl_seconds}s")

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/not found
        """
        entry = self._cache.get(key)
        if not entry:
            logger.debug(f"Cache miss: {key}")
            return None

        # Check if expired
        if time.time() - entry.timestamp > self._ttl:
            logger.debug(f"Cache expired: {key}")
            del self._cache[key]
            return None

        logger.debug(f"Cache hit: {key}")
        return entry.data

    def set(self, key: str, value: Any) -> None:
        """
        Store value in cache

        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = CacheEntry(value)
        logger.debug(f"Cache set: {key}")

    def invalidate(self, key: str) -> None:
        """
        Remove specific key from cache

        Args:
            key: Cache key to remove
        """
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache invalidated: {key}")

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Remove all keys matching a pattern (simple substring match)

        Args:
            pattern: Pattern to match (e.g., "repos:", "content:")

        Returns:
            Number of keys removed
        """
        keys_to_remove = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_remove:
            del self._cache[key]

        logger.info(f"Invalidated {len(keys_to_remove)} keys matching '{pattern}'")
        return len(keys_to_remove)

    def clear(self) -> None:
        """Clear entire cache"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cache cleared ({count} entries removed)")

    def size(self) -> int:
        """Get number of cached entries"""
        return len(self._cache)

    def cleanup_expired(self) -> int:
        """
        Remove all expired entries

        Returns:
            Number of entries removed
        """
        now = time.time()
        expired_keys = [
            k for k, v in self._cache.items()
            if now - v.timestamp > self._ttl
        ]

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")

        return len(expired_keys)
```

**Test the cache:**

Create `test_cache.py`:
```python
import time
from cache import InMemoryCache

def test_cache():
    cache = InMemoryCache(ttl_seconds=2)

    # Test set/get
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"
    print("✅ Set/get works")

    # Test expiration
    time.sleep(3)
    assert cache.get("key1") is None
    print("✅ TTL expiration works")

    # Test pattern invalidation
    cache.set("repos:all", [1, 2, 3])
    cache.set("repos:single", [1])
    cache.set("content:all", [4, 5])
    assert cache.size() == 3

    cache.invalidate_pattern("repos:")
    assert cache.size() == 1
    print("✅ Pattern invalidation works")

    print("\n🎉 All cache tests passed!")

if __name__ == "__main__":
    test_cache()
```

Run:
```bash
python test_cache.py
```

---

### Step 2.3: Implement MCP Client Connector

**What:** Create client to communicate with MCP Server

**Why:** Bridge between REST API and MCP protocol

**Add to `mcp_client.py`:**
```python
"""
MCP Client for communicating with the MCP Server
Handles stdio-based MCP protocol communication
"""

import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger(__name__)


class MCPClient:
    """
    Client for communicating with GitHub MCP Server

    Manages connection lifecycle and provides high-level methods
    for calling MCP tools.
    """

    def __init__(self, mcp_server_path: str, organization: str):
        """
        Initialize MCP Client

        Args:
            mcp_server_path: Path to MCP Server main.py
            organization: GitHub organization name
        """
        self.mcp_server_path = mcp_server_path
        self.organization = organization
        self.session: Optional[ClientSession] = None
        self._read = None
        self._write = None
        logger.info(f"MCP Client initialized for org: {organization}")

    async def connect(self):
        """
        Establish connection to MCP Server via stdio

        Raises:
            Exception: If connection fails
        """
        try:
            logger.info(f"Connecting to MCP Server: {self.mcp_server_path}")

            # Create server parameters
            server_params = StdioServerParameters(
                command="python",
                args=[self.mcp_server_path],
                env=None
            )

            # Connect via stdio
            stdio_transport = await stdio_client(server_params)
            self._read, self._write = stdio_transport

            # Create session
            self.session = ClientSession(self._read, self._write)
            await self.session.initialize()

            logger.info("✅ Connected to MCP Server")

        except Exception as e:
            logger.error(f"Failed to connect to MCP Server: {e}")
            raise

    async def disconnect(self):
        """Close connection to MCP Server"""
        if self.session:
            await self.session.__aexit__(None, None, None)
            logger.info("Disconnected from MCP Server")

    async def ensure_connected(self):
        """Ensure client is connected, reconnect if needed"""
        if not self.session:
            await self.connect()

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call an MCP tool

        Args:
            tool_name: Name of the MCP tool
            arguments: Tool arguments as dictionary

        Returns:
            Parsed tool response

        Raises:
            Exception: If tool call fails
        """
        await self.ensure_connected()

        try:
            logger.info(f"Calling MCP tool: {tool_name} with args: {arguments}")

            result = await self.session.call_tool(tool_name, arguments)

            # Parse result
            if result.content and len(result.content) > 0:
                content = result.content[0]
                if hasattr(content, 'text'):
                    parsed = json.loads(content.text)
                    logger.info(f"Tool {tool_name} returned {type(parsed)}")
                    return parsed
                else:
                    return content

            logger.warning(f"Tool {tool_name} returned empty content")
            return None

        except Exception as e:
            logger.error(f"MCP tool call failed ({tool_name}): {e}")
            raise

    # High-level methods for each MCP tool

    async def get_repositories(self) -> List[Dict[str, Any]]:
        """
        Fetch all repositories from the organization

        Returns:
            List of repository dictionaries
        """
        return await self.call_tool("get_org_repos", {"org": self.organization})

    async def get_repo_documentation(self, repo_name: str) -> List[Dict[str, Any]]:
        """
        Get documentation files from a repository

        Args:
            repo_name: Repository name

        Returns:
            List of documentation file dictionaries
        """
        return await self.call_tool(
            "get_repo_docs",
            {"org": self.organization, "repo": repo_name}
        )

    async def get_file_content(self, repo_name: str, path: str) -> Dict[str, Any]:
        """
        Get content of a specific file

        Args:
            repo_name: Repository name
            path: File path within repository

        Returns:
            File content dictionary with 'content', 'name', 'path', etc.
        """
        return await self.call_tool(
            "get_file_content",
            {"org": self.organization, "repo": repo_name, "path": path}
        )

    async def search_documentation(self, query: str) -> List[Dict[str, Any]]:
        """
        Search documentation across organization

        Args:
            query: Search query string

        Returns:
            List of search result dictionaries
        """
        return await self.call_tool(
            "search_documentation",
            {"org": self.organization, "query": query}
        )
```

**Important Notes:**
- Uses `mcp` Python SDK for client communication
- Stdio transport means MCP Server runs as subprocess
- Session lifecycle managed automatically
- Automatic reconnection on disconnection

---

### Step 2.4: Implement FastAPI Application (Core)

**What:** Create the main FastAPI application with REST endpoints

**Why:** Expose MCP functionality via HTTP REST API

**Add to `main.py` (Part 1 - Setup):**

```python
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
MCP_SERVER_PATH = os.getenv("MCP_SERVER_PATH", "../GitHub_MCP_Server/main.py")
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
    logger.info("🚀 Starting MCP Bridge...")
    logger.info(f"   Organization: {GITHUB_ORG}")
    logger.info(f"   MCP Server: {MCP_SERVER_PATH}")
    logger.info(f"   Cache: {'Enabled' if CACHE_ENABLED else 'Disabled'} (TTL: {CACHE_TTL}s)")

    # Validate configuration
    if not GITHUB_ORG:
        logger.error("❌ GITHUB_ORGANIZATION not set in environment")
        raise ValueError("GITHUB_ORGANIZATION is required")

    # Initialize cache
    if CACHE_ENABLED:
        cache = InMemoryCache(ttl_seconds=CACHE_TTL)
        logger.info("✅ Cache initialized")

    # Initialize and connect MCP client
    try:
        mcp_client = MCPClient(MCP_SERVER_PATH, GITHUB_ORG)
        await mcp_client.connect()
        logger.info("✅ MCP Client connected")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MCP Server: {e}")
        raise

    logger.info("✅ MCP Bridge ready")

    yield  # Application runs here

    # Shutdown
    logger.info("🛑 Shutting down MCP Bridge...")

    if mcp_client:
        await mcp_client.disconnect()
        logger.info("✅ MCP Client disconnected")

    if cache:
        cache.clear()
        logger.info("✅ Cache cleared")

    logger.info("✅ MCP Bridge stopped")


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
```

**Continue `main.py` (Part 2 - Endpoints):**

```python
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
            logger.info("📦 Returning cached repositories")
            return cached

    # Fetch from MCP
    try:
        logger.info("🔄 Fetching repositories from MCP Server")
        repos = await mcp_client.get_repositories()

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, repos)

        logger.info(f"✅ Returned {len(repos)} repositories")
        return repos

    except Exception as e:
        logger.error(f"❌ Failed to fetch repositories: {e}")
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
            logger.info(f"📦 Returning cached docs for {repo_name}")
            return cached

    # Fetch from MCP
    try:
        logger.info(f"🔄 Fetching docs for {repo_name} from MCP Server")
        docs = await mcp_client.get_repo_documentation(repo_name)

        # Cache result
        if cache and CACHE_ENABLED:
            cache.set(cache_key, docs)

        logger.info(f"✅ Returned {len(docs)} docs for {repo_name}")
        return docs

    except Exception as e:
        logger.error(f"❌ Failed to fetch docs for {repo_name}: {e}")
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
            logger.info(f"📦 Returning cached content for {repo_name}")
            return cached

    # Fetch from MCP
    try:
        logger.info(f"🔄 Fetching content for {repo_name} from MCP Server")

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

        logger.info(f"✅ Returned {len(content_items)} content items for {repo_name}")
        return content_items

    except Exception as e:
        logger.error(f"❌ Failed to fetch content for {repo_name}: {e}")
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
            logger.info("📦 Returning cached all content")
            return cached

    # Fetch from MCP
    try:
        logger.info("🔄 Fetching all content from MCP Server")

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

        logger.info(f"✅ Returned {len(all_content)} total content items")
        return all_content

    except Exception as e:
        logger.error(f"❌ Failed to fetch all content: {e}")
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
        logger.info(f"🔍 Searching for: '{query.query}'")

        results = await mcp_client.search_documentation(query.query)

        logger.info(f"✅ Found {len(results)} search results")
        return results

    except Exception as e:
        logger.error(f"❌ Search failed: {e}")
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
```

**Understanding the code:**

1. **Lifespan Management:** Startup/shutdown handled cleanly
2. **Global Instances:** MCP client and cache initialized once
3. **Caching Strategy:** Check cache first, fetch on miss, store result
4. **Error Handling:** All endpoints wrapped in try/except
5. **Logging:** Comprehensive logging at all levels
6. **Type Safety:** Pydantic models enforce types

---

### Step 2.5: Make Main Executable and Test

**What:** Test the complete MCP Bridge

**Why:** Verify all components work together

**Make executable:**
```bash
chmod +x main.py
```

**Test:**
```bash
# Ensure MCP Server path is correct
ls ../GitHub_MCP_Server/main.py
# Should show the file

# Run the bridge
python main.py
```

**Expected output:**
```
2024-XX-XX 10:00:00 - INFO - 🚀 Starting MCP Bridge...
2024-XX-XX 10:00:00 - INFO -    Organization: your-org
2024-XX-XX 10:00:00 - INFO -    MCP Server: ../GitHub_MCP_Server/main.py
2024-XX-XX 10:00:00 - INFO -    Cache: Enabled (TTL: 300s)
2024-XX-XX 10:00:00 - INFO - ✅ Cache initialized
2024-XX-XX 10:00:00 - INFO - Connecting to MCP Server...
2024-XX-XX 10:00:00 - INFO - ✅ Connected to MCP Server
2024-XX-XX 10:00:00 - INFO - ✅ MCP Bridge ready
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3001
```

**Test endpoints (in another terminal):**
```bash
# Health check
curl http://localhost:3001/health

# Get repositories
curl http://localhost:3001/api/repos

# Get docs from a specific repo (replace with actual repo name)
curl http://localhost:3001/api/repos/YOUR_REPO_NAME/docs

# Test Swagger UI
# Open browser: http://localhost:3001/docs
```

---

## Part 3: Testing & Validation (30-45 minutes)

### Step 3.1: Create Unit Tests

**What:** Test individual components

**Why:** Ensure reliability

**Add to `tests/test_api.py`:**
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_health_check():
    """Test health endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "cache_size" in data
        assert "mcp_connected" in data


@pytest.mark.asyncio
async def test_get_repos():
    """Test repositories endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/repos")
        assert response.status_code == 200
        repos = response.json()
        assert isinstance(repos, list)


@pytest.mark.asyncio
async def test_search():
    """Test search endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/search",
            json={"query": "API"}
        )
        assert response.status_code == 200
        results = response.json()
        assert isinstance(results, list)
```

**Run tests:**
```bash
pytest tests/
```

---

### Step 3.2: Integration Testing

**What:** Test the complete flow

**Why:** Verify end-to-end functionality

Create `test_integration.py`:
```python
#!/usr/bin/env python3
import asyncio
import httpx

async def test_integration():
    """Test complete MCP Bridge flow"""
    base_url = "http://localhost:3001"

    async with httpx.AsyncClient() as client:
        print("🧪 Testing MCP Bridge Integration\n")

        # Test 1: Health check
        print("1. Testing health check...")
        response = await client.get(f"{base_url}/health")
        assert response.status_code == 200
        health = response.json()
        print(f"   ✅ Status: {health['status']}")
        print(f"   ✅ MCP Connected: {health['mcp_connected']}")

        # Test 2: Get repositories
        print("\n2. Testing get repositories...")
        response = await client.get(f"{base_url}/api/repos")
        assert response.status_code == 200
        repos = response.json()
        print(f"   ✅ Found {len(repos)} repositories")

        if repos:
            repos_with_docs = [r for r in repos if r['hasDocFolder']]
            print(f"   ✅ {len(repos_with_docs)} have /doc folders")

            # Test 3: Get docs from first repo
            if repos_with_docs:
                test_repo = repos_with_docs[0]['name']
                print(f"\n3. Testing get docs for {test_repo}...")
                response = await client.get(f"{base_url}/api/repos/{test_repo}/docs")
                assert response.status_code == 200
                docs = response.json()
                print(f"   ✅ Found {len(docs)} docs")

                # Test 4: Get content
                if docs:
                    print(f"\n4. Testing get content for {test_repo}...")
                    response = await client.get(f"{base_url}/api/content/{test_repo}")
                    assert response.status_code == 200
                    content = response.json()
                    print(f"   ✅ Retrieved {len(content)} content items")

        # Test 5: Search
        print("\n5. Testing search...")
        response = await client.post(
            f"{base_url}/api/search",
            json={"query": "API"}
        )
        assert response.status_code == 200
        results = response.json()
        print(f"   ✅ Found {len(results)} search results")

        print("\n🎉 All integration tests passed!")

if __name__ == "__main__":
    asyncio.run(test_integration())
```

**Run:**
```bash
# Start bridge in one terminal
python main.py

# Run integration test in another
python test_integration.py
```

---

## Part 4: Documentation & Finalization (30 minutes)

### Step 4.1: Update README with Full Docs

**Content:** (Already covered in Step 1.8, expand if needed)

### Step 4.2: Create .env.example

```bash
cat > .env.example << 'EOF'
# Server Configuration
PORT=3001
HOST=0.0.0.0

# GitHub Organization
GITHUB_ORGANIZATION=your-org-name

# MCP Server Configuration
MCP_SERVER_PATH=../GitHub_MCP_Server/main.py
MCP_SERVER_TYPE=stdio

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_ENABLED=true

# CORS Configuration
CORS_ORIGINS=http://localhost:5173
CORS_ALLOW_CREDENTIALS=true

# Logging
LOG_LEVEL=INFO
EOF
```

### Step 4.3: Final Git Commit

```bash
cd /home/user/github-knowledge-vault

git add mcp-bridge/
git commit -m "feat: Implement MCP Bridge with Python/FastAPI

Complete REST API bridge for translating HTTP to MCP protocol.

Components:
- FastAPI REST API with async support
- MCP Client using stdio transport
- In-memory cache with 5-minute TTL
- Pydantic models for type safety
- Comprehensive error handling and logging

Endpoints:
- GET /health - Health check
- GET /api/repos - Get repositories
- GET /api/repos/{name}/docs - Get docs
- GET /api/content/{repo} - Get content
- GET /api/content/all - Get all content
- POST /api/search - Search documentation
- Cache management endpoints

Features:
- Automatic Swagger/OpenAPI docs at /docs
- CORS support for frontend
- Lifespan management (startup/shutdown)
- Comprehensive logging
- Unit and integration tests"
```

---

## Verification Checklist

- [ ] Virtual environment created and activated
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` configured with correct paths and org name
- [ ] MCP Server path exists and is correct
- [ ] Bridge starts without errors (`python main.py`)
- [ ] Health endpoint returns 200 (`curl http://localhost:3001/health`)
- [ ] Can fetch repositories (`GET /api/repos`)
- [ ] Can fetch docs (`GET /api/repos/{name}/docs`)
- [ ] Can fetch content (`GET /api/content/{repo}`)
- [ ] Search works (`POST /api/search`)
- [ ] Swagger UI accessible at `http://localhost:3001/docs`
- [ ] Cache is working (check logs for cache hits)
- [ ] Integration tests pass
- [ ] Code committed to Git

---

## Common Issues & Solutions

### Issue: "Module 'mcp' not found"
**Solution:**
```bash
pip install mcp
# or
pip install modelcontextprotocol
```

### Issue: "Cannot connect to MCP Server"
**Solution:**
- Verify `MCP_SERVER_PATH` is correct
- Ensure MCP Server `main.py` is executable
- Check Python path: `which python`
- Test MCP Server independently first

### Issue: "GITHUB_ORGANIZATION not set"
**Solution:**
```bash
# Edit .env
nano .env
# Add: GITHUB_ORGANIZATION=your-actual-org
```

### Issue: CORS errors from frontend
**Solution:**
```bash
# Edit .env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
# Restart bridge
```

### Issue: Cache not working
**Solution:**
- Check `CACHE_ENABLED=true` in `.env`
- Look for "Cache hit" in logs
- Try clearing cache: `curl -X POST http://localhost:3001/api/cache/clear`

---

## Next Steps

Once MCP Bridge is complete:

1. ✅ **Phase 1 Complete:** MCP Server
2. ✅ **Phase 2 Complete:** MCP Bridge ⭐
3. ⏭️ **Phase 3:** Integrate with Frontend
4. ⏭️ **Phase 4:** End-to-end Testing
5. ⏭️ **Phase 5:** Deployment

---

## Time Breakdown Summary

| Step | Task | Time |
|------|------|------|
| 1.1-1.9 | Project setup | 30 min |
| 2.1 | Data models | 20 min |
| 2.2 | Cache implementation | 25 min |
| 2.3 | MCP client | 30 min |
| 2.4 | FastAPI endpoints | 45 min |
| 2.5 | Testing | 20 min |
| 3.1-3.2 | Unit & integration tests | 30 min |
| 4.1-4.3 | Documentation & finalization | 30 min |
| **Total** | | **~3.5 hours** |

---

**Congratulations! 🎉**

You now have a fully functional MCP Bridge that:
- Translates REST API calls to MCP protocol
- Caches responses for performance
- Provides automatic API documentation
- Handles errors gracefully
- Supports CORS for frontend integration
- Is fully tested and documented

Ready for Phase 3 (Frontend Integration)?
