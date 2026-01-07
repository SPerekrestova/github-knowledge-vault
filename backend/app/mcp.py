"""
MCP Client - Simple HTTP client for MCP Server communication.
"""
import httpx
from typing import Any, Optional
from app.config import settings


class MCPClient:
    """Minimal MCP client using HTTP."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._connected: bool = False

    async def connect(self) -> None:
        """Initialize HTTP client and test connection."""
        self._client = httpx.AsyncClient(
            base_url=settings.MCP_SERVER_URL,
            timeout=settings.MCP_TIMEOUT
        )

        try:
            response = await self._client.get("/health")
            self._connected = response.status_code == 200
            print(f"MCP Server: {'Connected' if self._connected else 'Failed'}")
        except Exception as e:
            print(f"MCP Server connection failed: {e}")
            self._connected = False

    async def disconnect(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def call_tool(self, name: str, arguments: dict) -> Any:
        """
        Execute a tool on the MCP Server.

        Args:
            name: Tool name (e.g., 'list_repositories')
            arguments: Tool arguments dict

        Returns:
            Tool execution result

        Raises:
            RuntimeError: If MCP call fails
        """
        if not self._client:
            raise RuntimeError("MCP client not initialized")

        try:
            response = await self._client.post(
                "/tools/execute",
                json={"name": name, "arguments": arguments}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("result", data)

        except httpx.TimeoutException:
            raise RuntimeError(f"MCP tool '{name}' timed out")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"MCP tool '{name}' failed: {e.response.text}")
        except Exception as e:
            raise RuntimeError(f"MCP tool '{name}' error: {str(e)}")

    async def health_check(self) -> dict:
        """Check MCP Server health status."""
        if not self._client:
            return {"status": "disconnected"}

        try:
            response = await self._client.get("/health")
            if response.status_code == 200:
                return {"status": "connected"}
            return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "disconnected", "error": str(e)}


# Singleton instance
mcp_client = MCPClient()
