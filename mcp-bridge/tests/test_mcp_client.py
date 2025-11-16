"""
Unit tests for MCPClient
"""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from mcp_client import MCPClient


class TestMCPClient:
    """Test MCPClient class"""

    def test_initialization(self):
        """Test MCP client initialization"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org",
            github_token="test-token"
        )

        assert client.mcp_server_path == "/path/to/server.py"
        assert client.organization == "test-org"
        assert client.github_token == "test-token"
        assert client.session is None

    def test_initialization_without_token(self):
        """Test MCP client initialization without token"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        assert client.github_token is None

    @pytest.mark.asyncio
    async def test_connect_server_not_found(self):
        """Test connection fails when server file doesn't exist"""
        client = MCPClient(
            mcp_server_path="/nonexistent/server.py",
            organization="test-org"
        )

        with pytest.raises(FileNotFoundError):
            await client.connect()

    @pytest.mark.asyncio
    async def test_ensure_connected_when_not_connected(self):
        """Test ensure_connected calls connect when session is None"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Mock connect method
        client.connect = AsyncMock()

        await client.ensure_connected()

        client.connect.assert_called_once()

    @pytest.mark.asyncio
    async def test_ensure_connected_when_already_connected(self):
        """Test ensure_connected does nothing when already connected"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Set up as if already connected
        client.session = MagicMock()
        client.connect = AsyncMock()

        await client.ensure_connected()

        # Connect should not be called
        client.connect.assert_not_called()

    @pytest.mark.asyncio
    async def test_call_tool_returns_parsed_json(self):
        """Test call_tool parses JSON response"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Mock session and response
        mock_content = MagicMock()
        mock_content.text = json.dumps({"result": "success"})

        mock_result = MagicMock()
        mock_result.content = [mock_content]

        client.session = MagicMock()
        client.session.call_tool = AsyncMock(return_value=mock_result)

        result = await client.call_tool("test_tool", {"arg": "value"})

        assert result == {"result": "success"}
        client.session.call_tool.assert_called_once_with("test_tool", {"arg": "value"})

    @pytest.mark.asyncio
    async def test_call_tool_empty_content(self):
        """Test call_tool with empty content"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Mock session with empty content
        mock_result = MagicMock()
        mock_result.content = []

        client.session = MagicMock()
        client.session.call_tool = AsyncMock(return_value=mock_result)

        result = await client.call_tool("test_tool", {})

        assert result is None

    @pytest.mark.asyncio
    async def test_get_repositories(self):
        """Test get_repositories method"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        expected_repos = [{"id": "1", "name": "repo1"}]
        client.call_tool = AsyncMock(return_value=expected_repos)

        result = await client.get_repositories()

        assert result == expected_repos
        client.call_tool.assert_called_once_with("get_org_repos", {"org": "test-org"})

    @pytest.mark.asyncio
    async def test_get_repo_documentation(self):
        """Test get_repo_documentation method"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        expected_docs = [{"id": "1", "name": "README.md"}]
        client.call_tool = AsyncMock(return_value=expected_docs)

        result = await client.get_repo_documentation("test-repo")

        assert result == expected_docs
        client.call_tool.assert_called_once_with(
            "get_repo_docs",
            {"org": "test-org", "repo": "test-repo"}
        )

    @pytest.mark.asyncio
    async def test_get_file_content(self):
        """Test get_file_content method"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        expected_content = {"content": "# Test", "path": "doc/README.md"}
        client.call_tool = AsyncMock(return_value=expected_content)

        result = await client.get_file_content("test-repo", "doc/README.md")

        assert result == expected_content
        client.call_tool.assert_called_once_with(
            "get_file_content",
            {"org": "test-org", "repo": "test-repo", "path": "doc/README.md"}
        )

    @pytest.mark.asyncio
    async def test_search_documentation(self):
        """Test search_documentation method"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        expected_results = [{"name": "README.md", "path": "doc/README.md"}]
        client.call_tool = AsyncMock(return_value=expected_results)

        result = await client.search_documentation("test query")

        assert result == expected_results
        client.call_tool.assert_called_once_with(
            "search_documentation",
            {"org": "test-org", "query": "test query"}
        )

    @pytest.mark.asyncio
    async def test_disconnect(self):
        """Test disconnect method"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Mock session
        client.session = MagicMock()
        client.session.__aexit__ = AsyncMock()

        await client.disconnect()

        client.session.__aexit__.assert_called_once()

    @pytest.mark.asyncio
    async def test_disconnect_when_no_session(self):
        """Test disconnect when session is None"""
        client = MCPClient(
            mcp_server_path="/path/to/server.py",
            organization="test-org"
        )

        # Should not raise error
        await client.disconnect()
