from collections import Counter
from datetime import timedelta
import logging

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.db.models import Avg, Count, Sum
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from core.utils.cache import cache_value_or_set
from posts.models import Category, Platform, Post, PostInteraction

User = get_user_model()
logger = logging.getLogger(__name__)


def _serialize_recent_posts(limit: int = 5) -> list[dict]:
    recent_posts = (
        Post.objects.select_related("author", "platform", "category")
        .order_by("-created_at")[:limit]
    )
    return [
        {
            "id": post.id,
            "title": post.title,
            "author": post.author.username,
            "created_at": post.created_at.isoformat(),
            "views": post.view_count,
            "likes": post.like_count,
            "platform": post.platform.name,
            "category": post.category.name,
        }
        for post in recent_posts
    ]


def _popular_tags(limit: int = 10) -> list[dict]:
    tags_series = Post.objects.exclude(tags="").values_list("tags", flat=True)
    tags = [tag.strip() for tag_group in tags_series for tag in tag_group.split(",") if tag.strip()]
    return [{"name": name, "count": count} for name, count in Counter(tags).most_common(limit)]


def _platform_distribution() -> list[dict]:
    distribution = (
        Platform.objects.annotate(post_count=Count("posts"))
        .filter(post_count__gt=0)
        .order_by("-post_count")
    )
    return [{"platform": platform.name, "count": platform.post_count} for platform in distribution]


def _category_distribution() -> list[dict]:
    distribution = (
        Category.objects.annotate(post_count=Count("posts"))
        .filter(post_count__gt=0)
        .order_by("-post_count")
    )
    return [{"category": category.name, "count": category.post_count} for category in distribution]


def _dashboard_payload() -> dict:
    aggregate = Post.objects.aggregate(
        total_views=Sum("view_count"),
        total_likes=Sum("like_count"),
        total_bookmarks=Sum("bookmark_count"),
        avg_satisfaction=Avg("satisfaction"),
    )
    seven_days_ago = timezone.now() - timedelta(days=7)
    thirty_days_ago = timezone.now() - timedelta(days=30)

    return {
        "total_posts": Post.objects.count(),
        "total_users": User.objects.count(),
        "total_views": aggregate["total_views"] or 0,
        "total_likes": aggregate["total_likes"] or 0,
        "total_bookmarks": aggregate["total_bookmarks"] or 0,
        "avg_satisfaction": round(float(aggregate["avg_satisfaction"] or 0), 1),
        "weekly_added_posts": Post.objects.filter(created_at__gte=seven_days_ago).count(),
        "active_users": User.objects.filter(posts__created_at__gte=thirty_days_ago).distinct().count(),
        "recent_posts": _serialize_recent_posts(),
        "popular_tags": _popular_tags(),
        "platform_distribution": _platform_distribution(),
        "category_distribution": _category_distribution(),
    }


def dashboard_stats(request):
    try:
        data = cache_value_or_set("stats:dashboard", 60, _dashboard_payload)
        return JsonResponse({"status": "success", "data": data})
    except DatabaseError:
        logger.exception("Failed to build dashboard stats")
        return JsonResponse(
            {
                "status": "error",
                "message": "통계 조회 중 서버 오류가 발생했습니다.",
                "error_code": "DASHBOARD_STATS_FAILED",
            },
            status=500,
        )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    try:
        user_posts = Post.objects.filter(author=request.user)
        posts_count = user_posts.count()
        if posts_count == 0:
            return JsonResponse(
                {
                    "status": "success",
                    "data": {
                        "posts_count": 0,
                        "total_views": 0,
                        "total_likes": 0,
                        "total_bookmarks": 0,
                        "avg_satisfaction": 0,
                        "most_used_platform": None,
                        "most_used_category": None,
                        "recent_activity": {
                            "last_post_date": None,
                            "last_like_date": None,
                            "last_bookmark_date": None,
                        },
                    },
                }
            )

        aggregate = user_posts.aggregate(
            total_views=Sum("view_count"),
            total_likes=Sum("like_count"),
            total_bookmarks=Sum("bookmark_count"),
            avg_satisfaction=Avg("satisfaction"),
        )
        most_used_platform = (
            user_posts.values("platform__name").annotate(count=Count("platform")).order_by("-count").first()
        )
        most_used_category = (
            user_posts.values("category__name").annotate(count=Count("category")).order_by("-count").first()
        )
        last_post = user_posts.order_by("-created_at").first()
        last_like = (
            PostInteraction.objects.filter(user=request.user, is_liked=True).order_by("-updated_at").first()
        )
        last_bookmark = (
            PostInteraction.objects.filter(user=request.user, is_bookmarked=True)
            .order_by("-updated_at")
            .first()
        )

        return JsonResponse(
            {
                "status": "success",
                "data": {
                    "posts_count": posts_count,
                    "total_views": aggregate["total_views"] or 0,
                    "total_likes": aggregate["total_likes"] or 0,
                    "total_bookmarks": aggregate["total_bookmarks"] or 0,
                    "avg_satisfaction": round(float(aggregate["avg_satisfaction"] or 0), 1),
                    "most_used_platform": (most_used_platform or {}).get("platform__name"),
                    "most_used_category": (most_used_category or {}).get("category__name"),
                    "recent_activity": {
                        "last_post_date": last_post.created_at.isoformat() if last_post else None,
                        "last_like_date": last_like.updated_at.isoformat() if last_like else None,
                        "last_bookmark_date": last_bookmark.updated_at.isoformat() if last_bookmark else None,
                    },
                },
            }
        )
    except DatabaseError:
        logger.exception("Failed to build user stats for user_id=%s", getattr(request.user, "id", None))
        return JsonResponse(
            {
                "status": "error",
                "message": "사용자 통계 조회 중 서버 오류가 발생했습니다.",
                "error_code": "USER_STATS_FAILED",
            },
            status=500,
        )
