"""
MCP Client for communicating with the MCP Server
Handles stdio-based MCP protocol communication
"""

import asyncio
import json
import logging
import os
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

    def __init__(self, mcp_server_path: str, organization: str, github_token: Optional[str] = None):
        """
        Initialize MCP Client

        Args:
            mcp_server_path: Path to MCP Server main.py
            organization: GitHub organization name
            github_token: GitHub API token for the MCP Server
        """
        self.mcp_server_path = mcp_server_path
        self.organization = organization
        self.github_token = github_token
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

            # Check if MCP server file exists
            if not os.path.exists(self.mcp_server_path):
                raise FileNotFoundError(f"MCP Server not found at: {self.mcp_server_path}")

            # Create environment for MCP Server with GitHub token
            env = os.environ.copy()
            if self.github_token:
                env["GITHUB_TOKEN"] = self.github_token
                env["GITHUB_ORG"] = self.organization

            # Create server parameters
            server_params = StdioServerParameters(
                command="python",
                args=[self.mcp_server_path],
                env=env
            )

            # Connect via stdio
            stdio_transport = await stdio_client(server_params)
            self._read, self._write = stdio_transport

            # Create session
            self.session = ClientSession(self._read, self._write)
            await self.session.initialize()

            logger.info(" Connected to MCP Server")

        except FileNotFoundError as e:
            logger.error(f"MCP Server file not found: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to MCP Server: {e}")
            raise

    async def disconnect(self):
        """Close connection to MCP Server"""
        if self.session:
            try:
                await self.session.__aexit__(None, None, None)
                logger.info("Disconnected from MCP Server")
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")

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
