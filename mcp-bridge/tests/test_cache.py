"""
Unit tests for InMemoryCache
"""

import pytest
import time
from cache import InMemoryCache, CacheEntry


class TestCacheEntry:
    """Test CacheEntry class"""

    def test_cache_entry_creation(self):
        """Test creating a cache entry"""
        entry = CacheEntry("test_data")
        assert entry.data == "test_data"
        assert isinstance(entry.timestamp, float)
        assert entry.timestamp <= time.time()


class TestInMemoryCache:
    """Test InMemoryCache class"""

    def test_cache_initialization(self):
        """Test cache initialization with default TTL"""
        cache = InMemoryCache()
        assert cache._ttl == 300
        assert cache.size() == 0

    def test_cache_custom_ttl(self):
        """Test cache initialization with custom TTL"""
        cache = InMemoryCache(ttl_seconds=60)
        assert cache._ttl == 60

    def test_set_and_get(self):
        """Test setting and getting values"""
        cache = InMemoryCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent_key(self):
        """Test getting a non-existent key returns None"""
        cache = InMemoryCache()
        assert cache.get("nonexistent") is None

    def test_cache_expiration(self):
        """Test cache entry expires after TTL"""
        cache = InMemoryCache(ttl_seconds=1)
        cache.set("key1", "value1")

        # Should be available immediately
        assert cache.get("key1") == "value1"

        # Wait for expiration
        time.sleep(1.1)

        # Should be expired
        assert cache.get("key1") is None

    def test_cache_size(self):
        """Test cache size tracking"""
        cache = InMemoryCache()
        assert cache.size() == 0

        cache.set("key1", "value1")
        assert cache.size() == 1

        cache.set("key2", "value2")
        assert cache.size() == 2

    def test_invalidate_existing_key(self):
        """Test invalidating an existing key"""
        cache = InMemoryCache()
        cache.set("key1", "value1")
        assert cache.size() == 1

        cache.invalidate("key1")
        assert cache.size() == 0
        assert cache.get("key1") is None

    def test_invalidate_nonexistent_key(self):
        """Test invalidating a non-existent key does nothing"""
        cache = InMemoryCache()
        cache.invalidate("nonexistent")  # Should not raise error
        assert cache.size() == 0

    def test_invalidate_pattern(self):
        """Test pattern-based invalidation"""
        cache = InMemoryCache()
        cache.set("repos:all", [1, 2, 3])
        cache.set("repos:single", [1])
        cache.set("content:all", [4, 5])
        cache.set("other:data", "test")

        assert cache.size() == 4

        # Invalidate all "repos:" keys
        removed = cache.invalidate_pattern("repos:")
        assert removed == 2
        assert cache.size() == 2

        # Verify correct keys were removed
        assert cache.get("repos:all") is None
        assert cache.get("repos:single") is None
        assert cache.get("content:all") == [4, 5]
        assert cache.get("other:data") == "test"

    def test_invalidate_pattern_no_matches(self):
        """Test pattern invalidation with no matches"""
        cache = InMemoryCache()
        cache.set("key1", "value1")

        removed = cache.invalidate_pattern("nonexistent")
        assert removed == 0
        assert cache.size() == 1

    def test_clear(self):
        """Test clearing entire cache"""
        cache = InMemoryCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        assert cache.size() == 3

        cache.clear()

        assert cache.size() == 0
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") is None

    def test_cleanup_expired(self):
        """Test cleaning up expired entries"""
        cache = InMemoryCache(ttl_seconds=1)

        cache.set("key1", "value1")
        cache.set("key2", "value2")

        # Wait for expiration
        time.sleep(1.1)

        # Add a fresh entry
        cache.set("key3", "value3")

        # Cleanup should remove 2 expired entries
        removed = cache.cleanup_expired()
        assert removed == 2
        assert cache.size() == 1
        assert cache.get("key3") == "value3"

    def test_cleanup_expired_no_expired_entries(self):
        """Test cleanup with no expired entries"""
        cache = InMemoryCache(ttl_seconds=10)
        cache.set("key1", "value1")

        removed = cache.cleanup_expired()
        assert removed == 0
        assert cache.size() == 1

    def test_set_overwrites_existing_key(self):
        """Test setting an existing key overwrites the value"""
        cache = InMemoryCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

        cache.set("key1", "value2")
        assert cache.get("key1") == "value2"
        assert cache.size() == 1  # Still only 1 entry

    def test_cache_different_data_types(self):
        """Test caching different data types"""
        cache = InMemoryCache()

        cache.set("string", "test")
        cache.set("number", 123)
        cache.set("list", [1, 2, 3])
        cache.set("dict", {"key": "value"})
        cache.set("none", None)

        assert cache.get("string") == "test"
        assert cache.get("number") == 123
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"key": "value"}
        assert cache.get("none") is None
