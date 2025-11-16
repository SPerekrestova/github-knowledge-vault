"""
Pytest configuration and shared fixtures for MCP Bridge tests
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_mcp_client():
    """Mock MCP Client for testing"""
    client = AsyncMock()
    client.session = MagicMock()
    client.get_repositories = AsyncMock(return_value=[
        {
            "id": "repo-1",
            "name": "test-repo",
            "description": "Test repository",
            "url": "https://github.com/test-org/test-repo",
            "hasDocFolder": True
        }
    ])
    client.get_repo_documentation = AsyncMock(return_value=[
        {
            "id": "doc-1",
            "name": "README.md",
            "path": "doc/README.md",
            "type": "markdown",
            "size": 1024,
            "url": "https://github.com/test-org/test-repo/blob/main/doc/README.md",
            "download_url": "https://raw.githubusercontent.com/test-org/test-repo/main/doc/README.md",
            "sha": "abc123"
        }
    ])
    client.get_file_content = AsyncMock(return_value={
        "name": "README.md",
        "path": "doc/README.md",
        "content": "# Test Documentation",
        "sha": "abc123"
    })
    client.search_documentation = AsyncMock(return_value=[
        {
            "name": "README.md",
            "path": "doc/README.md",
            "repository": "test-repo",
            "url": "https://github.com/test-org/test-repo/blob/main/doc/README.md",
            "sha": "abc123"
        }
    ])
    return client


@pytest.fixture
def sample_repository():
    """Sample repository data"""
    return {
        "id": "repo-1",
        "name": "test-repo",
        "description": "Test repository",
        "url": "https://github.com/test-org/test-repo",
        "hasDocFolder": True
    }


@pytest.fixture
def sample_document():
    """Sample document file data"""
    return {
        "id": "doc-1",
        "name": "README.md",
        "path": "doc/README.md",
        "type": "markdown",
        "size": 1024,
        "url": "https://github.com/test-org/test-repo/blob/main/doc/README.md",
        "download_url": "https://raw.githubusercontent.com/test-org/test-repo/main/doc/README.md",
        "sha": "abc123"
    }


@pytest.fixture
def sample_content_item():
    """Sample content item data"""
    return {
        "id": "content-1",
        "repoId": "test-repo",
        "name": "README.md",
        "path": "doc/README.md",
        "type": "markdown",
        "content": "# Test Documentation",
        "lastUpdated": "2024-01-01T00:00:00"
    }
