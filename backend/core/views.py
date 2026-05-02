import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .pagination import PostPagination
from .filters import PostFilter
from .search import SearchManager
from .sorting import SortManager
from posts.models import Post
from posts.services.post_service import annotate_viewer_interaction_flags
from .services import TrendingService, TrendingServiceError
from django.core.exceptions import ValidationError
from django.db import DatabaseError

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_posts(request):
    queryset = Post.objects.select_related('author', 'platform', 'model', 'category').all()
    queryset = annotate_viewer_interaction_flags(queryset, getattr(request, "user", None))

    query = request.GET.get('q', '')
    search_type = request.GET.get('search_type', 'all')

    if query:
        queryset = SearchManager.search_posts(
            queryset=queryset,
            query=query,
            search_type=search_type,
        )

    filterset = PostFilter(request.GET, queryset=queryset)
    if filterset.is_valid():
        queryset = filterset.qs

    sort_by = request.GET.get('sort', 'latest')
    queryset = SortManager.sort_posts(queryset, sort_by)

    paginator = PostPagination()
    page = paginator.paginate_queryset(queryset, request)

    if page is not None:
        from posts.serializers import PostCardSerializer
        serializer = PostCardSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    return Response({'error': '페이지네이션 오류'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_sort_options(request):
    options = SortManager.get_sort_options()
    return Response({
        'sort_options': options,
        'default': 'latest'
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_filter_options(request):
    from posts.models import Platform, Category, AiModel

    platforms = Platform.objects.values('id', 'name').order_by('id')
    categories = Category.objects.values('id', 'name').order_by('id')
    models = AiModel.objects.select_related('platform').values(
        'id', 'name', 'platform__id', 'platform__name'
    ).order_by('platform__id', 'id')

    models_by_platform = {}
    for model in models:
        platform_name = model['platform__name']
        if platform_name not in models_by_platform:
            models_by_platform[platform_name] = []
        models_by_platform[platform_name].append({
            'id': model['id'],
            'name': model['name'],
            'platform_id': model['platform__id'],
            'platform_name': platform_name
        })
    
    return Response({
        'platforms': list(platforms),
        'categories': list(categories),
        'models_by_platform': models_by_platform
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_category_rankings(request):
    result = TrendingService.get_category_rankings()
    if result['status'] == 'error':
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(result)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def refresh_trending_cache(request):
    result = TrendingService.refresh_cache()
    if result['status'] == 'error':
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(result)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_trending_model_posts(request, model_name):
    try:
        model_info = TrendingService.get_trending_model_info(model_name)
        if not model_info:
            return Response({
                'error': '해당 트렌딩 모델을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)

        posts_queryset = TrendingService.get_related_posts_by_model_name(model_name)
        posts_queryset = annotate_viewer_interaction_flags(posts_queryset, getattr(request, "user", None))
        sort_by = request.GET.get('sort', 'latest')
        posts_queryset = SortManager.sort_posts(posts_queryset, sort_by)

        paginator = PostPagination()
        page = paginator.paginate_queryset(posts_queryset, request)

        if page is not None:
            from posts.serializers import PostCardSerializer
            serializer = PostCardSerializer(page, many=True, context={'request': request})
            response_data = paginator.get_paginated_response(serializer.data).data
            response_data['trending_model'] = model_info
            return Response(response_data)

        return Response({'error': '페이지네이션 오류'}, status=status.HTTP_400_BAD_REQUEST)
    except (TrendingServiceError, DatabaseError, ValidationError):
        logger.exception("Trending model posts fetch failed for model_name=%s", model_name)
        return Response({
            'error': '트렌딩 모델 게시글 조회 중 서버 오류가 발생했습니다.',
            'error_code': 'TRENDING_MODEL_POSTS_FAILED',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_trending_model_info(request, model_name):
    try:
        model_info = TrendingService.get_trending_model_info(model_name)
        if model_info:
            return Response({
                'status': 'success',
                'data': model_info
            })
        return Response({
            'status': 'error',
            'message': '해당 트렌딩 모델을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except (TrendingServiceError, DatabaseError):
        logger.exception("Trending model info fetch failed for model_name=%s", model_name)
        return Response({
            'status': 'error',
            'message': '트렌딩 모델 정보 조회 중 서버 오류가 발생했습니다.',
            'error_code': 'TRENDING_MODEL_INFO_FAILED',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
