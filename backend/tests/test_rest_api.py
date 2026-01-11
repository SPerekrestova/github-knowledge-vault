"""REST API tests (Tests 1-3, 5-12, 20)."""
import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Tests for /health endpoint."""
    
    @pytest.mark.asyncio
    async def test_health_check_all_services_up(self, client: AsyncClient):
        """Test 1: Health Check - All Services Up."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert data["services"]["mcp_server"]["status"] == "connected"
        assert data["services"]["claude_api"]["status"] == "available"
        assert data["services"]["claude_api"]["model"] == "claude-sonnet-4-20250514"


class TestRepositoryEndpoints:
    """Tests for repository browsing endpoints."""
    
    @pytest.mark.asyncio
    async def test_list_repositories(self, client: AsyncClient):
        """Test 3: List Repositories."""
        response = await client.get("/api/repos")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 3
        
        # Check structure of first repo
        assert "name" in data[0]
        assert "docCount" in data[0]
        assert "lastUpdated" in data[0]
        
        # Check specific repos
        repo_names = [repo["name"] for repo in data]
        assert "frontend-app" in repo_names
        assert "backend-api" in repo_names
        assert "docs-site" in repo_names
    
    @pytest.mark.asyncio
    async def test_get_repository_tree(self, client: AsyncClient):
        """Test 5: Get Repository Tree."""
        response = await client.get("/api/repos/frontend-app/tree")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 3
        
        # Check structure
        for item in data:
            assert "path" in item
            assert "type" in item
            assert "size" in item
        
        # Check specific files
        paths = [item["path"] for item in data]
        assert "README.md" in paths
        assert "docs/setup.md" in paths
        assert "docs/architecture.md" in paths
    
    @pytest.mark.asyncio
    async def test_get_tree_nonexistent_repo(self, client: AsyncClient):
        """Test 6: Get Tree for Non-existent Repo."""
        response = await client.get("/api/repos/invalid-repo/tree")
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    @pytest.mark.asyncio
    async def test_get_file_content(self, client: AsyncClient):
        """Test 7: Get File Content."""
        response = await client.get("/api/repos/frontend-app/files/README.md")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["repo"] == "frontend-app"
        assert data["path"] == "README.md"
        assert "content" in data
        assert "# Frontend App" in data["content"]
        assert "metadata" in data
        assert data["metadata"]["lastModified"] == "2025-01-09"
        assert data["metadata"]["author"] == "team"
    
    @pytest.mark.asyncio
    async def test_get_nested_file(self, client: AsyncClient):
        """Test 8: Get Nested File."""
        response = await client.get("/api/repos/frontend-app/files/docs/setup.md")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["repo"] == "frontend-app"
        assert data["path"] == "docs/setup.md"
        assert "# Setup Guide" in data["content"]
        assert data["metadata"]["lastModified"] == "2025-01-08"


class TestConversationEndpoints:
    """Tests for conversation management endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_conversation(self, client: AsyncClient):
        """Test 10: Create Conversation."""
        response = await client.post("/api/conversations")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        # Check UUID format (8-4-4-4-12)
        uuid = data["id"]
        parts = uuid.split("-")
        assert len(parts) == 5
        assert len(parts[0]) == 8
        assert len(parts[1]) == 4
        assert len(parts[2]) == 4
        assert len(parts[3]) == 4
        assert len(parts[4]) == 12
    
    @pytest.mark.asyncio
    async def test_get_messages_empty_conversation(self, client: AsyncClient):
        """Test 11: Get Messages from Empty Conversation."""
        # Create conversation first
        create_response = await client.post("/api/conversations")
        conv_id = create_response.json()["id"]
        
        # Get messages
        response = await client.get(f"/api/conversations/{conv_id}/messages")
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    @pytest.mark.asyncio
    async def test_get_messages_invalid_conversation(self, client: AsyncClient):
        """Test 12: Get Messages from Invalid Conversation."""
        response = await client.get("/api/conversations/invalid-uuid/messages")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Conversation not found"
    
    @pytest.mark.asyncio
    async def test_invalid_conversation_id(self, client: AsyncClient):
        """Test 20: Invalid Conversation ID."""
        response = await client.get("/api/conversations/not-a-uuid/messages")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Conversation not found"
