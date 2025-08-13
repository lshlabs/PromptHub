from django.http import JsonResponse
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Post, PostInteraction, Platform, Category
from users.models import CustomUser

User = get_user_model()


def token_required(view_func):
    """
    토큰 기반 인증 데코레이터
    
    Authorization 헤더에서 Token을 추출하여 인증을 수행합니다.
    인증에 실패하면 401 오류를 반환합니다.
    
    Args:
        view_func: 데코레이션될 뷰 함수
        
    Returns:
        function: 래핑된 뷰 함수
    """
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Token '):
            return JsonResponse({
                'status': 'error', 
                'message': '유효한 토큰이 필요합니다.'
            }, status=401)
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
            return view_func(request, *args, **kwargs)
        except Token.DoesNotExist:
            return JsonResponse({
                'status': 'error', 
                'message': '유효하지 않은 토큰입니다.'
            }, status=401)
    return wrapper


def dashboard_stats(request):
    """
    대시보드 통계를 조회합니다.
    
    전체 플랫폼의 기본 통계 정보를 제공합니다.
    비인증 사용자도 접근 가능합니다.
    
    제공되는 통계:
    - 총 게시글 수
    - 총 사용자 수  
    - 총 조회수
    - 총 좋아요 수
    - 총 북마크 수
    - 평균 만족도 (avg_satisfaction)
    - 최근 7일 신규 게시글 수 (weekly_added_posts)
    - 활성 사용자 수 (active_users: 최근 30일 내 게시글 작성 사용자)
    - 최근 게시글 (최대 5개)
    - 인기 태그 (사용 횟수 상위 10개)
    - 플랫폼별 게시글 분포
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        JsonResponse: 대시보드 통계 데이터
    """
    try:
        # 기본 통계 계산
        total_posts = Post.objects.count()
        total_users = User.objects.count()
        total_views = Post.objects.aggregate(
            total=Sum('view_count')
        )['total'] or 0
        total_likes = Post.objects.aggregate(
            total=Sum('like_count')
        )['total'] or 0
        total_bookmarks = Post.objects.aggregate(
            total=Sum('bookmark_count')
        )['total'] or 0

        # 평균 만족도 (전체 기준, 소수점 1자리 반올림)
        avg_satisfaction = Post.objects.exclude(
            satisfaction__isnull=True
        ).aggregate(avg=Avg('satisfaction'))['avg']
        if avg_satisfaction is not None:
            avg_satisfaction = round(float(avg_satisfaction), 1)
        else:
            avg_satisfaction = 0

        # 최근 7일 신규 게시글 수
        seven_days_ago = timezone.now() - timedelta(days=7)
        weekly_added_posts = Post.objects.filter(created_at__gte=seven_days_ago).count()

        # 활성 사용자 수 (최근 30일 내 게시글 작성 사용자 수)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_users = User.objects.filter(posts__created_at__gte=thirty_days_ago).distinct().count()
        
        # 최근 게시글 (최대 5개)
        recent_posts = Post.objects.select_related(
            'author', 'platform', 'category'
        ).order_by('-created_at')[:5]
        
        recent_posts_data = []
        for post in recent_posts:
            recent_posts_data.append({
                'id': post.id,
                'title': post.title,
                'author': post.author.username,
                'created_at': post.created_at.isoformat(),
                'views': post.view_count,
                'likes': post.like_count,
                'platform': post.platform.name,
                'category': post.category.name
            })
        
        # 인기 태그 (상위 10개)
        posts_with_tags = Post.objects.exclude(tags='').values_list('tags', flat=True)
        tag_counts = {}
        
        for tags_str in posts_with_tags:
            if tags_str:
                tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
                for tag in tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # 사용 횟수 순으로 정렬하여 상위 10개
        popular_tags = sorted(
            tag_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
        
        popular_tags_data = [
            {'name': tag, 'count': count} 
            for tag, count in popular_tags
        ]
        
        # 플랫폼별 게시글 분포
        platform_distribution = Platform.objects.annotate(
            post_count=Count('posts')
        ).filter(post_count__gt=0).order_by('-post_count')
        
        platform_distribution_data = [
            {
                'platform': platform.name,
                'count': platform.post_count
            }
            for platform in platform_distribution
        ]
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'total_posts': total_posts,
                'total_users': total_users,
                'total_views': total_views,
                'total_likes': total_likes,
                'total_bookmarks': total_bookmarks,
                'avg_satisfaction': avg_satisfaction,
                'weekly_added_posts': weekly_added_posts,
                'active_users': active_users,
                'recent_posts': recent_posts_data,
                'popular_tags': popular_tags_data,
                'platform_distribution': platform_distribution_data
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'통계 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=500)


@token_required
def user_stats(request):
    """
    사용자별 통계를 조회합니다.
    
    인증된 사용자의 개인 활동 통계를 제공합니다.
    
    제공되는 통계:
    - 작성한 게시글 수
    - 총 조회수 (본인 게시글)
    - 총 좋아요 수 (본인 게시글)
    - 총 북마크 수 (본인 게시글)
    - 평균 만족도
    - 가장 많이 사용한 플랫폼
    - 가장 많이 사용한 카테고리
    - 최근 활동 정보
    
    Args:
        request: HTTP 요청 객체 (인증 필요)
        
    Returns:
        JsonResponse: 사용자별 통계 데이터
    """
    try:
        user = request.user
        
        # 사용자가 작성한 게시글 통계
        user_posts = Post.objects.filter(author=user)
        posts_count = user_posts.count()
        
        if posts_count == 0:
            # 게시글이 없는 경우 기본값 반환
            return JsonResponse({
                'status': 'success',
                'data': {
                    'posts_count': 0,
                    'total_views': 0,
                    'total_likes': 0,
                    'total_bookmarks': 0,
                    'avg_satisfaction': 0,
                    'most_used_platform': None,
                    'most_used_category': None,
                    'recent_activity': {
                        'last_post_date': None,
                        'last_like_date': None,
                        'last_bookmark_date': None
                    }
                }
            })
        
        # 기본 통계 계산
        total_views = user_posts.aggregate(
            total=Sum('view_count')
        )['total'] or 0
        
        total_likes = user_posts.aggregate(
            total=Sum('like_count')
        )['total'] or 0
        
        total_bookmarks = user_posts.aggregate(
            total=Sum('bookmark_count')
        )['total'] or 0
        
        # 평균 만족도 계산 (null 값 제외)
        avg_satisfaction = user_posts.exclude(
            satisfaction__isnull=True
        ).aggregate(
            avg=Avg('satisfaction')
        )['avg']
        
        if avg_satisfaction:
            avg_satisfaction = round(float(avg_satisfaction), 1)
        else:
            avg_satisfaction = 0
        
        # 가장 많이 사용한 플랫폼
        most_used_platform = user_posts.values(
            'platform__name'
        ).annotate(
            count=Count('platform')
        ).order_by('-count').first()
        
        most_used_platform_name = None
        if most_used_platform:
            most_used_platform_name = most_used_platform['platform__name']
        
        # 가장 많이 사용한 카테고리
        most_used_category = user_posts.values(
            'category__name'
        ).annotate(
            count=Count('category')
        ).order_by('-count').first()
        
        most_used_category_name = None
        if most_used_category:
            most_used_category_name = most_used_category['category__name']
        
        # 최근 활동 정보
        last_post = user_posts.order_by('-created_at').first()
        last_post_date = last_post.created_at.isoformat() if last_post else None
        
        # 최근 좋아요 활동
        last_like_interaction = PostInteraction.objects.filter(
            user=user, 
            is_liked=True
        ).order_by('-updated_at').first()
        last_like_date = None
        if last_like_interaction:
            last_like_date = last_like_interaction.updated_at.isoformat()
        
        # 최근 북마크 활동
        last_bookmark_interaction = PostInteraction.objects.filter(
            user=user, 
            is_bookmarked=True
        ).order_by('-updated_at').first()
        last_bookmark_date = None
        if last_bookmark_interaction:
            last_bookmark_date = last_bookmark_interaction.updated_at.isoformat()
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'posts_count': posts_count,
                'total_views': total_views,
                'total_likes': total_likes,
                'total_bookmarks': total_bookmarks,
                'avg_satisfaction': avg_satisfaction,
                'most_used_platform': most_used_platform_name,
                'most_used_category': most_used_category_name,
                'recent_activity': {
                    'last_post_date': last_post_date,
                    'last_like_date': last_like_date,
                    'last_bookmark_date': last_bookmark_date
                }
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'사용자 통계 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=500)