"""
Post domain services

- Encapsulate query building, filtering, sorting and pagination for posts
- Keep views thin and focused on HTTP concerns only

Notes
- Functions here MUST NOT return HttpResponse/JsonResponse. They return
  plain Python objects (querysets, models, tuples) that views serialize.
"""

from __future__ import annotations

from typing import Tuple, Optional

from django.db import transaction
from django.db.models import Q, F, Case, When, Value, IntegerField
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Prefetch
from rest_framework.authtoken.models import Token

from core.filters import PostFilter
from posts.models import Post, PostInteraction


def attach_user_from_token(request) -> None:
    """
    Attach authenticated user to request when Authorization: Token <key> exists.
    Silently falls back to anonymous if invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Token "):
        return
    token_key = auth_header.split(" ")[1]
    try:
        token = Token.objects.get(key=token_key)
        request.user = token.user
    except Token.DoesNotExist:
        # Keep anonymous
        pass


def build_posts_page(request) -> Tuple:
    """
    Build filtered/sorted queryset and return current page + paginator.

    Query params accepted (same as existing view):
    - page, page_size, search, categories, platforms, models, exclude_id, sort_by
    """
    page = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 10)
    search = request.GET.get("search", "")
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

    if sort_by == "latest":
        queryset = queryset.order_by("-created_at")
    elif sort_by == "oldest":
        queryset = queryset.order_by("created_at")
    elif sort_by == "popular":
        queryset = queryset.order_by("-like_count")
    elif sort_by in ("rating", "satisfaction"):
        try:
            queryset = queryset.order_by(F("satisfaction").desc(nulls_last=True), "-created_at")
        except Exception:
            queryset = queryset.order_by("-satisfaction", "-created_at")
    elif sort_by == "views":
        queryset = queryset.order_by("-view_count")
    else:
        queryset = queryset.order_by("-created_at")

    if search:
        queryset = queryset.filter(
            Q(title__icontains=search)
            | Q(prompt__icontains=search)
            | Q(ai_response__icontains=search)
            | Q(tags__icontains=search)
        )

    if exclude_id:
        try:
            exclude_id_int = int(exclude_id)
            queryset = queryset.exclude(id=exclude_id_int)
        except (ValueError, TypeError):
            pass

    # Optimize interactions access for authenticated user to avoid N+1
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
    """
    Fetch a Post and atomically increment its view count.
    Returns None when not found.
    """
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
    """
    Common pagination/sorting/search helper for user-scoped post lists
    (liked, bookmarked, my posts).
    """
    page = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 20)
    search = request.GET.get("search", "")
    sort_by = request.GET.get(sort_param_name, default_sort)

    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 100)
    except (ValueError, TypeError):
        page = 1
        page_size = 20

    queryset = base_queryset

    if sort_by == "latest":
        queryset = queryset.order_by(order_field_latest)
    elif sort_by == "oldest":
        queryset = queryset.order_by(order_field_latest.replace("-", ""))
    elif sort_by == "popular":
        queryset = queryset.order_by("-like_count")
    elif sort_by == "views":
        queryset = queryset.order_by("-view_count")
    else:
        queryset = queryset.order_by(order_field_latest)

    if search:
        queryset = queryset.filter(
            Q(title__icontains=search)
            | Q(prompt__icontains=search)
            | Q(ai_response__icontains=search)
            | Q(tags__icontains=search)
        )

    # Optimize interactions prefetch for current user
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


