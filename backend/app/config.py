from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    OPENROUTER_API_KEY: Optional[str] = None
    MODEL_NAME: str = "openrouter/meta-llama/llama-3.3-70b-instruct"
    API_BASE: str = "https://openrouter.ai/api/v1"
    MAX_TOKENS: int = 4096

    MCP_SERVER_URL: str = "https://sperva-github-mcp-server.hf.space"
    MCP_TIMEOUT: int = 30

    # GitHub organization for MCP server
    GITHUB_ORG: str = "lifter-ai"

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
