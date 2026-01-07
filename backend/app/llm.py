"""
LLM Client - Claude API with streaming and tool execution.
"""
from anthropic import AsyncAnthropic
from typing import AsyncGenerator, Optional, List
import json
import time

from app.config import settings
from app.mcp import mcp_client


# Tool definitions for Claude
TOOLS = [
    {
        "name": "list_repositories",
        "description": "List all available repositories in the organization with their documentation counts.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "search_documentation",
        "description": "Search across all documentation. Returns matching documents with snippets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query string"
                },
                "repo": {
                    "type": "string",
                    "description": "Optional: Limit search to specific repository"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_documentation",
        "description": "Retrieve the full content of a specific documentation file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo": {
                    "type": "string",
                    "description": "Repository name"
                },
                "path": {
                    "type": "string",
                    "description": "File path within the repository"
                }
            },
            "required": ["repo", "path"]
        }
    },
    {
        "name": "list_repo_docs",
        "description": "List all documentation files in a specific repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo": {
                    "type": "string",
                    "description": "Repository name"
                }
            },
            "required": ["repo"]
        }
    }
]


def build_system_prompt(context: Optional[dict] = None) -> str:
    """Build system prompt with optional repo context."""

    base = """You are a helpful documentation assistant for a GitHub organization.

You have access to tools to search and retrieve documentation:
- list_repositories: List all available repositories
- search_documentation: Search across documentation
- get_documentation: Get a specific document's content
- list_repo_docs: List all documents in a repository

When answering questions:
1. Use tools to find relevant documentation
2. Cite specific documents when providing information
3. If information is not found, clearly state that
4. Provide accurate, helpful responses based on the documentation"""

    if context and context.get("scope") == "repo" and context.get("repoName"):
        repo = context["repoName"]
        base += f"""

IMPORTANT: The user is currently focused on the '{repo}' repository.
When searching for documentation:
1. Search within '{repo}' first
2. If not found there, mention you're expanding to other repositories
3. Always clarify which repository information comes from"""

    return base


class LLMClient:
    """Claude API client with streaming and tool execution."""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS

    async def chat_stream(
        self,
        messages: List[dict],
        context: Optional[dict] = None
    ) -> AsyncGenerator[dict, None]:
        """
        Stream chat response from Claude with tool execution.

        Args:
            messages: Conversation history [{"role": "user/assistant", "content": "..."}]
            context: Optional context {"scope": "repo", "repoName": "..."}

        Yields:
            Events:
            - {"type": "text", "content": "..."}
            - {"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}
            - {"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}
        """
        system_prompt = build_system_prompt(context)

        # Initial Claude request
        current_messages = list(messages)

        while True:
            # Collect full response for potential continuation
            assistant_content = []
            tool_use_block = None
            tool_input_json = ""

            async with self.client.messages.stream(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=current_messages,
                tools=TOOLS,
            ) as stream:

                async for event in stream:

                    if event.type == "content_block_start":
                        if event.content_block.type == "tool_use":
                            tool_use_block = {
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                            }
                            tool_input_json = ""
                            yield {
                                "type": "tool_use_start",
                                "toolId": event.content_block.id,
                                "name": event.content_block.name,
                                "input": {}
                            }

                    elif event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            yield {"type": "text", "content": event.delta.text}
                        elif hasattr(event.delta, "partial_json"):
                            tool_input_json += event.delta.partial_json

                    elif event.type == "content_block_stop":
                        if tool_use_block:
                            # Parse accumulated JSON and execute tool
                            try:
                                tool_input = json.loads(tool_input_json) if tool_input_json else {}
                            except json.JSONDecodeError:
                                tool_input = {}

                            # Execute the tool
                            start_time = time.time()
                            try:
                                result = await mcp_client.call_tool(
                                    tool_use_block["name"],
                                    tool_input
                                )
                            except Exception as e:
                                result = {"error": str(e)}

                            duration = int((time.time() - start_time) * 1000)

                            yield {
                                "type": "tool_result",
                                "toolId": tool_use_block["id"],
                                "name": tool_use_block["name"],
                                "result": result,
                                "duration": duration
                            }

                            # Store for continuation
                            assistant_content.append({
                                "type": "tool_use",
                                "id": tool_use_block["id"],
                                "name": tool_use_block["name"],
                                "input": tool_input
                            })

                            tool_use_block = None
                            tool_input_json = ""

                # Get final message to check stop reason
                final_message = await stream.get_final_message()

            # Check if we need to continue (tool_use stop reason)
            if final_message.stop_reason == "tool_use":
                # Build tool results for continuation
                tool_results = []
                for block in final_message.content:
                    if block.type == "tool_use":
                        # Find the result we already computed
                        try:
                            result = await mcp_client.call_tool(block.name, block.input)
                        except Exception as e:
                            result = {"error": str(e)}

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result) if isinstance(result, (dict, list)) else str(result)
                        })

                # Update messages for next iteration
                current_messages = current_messages + [
                    {"role": "assistant", "content": final_message.content},
                    {"role": "user", "content": tool_results}
                ]

                # Continue the loop for Claude's response to tool results
            else:
                # Normal end (end_turn or max_tokens)
                break


# Singleton instance
llm_client = LLMClient()
