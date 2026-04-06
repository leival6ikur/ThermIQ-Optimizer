"""
Rate Limiting Middleware for API Protection

Implements per-IP rate limiting to prevent abuse and ensure fair usage.
Uses slowapi library for Redis-backed or in-memory rate limiting.
"""
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Create limiter instance
# Uses in-memory storage by default
# For production with multiple workers, use Redis: storage_uri="redis://localhost:6379"
limiter = Limiter(key_func=get_remote_address)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to API requests
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except RateLimitExceeded as e:
            logger.warning(
                f"Rate limit exceeded for {get_remote_address(request)}: {request.url.path}"
            )
            raise


# Rate limit decorators for different endpoint types

# Standard API endpoints - 100 requests per minute
standard_limit = limiter.limit("100/minute")

# Data-heavy endpoints - 30 requests per minute
data_limit = limiter.limit("30/minute")

# Write/modify endpoints - 20 requests per minute
write_limit = limiter.limit("20/minute")

# Authentication/setup endpoints - 5 requests per minute
auth_limit = limiter.limit("5/minute")

# Health check endpoints - no limit (used by monitoring)
no_limit = None


def get_rate_limit_config():
    """
    Get current rate limiting configuration
    """
    return {
        "enabled": True,
        "strategy": "fixed-window",
        "storage": "in-memory",
        "limits": {
            "standard": "100/minute",
            "data": "30/minute",
            "write": "20/minute",
            "auth": "5/minute",
        },
        "key_func": "IP address",
    }
