from __future__ import annotations

from typing import Optional, Tuple

from django.db import transaction
from django.db.models import F
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Prefetch

from core.filters import PostFilter
from core.search import SearchManager
from core.sorting import SortManager
from posts.models import Post, PostInteraction


def build_posts_page(request) -> Tuple:
    page = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 10)
    search = request.GET.get("search", "")
    search_type = request.GET.get("search_type", "title")
    exclude_id = request.GET.get("exclude_id", "")
    sort_by = request.GET.get("sort_by", "latest")

    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 50)
    except (ValueError, TypeError):
        page = 1
        page_size = 10

    queryset = Post.objects.select_related("author", "platform", "model", "category")

    filterset = PostFilter(request.GET, queryset=queryset)
    if filterset.is_valid():
        queryset = filterset.qs

    if sort_by in ("rating", "satisfaction"):
        sort_by = "satisfaction"
    queryset = SortManager.sort_posts(queryset, sort_by)

    if search:
        queryset = SearchManager.search_posts(queryset, search, search_type)

    if str(exclude_id).isdigit():
        queryset = queryset.exclude(id=int(exclude_id))

    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        queryset = queryset.prefetch_related(
            Prefetch(
                "interactions",
                queryset=PostInteraction.objects.filter(user=user),
            )
        )

    paginator = Paginator(queryset, page_size)
    try:
        posts_page = paginator.page(page)
    except PageNotAnInteger:
        posts_page = paginator.page(1)
    except EmptyPage:
        posts_page = paginator.page(paginator.num_pages)

    return posts_page, paginator


def get_post_and_increment_views(post_id: int) -> Optional[Post]:
    try:
        post = (
            Post.objects.select_related("author", "platform", "model", "category").get(id=post_id)
        )
    except Post.DoesNotExist:
        return None

    with transaction.atomic():
        Post.objects.filter(id=post_id).update(view_count=F("view_count") + 1)
        post.refresh_from_db()

    return post


def build_user_posts_page(
    request,
    base_queryset,
    sort_param_name: str = "sort",
    default_sort: str = "latest",
    order_field_latest: str = "-created_at",
):
    page = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 10)
    search = request.GET.get("search", "")
    search_type = request.GET.get("search_type", "title")
    sort_by = request.GET.get(sort_param_name, default_sort)

    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 100)
    except (ValueError, TypeError):
        page = 1
        page_size = 10

    queryset = base_queryset

    if sort_by == "latest":
        queryset = queryset.order_by(order_field_latest)
    elif sort_by == "oldest":
        queryset = queryset.order_by(order_field_latest.replace("-", ""))
    else:
        queryset = SortManager.sort_posts(queryset, sort_by)

    if search:
        queryset = SearchManager.search_posts(queryset, search, search_type)

    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        queryset = queryset.prefetch_related(
            Prefetch(
                "interactions",
                queryset=PostInteraction.objects.filter(user=user),
            )
        )

    paginator = Paginator(queryset, page_size)
    try:
        posts_page = paginator.page(page)
    except PageNotAnInteger:
        posts_page = paginator.page(1)
    except EmptyPage:
        posts_page = paginator.page(paginator.num_pages)

    return posts_page, paginator
