"""
Data models for MCP Bridge
Pydantic models for request/response validation and serialization
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class Repository(BaseModel):
    """Repository model matching frontend expectations"""
    id: str
    name: str
    description: str
    url: str
    hasDocFolder: bool = Field(alias="hasDocFolder")

    class Config:
        populate_by_name = True


class DocumentFile(BaseModel):
    """Documentation file metadata"""
    id: str
    name: str
    path: str
    type: Literal["markdown", "mermaid", "postman", "openapi", "svg"]
    size: int
    url: str
    download_url: str = Field(alias="download_url")
    sha: str

    class Config:
        populate_by_name = True


class ContentItem(BaseModel):
    """Content item with file data"""
    id: str
    repoId: str = Field(alias="repoId")
    name: str
    path: str
    type: str
    content: str
    lastUpdated: str = Field(alias="lastUpdated")

    class Config:
        populate_by_name = True


class SearchQuery(BaseModel):
    """Search request body"""
    query: str = Field(..., min_length=1, max_length=200)


class SearchResult(BaseModel):
    """Search result item"""
    name: str
    path: str
    repository: str
    url: str
    sha: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    cache_size: int
    mcp_connected: bool


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
