"""Integration test for complete workflow (Test 21)."""
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def sync_client():
    """Create a sync test client for WebSocket testing."""
    return TestClient(app)


class TestCompleteWorkflow:
    """Test 21: Complete Workflow - Full user journey."""
    
    @pytest.mark.asyncio
    async def test_complete_rest_api_workflow(self, client: AsyncClient):
        """Test complete REST API workflow (steps 1-5)."""
        # Step 1: Health check
        health_response = await client.get("/health")
        assert health_response.status_code == 200
        assert health_response.json()["status"] == "healthy"
        
        # Step 2: List repositories
        repos_response = await client.get("/api/repos")
        assert repos_response.status_code == 200
        repos = repos_response.json()
        assert len(repos) > 0
        assert any(repo["name"] == "frontend-app" for repo in repos)
        
        # Step 3: Browse repository tree
        tree_response = await client.get("/api/repos/frontend-app/tree")
        assert tree_response.status_code == 200
        tree = tree_response.json()
        assert len(tree) > 0
        assert any(item["path"] == "README.md" for item in tree)
        
        # Step 4: Read a file
        file_response = await client.get("/api/repos/frontend-app/files/README.md")
        assert file_response.status_code == 200
        file_data = file_response.json()
        assert file_data["repo"] == "frontend-app"
        assert file_data["path"] == "README.md"
        assert len(file_data["content"]) > 0
        
        # Step 5: Create conversation
        conv_response = await client.post("/api/conversations")
        assert conv_response.status_code == 200
        conv_id = conv_response.json()["id"]
        assert len(conv_id) > 0
        
        # Verify conversation exists
        messages_response = await client.get(f"/api/conversations/{conv_id}/messages")
        assert messages_response.status_code == 200
        assert messages_response.json() == []
    
    @pytest.mark.skipif(
        True,  # Skip by default as it requires valid ANTHROPIC_API_KEY
        reason="Requires valid ANTHROPIC_API_KEY"
    )
    @pytest.mark.asyncio
    async def test_complete_workflow_with_chat(
        self, 
        client: AsyncClient, 
        sync_client: TestClient
    ):
        """Test complete workflow including chat (steps 1-9)."""
        # Steps 1-5: REST API workflow
        health_response = await client.get("/health")
        assert health_response.status_code == 200
        
        repos_response = await client.get("/api/repos")
        assert repos_response.status_code == 200
        
        tree_response = await client.get("/api/repos/frontend-app/tree")
        assert tree_response.status_code == 200
        
        file_response = await client.get("/api/repos/frontend-app/files/README.md")
        assert file_response.status_code == 200
        
        conv_response = await client.post("/api/conversations")
        assert conv_response.status_code == 200
        conv_id = conv_response.json()["id"]
        
        # Step 6: Ask about repositories via WebSocket
        with sync_client.websocket_connect(f"/ws/chat/{conv_id}") as websocket:
            websocket.send_json({
                "type": "message",
                "content": "What repositories do you have?"
            })
            
            tool_executed = False
            done = False
            
            while not done:
                response = websocket.receive_json()
                
                if response["type"] == "tool_use_start":
                    if response["name"] == "list_repositories":
                        tool_executed = True
                
                elif response["type"] == "done":
                    done = True
                
                elif response["type"] == "error":
                    pytest.fail(f"Error in step 6: {response['message']}")
            
            assert tool_executed, "list_repositories tool should have been executed"
        
        # Step 7: Ask about specific repo
        with sync_client.websocket_connect(f"/ws/chat/{conv_id}") as websocket:
            websocket.send_json({
                "type": "message",
                "content": "Tell me about frontend-app"
            })
            
            text_received = False
            done = False
            
            while not done:
                response = websocket.receive_json()
                
                if response["type"] == "text":
                    text_received = True
                
                elif response["type"] == "done":
                    done = True
                
                elif response["type"] == "error":
                    pytest.fail(f"Error in step 7: {response['message']}")
            
            assert text_received, "Should have received text response"
        
        # Step 8: Ask for specific doc
        with sync_client.websocket_connect(f"/ws/chat/{conv_id}") as websocket:
            websocket.send_json({
                "type": "message",
                "content": "Show me the setup guide for frontend-app"
            })
            
            done = False
            
            while not done:
                response = websocket.receive_json()
                
                if response["type"] == "done":
                    done = True
                
                elif response["type"] == "error":
                    pytest.fail(f"Error in step 8: {response['message']}")
        
        # Step 9: Check conversation history
        history_response = await client.get(f"/api/conversations/{conv_id}/messages")
        assert history_response.status_code == 200
        
        messages = history_response.json()
        assert len(messages) >= 6  # At least 3 user + 3 assistant messages
        
        # Verify message structure
        user_messages = [m for m in messages if m["role"] == "user"]
        assistant_messages = [m for m in messages if m["role"] == "assistant"]
        
        assert len(user_messages) == 3
        assert len(assistant_messages) == 3
        
        # Verify conversation context is maintained
        assert any("repository" in m["content"].lower() for m in user_messages)
        assert any("frontend-app" in m["content"].lower() for m in user_messages)


class TestDataFlowIntegrity:
    """Test that data flows correctly through the system."""
    
    @pytest.mark.asyncio
    async def test_data_consistency_across_endpoints(self, client: AsyncClient):
        """Test that data is consistent across different endpoints."""
        # Get repos
        repos_response = await client.get("/api/repos")
        repos = repos_response.json()
        frontend_repo = next(r for r in repos if r["name"] == "frontend-app")
        
        # Get tree for the same repo
        tree_response = await client.get("/api/repos/frontend-app/tree")
        tree = tree_response.json()
        
        # Verify doc count matches tree items
        assert len(tree) > 0
        
        # Get a specific file from the tree
        readme = next(item for item in tree if item["path"] == "README.md")
        
        # Get file content
        file_response = await client.get("/api/repos/frontend-app/files/README.md")
        file_data = file_response.json()
        
        # Verify consistency
        assert file_data["repo"] == "frontend-app"
        assert file_data["path"] == readme["path"]
    
    @pytest.mark.asyncio
    async def test_conversation_data_persistence(self, client: AsyncClient):
        """Test that conversation data persists correctly."""
        # Create conversation
        conv1 = await client.post("/api/conversations")
        conv_id1 = conv1.json()["id"]
        
        # Create another conversation
        conv2 = await client.post("/api/conversations")
        conv_id2 = conv2.json()["id"]
        
        # Verify they are different
        assert conv_id1 != conv_id2
        
        # Verify both can be accessed
        messages1 = await client.get(f"/api/conversations/{conv_id1}/messages")
        messages2 = await client.get(f"/api/conversations/{conv_id2}/messages")
        
        assert messages1.status_code == 200
        assert messages2.status_code == 200
        assert messages1.json() == []
        assert messages2.json() == []
