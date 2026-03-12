from django.db.models import F


class PostSorting:
    @staticmethod
    def sort_by_latest(queryset):
        return queryset.order_by('-created_at')
    
    @staticmethod
    def sort_by_oldest(queryset):
        return queryset.order_by('created_at')
    
    @staticmethod
    def sort_by_popular(queryset):
        return queryset.annotate(
            popularity=F('like_count') + F('bookmark_count')
        ).order_by('-popularity', '-created_at')
    
    @staticmethod
    def sort_by_satisfaction(queryset):
        return queryset.order_by(F('satisfaction').desc(nulls_last=True), '-created_at')
    
    @staticmethod
    def sort_by_views(queryset):
        return queryset.order_by('-view_count', '-created_at')


class SortManager:
    SORT_OPTIONS = {
        'latest': PostSorting.sort_by_latest,
        'oldest': PostSorting.sort_by_oldest,
        'popular': PostSorting.sort_by_popular,
        'satisfaction': PostSorting.sort_by_satisfaction,
        'views': PostSorting.sort_by_views,
    }
    
    @staticmethod
    def sort_posts(queryset, sort_by='latest', **kwargs):
        if sort_by in SortManager.SORT_OPTIONS:
            sort_func = SortManager.SORT_OPTIONS[sort_by]
            return sort_func(queryset)
        return PostSorting.sort_by_latest(queryset)
    
    @staticmethod
    def get_sort_options():
        return {
            'latest': '최신순',
            'oldest': '오래된순',
            'popular': '인기순',
            'satisfaction': '만족도순',
            'views': '조회순',
        } 
