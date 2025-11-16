"""
In-memory cache with TTL (Time To Live) support
Simple dictionary-based cache for MCP responses
"""

import time
from typing import Any, Optional, Dict
import logging

logger = logging.getLogger(__name__)


class CacheEntry:
    """Cache entry with data and timestamp"""
    def __init__(self, data: Any):
        self.data = data
        self.timestamp = time.time()


class InMemoryCache:
    """
    Simple in-memory cache with TTL support

    Features:
    - Automatic expiration based on TTL
    - Pattern-based invalidation
    - Thread-safe (single-threaded async context)
    """

    def __init__(self, ttl_seconds: int = 300):
        """
        Initialize cache

        Args:
            ttl_seconds: Time to live in seconds (default: 300 = 5 minutes)
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._ttl = ttl_seconds
        logger.info(f"Cache initialized with TTL: {ttl_seconds}s")

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/not found
        """
        entry = self._cache.get(key)
        if not entry:
            logger.debug(f"Cache miss: {key}")
            return None

        # Check if expired
        if time.time() - entry.timestamp > self._ttl:
            logger.debug(f"Cache expired: {key}")
            del self._cache[key]
            return None

        logger.debug(f"Cache hit: {key}")
        return entry.data

    def set(self, key: str, value: Any) -> None:
        """
        Store value in cache

        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = CacheEntry(value)
        logger.debug(f"Cache set: {key}")

    def invalidate(self, key: str) -> None:
        """
        Remove specific key from cache

        Args:
            key: Cache key to remove
        """
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache invalidated: {key}")

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Remove all keys matching a pattern (simple substring match)

        Args:
            pattern: Pattern to match (e.g., "repos:", "content:")

        Returns:
            Number of keys removed
        """
        keys_to_remove = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_remove:
            del self._cache[key]

        logger.info(f"Invalidated {len(keys_to_remove)} keys matching '{pattern}'")
        return len(keys_to_remove)

    def clear(self) -> None:
        """Clear entire cache"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cache cleared ({count} entries removed)")

    def size(self) -> int:
        """Get number of cached entries"""
        return len(self._cache)

    def cleanup_expired(self) -> int:
        """
        Remove all expired entries

        Returns:
            Number of entries removed
        """
        now = time.time()
        expired_keys = [
            k for k, v in self._cache.items()
            if now - v.timestamp > self._ttl
        ]

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")

        return len(expired_keys)
