"""
MCP Client for communicating with FastMCP GitHub server.

Uses the official FastMCP client library to communicate with the
GitHub MCP Server via the Model Context Protocol over HTTP.
"""

import logging
from typing import Any, Optional
from contextlib import asynccontextmanager

from fastmcp import Client
from app.config import settings

logger = logging.getLogger(__name__)


class MCPClient:
    """MCP client using FastMCP's Client for standard MCP protocol communication."""

    def __init__(self):
        self._client: Optional[Client] = None
        self._connected: bool = False
        self._url: str = settings.MCP_SERVER_URL

    async def connect(self) -> None:
        """Initialize MCP client and test connection."""
        try:
            # Create FastMCP client with the MCP endpoint URL
            self._client = Client(self._url)

            # Test connection by listing available tools
            async with self._client as client:
                tools = await client.list_tools()
                self._connected = True
                logger.info(f"MCP Server: Connected ({len(tools)} tools available)")

                # Log available tools for debugging
                tool_names = [tool.name for tool in tools]
                logger.debug(f"Available tools: {tool_names}")

        except Exception as e:
            logger.error(f"MCP Server connection failed: {e}")
            self._connected = False

    async def disconnect(self) -> None:
        """Close MCP client connection."""
        # FastMCP Client uses context manager, no explicit disconnect needed
        self._client = None
        self._connected = False
        logger.info("MCP client disconnected")

    @property
    def is_connected(self) -> bool:
        return self._connected and self._client is not None

    @asynccontextmanager
    async def _get_client(self):
        """Context manager to get an active client session."""
        if not self._client:
            raise RuntimeError("MCP client not initialized. Call connect() first.")

        async with self._client as client:
            yield client

    async def call_tool(self, name: str, arguments: dict) -> Any:
        """
        Execute a tool on the MCP Server using standard MCP protocol.

        Args:
            name: Tool name (e.g., 'get_org_repos_tool', 'search_documentation_tool')
            arguments: Tool arguments dict

        Returns:
            Tool execution result

        Raises:
            RuntimeError: If MCP call fails or client not initialized
        """
        try:
            async with self._get_client() as client:
                logger.debug(f"Calling MCP tool: {name} with args: {arguments}")

                # Call the tool using FastMCP client
                result = await client.call_tool(name, arguments)

                logger.debug(f"MCP tool '{name}' completed successfully")

                # FastMCP returns a CallToolResult object with content
                # Extract the actual data from the response
                if hasattr(result, 'content') and result.content:
                    # Get first content item (usually text)
                    first_content = result.content[0]
                    if hasattr(first_content, 'text'):
                        # Try to parse as JSON if it's text
                        import json
                        try:
                            return json.loads(first_content.text)
                        except json.JSONDecodeError:
                            return first_content.text
                    return first_content

                return result

        except AttributeError as e:
            raise RuntimeError(f"MCP client not initialized: {str(e)}")
        except Exception as e:
            logger.error(f"MCP tool '{name}' error: {str(e)}")
            raise RuntimeError(f"MCP tool '{name}' failed: {str(e)}")

    async def health_check(self) -> dict:
        """
        Check MCP Server health status.

        Returns:
            Status dictionary with connection state
        """
        if not self._client:
            return {"status": "disconnected", "error": "Client not initialized"}

        try:
            async with self._get_client() as client:
                # Try to list tools as a health check
                tools = await client.list_tools()
                return {
                    "status": "connected",
                    "tools_count": len(tools)
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


# Singleton instance
mcp_client = MCPClient()
