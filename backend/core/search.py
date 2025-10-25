from django.db.models import Q
from posts.models import Post


class SearchManager:
    """
    검색 매니저 (통합 검색 기능)
    """
    
    @staticmethod
    def search_posts(queryset, query, search_type='all'):
        """
        포스트 검색 (queryset을 받아서 검색만 수행)
        """
        if not query:
            return queryset
        
        # 기본 검색만 사용 (title + content)
        return queryset.filter(
            Q(title__icontains=query) |
            Q(prompt__icontains=query) |
            Q(ai_response__icontains=query) |
            Q(additional_opinion__icontains=query) |
            Q(tags__icontains=query)
        ) 