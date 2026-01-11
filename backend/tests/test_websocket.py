"""WebSocket tests (Tests 13-18)."""
import pytest
import json
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def sync_client():
    """Create a sync test client for WebSocket testing."""
    return TestClient(app)


@pytest.fixture
async def conversation_id(client: AsyncClient) -> str:
    """Create a conversation and return its ID."""
    response = await client.post("/api/conversations")
    return response.json()["id"]


class TestWebSocketBasics:
    """Tests for basic WebSocket functionality."""
    
    def test_websocket_ping_pong(self, sync_client: TestClient, conversation_id: str):
        """Test 13: WebSocket Ping/Pong."""
        with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
            # Send ping
            websocket.send_json({"type": "ping"})
            
            # Receive pong
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_empty_message_error(self, sync_client: TestClient, conversation_id: str):
        """Test 14: Empty Message Error."""
        with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
            # Send empty message
            websocket.send_json({"type": "message", "content": ""})
            
            # Receive error
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert response["message"] == "Empty message"


class TestWebSocketChat:
    """Tests for WebSocket chat functionality with mocked LLM."""

    def test_simple_chat_no_tools(self, sync_client: TestClient, conversation_id: str):
        """Test 15: Simple Chat (No Tools) - mocked."""
        from unittest.mock import patch, AsyncMock

        # Mock LLM stream to return simple text without tools
        async def mock_chat_stream(messages, context=None):
            yield {"type": "text", "content": "Hello! "}
            yield {"type": "text", "content": "I can help you "}
            yield {"type": "text", "content": "with documentation."}

        with patch("app.main.llm_client.chat_stream", side_effect=mock_chat_stream):
            with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
                # Send message
                websocket.send_json({
                    "type": "message",
                    "content": "Hello, what can you help me with?"
                })

                # Collect response
                full_text = ""
                done = False

                while not done:
                    response = websocket.receive_json()

                    if response["type"] == "text":
                        full_text += response["content"]
                    elif response["type"] == "done":
                        done = True
                        assert "messageId" in response
                    elif response["type"] == "error":
                        pytest.fail(f"Got error: {response['message']}")

                assert full_text == "Hello! I can help you with documentation."
    
    def test_chat_with_tool_execution(self, sync_client: TestClient, conversation_id: str):
        """Test 16: Chat with Tool Execution - mocked."""
        from unittest.mock import patch

        # Mock LLM stream to return tool execution events
        async def mock_chat_stream_with_tools(messages, context=None):
            yield {"type": "tool_use_start", "toolId": "tool_123", "name": "list_repositories", "input": {}}
            yield {"type": "tool_result", "toolId": "tool_123", "name": "list_repositories", "result": [{"name": "repo1"}], "duration": 100}
            yield {"type": "text", "content": "The repositories are: repo1"}

        with patch("app.main.llm_client.chat_stream", side_effect=mock_chat_stream_with_tools):
            with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
                # Send message that should trigger tool
                websocket.send_json({
                    "type": "message",
                    "content": "What repositories are available?"
                })

                # Track events
                tool_started = False
                tool_result = False
                text_received = False
                done = False

                while not done:
                    response = websocket.receive_json()

                    if response["type"] == "tool_use_start":
                        tool_started = True
                        assert response["name"] == "list_repositories"
                        assert isinstance(response.get("input"), dict)

                    elif response["type"] == "tool_result":
                        tool_result = True
                        assert response["name"] == "list_repositories"
                        assert "duration" in response
                        assert "result" in response

                    elif response["type"] == "text":
                        text_received = True

                    elif response["type"] == "done":
                        done = True

                    elif response["type"] == "error":
                        pytest.fail(f"Got error: {response['message']}")

                assert tool_started
                assert tool_result
                assert text_received
    
    def test_search_documentation_tool(self, sync_client: TestClient, conversation_id: str):
        """Test 17: Search Documentation Tool - mocked."""
        from unittest.mock import patch

        # Mock LLM stream to use search tool
        async def mock_search_stream(messages, context=None):
            yield {"type": "tool_use_start", "toolId": "search_123", "name": "search_documentation", "input": {"query": "setup"}}
            yield {"type": "tool_result", "toolId": "search_123", "name": "search_documentation", "result": [], "duration": 50}
            yield {"type": "text", "content": "Found setup docs"}

        with patch("app.main.llm_client.chat_stream", side_effect=mock_search_stream):
            with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
                # Send search query
                websocket.send_json({
                    "type": "message",
                    "content": "Find documentation about setup"
                })

                # Track events
                search_tool_used = False
                done = False

                while not done:
                    response = websocket.receive_json()

                    if response["type"] == "tool_use_start":
                        if response["name"] == "search_documentation":
                            search_tool_used = True
                            assert "input" in response

                    elif response["type"] == "done":
                        done = True

                    elif response["type"] == "error":
                        pytest.fail(f"Got error: {response['message']}")

                assert search_tool_used
    
    @pytest.mark.asyncio
    async def test_conversation_persistence(
        self,
        sync_client: TestClient,
        client: AsyncClient,
        conversation_id: str
    ):
        """Test 18: Conversation Persistence - mocked."""
        from unittest.mock import patch

        # Mock LLM streams for both messages
        call_count = [0]

        async def mock_persistence_stream(messages, context=None):
            call_count[0] += 1
            if call_count[0] == 1:
                # First call: respond to "My name is Alice"
                yield {"type": "text", "content": "Nice to meet you, Alice!"}
            else:
                # Second call: respond to "What is my name?" with context
                yield {"type": "text", "content": "Your name is Alice."}

        with patch("app.main.llm_client.chat_stream", side_effect=mock_persistence_stream):
            # Send first message
            with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
                websocket.send_json({
                    "type": "message",
                    "content": "My name is Alice"
                })

                # Wait for done
                while True:
                    response = websocket.receive_json()
                    if response["type"] == "done":
                        break

            # Send follow-up message
            with sync_client.websocket_connect(f"/ws/chat/{conversation_id}") as websocket:
                websocket.send_json({
                    "type": "message",
                    "content": "What is my name?"
                })

                full_text = ""
                while True:
                    response = websocket.receive_json()
                    if response["type"] == "text":
                        full_text += response["content"]
                    elif response["type"] == "done":
                        break

                # Check if Alice is mentioned
                assert "Alice" in full_text or "alice" in full_text.lower()

            # Check conversation history via REST API
            history_response = await client.get(f"/api/conversations/{conversation_id}/messages")
            assert history_response.status_code == 200

            messages = history_response.json()
            assert len(messages) >= 4  # 2 user + 2 assistant

            # Check message structure
            assert messages[0]["role"] == "user"
            assert "Alice" in messages[0]["content"]
            assert messages[1]["role"] == "assistant"
