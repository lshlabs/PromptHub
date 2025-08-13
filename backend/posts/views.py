from django.http import JsonResponse
from django.db import transaction
from django.db.models import Q, Count, F, Case, When, Value, IntegerField
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.authtoken.models import Token
import json
 

from .models import Platform, AiModel, Category, Post, PostInteraction
from .serializers import (
    PlatformSerializer, ModelSerializer, CategorySerializer,
    PostCardSerializer, PostDetailSerializer, PostCreateSerializer, PostEditSerializer,
    TagSerializer, PostInteractionSerializer
)
from core.filters import PostFilter
from posts.services.post_service import (
    attach_user_from_token,
    build_posts_page,
    get_post_and_increment_views,
    build_user_posts_page,
)

User = get_user_model()


from core.utils.auth import token_required


# ========================
# 메타데이터 API
# ========================

def platforms_list(request):
    """
    플랫폼 목록을 조회합니다.
    
    모든 AI 플랫폼의 목록을 이름 순으로 정렬하여 반환합니다.
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 플랫폼 목록 데이터
    """
    """플랫폼 목록 조회"""
    platforms = Platform.objects.all().order_by('name')
    serializer = PlatformSerializer(platforms, many=True)
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


def models_list(request):
    """
    AI 모델 목록을 조회합니다.
    
    platform_id 파라미터가 있으면 해당 플랫폼의 모델만 반환하고,
    없으면 모든 모델을 반환합니다.
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 모델 목록 데이터 또는 오류 메시지
    """
    """모델 목록 조회"""
    platform_id = request.GET.get('platform_id')

    if platform_id:
        try:
            platform_id = int(platform_id)
            qs = AiModel.objects.filter(platform_id=platform_id).select_related('platform')
        except (ValueError, TypeError):
            return JsonResponse({
                'status': 'error',
                'message': '유효하지 않은 플랫폼 ID입니다.'
            }, status=400)
    else:
        qs = AiModel.objects.all().select_related('platform')

    # 정렬 규칙: sort_order=0은 가장 뒤로 배치 (컬럼 미존재 환경 대비 안전 처리)
    try:
        qs = qs.annotate(
            sort_key=Case(
                When(sort_order=0, then=Value(999999)),
                default=F('sort_order'),
                output_field=IntegerField(),
            )
        ).order_by('platform__name', 'sort_key', 'name')
    except Exception:
        # 마이그레이션이 적용되지 않았거나 컬럼이 없을 때의 안전한 폴백
        qs = qs.order_by('platform__name', 'name')
    serializer = ModelSerializer(qs, many=True)
    
    # 기본값 정보 추가 (첫 번째 모델을 기본값으로 설정)
    default_model = None
    if qs.exists():
        first = qs.first()
        default_model = {
            'id': first.id,
            'name': first.name,
            'platform': first.platform.id,
            'platform_name': first.platform.name
        }
    
    return JsonResponse({
        'status': 'success',
        'data': serializer.data,
        'default_model': default_model
    })


def platform_models_with_default(request, platform_id):
    """
    특정 플랫폼의 모델 목록과 기본값을 조회합니다.
    
    플랫폼 ID를 받아서 해당 플랫폼의 모든 모델 목록과
    첫 번째 모델을 기본값으로 반환합니다.
    
    Args:
        request: HTTP 요청 객체
        platform_id: 플랫폼 ID
        
    Returns:
        JsonResponse: 모델 목록과 기본값 데이터
    """
    try:
        platform_id = int(platform_id)
        platform = Platform.objects.get(id=platform_id)
    except (ValueError, TypeError, Platform.DoesNotExist):
        return JsonResponse({
            'status': 'error',
            'message': '유효하지 않은 플랫폼 ID입니다.'
        }, status=400)
    
    # 해당 플랫폼의 모델 목록 조회 (sort_order=0은 마지막, 컬럼 미존재 환경 대비)
    try:
        qs = AiModel.objects.filter(platform_id=platform_id).annotate(
            sort_key=Case(
                When(sort_order=0, then=Value(999999)),
                default=F('sort_order'),
                output_field=IntegerField(),
            )
        ).order_by('sort_key', 'name')
    except Exception:
        qs = AiModel.objects.filter(platform_id=platform_id).order_by('name')
    serializer = ModelSerializer(qs, many=True)
    
    # 기본값 설정 (첫 번째 모델)
    default_model = None
    if qs.exists():
        first_model = qs.first()
        default_model = {
            'id': first_model.id,
            'name': first_model.name,
            'platform': first_model.platform.id,
            'platform_name': first_model.platform.name
        }
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'platform': {
                'id': platform.id,
                'name': platform.name
            },
            'models': serializer.data,
            'default_model': default_model
        }
    })


def categories_list(request):
    """
    카테고리 목록을 조회합니다.
    
    모든 게시글 카테고리의 목록을 이름 순으로 정렬하여 반환합니다.
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 카테고리 목록 데이터
    """
    """카테고리 목록 조회"""
    categories = Category.objects.all().order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


def tags_list(request):
    """
    태그 목록을 사용 횟수와 함께 조회합니다.
    
    모든 게시글에서 태그를 수집하고 사용 횟수를 계산하여
    사용 횟수 내림차순으로 정렬하여 반환합니다.
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 태그 목록과 사용 횟수 데이터
    """
    """태그 목록 조회"""
    # 모든 게시글에서 태그 수집
    posts_with_tags = Post.objects.exclude(tags='').values_list('tags', flat=True)
    
    tag_counts = {}
    for tags_str in posts_with_tags:
        if tags_str:
            tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # 태그를 사용 횟수 순으로 정렬
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    
    # 시리얼라이즈
    tag_data = [{'name': tag, 'count': count} for tag, count in sorted_tags]
    
    return JsonResponse({
        'status': 'success',
        'data': tag_data
    })


# ========================
# 게시글 CRUD API
# ========================

def posts_list(request):
    """
    게시글 목록을 조회합니다.
    
    django-filters를 사용하여 필터링을 처리하고 프론트엔드 FilterPanel과 연동됩니다.
    인증된 사용자의 경우 좋아요 상태도 포함합니다.
    
    지원되는 쿼리 파라미터:
    - page: 페이지 번호
    - page_size: 페이지당 게시글 수
    - search: 검색어 (제목, 프롬프트, AI 응답, 태그)
    - categories: 카테고리 ID 필터 (쉼표로 구분)
    - platforms: 플랫폼 ID 필터 (쉼표로 구분)  
    - models: 모델 ID 필터 (쉼표로 구분)
    - exclude_id: 제외할 게시글 ID
    - sort_by: 정렬 기준 (latest, oldest, popular, satisfaction, views)
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 게시글 목록과 페이지네이션 데이터
    """
    # 토큰 인증 처리 (선택적)
    attach_user_from_token(request)
    
    posts_page, paginator = build_posts_page(request)
    
    # 시리얼라이즈
    serializer = PostCardSerializer(
        posts_page, 
        many=True, 
        context={'request': request}
    )
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'results': serializer.data,
            'pagination': {
                'current_page': posts_page.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': posts_page.has_next(),
                'has_previous': posts_page.has_previous(),
            }
        }
    })


def post_detail(request, post_id):
    """
    게시글 상세 내용을 조회합니다.
    
    게시글 조회 시 조회수를 자동으로 1 증가시킵니다.
    인증된 사용자의 경우 좋아요/북마크 상태도 포함합니다.
    
    Args:
        request: HTTP 요청 객체
        post_id: 조회할 게시글 ID
        
    Returns:
        JsonResponse: 게시글 상세 데이터 또는 404 오류
    """
    """게시글 상세 조회"""
    # 토큰 인증 처리 (선택적)
    attach_user_from_token(request)

    post = get_post_and_increment_views(post_id)
    if not post:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    # 시리얼라이즈
    serializer = PostDetailSerializer(post, context={'request': request})
    
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_create(request):
    """
    새로운 게시글을 생성합니다.
    
    인증된 사용자만 게시글을 생성할 수 있습니다.
    JSON 데이터를 받아 유효성 검사 후 게시글을 생성합니다.
    
    Args:
        request: HTTP POST 요청 객체
        
    Returns:
        JsonResponse: 생성된 게시글 데이터 또는 오류 메시지
    """
    """게시글 생성"""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': '유효하지 않은 JSON 데이터입니다.'
        }, status=400)
    
    # 시리얼라이저로 유효성 검사 및 생성
    serializer = PostCreateSerializer(
        data=data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            post = serializer.save()
            
            # 생성된 게시글 상세 정보 반환
            detail_serializer = PostDetailSerializer(
                post, 
                context={'request': request}
            )
            
            return JsonResponse({
                'status': 'success',
                'message': '게시글이 성공적으로 생성되었습니다.',
                'data': detail_serializer.data
            }, status=201)
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'게시글 생성 중 오류가 발생했습니다: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({
            'status': 'error',
            'message': '유효성 검사 실패',
            'errors': serializer.errors
        }, status=400)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
@token_required
def post_update(request, post_id):
    """
    게시글을 수정합니다.
    
    인증된 사용자가 자신의 게시글만 수정할 수 있습니다.
    JSON 데이터를 받아 유효성 검사 후 게시글을 수정합니다.
    
    Args:
        request: HTTP PUT/PATCH 요청 객체
        post_id: 수정할 게시글 ID
        
    Returns:
        JsonResponse: 수정된 게시글 데이터 또는 오류 메시지
    """
    try:
        post = Post.objects.select_related(
            'author', 'platform', 'model', 'category'
        ).get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    # 작성자 권한 확인
    if post.author != request.user:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 수정할 권한이 없습니다.'
        }, status=403)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': '유효하지 않은 JSON 데이터입니다.'
        }, status=400)
    
    # 부분 업데이트 (PATCH) 또는 전체 업데이트 (PUT)
    partial = request.method == 'PATCH'
    
    # 시리얼라이저로 유효성 검사 및 수정
    serializer = PostEditSerializer(
        post,
        data=data, 
        partial=partial,
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            updated_post = serializer.save()
            
            # 수정된 게시글 상세 정보 반환
            detail_serializer = PostDetailSerializer(
                updated_post, 
                context={'request': request}
            )
            
            return JsonResponse({
                'status': 'success',
                'message': '게시글이 성공적으로 수정되었습니다.',
                'data': detail_serializer.data
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'게시글 수정 중 오류가 발생했습니다: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({
            'status': 'error',
            'message': '유효성 검사 실패',
            'errors': serializer.errors
        }, status=400)


# ========================
# 상호작용 API
# ========================

@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_like(request, post_id):
    """
    게시글 좋아요 상태를 토글합니다.
    
    인증된 사용자만 좋아요를 누를 수 있으며,
    자신의 게시글에는 좋아요를 누륿 수 없습니다.
    
    Args:
        request: HTTP POST 요청 객체
        post_id: 좋아요를 누륿 게시글 ID
        
    Returns:
        JsonResponse: 좋아요 상태와 좋아요 수 데이터
    """
    """게시글 좋아요 토글"""
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    # 자신의 게시글에는 좋아요 불가
    if post.author == request.user:
        return JsonResponse({
            'status': 'success',
            'message': '자신의 게시글에는 좋아요를 누를 수 없습니다.',
            'data': {
                'is_liked': False,
                'like_count': post.like_count
            }
        })
    
    # 상호작용 가져오기 또는 생성
    interaction, created = PostInteraction.objects.get_or_create(
        user=request.user,
        post=post,
        defaults={'is_liked': False, 'is_bookmarked': False}
    )
    
    # 좋아요 상태 토글
    interaction.is_liked = not interaction.is_liked
    interaction.save()
    
    # 최신 게시글 정보 가져오기
    post.refresh_from_db()
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'is_liked': interaction.is_liked,
            'like_count': post.like_count
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_bookmark(request, post_id):
    """
    게시글 북마크 상태를 토글합니다.
    
    인증된 사용자만 북마크를 할 수 있으며,
    자신의 게시글에는 북마크를 할 수 없습니다.
    
    Args:
        request: HTTP POST 요청 객체
        post_id: 북마크할 게시글 ID
        
    Returns:
        JsonResponse: 북마크 상태와 북마크 수 데이터
    """
    """게시글 북마크 토글"""
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    # 자신의 게시글에는 북마크 불가
    if post.author == request.user:
        return JsonResponse({
            'status': 'success',
            'message': '자신의 게시글에는 북마크를 할 수 없습니다.',
            'data': {
                'is_bookmarked': False,
                'bookmark_count': post.bookmark_count
            }
        })
    
    # 상호작용 가져오기 또는 생성
    interaction, created = PostInteraction.objects.get_or_create(
        user=request.user,
        post=post,
        defaults={'is_liked': False, 'is_bookmarked': False}
    )
    
    # 북마크 상태 토글
    interaction.is_bookmarked = not interaction.is_bookmarked
    interaction.save()
    
    # 최신 게시글 정보 가져오기
    post.refresh_from_db()
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'is_bookmarked': interaction.is_bookmarked,
            'bookmark_count': post.bookmark_count
        }
    })


# ========================
# 사용자별 게시글 조회 API
# ========================

@token_required
def user_liked_posts(request):
    """
    사용자가 좋아요한 게시글 목록을 조회합니다.
    
    인증된 사용자의 좋아요한 게시글을 페이지네이션과 필터링을 지원하여 반환합니다.
    기본적으로 최신순으로 정렬됩니다.
    
    지원되는 쿼리 파라미터:
    - page: 페이지 번호
    - page_size: 페이지당 게시글 수
    - search: 검색어 (제목, 프롬프트, AI 응답, 태그)
    - category: 카테고리 필터
    - platform: 플랫폼 필터
    - sort: 정렬 기준 (latest, oldest, popular, views)
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 좋아요한 게시글 목록과 페이지네이션 데이터
    """
    # 쿼리 파라미터 파싱
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    platform = request.GET.get('platform', '')
    sort_by = request.GET.get('sort', 'latest')
    
    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 100)  # 최대 100개로 제한
    except (ValueError, TypeError):
        page = 1
        page_size = 20
    
    base_queryset = Post.objects.select_related('author', 'platform', 'model', 'category').filter(
        interactions__user=request.user,
        interactions__is_liked=True,
    )
    posts_page, paginator = build_user_posts_page(
        request,
        base_queryset,
        sort_param_name='sort',
        default_sort='latest',
        order_field_latest='-interactions__updated_at',
    )
    
    # 시리얼라이즈
    serializer = PostCardSerializer(
        posts_page, 
        many=True, 
        context={'request': request}
    )
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'results': serializer.data,
            'pagination': {
                'current_page': posts_page.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': posts_page.has_next(),
                'has_previous': posts_page.has_previous(),
            }
        }
    })


@token_required
def user_bookmarked_posts(request):
    """
    사용자가 북마크한 게시글 목록을 조회합니다.
    
    인증된 사용자의 북마크한 게시글을 페이지네이션과 필터링을 지원하여 반환합니다.
    기본적으로 최신순으로 정렬됩니다.
    
    지원되는 쿼리 파라미터:
    - page: 페이지 번호
    - page_size: 페이지당 게시글 수
    - search: 검색어 (제목, 프롬프트, AI 응답, 태그)
    - category: 카테고리 필터
    - platform: 플랫폼 필터
    - sort: 정렬 기준 (latest, oldest, popular, views)
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 북마크한 게시글 목록과 페이지네이션 데이터
    """
    # 쿼리 파라미터 파싱
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    platform = request.GET.get('platform', '')
    sort_by = request.GET.get('sort', 'latest')
    
    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 100)  # 최대 100개로 제한
    except (ValueError, TypeError):
        page = 1
        page_size = 20
    
    base_queryset = Post.objects.select_related('author', 'platform', 'model', 'category').filter(
        interactions__user=request.user,
        interactions__is_bookmarked=True,
    )
    posts_page, paginator = build_user_posts_page(
        request,
        base_queryset,
        sort_param_name='sort',
        default_sort='latest',
        order_field_latest='-interactions__updated_at',
    )
    
    # 시리얼라이즈
    serializer = PostCardSerializer(
        posts_page, 
        many=True, 
        context={'request': request}
    )
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'results': serializer.data,
            'pagination': {
                'current_page': posts_page.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': posts_page.has_next(),
                'has_previous': posts_page.has_previous(),
            }
        }
    })


@token_required
def user_my_posts(request):
    """
    사용자가 작성한 게시글 목록을 조회합니다.
    
    인증된 사용자가 작성한 게시글을 페이지네이션과 필터링을 지원하여 반환합니다.
    기본적으로 최신순으로 정렬됩니다.
    
    지원되는 쿼리 파라미터:
    - page: 페이지 번호
    - page_size: 페이지당 게시글 수
    - search: 검색어 (제목, 프롬프트, AI 응답, 태그)
    - category: 카테고리 필터
    - platform: 플랫폼 필터
    - sort: 정렬 기준 (latest, oldest, popular, views)
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 사용자가 작성한 게시글 목록과 페이지네이션 데이터
    """
    # 쿼리 파라미터 파싱
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    platform = request.GET.get('platform', '')
    sort_by = request.GET.get('sort', 'latest')
    
    try:
        page = int(page)
        page_size = int(page_size)
        page_size = min(page_size, 100)  # 최대 100개로 제한
    except (ValueError, TypeError):
        page = 1
        page_size = 20
    
    base_queryset = Post.objects.select_related('author', 'platform', 'model', 'category').filter(
        author=request.user,
    )
    posts_page, paginator = build_user_posts_page(
        request,
        base_queryset,
        sort_param_name='sort',
        default_sort='latest',
        order_field_latest='-created_at',
    )
    
    # 시리얼라이즈
    serializer = PostCardSerializer(
        posts_page, 
        many=True, 
        context={'request': request}
    )
    
    return JsonResponse({
        'status': 'success',
        'data': {
            'results': serializer.data,
            'pagination': {
                'current_page': posts_page.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': posts_page.has_next(),
                'has_previous': posts_page.has_previous(),
            }
        }
    })


# ========================
# 게시글 삭제 API
# ========================

@csrf_exempt
@require_http_methods(["DELETE"])
@token_required
def post_delete(request, post_id):
    """
    게시글을 삭제합니다.
    
    인증된 사용자가 자신의 게시글만 삭제할 수 있습니다.
    게시글과 관련된 모든 상호작용 데이터도 함께 삭제됩니다.
    
    Args:
        request: HTTP DELETE 요청 객체
        post_id: 삭제할 게시글 ID
        
    Returns:
        JsonResponse: 삭제 성공 메시지 또는 오류 메시지
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    # 작성자 권한 확인
    if post.author != request.user:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 삭제할 권한이 없습니다.'
        }, status=403)
    
    try:
        with transaction.atomic():
            # 게시글 삭제 (관련 상호작용들도 CASCADE로 자동 삭제됨)
            post_title = post.title
            post.delete()
            
        return JsonResponse({
            'status': 'success',
            'message': f'게시글 "{post_title}"이(가) 성공적으로 삭제되었습니다.'
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'게시글 삭제 중 오류가 발생했습니다: {str(e)}'
        }, status=500)


 


@csrf_exempt
@require_http_methods(["GET"])
def models_suggest(request):
    """
    간단하고 직관적인 모델 검색 API.
    - 모델명/모델 slug/플랫폼명/플랫폼 slug에 대해 부분 일치 검색
    - startswith 우선, 그 다음 contains 우선

    Query Parameters:
        - query (str, required): 검색어
        - platform_id (int, optional): 특정 플랫폼 ID로 제한
        - limit (int, optional): 결과 개수 (기본 10, 최대 50)

    Returns:
        JsonResponse: [{ id, name, slug, platform: { id, name, slug } }]
    """
    try:
        query_raw = request.GET.get('query', '')
        query = query_raw.strip()
        platform_id = request.GET.get('platform_id')
        limit = min(max(int(request.GET.get('limit', 10)), 1), 50)

        if not query:
            return JsonResponse({
                'status': 'error',
                'message': '검색어를 입력해주세요.'
            }, status=400)

        q_lower = query.lower()

        # 기본 쿼리셋 (활성 모델/플랫폼 우선)
        qs = AiModel.objects.select_related('platform').filter(
            is_active=True, platform__is_active=True
        )

        # 플랫폼 ID 제한
        if platform_id:
            try:
                qs = qs.filter(platform_id=int(platform_id))
            except (ValueError, TypeError):
                return JsonResponse({
                    'status': 'error',
                    'message': '유효하지 않은 플랫폼 ID입니다.'
                }, status=400)

        # 간단한 후보군 1차 필터 (DB 레벨 icontains)
        qs = qs.filter(
            Q(name__icontains=query) |
            Q(slug__icontains=q_lower) |
            Q(platform__name__icontains=query) |
            Q(platform__slug__icontains=q_lower)
        )

        # 파이썬 레벨에서 스코어 계산: startswith > contains
        def compute_score(m: AiModel) -> float:
            name = m.name or ''
            slug = m.slug or ''
            p_name = m.platform.name or ''
            p_slug = m.platform.slug or ''
            nl = name.lower()
            sl = slug.lower()
            pnl = p_name.lower()
            psl = p_slug.lower()

            score = 0.0
            # startswith 가중치
            if nl.startswith(q_lower):
                score += 3.0
            if sl.startswith(q_lower):
                score += 2.5
            if pnl.startswith(q_lower):
                score += 2.0
            if psl.startswith(q_lower):
                score += 1.8
            # contains 가중치
            if q_lower in nl:
                score += 1.0
            if q_lower in sl:
                score += 0.8
            if q_lower in pnl:
                score += 0.7
            if q_lower in psl:
                score += 0.6
            return score

        # 결과 정렬: 점수 내림차순 → sort_order → name
        results = sorted(qs, key=lambda m: (-compute_score(m), m.sort_order, m.name.lower()))

        # 한도 적용
        results = results[:limit]

        suggestions = [
            {
                'id': m.id,
                'name': m.name,
                'slug': m.slug,
                'platform': {
                    'id': m.platform.id,
                    'name': m.platform.name,
                    'slug': m.platform.slug,
                }
            }
            for m in results
        ]

        return JsonResponse({
            'status': 'success',
            'data': {
                'query': query,
                'suggestions': suggestions,
                'total_count': len(suggestions),
            }
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'모델 검색에 실패했습니다: {str(e)}'
        }, status=500)