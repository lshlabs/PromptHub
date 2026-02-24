"""
게시글 도메인 서비스

- 게시글의 쿼리 구성, 필터링, 정렬, 페이지네이션을 캡슐화
- 뷰는 HTTP 처리에만 집중하도록 유지

주의사항
- 이 파일의 함수들은 HttpResponse/JsonResponse를 반환하면 안 됩니다.
  뷰에서 직렬화할 순수 Python 객체(querysets, models, tuples)만 반환해야 합니다.
"""

from __future__ import annotations

from typing import Tuple, Optional

from django.db import transaction
from django.db.models import F
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Prefetch
from rest_framework.authtoken.models import Token

from core.filters import PostFilter
from core.search import SearchManager
from core.sorting import SortManager
from posts.models import Post, PostInteraction


def attach_user_from_token(request) -> None:
    """
    Authorization: Token <key> 헤더가 있을 때 인증된 사용자를 request에 연결합니다.
    토큰이 유효하지 않으면 조용히 익명 사용자로 처리합니다.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Token "):
        return
    token_key = auth_header.split(" ")[1]
    try:
        token = Token.objects.get(key=token_key)
        request.user = token.user
    except Token.DoesNotExist:
        # 익명 사용자로 유지
        pass


def build_posts_page(request) -> Tuple:
    """
    필터링/정렬된 쿼리셋을 구성하고 현재 페이지와 페이지네이터를 반환합니다.

    지원하는 쿼리 파라미터 (기존 뷰와 동일):
    - page, page_size, search, categories, platforms, models, exclude_id, sort_by
    """
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

    # select_related: 외래키 관계를 한 번의 쿼리로 가져와서 성능 최적화
    queryset = Post.objects.select_related("author", "platform", "model", "category")

    # django-filter를 사용한 필터링 (카테고리, 모델 등)
    filterset = PostFilter(request.GET, queryset=queryset)
    if filterset.is_valid():
        queryset = filterset.qs

    # 정렬 적용 - SortManager 사용
    if sort_by in ("rating", "satisfaction"):
        sort_by = "satisfaction"  # rating을 satisfaction으로 매핑 (하위 호환성)
    queryset = SortManager.sort_posts(queryset, sort_by)

    # 검색어가 있으면 SearchManager를 사용하여 검색
    if search:
        queryset = SearchManager.search_posts(queryset, search, search_type)

    if exclude_id:
        try:
            exclude_id_int = int(exclude_id)
            queryset = queryset.exclude(id=exclude_id_int)
        except (ValueError, TypeError):
            pass

    # 인증된 사용자의 상호작용 데이터 접근 최적화 (N+1 쿼리 방지)
    # N+1 문제: 게시글마다 개별적으로 좋아요/북마크 상태를 조회하는 것을 방지
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        # 한 번의 쿼리로 모든 상호작용 데이터를 미리 가져옴
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
    게시글을 조회하고 조회수를 원자적으로 증가시킵니다.
    게시글을 찾을 수 없으면 None을 반환합니다.
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
    사용자 범위 게시글 목록(좋아요, 북마크, 내 게시글)을 위한
    공통 페이지네이션/정렬/검색 헬퍼 함수입니다.
    """
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

    # 정렬 적용 - 사용자별 특수 정렬 필드 고려
    if sort_by == "latest":
        queryset = queryset.order_by(order_field_latest)
    elif sort_by == "oldest":
        queryset = queryset.order_by(order_field_latest.replace("-", ""))
    else:
        # 기본 정렬은 SortManager 사용 (popular, views, satisfaction)
        queryset = SortManager.sort_posts(queryset, sort_by)

    if search:
        queryset = SearchManager.search_posts(queryset, search, search_type)

    # 현재 사용자의 상호작용 데이터 미리 가져오기 최적화
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

