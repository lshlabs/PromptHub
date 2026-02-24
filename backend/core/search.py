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

        normalized_type = (search_type or 'all').strip().lower()

        title_query = Q(title__icontains=query)
        content_query = (
            Q(prompt__icontains=query)
            | Q(ai_response__icontains=query)
            | Q(additional_opinion__icontains=query)
            | Q(tags__icontains=query)
        )

        if normalized_type == 'title':
            return queryset.filter(title_query)

        if normalized_type == 'content':
            return queryset.filter(content_query)

        if normalized_type in {'title_content', 'all'}:
            return queryset.filter(title_query | content_query)

        # 잘못된 값은 title+content로 안전하게 폴백
        return queryset.filter(title_query | content_query)
