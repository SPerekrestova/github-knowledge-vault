"""
LLM Client - Multi-provider support via litellm with OpenRouter integration.
"""
from litellm import acompletion
from typing import AsyncGenerator, Optional, List, Dict, Any
import json
import time
import logging

from app.config import settings
from app.mcp import mcp_client

logger = logging.getLogger(__name__)


def map_tool_call(tool_name: str, tool_input: dict) -> tuple[str, dict]:
    """
    Map LLM tool calls to MCP server tool names and parameters.

    The LLM uses simplified tool names, but the MCP server expects
    specific tool names with the 'org' parameter included.

    Args:
        tool_name: Tool name from LLM (e.g., 'list_repositories')
        tool_input: Tool arguments from LLM

    Returns:
        Tuple of (mcp_tool_name, mcp_arguments)
    """
    org = settings.GITHUB_ORG

    # Map LLM tool names to MCP tool names
    tool_mapping = {
        "list_repositories": "get_org_repos_tool",
        "search_documentation": "search_documentation_tool",
        "get_documentation": "get_file_content_tool",
        "list_repo_docs": "get_repo_docs_tool"
    }

    mcp_tool_name = tool_mapping.get(tool_name, tool_name)

    # Add org parameter to all tool calls
    mcp_arguments = {"org": org, **tool_input}

    logger.debug(f"Mapped {tool_name} -> {mcp_tool_name} with args: {mcp_arguments}")

    return mcp_tool_name, mcp_arguments

# Tool definitions in OpenAI format (required by litellm)
# These tool names and parameters match the MCP server's actual tools
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_repositories",
            "description": "List all available repositories in the organization with their documentation counts. Searches for repositories that have a /doc folder.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_documentation",
            "description": "Search across documentation in all repositories using GitHub Code Search API. Returns matching files in /doc folders.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query string (e.g., 'authentication', 'API', 'streaming')"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_documentation",
            "description": "Retrieve the full content of a specific documentation file from a repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo": {
                        "type": "string",
                        "description": "Repository name (not full path, just the repo name)"
                    },
                    "path": {
                        "type": "string",
                        "description": "File path within the repository (e.g., 'doc/README.md')"
                    }
                },
                "required": ["repo", "path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_repo_docs",
            "description": "List all documentation files in a specific repository's /doc folder. Filters for supported types: Markdown, Mermaid, SVG, OpenAPI, Postman.",
            "parameters": {
                "type": "object",
                "properties": {
                    "repo": {
                        "type": "string",
                        "description": "Repository name (not full path, just the repo name)"
                    }
                },
                "required": ["repo"]
            }
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
    """Multi-provider LLM client with streaming and tool execution."""

    def __init__(self):
        self.model = settings.MODEL_NAME
        self.max_tokens = settings.MAX_TOKENS
        self.api_key = settings.OPENROUTER_API_KEY
        self.api_base = settings.API_BASE

    async def chat_stream(
        self,
        messages: List[dict],
        context: Optional[dict] = None
    ) -> AsyncGenerator[dict, None]:
        """
        Stream chat response from LLM with tool execution.

        Args:
            messages: Conversation history [{"role": "user/assistant", "content": "..."}]
            context: Optional context {"scope": "repo", "repoName": "..."}

        Yields:
            Events (maintains backward compatibility):
            - {"type": "text", "content": "..."}
            - {"type": "tool_use_start", "toolId": "...", "name": "...", "input": {...}}
            - {"type": "tool_result", "toolId": "...", "name": "...", "result": {...}, "duration": 123}
        """
        system_prompt = build_system_prompt(context)

        # Convert messages to OpenAI format (system as first message if needed)
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        current_messages = formatted_messages
        max_iterations = 10  # Prevent infinite loops
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Track tool calls for this iteration
            pending_tool_calls = []
            accumulated_text = ""

            try:
                # Make streaming request
                response = await acompletion(
                    model=self.model,
                    messages=current_messages,
                    tools=TOOLS,
                    stream=True,
                    api_key=self.api_key,
                    api_base=self.api_base,
                    max_tokens=self.max_tokens,
                    extra_headers={
                        "X-Title": "GitHub Knowledge Vault"
                    }
                )

                finish_reason = None

                # Stream chunks
                async for chunk in response:
                    if not chunk or not chunk.choices:
                        continue

                    choice = chunk.choices[0]
                    delta = choice.delta if hasattr(choice, 'delta') else None

                    if not delta:
                        continue

                    # Handle text content
                    if hasattr(delta, 'content') and delta.content:
                        accumulated_text += delta.content
                        yield {"type": "text", "content": delta.content}

                    # Handle tool calls
                    if hasattr(delta, 'tool_calls') and delta.tool_calls:
                        for tool_call in delta.tool_calls:
                            tool_id = tool_call.id if hasattr(tool_call, 'id') else f"call_{int(time.time() * 1000)}"

                            # Check if this is a new tool call or continuation
                            existing = next(
                                (tc for tc in pending_tool_calls if tc.get('id') == tool_id),
                                None
                            )

                            if not existing:
                                # New tool call
                                tool_name = tool_call.function.name if hasattr(tool_call.function, 'name') else ""
                                pending_tool_calls.append({
                                    'id': tool_id,
                                    'name': tool_name,
                                    'arguments': tool_call.function.arguments if hasattr(tool_call.function, 'arguments') else ""
                                })

                                yield {
                                    "type": "tool_use_start",
                                    "toolId": tool_id,
                                    "name": tool_name,
                                    "input": {}
                                }
                            else:
                                # Accumulate arguments
                                if hasattr(tool_call.function, 'arguments'):
                                    existing['arguments'] += tool_call.function.arguments

                    # Check finish reason
                    if hasattr(choice, 'finish_reason') and choice.finish_reason:
                        finish_reason = choice.finish_reason

                # Process tool calls if any
                if pending_tool_calls:
                    tool_results = []

                    for tool_call in pending_tool_calls:
                        # Parse arguments
                        try:
                            tool_input = json.loads(tool_call['arguments']) if tool_call['arguments'] else {}
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse tool arguments: {e}")
                            tool_input = {}

                        # Map LLM tool call to MCP tool call
                        mcp_tool_name, mcp_arguments = map_tool_call(
                            tool_call['name'],
                            tool_input
                        )

                        # Execute tool on MCP server
                        start_time = time.time()
                        try:
                            result = await mcp_client.call_tool(
                                mcp_tool_name,
                                mcp_arguments
                            )
                        except Exception as e:
                            logger.error(f"Tool execution error: {e}")
                            result = {"error": str(e)}

                        duration = int((time.time() - start_time) * 1000)

                        # Yield tool result event
                        yield {
                            "type": "tool_result",
                            "toolId": tool_call['id'],
                            "name": tool_call['name'],
                            "result": result,
                            "duration": duration
                        }

                        # Build tool result message for continuation
                        tool_results.append({
                            "role": "tool",
                            "tool_call_id": tool_call['id'],
                            "name": tool_call['name'],
                            "content": json.dumps(result) if isinstance(result, (dict, list)) else str(result)
                        })

                    # Add assistant message with tool calls
                    assistant_message = {
                        "role": "assistant",
                        "content": accumulated_text or None,
                        "tool_calls": [
                            {
                                "id": tc['id'],
                                "type": "function",
                                "function": {
                                    "name": tc['name'],
                                    "arguments": tc['arguments']
                                }
                            }
                            for tc in pending_tool_calls
                        ]
                    }

                    # Continue conversation with tool results
                    current_messages = current_messages + [assistant_message] + tool_results

                    # Continue loop for next iteration
                    continue

                # No tool calls - conversation complete
                if finish_reason in ("stop", "length", "end_turn"):
                    break

                # Unknown finish reason - break to avoid infinite loop
                logger.warning(f"Unexpected finish reason: {finish_reason}")
                break

            except Exception as e:
                logger.error(f"Streaming error: {e}")
                # Don't yield error here - let WebSocket handler deal with it
                raise


# Singleton instance
llm_client = LLMClient()
