from django.db.models import Q, Value
from django.db.models.functions import Concat
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from posts.models import Post


class PostSearch:
    """
    Post 모델 전용 검색 클래스
    """
    
    @staticmethod
    def basic_search(queryset, query, fields=None):
        """
        기본 검색 (IContains 사용)
        """
        if not query:
            return queryset
        
        if fields is None:
            fields = ['title', 'prompt', 'ai_response', 'additional_opinion', 'tags']
        
        q_objects = Q()
        for field in fields:
            q_objects |= Q(**{f"{field}__icontains": query})
        
        return queryset.filter(q_objects)
    
    @staticmethod
    def advanced_search(queryset, query, search_type='all'):
        """
        고급 검색 (검색 타입별)
        """
        if not query:
            return queryset
        
        if search_type == 'title':
            return queryset.filter(title__icontains=query)
        elif search_type == 'content':
            return queryset.filter(
                Q(prompt__icontains=query) |
                Q(ai_response__icontains=query) |
                Q(additional_opinion__icontains=query)
            )
        elif search_type == 'tags':
            return queryset.filter(tags__icontains=query)
        elif search_type == 'author':
            return queryset.filter(author__username__icontains=query)
        else:  # 'all'
            return PostSearch.basic_search(queryset, query)
    
    @staticmethod
    def weighted_search(queryset, query):
        """
        가중치 검색 (제목 > 태그 > 내용 순)
        """
        if not query:
            return queryset
        
        # 제목에서 정확히 일치하는 경우 (가장 높은 우선순위)
        title_exact = queryset.filter(title__iexact=query)
        
        # 제목에서 포함되는 경우
        title_contains = queryset.filter(title__icontains=query).exclude(title__iexact=query)
        
        # 태그에서 일치하는 경우
        tags_match = queryset.filter(tags__icontains=query).exclude(
            Q(title__icontains=query)
        )
        
        # 내용에서 일치하는 경우
        content_match = queryset.filter(
            Q(prompt__icontains=query) |
            Q(ai_response__icontains=query) |
            Q(additional_opinion__icontains=query)
        ).exclude(
            Q(title__icontains=query) | Q(tags__icontains=query)
        )
        
        # 순서대로 합치기
        return title_exact.union(title_contains, tags_match, content_match)
    
    @staticmethod
    def multi_word_search(queryset, query):
        """
        다중 단어 검색 (AND 조건)
        """
        if not query:
            return queryset
        
        words = query.split()
        if not words:
            return queryset
        
        q_objects = Q()
        for word in words:
            word_q = Q(title__icontains=word) | Q(tags__icontains=word) | \
                    Q(prompt__icontains=word) | Q(ai_response__icontains=word)
            q_objects &= word_q
        
        return queryset.filter(q_objects)
    
    @staticmethod
    def fuzzy_search(queryset, query):
        """
        유사 검색 (단어 일부만 일치해도 검색)
        """
        if not query:
            return queryset
        
        # 단어를 2글자 이상으로 분할
        words = [query[i:i+2] for i in range(len(query)-1)]
        
        q_objects = Q()
        for word in words:
            if len(word) >= 2:
                q_objects |= Q(title__icontains=word) | Q(tags__icontains=word)
        
        return queryset.filter(q_objects)


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
        
        if search_type == 'weighted':
            return PostSearch.weighted_search(queryset, query)
        elif search_type == 'multi_word':
            return PostSearch.multi_word_search(queryset, query)
        elif search_type == 'fuzzy':
            return PostSearch.fuzzy_search(queryset, query)
        else:
            return PostSearch.advanced_search(queryset, query, search_type) 