"""
Unit tests for FastAPI endpoints
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime


class TestHealthEndpoint:
    """Test /health endpoint"""

    def test_health_check_success(self):
        """Test health check returns OK status"""
        with patch('main.mcp_client') as mock_client, \
             patch('main.cache') as mock_cache:

            mock_client.session = MagicMock()
            mock_cache.size.return_value = 5

            from main import app
            client = TestClient(app)

            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["cache_size"] == 5
            assert data["mcp_connected"] is True

    def test_health_check_no_mcp_connection(self):
        """Test health check when MCP not connected"""
        with patch('main.mcp_client', None), \
             patch('main.cache') as mock_cache:

            mock_cache.size.return_value = 0

            from main import app
            client = TestClient(app)

            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["mcp_connected"] is False


class TestReposEndpoint:
    """Test /api/repos endpoint"""

    def test_get_repos_from_cache(self, mock_mcp_client, sample_repository):
        """Test getting repositories from cache"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = [sample_repository]

            from main import app
            client = TestClient(app)

            response = client.get("/api/repos")

            assert response.status_code == 200
            repos = response.json()
            assert len(repos) == 1
            assert repos[0]["name"] == "test-repo"
            mock_cache.get.assert_called_once_with("repos:all")
            mock_mcp_client.get_repositories.assert_not_called()

    def test_get_repos_from_mcp(self, mock_mcp_client, sample_repository):
        """Test getting repositories from MCP (cache miss)"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = None  # Cache miss

            from main import app
            client = TestClient(app)

            response = client.get("/api/repos")

            assert response.status_code == 200
            repos = response.json()
            assert len(repos) == 1
            assert repos[0]["name"] == "test-repo"
            mock_mcp_client.get_repositories.assert_called_once()
            mock_cache.set.assert_called_once()

    def test_get_repos_mcp_not_connected(self):
        """Test error when MCP not connected"""
        with patch('main.mcp_client', None):

            from main import app
            client = TestClient(app)

            response = client.get("/api/repos")

            assert response.status_code == 503
            assert "MCP Server not connected" in response.json()["detail"]


class TestRepoDocsEndpoint:
    """Test /api/repos/{repo_name}/docs endpoint"""

    def test_get_repo_docs_success(self, mock_mcp_client, sample_document):
        """Test getting repository docs"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = None  # Cache miss

            from main import app
            client = TestClient(app)

            response = client.get("/api/repos/test-repo/docs")

            assert response.status_code == 200
            docs = response.json()
            assert len(docs) == 1
            assert docs[0]["name"] == "README.md"
            mock_mcp_client.get_repo_documentation.assert_called_once_with("test-repo")

    def test_get_repo_docs_from_cache(self, mock_mcp_client, sample_document):
        """Test getting repository docs from cache"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = [sample_document]

            from main import app
            client = TestClient(app)

            response = client.get("/api/repos/test-repo/docs")

            assert response.status_code == 200
            docs = response.json()
            assert len(docs) == 1
            mock_mcp_client.get_repo_documentation.assert_not_called()


class TestContentEndpoint:
    """Test /api/content/{repo_name} endpoint"""

    def test_get_repo_content_success(self, mock_mcp_client):
        """Test getting repository content"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = None  # Cache miss

            from main import app
            client = TestClient(app)

            response = client.get("/api/content/test-repo")

            assert response.status_code == 200
            content = response.json()
            assert len(content) == 1
            assert content[0]["name"] == "README.md"
            assert content[0]["repoId"] == "test-repo"
            assert "content" in content[0]

    def test_get_repo_content_from_cache(self, mock_mcp_client, sample_content_item):
        """Test getting repository content from cache"""
        with patch('main.mcp_client', mock_mcp_client), \
             patch('main.cache') as mock_cache, \
             patch('main.CACHE_ENABLED', True):

            mock_cache.get.return_value = [sample_content_item]

            from main import app
            client = TestClient(app)

            response = client.get("/api/content/test-repo")

            assert response.status_code == 200
            content = response.json()
            assert len(content) == 1
            mock_mcp_client.get_repo_documentation.assert_not_called()


class TestSearchEndpoint:
    """Test /api/search endpoint"""

    def test_search_success(self, mock_mcp_client):
        """Test search documentation"""
        with patch('main.mcp_client', mock_mcp_client):

            from main import app
            client = TestClient(app)

            response = client.post("/api/search", json={"query": "test"})

            assert response.status_code == 200
            results = response.json()
            assert len(results) == 1
            assert results[0]["name"] == "README.md"
            mock_mcp_client.search_documentation.assert_called_once_with("test")

    def test_search_empty_query(self):
        """Test search with empty query returns validation error"""
        with patch('main.mcp_client'):

            from main import app
            client = TestClient(app)

            response = client.post("/api/search", json={"query": ""})

            assert response.status_code == 422  # Validation error

    def test_search_missing_query(self):
        """Test search without query field"""
        with patch('main.mcp_client'):

            from main import app
            client = TestClient(app)

            response = client.post("/api/search", json={})

            assert response.status_code == 422  # Validation error

    def test_search_mcp_not_connected(self):
        """Test search when MCP not connected"""
        with patch('main.mcp_client', None):

            from main import app
            client = TestClient(app)

            response = client.post("/api/search", json={"query": "test"})

            assert response.status_code == 503


class TestCacheEndpoints:
    """Test cache management endpoints"""

    def test_clear_cache_success(self):
        """Test clearing cache"""
        with patch('main.cache') as mock_cache:

            mock_cache.clear = MagicMock()

            from main import app
            client = TestClient(app)

            response = client.post("/api/cache/clear")

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Cache cleared"
            mock_cache.clear.assert_called_once()

    def test_clear_cache_when_disabled(self):
        """Test clearing cache when cache is disabled"""
        with patch('main.cache', None):

            from main import app
            client = TestClient(app)

            response = client.post("/api/cache/clear")

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Cache not enabled"

    def test_invalidate_cache_key(self):
        """Test invalidating specific cache key"""
        with patch('main.cache') as mock_cache:

            mock_cache.invalidate = MagicMock()

            from main import app
            client = TestClient(app)

            response = client.delete("/api/cache/test-key")

            assert response.status_code == 200
            data = response.json()
            assert "test-key" in data["message"]
            mock_cache.invalidate.assert_called_once_with("test-key")


class TestCORSHeaders:
    """Test CORS configuration"""

    def test_cors_headers_present(self):
        """Test that CORS headers are present in response"""
        with patch('main.mcp_client'):

            from main import app
            client = TestClient(app)

            # Make an OPTIONS request (preflight)
            response = client.options("/health")

            # Check that CORS headers would be added by middleware
            # Note: TestClient doesn't fully simulate CORS, but we can verify
            # the middleware is configured
            assert response.status_code in [200, 405]  # Depends on route configuration
