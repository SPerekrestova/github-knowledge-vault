"""Mock MCP Server for testing."""
from fastapi import FastAPI, HTTPException
from typing import Dict, Any
import uvicorn

app = FastAPI(title="Mock MCP Server")

# Mock data
MOCK_REPOS = [
    {"name": "frontend-app", "docCount": 15, "lastUpdated": "2025-01-09"},
    {"name": "backend-api", "docCount": 23, "lastUpdated": "2025-01-08"},
    {"name": "docs-site", "docCount": 42, "lastUpdated": "2025-01-10"}
]

MOCK_DOCS = {
    "frontend-app": [
        {"path": "README.md", "type": "file", "size": 1234},
        {"path": "docs/setup.md", "type": "file", "size": 2456},
        {"path": "docs/architecture.md", "type": "file", "size": 3789}
    ],
    "backend-api": [
        {"path": "README.md", "type": "file", "size": 987},
        {"path": "API.md", "type": "file", "size": 5432}
    ]
}

MOCK_CONTENT = {
    ("frontend-app", "README.md"): {
        "repo": "frontend-app",
        "path": "README.md",
        "content": "# Frontend App\n\nThis is a React-based frontend application.",
        "metadata": {"lastModified": "2025-01-09", "author": "team"}
    },
    ("frontend-app", "docs/setup.md"): {
        "repo": "frontend-app",
        "path": "docs/setup.md",
        "content": "# Setup Guide\n\n1. Install Node.js\n2. Run npm install\n3. Run npm start",
        "metadata": {"lastModified": "2025-01-08"}
    }
}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "mock-mcp"}

@app.post("/tools/execute")
async def execute_tool(request: Dict[str, Any]):
    name = request.get("name")
    arguments = request.get("arguments", {})

    if name == "list_repositories":
        return {"result": MOCK_REPOS}

    elif name == "list_repo_docs":
        repo = arguments.get("repo")
        docs = MOCK_DOCS.get(repo, [])
        return {"result": docs}

    elif name == "get_documentation":
        repo = arguments.get("repo")
        path = arguments.get("path")
        content = MOCK_CONTENT.get((repo, path))
        if not content:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"result": content}

    elif name == "search_documentation":
        query = arguments.get("query", "").lower()
        repo_filter = arguments.get("repo")

        results = []
        for (repo, path), doc in MOCK_CONTENT.items():
            if repo_filter and repo != repo_filter:
                continue
            if query in doc["content"].lower() or query in path.lower():
                results.append({
                    "repo": repo,
                    "path": path,
                    "snippet": doc["content"][:100] + "...",
                    "relevance": 0.95
                })

        return {"result": results}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {name}")

if __name__ == "__main__":
    print("🔧 Starting Mock MCP Server on port 3002...")
    uvicorn.run(app, host="0.0.0.0", port=3002)
