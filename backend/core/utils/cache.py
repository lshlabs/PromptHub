from typing import Any, Callable
from django.core.cache import cache


def cache_value_or_set(key: str, timeout_seconds: int, producer: Callable[[], Any]) -> Any:
    """
    Get a value from cache by key. If missing, compute via producer(), cache it and return.
    """
    value = cache.get(key)
    if value is not None:
        return value
    value = producer()
    cache.set(key, value, timeout=timeout_seconds)
    return value


