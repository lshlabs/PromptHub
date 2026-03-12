from django.http import JsonResponse
from django.db import transaction
from django.db.utils import DatabaseError
from django.db.models import F, Case, When, Value, IntegerField
from django.core.exceptions import FieldError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from collections import Counter
 

from .models import Platform, AiModel, Category, Post
from .serializers import (
    PlatformSerializer, ModelSerializer, CategorySerializer,
    PostCardSerializer, PostDetailSerializer, PostCreateSerializer, PostEditSerializer
)
from posts.services.post_service import (
    build_posts_page,
    get_post_and_increment_views,
    build_user_posts_page,
)
from posts.services import InteractionService, ModelSuggestService
from core.utils.auth import token_required, attach_authenticated_user


def _default_model_payload(model):
    if not model:
        return None
    return {
        'id': model.id,
        'name': model.name,
        'platform': model.platform.id,
        'platform_name': model.platform.name,
    }


def _paginated_posts_response(posts_page, paginator, request):
    serializer = PostCardSerializer(posts_page, many=True, context={'request': request})
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
            },
        },
    })


def platforms_list(request):
    platforms = Platform.objects.filter(is_active=True).order_by('name')
    serializer = PlatformSerializer(platforms, many=True)
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


def models_list(request):
    platform_id = request.GET.get('platform_id')
    if platform_id:
        try:
            platform_id = int(platform_id)
            qs = AiModel.objects.filter(
                platform_id=platform_id,
                is_active=True,
                is_deprecated=False,
                platform__is_active=True,
            ).select_related('platform')
        except (ValueError, TypeError):
            return JsonResponse({
                'status': 'error',
                'message': '유효하지 않은 플랫폼 ID입니다.'
            }, status=400)
    else:
        qs = AiModel.objects.filter(
            is_active=True,
            is_deprecated=False,
            platform__is_active=True,
        ).select_related('platform')

    models = sorted(
        qs,
        key=lambda model: (
            999999 if getattr(model, 'sort_order', 0) == 0 else getattr(model, 'sort_order', 0),
            model.platform.name.lower(),
            model.name.lower(),
        ),
    )
    serializer = ModelSerializer(models, many=True)
    default_model = _default_model_payload(models[0]) if models else None
    
    return JsonResponse({
        'status': 'success',
        'data': serializer.data,
        'default_model': default_model
    })


def platform_models_with_default(request, platform_id):
    try:
        platform_id = int(platform_id)
        platform = Platform.objects.get(id=platform_id, is_active=True)
    except (ValueError, TypeError, Platform.DoesNotExist):
        return JsonResponse({
            'status': 'error',
            'message': '유효하지 않은 플랫폼 ID입니다.'
        }, status=400)
    
    try:
        qs = AiModel.objects.filter(
            platform_id=platform_id,
            is_active=True,
            is_deprecated=False,
            platform__is_active=True,
        ).annotate(
            sort_key=Case(
                When(sort_order=0, then=Value(999999)),
                default=F('sort_order'),
                output_field=IntegerField(),
            )
        ).order_by('sort_key', 'name')
    except FieldError:
        qs = AiModel.objects.filter(
            platform_id=platform_id,
            is_active=True,
            is_deprecated=False,
            platform__is_active=True,
        ).order_by('name')
    serializer = ModelSerializer(qs, many=True)
    default_model = _default_model_payload(qs.first()) if qs.exists() else None
    
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
    categories = Category.objects.all().order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


def tags_list(request):
    tags_series = Post.objects.exclude(tags='').values_list('tags', flat=True)
    tag_counter = Counter(
        tag.strip()
        for tags_group in tags_series
        for tag in tags_group.split(',')
        if tag.strip()
    )
    tag_data = [{'name': tag, 'count': count} for tag, count in tag_counter.most_common()]
    
    return JsonResponse({
        'status': 'success',
        'data': tag_data
    })


def posts_list(request):
    attach_authenticated_user(request)
    posts_page, paginator = build_posts_page(request)
    return _paginated_posts_response(posts_page, paginator, request)


def post_detail(request, post_id):
    attach_authenticated_user(request)

    post = get_post_and_increment_views(post_id)
    if not post:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    serializer = PostDetailSerializer(post, context={'request': request})
    
    return JsonResponse({
        'status': 'success',
        'data': serializer.data
    })


@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_create(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': '유효하지 않은 JSON 데이터입니다.'
        }, status=400)
    
    serializer = PostCreateSerializer(data=data, context={'request': request})
    
    if serializer.is_valid():
        try:
            post = serializer.save()
            detail_serializer = PostDetailSerializer(post, context={'request': request})
            return JsonResponse({
                'status': 'success',
                'message': '게시글이 성공적으로 생성되었습니다.',
                'data': detail_serializer.data
            }, status=201)
            
        except (DatabaseError, ValueError, TypeError) as e:
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
    try:
        post = Post.objects.select_related('author', 'platform', 'model', 'category').get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
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
    
    partial = request.method == 'PATCH'
    serializer = PostEditSerializer(post, data=data, partial=partial, context={'request': request})
    
    if serializer.is_valid():
        try:
            updated_post = serializer.save()
            detail_serializer = PostDetailSerializer(updated_post, context={'request': request})
            return JsonResponse({
                'status': 'success',
                'message': '게시글이 성공적으로 수정되었습니다.',
                'data': detail_serializer.data
            })
            
        except (DatabaseError, ValueError, TypeError) as e:
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

@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_like(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    if post.author == request.user:
        return JsonResponse({
            'status': 'success',
            'message': '자신의 게시글에는 좋아요를 누를 수 없습니다.',
            'data': {
                'is_liked': False,
                'like_count': post.like_count
            }
        })
    
    like_result = InteractionService.toggle_like(request.user, post)
    
    return JsonResponse({
        'status': 'success',
        'data': like_result
    })


@csrf_exempt
@require_http_methods(["POST"])
@token_required
def post_bookmark(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    if post.author == request.user:
        return JsonResponse({
            'status': 'success',
            'message': '자신의 게시글에는 북마크를 할 수 없습니다.',
            'data': {
                'is_bookmarked': False,
                'bookmark_count': post.bookmark_count
            }
        })
    
    bookmark_result = InteractionService.toggle_bookmark(request.user, post)
    
    return JsonResponse({
        'status': 'success',
        'data': bookmark_result
    })

@token_required
def user_liked_posts(request):
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
    return _paginated_posts_response(posts_page, paginator, request)


@token_required
def user_bookmarked_posts(request):
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
    return _paginated_posts_response(posts_page, paginator, request)


@token_required
def user_my_posts(request):
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
    return _paginated_posts_response(posts_page, paginator, request)

@csrf_exempt
@require_http_methods(["DELETE"])
@token_required
def post_delete(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 찾을 수 없습니다.'
        }, status=404)
    
    if post.author != request.user:
        return JsonResponse({
            'status': 'error',
            'message': '게시글을 삭제할 권한이 없습니다.'
        }, status=403)
    
    try:
        with transaction.atomic():
            post_title = post.title
            post.delete()
            
        return JsonResponse({
            'status': 'success',
            'message': f'게시글 "{post_title}"이(가) 성공적으로 삭제되었습니다.'
        })
        
    except DatabaseError as e:
        return JsonResponse({
            'status': 'error',
            'message': f'게시글 삭제 중 오류가 발생했습니다: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def models_suggest(request):
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

        parsed_platform_id = None
        if platform_id:
            try:
                parsed_platform_id = int(platform_id)
            except (ValueError, TypeError):
                return JsonResponse({
                    'status': 'error',
                    'message': '유효하지 않은 플랫폼 ID입니다.'
                }, status=400)

        suggestions = ModelSuggestService.suggest_models(
            query=query,
            platform_id=parsed_platform_id,
            limit=limit,
        )

        return JsonResponse({
            'status': 'success',
            'data': {
                'query': query,
                'suggestions': suggestions,
                'total_count': len(suggestions),
            }
        })

    except (DatabaseError, ValueError, TypeError) as e:
        return JsonResponse({
            'status': 'error',
            'message': f'모델 검색에 실패했습니다: {str(e)}'
        }, status=500)
