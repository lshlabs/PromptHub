"""
헬스체크 API 뷰
Docker 컨테이너와 render.com 배포 상태 확인용
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    애플리케이션 상태 확인
    - 데이터베이스 연결 상태
    - 기본 애플리케이션 로직
    """
    try:
        # 데이터베이스 연결 확인
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        # 캐시 시스템 확인 (있는 경우)
        try:
            cache.set('health_check', 'ok', 10)
            cache.get('health_check')
        except Exception:
            pass  # 캐시가 없어도 괜찮음
            
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': '2024-01-01T00:00:00Z'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': '2024-01-01T00:00:00Z'
        }, status=503)
