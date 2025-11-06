# MCP Server - Detailed Step-by-Step Implementation Guide

## Overview

This guide provides granular, step-by-step instructions for implementing the GitHub MCP Server from scratch. Each step includes what to do, why, and how to verify it works.

**Estimated Total Time:** 3-4 hours
**Difficulty:** Beginner to Intermediate
**Prerequisites:** Python 3.10+, basic async/await knowledge, GitHub account

---

## Part 1: Project Setup & Environment (30 minutes)

### Step 1.1: Create Project Directory

**What:** Set up the basic folder structure for the MCP Server

**Why:** Organize code in a clean, separate repository

**Commands:**
```bash
# Navigate to your projects folder
cd /home/user

# Create the MCP Server directory
mkdir -p GitHub_MCP_Server
cd GitHub_MCP_Server

# Verify you're in the right place
pwd
# Should output: /home/user/GitHub_MCP_Server
```

**Verification:**
```bash
ls -la
# Should show an empty directory (just . and ..)
```

---

### Step 1.2: Initialize Git Repository

**What:** Set up version control for the project

**Why:** Track changes, enable collaboration, prepare for GitHub push

**Commands:**
```bash
git init

# Verify git is initialized
git status
# Should show: "On branch main" or "On branch master"
```

**Best Practice:** If you want to use 'main' as default branch:
```bash
git config --global init.defaultBranch main
```

---

### Step 1.3: Create Python Virtual Environment

**What:** Isolate Python dependencies for this project

**Why:** Avoid conflicts with other Python projects, ensure reproducibility

**Commands:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Verify activation (prompt should show (venv))
which python
# Should output: /home/user/GitHub_MCP_Server/venv/bin/python
```

**Important:** You'll need to activate this venv every time you work on the project:
```bash
source venv/bin/activate
```

**To deactivate later:**
```bash
deactivate
```

---

### Step 1.4: Create Project Files

**What:** Create all necessary files for the project

**Why:** Set up complete project structure before coding

**Commands:**
```bash
# Create main files
touch main.py
touch requirements.txt
touch .env
touch .gitignore
touch README.md

# Verify files created
ls -la
# Should show: main.py, requirements.txt, .env, .gitignore, README.md, venv/
```

---

### Step 1.5: Configure .gitignore

**What:** Tell Git which files to ignore

**Why:** Prevent committing secrets (.env), virtual environment, and cache files

**Content for `.gitignore`:**
```
# Virtual Environment
venv/
env/
ENV/

# Python Cache
__pycache__/
*.pyc
*.pyo
*.pyd
.Python

# Environment Variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log
```

**How to create:**
```bash
cat > .gitignore << 'EOF'
venv/
__pycache__/
*.pyc
.env
.DS_Store
.idea/
EOF
```

**Verification:**
```bash
cat .gitignore
# Should display the content above
```

---

### Step 1.6: Set Up requirements.txt

**What:** List all Python dependencies

**Why:** Enable easy installation and ensure version compatibility

**Content for `requirements.txt`:**
```
# MCP Framework
fastmcp>=0.1.0

# HTTP Client
aiohttp>=3.9.0

# Environment Variables
python-dotenv>=1.0.0

# Data Validation (optional but recommended)
pydantic>=2.0.0
```

**How to create:**
```bash
cat > requirements.txt << 'EOF'
fastmcp>=0.1.0
aiohttp>=3.9.0
python-dotenv>=1.0.0
pydantic>=2.0.0
EOF
```

**Verification:**
```bash
cat requirements.txt
# Should display the dependencies above
```

---

### Step 1.7: Install Dependencies

**What:** Install all required Python packages

**Why:** Make libraries available for coding

**Commands:**
```bash
# Make sure venv is activated (you should see (venv) in prompt)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list
# Should show fastmcp, aiohttp, python-dotenv, pydantic and their dependencies
```

**Troubleshooting:**
- If `fastmcp` not found: `pip install fastmcp` directly
- If permission error: Don't use `sudo`, check venv is activated
- If network error: Check internet connection, try `pip install --user`

---

### Step 1.8: Configure Environment Variables

**What:** Set up GitHub API credentials

**Why:** Authenticate with GitHub, avoid hardcoding secrets

**Content for `.env`:**
```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_API_BASE_URL=https://api.github.com

# Optional: MCP Server Configuration
MCP_SERVER_PORT=8000
LOG_LEVEL=INFO
```

**How to create:**
```bash
cat > .env << 'EOF'
GITHUB_TOKEN=your_github_token_here
GITHUB_API_BASE_URL=https://api.github.com
MCP_SERVER_PORT=8000
LOG_LEVEL=INFO
EOF
```

**⚠️ Important: Get Your GitHub Token**

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "MCP Server Token"
4. Select scopes:
   - `repo` (if you need private repos)
   - `read:org` (for organization access)
   - `read:user` (basic access)
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)
7. Replace `your_github_token_here` in `.env` with your actual token

**Verification:**
```bash
# This should NOT show your token (it's gitignored)
git status
# .env should NOT appear in untracked files

# But the file should exist
ls -la .env
# Should show: -rw-r--r-- 1 user user ... .env
```

---

### Step 1.9: Create Basic README

**What:** Document the project

**Why:** Help future you and collaborators understand the project

**Content for `README.md`:**
```markdown
# GitHub MCP Server

Model Context Protocol server for GitHub API integration.

## Features

- Fetch repositories from GitHub organizations
- Access documentation files from repositories
- MCP-compliant tools and resources
- Async/await design for performance

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
   # Edit .env and add your GITHUB_TOKEN
   ```

4. Run server:
   ```bash
   python main.py
   ```

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token (required)
- `GITHUB_API_BASE_URL` - GitHub API URL (default: https://api.github.com)
- `MCP_SERVER_PORT` - Server port (default: 8000)

## MCP Tools

- `get_org_repos(org: str)` - Fetch all repositories from an organization
- `get_repo_docs(org: str, repo: str)` - Get documentation files from /doc folder
- `get_file_content(org: str, repo: str, path: str)` - Fetch specific file content
- `search_documentation(org: str, query: str)` - Search across documentation files

## MCP Resources

- `documentation://{org}/{repo}` - List documentation files
- `content://{org}/{repo}/{path}` - Get file content

## License

MIT
```

**How to create:**
```bash
cat > README.md << 'EOF'
# GitHub MCP Server

Model Context Protocol server for GitHub API integration.

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
   # Edit .env and add your GITHUB_TOKEN
   ```

4. Run server:
   ```bash
   python main.py
   ```

See documentation for more details.
EOF
```

---

### Step 1.10: Initial Git Commit

**What:** Save the project setup in Git

**Why:** Establish baseline, enable tracking of future changes

**Commands:**
```bash
# Check what will be committed
git status
# Should show: requirements.txt, .gitignore, README.md, main.py (empty)

# Add files
git add .gitignore requirements.txt README.md main.py

# Create first commit
git commit -m "chore: Initial project setup with dependencies and configuration"

# Verify commit
git log --oneline
# Should show your commit
```

**Note:** `.env` should NOT be committed (it's in .gitignore)

---

## Part 2: Core MCP Server Implementation (1.5-2 hours)

### Step 2.1: Set Up Basic Server Structure

**What:** Create the skeleton of the MCP server

**Why:** Establish imports, configuration, and MCP initialization

**Add to `main.py`:**
```python
#!/usr/bin/env python3
"""
GitHub MCP Server
Provides GitHub API access via Model Context Protocol
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
import aiohttp
from dotenv import load_dotenv
from fastmcp import FastMCP

# Load environment variables from .env file
load_dotenv()

# Initialize MCP server with a descriptive name
mcp = FastMCP("GitHub Knowledge Vault MCP Server")

# Configuration - Load from environment
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE_URL", "https://api.github.com")
MCP_SERVER_PORT = int(os.getenv("MCP_SERVER_PORT", "8000"))

# Validate configuration
if not GITHUB_TOKEN:
    print("⚠️  Warning: GITHUB_TOKEN not set. API rate limits will be restricted.")


# TODO: Add helper functions here


# TODO: Add MCP tools here


# TODO: Add MCP resources here


if __name__ == "__main__":
    # Run the MCP server
    print("🚀 Starting GitHub MCP Server...")
    print(f"📍 Server name: {mcp.name}")
    print(f"🔑 Token configured: {'Yes' if GITHUB_TOKEN else 'No'}")
    mcp.run()
```

**How to create:**
```bash
cat > main.py << 'EOF'
#!/usr/bin/env python3
"""
GitHub MCP Server
Provides GitHub API access via Model Context Protocol
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
import aiohttp
from dotenv import load_dotenv
from fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("GitHub Knowledge Vault MCP Server")

# Configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE_URL", "https://api.github.com")

if not GITHUB_TOKEN:
    print("⚠️  Warning: GITHUB_TOKEN not set.")


if __name__ == "__main__":
    print("🚀 Starting GitHub MCP Server...")
    mcp.run()
EOF
```

**Make executable:**
```bash
chmod +x main.py
```

**Test basic server:**
```bash
python main.py
# Should start without errors
# Press Ctrl+C to stop
```

**Verification:**
- Server starts without errors ✓
- Environment variables load correctly ✓
- Can be stopped with Ctrl+C ✓

---

### Step 2.2: Implement GitHub API Headers Helper

**What:** Create function to generate GitHub API request headers

**Why:** Centralize authentication, ensure consistent headers across all requests

**Add this function BEFORE the `if __name__ == "__main__":` line:**
```python
async def create_headers() -> Dict[str, str]:
    """
    Create GitHub API request headers with authentication

    Returns:
        Dictionary of HTTP headers for GitHub API requests
    """
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitHub-MCP-Server/1.0"
    }

    # Add authorization if token is available
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    return headers
```

**Why each header:**
- `Accept`: Tells GitHub we want v3 API responses
- `User-Agent`: GitHub requires this (identifies our application)
- `Authorization`: Provides authentication token for higher rate limits

**Test this function:**

Create a test file `test_headers.py`:
```python
import asyncio
from main import create_headers

async def test():
    headers = await create_headers()
    print("Headers:", headers)
    assert "Accept" in headers
    assert "User-Agent" in headers
    print("✅ Headers test passed")

asyncio.run(test())
```

Run test:
```bash
python test_headers.py
# Should print headers and "✅ Headers test passed"
```

---

### Step 2.3: Implement Tool #1 - get_org_repos

**What:** Create the first MCP tool to fetch repositories from a GitHub organization

**Why:** This is the primary function - discovering repos with documentation

**Add after the `create_headers()` function:**

```python
@mcp.tool()
async def get_org_repos(org: str) -> List[Dict[str, Any]]:
    """
    Fetch all repositories from a GitHub organization

    This tool uses the GitHub Search API to efficiently find repositories
    that have a /doc folder, falling back to checking each repo individually
    if the search API is unavailable.

    Args:
        org: GitHub organization name (e.g., "microsoft", "google")

    Returns:
        List of repository dictionaries with structure:
        [
            {
                "id": "123456",
                "name": "repo-name",
                "description": "Repository description",
                "url": "https://github.com/org/repo",
                "hasDocFolder": true
            },
            ...
        ]

    Example:
        repos = await get_org_repos("anthropics")
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()

        # Strategy 1: Use GitHub Search API (efficient - one request)
        search_url = f"{GITHUB_API_BASE}/search/code"
        params = {
            "q": f"org:{org} path:/doc",
            "per_page": 100
        }

        try:
            async with session.get(search_url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    # Extract unique repositories from search results
                    repos_with_docs = {}
                    for item in data.get("items", []):
                        repo_info = item.get("repository", {})
                        repo_name = repo_info.get("name")

                        if repo_name and repo_name not in repos_with_docs:
                            repos_with_docs[repo_name] = {
                                "id": str(repo_info.get("id", "")),
                                "name": repo_name,
                                "description": repo_info.get("description") or "",
                                "url": repo_info.get("html_url", ""),
                                "hasDocFolder": True
                            }

                    print(f"✅ Found {len(repos_with_docs)} repos with /doc via search")
                    return list(repos_with_docs.values())

        except Exception as e:
            print(f"⚠️  Search API failed: {e}, falling back to list all repos")

        # Strategy 2: Fallback - List all repos and check each one
        repos_url = f"{GITHUB_API_BASE}/orgs/{org}/repos"
        all_repos = []
        page = 1

        print(f"📥 Fetching repos for organization: {org}")

        while True:
            async with session.get(
                repos_url,
                headers=headers,
                params={"per_page": 100, "page": page, "sort": "updated"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"GitHub API error {response.status}: {error_text}")

                repos = await response.json()
                if not repos:
                    break

                all_repos.extend(repos)
                print(f"📄 Fetched page {page} ({len(repos)} repos)")
                page += 1

                # Stop if we got less than 100 (last page)
                if len(repos) < 100:
                    break

        print(f"📦 Total repos fetched: {len(all_repos)}")

        # Check each repo for /doc folder
        result = []
        for idx, repo in enumerate(all_repos, 1):
            print(f"🔍 Checking {idx}/{len(all_repos)}: {repo['name']}")
            has_doc = await check_doc_folder(session, org, repo["name"])

            result.append({
                "id": str(repo["id"]),
                "name": repo["name"],
                "description": repo.get("description") or "",
                "url": repo["html_url"],
                "hasDocFolder": has_doc
            })

        repos_with_docs_count = sum(1 for r in result if r["hasDocFolder"])
        print(f"✅ Found {repos_with_docs_count} repos with /doc folder")

        return result
```

**Add the helper function:**
```python
async def check_doc_folder(
    session: aiohttp.ClientSession,
    org: str,
    repo: str
) -> bool:
    """
    Check if a repository has a /doc folder

    Args:
        session: aiohttp ClientSession (reuse connection)
        org: Organization name
        repo: Repository name

    Returns:
        True if /doc folder exists, False otherwise
    """
    headers = await create_headers()
    url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/doc"

    try:
        async with session.get(url, headers=headers) as response:
            return response.status == 200
    except Exception:
        return False
```

**Understanding the code:**

1. **Two Strategies:**
   - Primary: Use Search API (fast, 1 request finds all repos with /doc)
   - Fallback: List all repos, check each one (slower but reliable)

2. **Pagination:** Handles orgs with >100 repos

3. **Error Handling:** Graceful fallback if search fails

4. **Progress Logging:** Shows what's happening (useful for debugging)

**Verification:**

Create test file `test_get_repos.py`:
```python
import asyncio
from main import get_org_repos

async def test():
    # Replace with a real organization
    org = "anthropics"  # or your test org

    print(f"Testing get_org_repos for: {org}")
    repos = await get_org_repos(org)

    print(f"\nResults:")
    print(f"  Total repos: {len(repos)}")
    print(f"  Repos with /doc: {sum(1 for r in repos if r['hasDocFolder'])}")

    if repos:
        print(f"\nFirst repo:")
        print(f"  Name: {repos[0]['name']}")
        print(f"  Has /doc: {repos[0]['hasDocFolder']}")

    print("\n✅ Test passed")

asyncio.run(test())
```

Run:
```bash
python test_get_repos.py
```

---

### Step 2.4: Implement Tool #2 - get_repo_docs

**What:** Fetch list of documentation files from a repository's /doc folder

**Why:** Discover what documentation is available

**Add after `get_org_repos`:**

```python
@mcp.tool()
async def get_repo_docs(org: str, repo: str) -> List[Dict[str, Any]]:
    """
    Get all documentation files from a repository's /doc folder

    Filters for supported file types: Markdown, Mermaid, SVG, OpenAPI, Postman

    Args:
        org: GitHub organization name
        repo: Repository name

    Returns:
        List of documentation file dictionaries:
        [
            {
                "id": "abc123...",
                "name": "README.md",
                "path": "doc/README.md",
                "type": "markdown",
                "size": 1234,
                "url": "https://github.com/org/repo/blob/main/doc/README.md",
                "download_url": "https://raw.githubusercontent.com/.../README.md",
                "sha": "abc123..."
            },
            ...
        ]

    Example:
        docs = await get_repo_docs("anthropics", "anthropic-sdk-python")
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/doc"

        print(f"📂 Fetching docs from: {org}/{repo}/doc")

        async with session.get(url, headers=headers) as response:
            if response.status == 404:
                print(f"⚠️  No /doc folder found in {org}/{repo}")
                return []

            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"GitHub API error {response.status}: {error_text}")

            contents = await response.json()

            # Filter for supported file types
            supported_extensions = [
                '.md',       # Markdown
                '.mmd',      # Mermaid
                '.mermaid',  # Mermaid
                '.svg',      # SVG images
                '.yml',      # YAML (OpenAPI)
                '.yaml',     # YAML (OpenAPI)
                '.json'      # JSON (OpenAPI/Postman)
            ]

            docs = []
            skipped = 0

            for item in contents:
                # Only process files (not directories)
                if item["type"] == "file":
                    name = item["name"]

                    # Check if file extension is supported
                    if any(name.lower().endswith(ext) for ext in supported_extensions):
                        content_type = determine_content_type(name)

                        docs.append({
                            "id": item["sha"],
                            "name": name,
                            "path": item["path"],
                            "type": content_type,
                            "size": item["size"],
                            "url": item["html_url"],
                            "download_url": item.get("download_url", ""),
                            "sha": item["sha"]
                        })
                    else:
                        skipped += 1

            print(f"✅ Found {len(docs)} documentation files ({skipped} skipped)")
            return docs


def determine_content_type(filename: str) -> str:
    """
    Determine content type from filename

    Args:
        filename: Name of the file

    Returns:
        Content type: 'markdown', 'mermaid', 'svg', 'openapi', 'postman', or 'unknown'
    """
    lower_name = filename.lower()

    if lower_name.endswith(('.mmd', '.mermaid')):
        return 'mermaid'
    elif lower_name.endswith('.md'):
        return 'markdown'
    elif lower_name.endswith('.svg'):
        return 'svg'
    elif lower_name.endswith(('.yml', '.yaml')):
        return 'openapi'
    elif lower_name.startswith('postman') and lower_name.endswith('.json'):
        return 'postman'
    elif lower_name.endswith('.json'):
        return 'openapi'  # Assume OpenAPI JSON
    else:
        return 'unknown'
```

**Test:**

Create `test_get_docs.py`:
```python
import asyncio
from main import get_org_repos, get_repo_docs

async def test():
    org = "anthropics"  # Replace with your org

    # First get repos
    repos = await get_org_repos(org)
    repos_with_docs = [r for r in repos if r["hasDocFolder"]]

    if not repos_with_docs:
        print("❌ No repos with /doc folder found")
        return

    # Test on first repo with docs
    test_repo = repos_with_docs[0]
    print(f"Testing with repo: {test_repo['name']}")

    docs = await get_repo_docs(org, test_repo["name"])

    print(f"\n📊 Results:")
    print(f"  Total docs: {len(docs)}")

    # Group by type
    by_type = {}
    for doc in docs:
        doc_type = doc["type"]
        by_type[doc_type] = by_type.get(doc_type, 0) + 1

    print(f"\n  By type:")
    for doc_type, count in by_type.items():
        print(f"    {doc_type}: {count}")

    if docs:
        print(f"\n  Sample doc:")
        print(f"    Name: {docs[0]['name']}")
        print(f"    Type: {docs[0]['type']}")
        print(f"    Size: {docs[0]['size']} bytes")

    print("\n✅ Test passed")

asyncio.run(test())
```

Run:
```bash
python test_get_docs.py
```

---

### Step 2.5: Implement Tool #3 - get_file_content

**What:** Fetch the actual content of a specific file

**Why:** Allow reading documentation file contents

**Add after `get_repo_docs`:**

```python
@mcp.tool()
async def get_file_content(org: str, repo: str, path: str) -> Dict[str, Any]:
    """
    Fetch content of a specific file from GitHub

    Decodes base64-encoded content returned by GitHub API

    Args:
        org: GitHub organization name
        repo: Repository name
        path: File path within repository (e.g., "doc/README.md")

    Returns:
        Dictionary with file metadata and content:
        {
            "name": "README.md",
            "path": "doc/README.md",
            "content": "# Documentation\\n\\nThis is...",
            "size": 1234,
            "sha": "abc123...",
            "encoding": "base64"
        }

    Example:
        content = await get_file_content("anthropics", "sdk", "doc/README.md")
    """
    import base64

    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        url = f"{GITHUB_API_BASE}/repos/{org}/{repo}/contents/{path}"

        print(f"📄 Fetching content: {org}/{repo}/{path}")

        async with session.get(url, headers=headers) as response:
            if response.status == 404:
                raise Exception(f"File not found: {path}")

            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"GitHub API error {response.status}: {error_text}")

            data = await response.json()

            # Decode base64 content if present
            content = ""
            if "content" in data and data["content"]:
                try:
                    # GitHub returns base64-encoded content with newlines
                    encoded_content = data["content"].replace('\n', '')
                    content = base64.b64decode(encoded_content).decode('utf-8')
                    print(f"✅ Decoded content ({len(content)} characters)")
                except Exception as e:
                    print(f"⚠️  Failed to decode content: {e}")
                    content = data.get("content", "")

            return {
                "name": data["name"],
                "path": data["path"],
                "content": content,
                "size": data["size"],
                "sha": data["sha"],
                "encoding": data.get("encoding", "base64")
            }
```

**Test:**

Create `test_get_content.py`:
```python
import asyncio
from main import get_org_repos, get_repo_docs, get_file_content

async def test():
    org = "anthropics"  # Replace

    # Get repos
    repos = await get_org_repos(org)
    repos_with_docs = [r for r in repos if r["hasDocFolder"]]

    if not repos_with_docs:
        print("❌ No repos with docs")
        return

    # Get docs from first repo
    test_repo = repos_with_docs[0]["name"]
    docs = await get_repo_docs(org, test_repo)

    if not docs:
        print("❌ No docs found")
        return

    # Get content of first doc
    test_doc = docs[0]
    print(f"Testing with: {test_doc['path']}")

    content = await get_file_content(org, test_repo, test_doc["path"])

    print(f"\n📄 Content preview:")
    print(f"  Name: {content['name']}")
    print(f"  Size: {content['size']} bytes")
    print(f"  First 100 chars: {content['content'][:100]}...")

    print("\n✅ Test passed")

asyncio.run(test())
```

Run:
```bash
python test_get_content.py
```

---

### Step 2.6: Implement Tool #4 - search_documentation

**What:** Search across all documentation in an organization

**Why:** Enable finding docs by keyword

**Add after `get_file_content`:**

```python
@mcp.tool()
async def search_documentation(org: str, query: str) -> List[Dict[str, Any]]:
    """
    Search for documentation files across all repositories in an organization

    Uses GitHub Code Search API to find matching files in /doc folders

    Args:
        org: GitHub organization name
        query: Search query string (e.g., "authentication", "API", "tutorial")

    Returns:
        List of search result dictionaries:
        [
            {
                "name": "authentication.md",
                "path": "doc/authentication.md",
                "repository": "repo-name",
                "url": "https://github.com/org/repo/blob/main/doc/auth.md",
                "sha": "abc123..."
            },
            ...
        ]

    Example:
        results = await search_documentation("anthropics", "streaming")
    """
    async with aiohttp.ClientSession() as session:
        headers = await create_headers()
        search_url = f"{GITHUB_API_BASE}/search/code"
        params = {
            "q": f"org:{org} path:/doc {query}",
            "per_page": 50
        }

        print(f"🔍 Searching for: '{query}' in {org}")

        async with session.get(search_url, headers=headers, params=params) as response:
            if response.status == 403:
                raise Exception("Search API rate limit exceeded. Try again later.")

            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"GitHub API error {response.status}: {error_text}")

            data = await response.json()
            results = []

            for item in data.get("items", []):
                repo_info = item.get("repository", {})
                results.append({
                    "name": item["name"],
                    "path": item["path"],
                    "repository": repo_info.get("name", ""),
                    "url": item["html_url"],
                    "sha": item["sha"]
                })

            print(f"✅ Found {len(results)} matching files")
            return results
```

**Test:**

```python
# test_search.py
import asyncio
from main import search_documentation

async def test():
    org = "anthropics"
    query = "API"

    results = await search_documentation(org, query)

    print(f"🔍 Search results for '{query}':")
    print(f"  Total: {len(results)}")

    for i, result in enumerate(results[:5], 1):
        print(f"\n  {i}. {result['name']}")
        print(f"     Repo: {result['repository']}")
        print(f"     Path: {result['path']}")

    print("\n✅ Test passed")

asyncio.run(test())
```

---

### Step 2.7: Implement MCP Resources

**What:** Add URI-accessible resources for documentation

**Why:** Provide alternative access pattern for MCP clients

**Add after all tools:**

```python
@mcp.resource("documentation://{org}/{repo}")
async def documentation_resource(org: str, repo: str) -> str:
    """
    MCP Resource: List documentation files in a repository

    URI Pattern: documentation://organization-name/repository-name

    Example URIs:
        documentation://anthropics/anthropic-sdk-python
        documentation://openai/openai-python

    Args:
        org: Organization name from URI
        repo: Repository name from URI

    Returns:
        Formatted string listing all documentation files
    """
    docs = await get_repo_docs(org, repo)

    if not docs:
        return f"No documentation found in {org}/{repo}/doc folder"

    # Format as readable list
    lines = [
        f"Documentation in {org}/{repo}",
        "=" * 50,
        ""
    ]

    for doc in docs:
        lines.append(f"📄 {doc['name']}")
        lines.append(f"   Type: {doc['type']}")
        lines.append(f"   Size: {doc['size']:,} bytes")
        lines.append(f"   Path: {doc['path']}")
        lines.append("")

    lines.append(f"Total: {len(docs)} files")

    return "\n".join(lines)


@mcp.resource("content://{org}/{repo}/{path:path}")
async def content_resource(org: str, repo: str, path: str) -> str:
    """
    MCP Resource: Get content of a specific file

    URI Pattern: content://organization/repository/path/to/file.md

    Example URIs:
        content://anthropics/sdk/doc/README.md
        content://openai/openai-python/doc/api-reference.md

    Args:
        org: Organization name from URI
        repo: Repository name from URI
        path: File path within repository (URI component after repo)

    Returns:
        File content as string
    """
    file_data = await get_file_content(org, repo, path)
    return file_data["content"]
```

**Understanding Resources:**

Resources are URI-addressable data:
- `documentation://org/repo` → Lists files
- `content://org/repo/path/to/file.md` → Returns file content

MCP clients can access these like URLs.

---

## Part 3: Testing & Finalization (30-45 minutes)

### Step 3.1: Create Comprehensive Test Suite

**What:** Test all functions together

**Why:** Ensure everything works end-to-end

**Create `test_all.py`:**

```python
#!/usr/bin/env python3
import asyncio
from main import (
    get_org_repos,
    get_repo_docs,
    get_file_content,
    search_documentation
)

async def test_all():
    """Comprehensive test of all MCP tools"""

    # Configuration
    TEST_ORG = "anthropics"  # Change to your org

    print("=" * 60)
    print("MCP SERVER COMPREHENSIVE TEST")
    print("=" * 60)

    # Test 1: Get repositories
    print("\n1️⃣  Testing get_org_repos...")
    repos = await get_org_repos(TEST_ORG)
    print(f"   ✅ Found {len(repos)} total repositories")
    repos_with_docs = [r for r in repos if r["hasDocFolder"]]
    print(f"   ✅ {len(repos_with_docs)} have /doc folders")

    if not repos_with_docs:
        print("\n❌ No repos with /doc folder. Cannot continue tests.")
        return

    # Test 2: Get documentation files
    print("\n2️⃣  Testing get_repo_docs...")
    test_repo = repos_with_docs[0]
    print(f"   Testing with: {test_repo['name']}")
    docs = await get_repo_docs(TEST_ORG, test_repo["name"])
    print(f"   ✅ Found {len(docs)} documentation files")

    if docs:
        print(f"\n   📄 Sample docs:")
        for doc in docs[:3]:
            print(f"      - {doc['name']} ({doc['type']}, {doc['size']} bytes)")

    if not docs:
        print("\n❌ No docs found. Skipping content test.")
        return

    # Test 3: Get file content
    print("\n3️⃣  Testing get_file_content...")
    test_doc = docs[0]
    print(f"   Testing with: {test_doc['path']}")
    content = await get_file_content(TEST_ORG, test_repo["name"], test_doc["path"])
    print(f"   ✅ Retrieved {len(content['content'])} characters")
    print(f"\n   📄 Content preview:")
    print(f"      {content['content'][:150]}...")

    # Test 4: Search documentation
    print("\n4️⃣  Testing search_documentation...")
    query = "API"
    search_results = await search_documentation(TEST_ORG, query)
    print(f"   ✅ Found {len(search_results)} results for '{query}'")

    if search_results:
        print(f"\n   🔍 Top results:")
        for result in search_results[:3]:
            print(f"      - {result['name']} in {result['repository']}")

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"✅ get_org_repos: {len(repos)} repos")
    print(f"✅ get_repo_docs: {len(docs)} docs")
    print(f"✅ get_file_content: {len(content['content'])} chars")
    print(f"✅ search_documentation: {len(search_results)} results")
    print("\n🎉 All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_all())
```

**Run comprehensive test:**
```bash
python test_all.py
```

---

### Step 3.2: Test MCP Server in CLI Mode

**What:** Run the actual MCP server

**Why:** Verify it works as a proper MCP server

**Run server:**
```bash
python main.py
```

The server will start and wait for MCP protocol messages on stdin/stdout.

**To test properly, you need an MCP client.** For now, verify:
- No errors on startup
- Shows configuration info
- Can be stopped with Ctrl+C

---

### Step 3.3: Add Error Handling & Logging

**What:** Improve error messages and logging

**Why:** Make debugging easier

**Add at the top of `main.py` after imports:**

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

**Replace `print()` calls with `logger.info()` or `logger.error()`:**

Example:
```python
# Before
print(f"✅ Found {len(docs)} documentation files")

# After
logger.info(f"Found {len(docs)} documentation files")
```

---

### Step 3.4: Final Git Commit

**What:** Save all the implementation work

**Why:** Version control, backup

**Commands:**
```bash
# Check status
git status

# Add all changes
git add main.py test_*.py

# Commit
git commit -m "feat: Implement complete MCP server with tools and resources

Added MCP tools:
- get_org_repos: Fetch repositories with /doc folders
- get_repo_docs: List documentation files in a repo
- get_file_content: Retrieve file content with base64 decoding
- search_documentation: Search across org documentation

Added MCP resources:
- documentation://{org}/{repo}: List docs via URI
- content://{org}/{repo}/{path}: Get file content via URI

Includes comprehensive test suite and error handling."

# View commit
git log --oneline -1
```

---

## Part 4: Documentation & Deployment (30 minutes)

### Step 4.1: Update README.md

**What:** Complete the README with usage examples

**Why:** Help users understand how to use the server

**Update README.md** with full documentation (example in earlier steps).

---

### Step 4.2: Create .env.example

**What:** Template for environment variables

**Why:** Users can copy this to create their .env

**Create `.env.example`:**
```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_API_BASE_URL=https://api.github.com

# Server Configuration
MCP_SERVER_PORT=8000
LOG_LEVEL=INFO
```

**Commands:**
```bash
cat > .env.example << 'EOF'
GITHUB_TOKEN=ghp_your_token_here
GITHUB_API_BASE_URL=https://api.github.com
MCP_SERVER_PORT=8000
LOG_LEVEL=INFO
EOF

git add .env.example
git commit -m "docs: Add environment variable template"
```

---

### Step 4.3: Create Usage Examples

**What:** Document how to use each tool

**Why:** Help MCP client developers integrate

**Create `USAGE.md`:**

```markdown
# MCP Server Usage Examples

## Using Tools

### Get Organization Repositories

```python
# Via MCP client
result = await mcp_client.call_tool("get_org_repos", {"org": "anthropics"})
repos = result.content
```

### Get Repository Documentation

```python
result = await mcp_client.call_tool("get_repo_docs", {
    "org": "anthropics",
    "repo": "anthropic-sdk-python"
})
docs = result.content
```

### Get File Content

```python
result = await mcp_client.call_tool("get_file_content", {
    "org": "anthropics",
    "repo": "anthropic-sdk-python",
    "path": "doc/README.md"
})
content = result.content["content"]
```

### Search Documentation

```python
result = await mcp_client.call_tool("search_documentation", {
    "org": "anthropics",
    "query": "streaming"
})
results = result.content
```

## Using Resources

### List Documentation

```python
# Via MCP client
content = await mcp_client.read_resource(
    "documentation://anthropics/anthropic-sdk-python"
)
print(content)
```

### Get File Content

```python
content = await mcp_client.read_resource(
    "content://anthropics/anthropic-sdk-python/doc/README.md"
)
print(content)
```

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-docs": {
      "command": "python",
      "args": ["/path/to/GitHub_MCP_Server/main.py"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

Then restart Claude Desktop and you can ask:
- "What documentation exists in the anthropics organization?"
- "Show me authentication docs from the SDK"
- "Search for streaming examples in anthropics repos"
```

---

### Step 4.4: Optional - Create Dockerfile

**What:** Containerize the MCP server

**Why:** Easy deployment, reproducible environment

**Create `Dockerfile`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Set environment
ENV PYTHONUNBUFFERED=1

# Run server
CMD ["python", "main.py"]
```

**Test:**
```bash
# Build
docker build -t github-mcp-server .

# Run (pass env variables)
docker run -e GITHUB_TOKEN=your_token github-mcp-server
```

---

## Verification Checklist

Before considering the MCP Server complete, verify:

- [ ] All dependencies install without errors (`pip install -r requirements.txt`)
- [ ] `.env` file configured with valid `GITHUB_TOKEN`
- [ ] `.gitignore` prevents committing `.env` and `venv/`
- [ ] Server starts without errors (`python main.py`)
- [ ] `test_all.py` runs successfully and shows correct results
- [ ] All four tools work:
  - [ ] `get_org_repos` returns repositories
  - [ ] `get_repo_docs` returns documentation files
  - [ ] `get_file_content` decodes content correctly
  - [ ] `search_documentation` finds matching files
- [ ] Resources are defined (even if not fully tested yet)
- [ ] Code is committed to Git with meaningful messages
- [ ] README.md documents setup and usage
- [ ] `.env.example` provides template for configuration

---

## Common Issues & Solutions

### Issue: "Module 'fastmcp' not found"
**Solution:**
```bash
source venv/bin/activate
pip install fastmcp
```

### Issue: "GITHUB_TOKEN not set" warning
**Solution:**
```bash
# Edit .env file
nano .env
# Add: GITHUB_TOKEN=ghp_your_actual_token
```

### Issue: GitHub API returns 403 (Rate Limited)
**Solution:**
- Ensure `GITHUB_TOKEN` is set correctly
- Wait 60 minutes for rate limit reset
- Check token hasn't expired: https://github.com/settings/tokens

### Issue: "No /doc folder found"
**Solution:**
- Test with a different organization that has docs
- Try: `anthropics`, `openai`, or your own org

### Issue: Search API fails
**Solution:**
- This is expected for some orgs
- The fallback strategy (list all repos) will automatically run
- This is slower but works

---

## Next Steps

Once the MCP Server is complete:

1. ✅ **Phase 1 Complete:** MCP Server is ready
2. ⏭️ **Phase 2:** Build MCP Bridge (Node.js)
3. ⏭️ **Phase 3:** Integrate with Frontend
4. ⏭️ **Phase 4:** Testing
5. ⏭️ **Phase 5:** Deployment

---

## Time Breakdown Summary

| Step | Task | Time |
|------|------|------|
| 1.1-1.10 | Project setup & environment | 30 min |
| 2.1 | Basic server structure | 15 min |
| 2.2 | Headers helper | 10 min |
| 2.3 | get_org_repos tool | 30 min |
| 2.4 | get_repo_docs tool | 25 min |
| 2.5 | get_file_content tool | 20 min |
| 2.6 | search_documentation tool | 15 min |
| 2.7 | MCP resources | 15 min |
| 3.1-3.4 | Testing & finalization | 45 min |
| 4.1-4.4 | Documentation & deployment | 30 min |
| **Total** | | **3-4 hours** |

---

**Congratulations! 🎉**

If you've followed all steps, you now have a fully functional GitHub MCP Server that can:
- Discover repositories with documentation
- List documentation files
- Fetch file contents
- Search across documentation
- Serve data via MCP protocol

Ready to proceed to Phase 2 (MCP Bridge)?
