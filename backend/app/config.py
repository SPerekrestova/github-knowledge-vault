from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # LLM Provider Configuration
    LLM_PROVIDER: str = "openrouter"  # "openrouter" | "anthropic" | "openai"

    # API Keys
    OPENROUTER_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None  # Fallback

    # Model Selection
    # OpenRouter format: "openrouter/provider/model"
    MODEL_NAME: str = "openrouter/meta-llama/llama-3.3-70b-instruct"

    # Legacy fields (backward compatibility)
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    CLAUDE_MAX_TOKENS: int = 4096

    # Token limits
    MAX_TOKENS: int = 4096

    # MCP Server Configuration
    MCP_SERVER_URL: str = "http://mcp-server:3000"
    MCP_TIMEOUT: int = 30

    # CORS Configuration
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def effective_api_key(self) -> str:
        """Get the appropriate API key based on provider."""
        if self.LLM_PROVIDER == "openrouter" and self.OPENROUTER_API_KEY:
            return self.OPENROUTER_API_KEY
        elif self.LLM_PROVIDER == "anthropic" and self.ANTHROPIC_API_KEY:
            return self.ANTHROPIC_API_KEY
        elif self.OPENROUTER_API_KEY:  # Default to OpenRouter
            return self.OPENROUTER_API_KEY
        raise ValueError("No valid API key configured")

    @property
    def effective_model(self) -> str:
        """Get the appropriate model based on provider."""
        if self.LLM_PROVIDER == "openrouter":
            return self.MODEL_NAME
        elif self.LLM_PROVIDER == "anthropic":
            return self.CLAUDE_MODEL
        return self.MODEL_NAME


settings = Settings()
