"""
Unit tests for Pydantic models
"""

import pytest
from pydantic import ValidationError
from models import (
    Repository,
    DocumentFile,
    ContentItem,
    SearchQuery,
    SearchResult,
    HealthResponse,
    ErrorResponse
)


class TestRepository:
    """Test Repository model"""

    def test_valid_repository(self, sample_repository):
        """Test creating a valid repository"""
        repo = Repository(**sample_repository)
        assert repo.id == "repo-1"
        assert repo.name == "test-repo"
        assert repo.hasDocFolder is True

    def test_repository_alias(self):
        """Test field alias for hasDocFolder"""
        repo = Repository(
            id="1",
            name="test",
            description="desc",
            url="http://test.com",
            hasDocFolder=True
        )
        assert repo.hasDocFolder is True

    def test_repository_missing_field(self):
        """Test validation error on missing required field"""
        with pytest.raises(ValidationError):
            Repository(
                id="1",
                name="test",
                description="desc"
                # Missing url and hasDocFolder
            )


class TestDocumentFile:
    """Test DocumentFile model"""

    def test_valid_document(self, sample_document):
        """Test creating a valid document"""
        doc = DocumentFile(**sample_document)
        assert doc.name == "README.md"
        assert doc.type == "markdown"
        assert doc.size == 1024

    def test_document_type_validation(self, sample_document):
        """Test document type must be one of allowed types"""
        sample_document["type"] = "invalid_type"
        with pytest.raises(ValidationError):
            DocumentFile(**sample_document)

    def test_valid_document_types(self, sample_document):
        """Test all valid document types"""
        valid_types = ["markdown", "mermaid", "postman", "openapi", "svg"]
        for doc_type in valid_types:
            sample_document["type"] = doc_type
            doc = DocumentFile(**sample_document)
            assert doc.type == doc_type


class TestContentItem:
    """Test ContentItem model"""

    def test_valid_content_item(self, sample_content_item):
        """Test creating a valid content item"""
        item = ContentItem(**sample_content_item)
        assert item.repoId == "test-repo"
        assert item.content == "# Test Documentation"

    def test_content_item_alias(self):
        """Test field aliases"""
        item = ContentItem(
            id="1",
            repoId="repo",
            name="test.md",
            path="doc/test.md",
            type="markdown",
            content="# Test",
            lastUpdated="2024-01-01T00:00:00"
        )
        assert item.repoId == "repo"
        assert item.lastUpdated == "2024-01-01T00:00:00"


class TestSearchQuery:
    """Test SearchQuery model"""

    def test_valid_search_query(self):
        """Test creating a valid search query"""
        query = SearchQuery(query="test search")
        assert query.query == "test search"

    def test_empty_query_validation(self):
        """Test validation fails on empty query"""
        with pytest.raises(ValidationError):
            SearchQuery(query="")

    def test_query_max_length(self):
        """Test query max length validation"""
        long_query = "a" * 201
        with pytest.raises(ValidationError):
            SearchQuery(query=long_query)

    def test_query_exactly_max_length(self):
        """Test query at exactly max length is valid"""
        query = SearchQuery(query="a" * 200)
        assert len(query.query) == 200


class TestSearchResult:
    """Test SearchResult model"""

    def test_valid_search_result(self):
        """Test creating a valid search result"""
        result = SearchResult(
            name="test.md",
            path="doc/test.md",
            repository="test-repo",
            url="https://github.com/test/test",
            sha="abc123"
        )
        assert result.name == "test.md"
        assert result.repository == "test-repo"


class TestHealthResponse:
    """Test HealthResponse model"""

    def test_valid_health_response(self):
        """Test creating a valid health response"""
        health = HealthResponse(
            status="ok",
            cache_size=10,
            mcp_connected=True
        )
        assert health.status == "ok"
        assert health.cache_size == 10
        assert health.mcp_connected is True


class TestErrorResponse:
    """Test ErrorResponse model"""

    def test_error_response_with_detail(self):
        """Test error response with detail"""
        error = ErrorResponse(
            error="Test error",
            detail="Detailed error message"
        )
        assert error.error == "Test error"
        assert error.detail == "Detailed error message"

    def test_error_response_without_detail(self):
        """Test error response without detail"""
        error = ErrorResponse(error="Test error")
        assert error.error == "Test error"
        assert error.detail is None
