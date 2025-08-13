from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .pagination import PostPagination
from .filters import PostFilter
from .search import SearchManager
from .sorting import SortManager
from posts.models import Post
from .services import TrendingService


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_posts(request):
    """
    통합 검색 API
    검색 → 필터 → 정렬 → 페이지네이션 순서로 유기적 연동
    """
    # 1. 기본 쿼리셋 (모든 게시글)
    queryset = Post.objects.select_related('author', 'platform', 'model', 'category').all()
    
    # 2. 검색 적용
    query = request.GET.get('q', '')
    search_type = request.GET.get('search_type', 'all')
    
    if query:
        queryset = SearchManager.search_posts(
            queryset=queryset,
            query=query,
            search_type=search_type
        )
    
    # 3. 필터 적용 (플랫폼, 모델, 카테고리)
    categories = request.GET.get('categories', '')
    platforms = request.GET.get('platforms', '')
    models = request.GET.get('models', '')
    
    if categories:
        category_ids = [id.strip() for id in categories.split(',') if id.strip()]
        if category_ids:
            queryset = queryset.filter(category_id__in=category_ids)
    
    if platforms:
        platform_ids = [id.strip() for id in platforms.split(',') if id.strip()]
        if platform_ids:
            queryset = queryset.filter(platform_id__in=platform_ids)
    
    if models:
        model_ids = [id.strip() for id in models.split(',') if id.strip()]
        if model_ids:
            queryset = queryset.filter(model_id__in=model_ids)
    
    # 4. 정렬 적용
    sort_by = request.GET.get('sort', 'latest')
    queryset = SortManager.sort_posts(queryset, sort_by)
    
    # 5. 페이지네이션 적용
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
    """
    사용 가능한 정렬 옵션 반환
    """
    options = SortManager.get_sort_options()
    return Response({
        'sort_options': options,
        'default': 'latest'
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_filter_options(request):
    """
    사용 가능한 필터 옵션 반환
    기존 프론트엔드 필터 UI에 맞춰 수정 (플랫폼, 모델, 카테고리만)
    """
    from posts.models import Platform, Category, Model
    
    # 플랫폼 목록
    platforms = Platform.objects.values('id', 'name').order_by('id')
    
    # 카테고리 목록
    categories = Category.objects.values('id', 'name').order_by('id')
    
    # 모델 목록 (플랫폼별로 그룹화)
    models = Model.objects.select_related('platform').values(
        'id', 'name', 'platform__id', 'platform__name'
    ).order_by('platform__id', 'id')
    
    # 플랫폼별 모델 그룹화
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
    """
    트렌딩 카테고리 랭킹 데이터 반환
    TrendingService를 통해 캐싱 및 비즈니스 로직 처리
    """
    result = TrendingService.get_category_rankings()
    
    if result['status'] == 'error':
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(result)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # 개발 중에만 허용, 나중에 관리자 권한으로 변경
def refresh_trending_cache(request):
    """
    트렌딩 캐시 강제 새로고침 (관리자용)
    TrendingService를 통해 캐시 관리
    """
    result = TrendingService.refresh_cache()
    
    if result['status'] == 'error':
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(result)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_trending_model_posts(request, model_name):
    """
    특정 트렌딩 모델과 관련된 게시글 목록 반환
    
    Args:
        model_name: 트렌딩 모델명 (예: 'GPT-5')
    
    Query Parameters:
        - page: 페이지 번호 (기본값: 1)
        - page_size: 페이지 크기 (기본값: 20)
        - sort: 정렬 방식 (기본값: 'latest')
    """
    try:
        # 트렌딩 모델 정보 조회
        model_info = TrendingService.get_trending_model_info(model_name)
        if not model_info:
            return Response({
                'error': '해당 트렌딩 모델을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 관련 게시글 조회
        posts_queryset = TrendingService.get_related_posts_by_model_name(model_name)
        
        # 정렬 적용
        sort_by = request.GET.get('sort', 'latest')
        posts_queryset = SortManager.sort_posts(posts_queryset, sort_by)
        
        # 페이지네이션 적용
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts_queryset, request)
        
        if page is not None:
            from posts.serializers import PostCardSerializer
            serializer = PostCardSerializer(page, many=True, context={'request': request})
            
            response_data = paginator.get_paginated_response(serializer.data).data
            # 트렌딩 모델 정보 추가
            response_data['trending_model'] = model_info
            
            return Response(response_data)
        
        return Response({'error': '페이지네이션 오류'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'error': f'트렌딩 모델 게시글 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_trending_model_info(request, model_name):
    """
    특정 트렌딩 모델의 상세 정보 반환
    
    Args:
        model_name: 트렌딩 모델명
    """
    try:
        model_info = TrendingService.get_trending_model_info(model_name)
        
        if model_info:
            return Response({
                'status': 'success',
                'data': model_info
            })
        else:
            return Response({
                'status': 'error',
                'message': '해당 트렌딩 모델을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'트렌딩 모델 정보 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
