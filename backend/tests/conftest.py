"""Pytest configuration and fixtures for tests."""
import pytest
import asyncio
import subprocess
import time
import signal
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def mock_mcp_server():
    """Start mock MCP server for tests."""
    import os
    from pathlib import Path

    # Start mock MCP server from tests directory
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    mock_server_path = Path(__file__).parent / "mock_mcp_server.py"

    process = subprocess.Popen(
        ["python", str(mock_server_path)],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Wait for server to start
    time.sleep(3)

    yield

    # Cleanup
    process.send_signal(signal.SIGTERM)
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()


@pytest.fixture
async def client(mock_mcp_server) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client for testing."""
    from app.mcp import mcp_client

    # Ensure MCP client connects to mock server
    if not mcp_client.is_connected:
        await mcp_client.connect()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_conversation_id() -> str:
    """Return a valid conversation ID for testing."""
    return "550e8400-e29b-41d4-a716-446655440000"
