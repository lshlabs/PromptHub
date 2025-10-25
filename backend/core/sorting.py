from django.db.models import F


class PostSorting:
    """
    Post 모델 전용 정렬 클래스
    SortSelector 컴포넌트에 맞춰 수정 (latest, oldest, popular, satisfaction, views만)
    """
    
    @staticmethod
    def sort_by_latest(queryset):
        """최신순 정렬"""
        return queryset.order_by('-created_at')
    
    @staticmethod
    def sort_by_oldest(queryset):
        """오래된순 정렬"""
        return queryset.order_by('created_at')
    
    @staticmethod
    def sort_by_popular(queryset):
        """인기순 정렬 (좋아요 + 북마크)"""
        return queryset.annotate(
            popularity=F('like_count') + F('bookmark_count')
        ).order_by('-popularity', '-created_at')
    
    @staticmethod
    def sort_by_satisfaction(queryset):
        """만족도순 정렬"""
        # 만족도가 있는 게시글을 우선 정렬하고(내림차순), 동일 시 최신순
        return queryset.order_by(F('satisfaction').desc(nulls_last=True), '-created_at')
    
    @staticmethod
    def sort_by_views(queryset):
        """조회순 정렬"""
        return queryset.order_by('-view_count', '-created_at')


class SortManager:
    """
    정렬 매니저 (통합 정렬 기능)
    SortSelector 컴포넌트에 맞춰 수정
    """
    
    SORT_OPTIONS = {
        'latest': PostSorting.sort_by_latest,
        'oldest': PostSorting.sort_by_oldest,
        'popular': PostSorting.sort_by_popular,
        'satisfaction': PostSorting.sort_by_satisfaction,
        'views': PostSorting.sort_by_views,
    }
    
    @staticmethod
    def sort_posts(queryset, sort_by='latest', **kwargs):
        """
        포스트 정렬
        """
        if sort_by in SortManager.SORT_OPTIONS:
            sort_func = SortManager.SORT_OPTIONS[sort_by]
            return sort_func(queryset)
        
        # 기본값
        return PostSorting.sort_by_latest(queryset)
    
    @staticmethod
    def get_sort_options():
        """
        사용 가능한 정렬 옵션 반환
        SortSelector 컴포넌트와 일치
        """
        return {
            'latest': '최신순',
            'oldest': '오래된순',
            'popular': '인기순',
            'satisfaction': '만족도순',
            'views': '조회순',
        } 