"""Pytest configuration and fixtures for tests."""
import os
import pytest
import subprocess
import time
import signal
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport

# Set test environment variables BEFORE importing app modules
os.environ["MCP_SERVER_URL"] = "http://localhost:3002"
os.environ["OPENROUTER_API_KEY"] = "test-key-12345"

# Now import app modules - they will use the test environment variables
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def mock_mcp_server():
    """Start mock MCP server for tests."""
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

    # Disconnect and reconnect to ensure fresh event loop
    await mcp_client.disconnect()
    await mcp_client.connect()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_conversation_id() -> str:
    """Return a valid conversation ID for testing."""
    return "550e8400-e29b-41d4-a716-446655440000"
