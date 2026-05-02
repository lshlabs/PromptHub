from django.core.cache import cache
from django.db import connection
from django.db.utils import DatabaseError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
import logging

logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        cache_status = "available"
        try:
            cache.set("health_check", "ok", 10)
            cache.get("health_check")
        except (ValueError, TypeError, RuntimeError) as cache_error:
            logger.warning("Cache health probe failed: %s", cache_error)
            cache_status = "unavailable"

        return JsonResponse(
            {
                "status": "healthy",
                "database": "connected",
                "cache": cache_status,
                "timestamp": timezone.now().isoformat(),
            },
            status=200,
        )
    except DatabaseError:
        logger.exception("Health check failed due to database error.")
        return JsonResponse({
            "status": "unhealthy",
            "error": "database_unavailable",
            "timestamp": timezone.now().isoformat(),
        }, status=503)
