from typing import Any, Dict, Optional
import logging
from django.core.cache import cache
from django.db import DatabaseError
from django.db.models import QuerySet
from ..models.trending import TrendingCategory, TrendingRanking

logger = logging.getLogger(__name__)


class TrendingServiceError(RuntimeError):
    ...


class TrendingService:
    CACHE_KEY = "trending_category_rankings"
    CACHE_TIMEOUT = 3600

    @classmethod
    def get_category_rankings(cls) -> Dict[str, Any]:
        cached_data = cache.get(cls.CACHE_KEY)
        if cached_data is not None:
            return {"status": "success", "data": cached_data, "from_cache": True}

        try:
            category_rankings = cls._fetch_category_rankings()
            cache.set(cls.CACHE_KEY, category_rankings, cls.CACHE_TIMEOUT)
            return {"status": "success", "data": category_rankings, "from_cache": False}
        except DatabaseError as db_error:
            logger.exception("Failed to fetch trending category rankings.")
            raise TrendingServiceError("트렌딩 데이터를 조회할 수 없습니다.") from db_error

    @classmethod
    def _fetch_category_rankings(cls) -> Dict[str, Dict[str, Any]]:
        categories = TrendingCategory.objects.filter(is_active=True).order_by("order", "name")
        category_rankings = {}

        for category in categories:
            rankings = TrendingRanking.objects.filter(
                category=category,
                is_active=True
            ).order_by("rank")

            category_rankings[category.name] = {
                "title": category.title,
                "subtitle": category.subtitle,
                "icon": category.icon_name,
                "data": [
                    {
                        "rank": ranking.rank,
                        "name": ranking.name,
                        "score": ranking.score,
                        "provider": ranking.provider,
                    }
                    for ranking in rankings
                ],
            }

        return category_rankings

    @classmethod
    def refresh_cache(cls) -> Dict[str, Any]:
        try:
            cache.delete(cls.CACHE_KEY)
            return {"status": "success", "message": "트렌딩 캐시가 성공적으로 삭제되었습니다."}
        except (RuntimeError, ValueError, TypeError) as cache_error:
            logger.exception("Failed to refresh trending cache.")
            raise TrendingServiceError("트렌딩 캐시를 갱신할 수 없습니다.") from cache_error

    @classmethod
    def get_category_count(cls) -> int:
        return TrendingCategory.objects.filter(is_active=True).count()

    @classmethod
    def get_total_rankings_count(cls) -> int:
        return TrendingRanking.objects.filter(is_active=True).count()

    @classmethod
    def get_category_by_name(cls, category_name: str) -> Optional[Dict[str, Any]]:
        try:
            category = TrendingCategory.objects.get(name=category_name, is_active=True)
            rankings = TrendingRanking.objects.filter(
                category=category,
                is_active=True
            ).order_by("rank")
            return {
                "title": category.title,
                "subtitle": category.subtitle,
                "icon": category.icon_name,
                "data": [
                    {
                        "rank": ranking.rank,
                        "name": ranking.name,
                        "score": ranking.score,
                        "provider": ranking.provider,
                    }
                    for ranking in rankings
                ],
            }
        except TrendingCategory.DoesNotExist:
            return None

    @classmethod
    def get_related_posts_by_model_name(cls, model_name: str) -> QuerySet:
        from posts.models import Post

        try:
            trending_ranking = TrendingRanking.objects.filter(
                name=model_name,
                is_active=True,
                related_model__isnull=False,
            ).first()
            if trending_ranking:
                return trending_ranking.get_filtered_posts()
            return Post.objects.none()
        except DatabaseError as db_error:
            logger.exception("Failed to fetch related posts for model_name=%s", model_name)
            raise TrendingServiceError("트렌딩 연관 게시글을 조회할 수 없습니다.") from db_error

    @classmethod
    def get_trending_model_info(cls, model_name: str) -> Optional[Dict[str, Any]]:
        try:
            trending_ranking = TrendingRanking.objects.filter(
                name=model_name,
                is_active=True,
            ).select_related("related_model", "category").first()
            if not trending_ranking:
                return None

            related_model_info = None
            related_posts_count = 0
            if trending_ranking.related_model:
                related_posts_count = trending_ranking.get_filtered_posts().count()
                related_model_info = {
                    "id": trending_ranking.related_model.id,
                    "name": trending_ranking.related_model.name,
                    "platform": trending_ranking.related_model.platform.name,
                    "exact_matching": trending_ranking.use_exact_matching,
                    "model_detail_filter": trending_ranking.model_detail_contains,
                    "model_etc_filter": trending_ranking.model_etc_contains,
                }

            return {
                "trending_name": trending_ranking.name,
                "provider": trending_ranking.provider,
                "score": trending_ranking.score,
                "rank": trending_ranking.rank,
                "category": {
                    "name": trending_ranking.category.name,
                    "title": trending_ranking.category.title,
                },
                "related_model": related_model_info,
                "related_posts_count": related_posts_count,
            }
        except DatabaseError as db_error:
            logger.exception("Failed to fetch trending model info for model_name=%s", model_name)
            raise TrendingServiceError("트렌딩 모델 정보를 조회할 수 없습니다.") from db_error
        except AttributeError as model_mapping_error:
            logger.exception("Invalid mapping found in trending model info for model_name=%s", model_name)
            raise TrendingServiceError("트렌딩 모델 데이터가 유효하지 않습니다.") from model_mapping_error
