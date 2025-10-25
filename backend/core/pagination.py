from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    """
    커스텀 페이지네이션 클래스
    - 기본 페이지 크기: 12개
    - 최대 페이지 크기: 50개
    - 페이지 파라미터: 'page'
    - 페이지 크기 파라미터: 'page_size'
    
    필터와 정렬과 유기적으로 연동:
    1. 검색 → 2. 필터 → 3. 정렬 → 4. 페이지네이션 순서로 적용
    """
    # 통일: 기본 10, 최대 100 (프론트 타입 기준과 일치)
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        """
        페이지네이션 응답 형식
        필터링된 전체 결과에 대한 정보 포함
        """
        return Response({
            'count': self.page.paginator.count,  # 필터링된 전체 개수
            'total_count': self.page.paginator.count,  # 호환 키
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'has_next': self.page.has_next(),
            'has_previous': self.page.has_previous(),
        })


class PostPagination(CustomPagination):
    """
    Post 전용 페이지네이션 (카드 형태에 최적화)
    
    사용 예시:
    # 1. 검색 적용
    queryset = SearchManager.search_posts(queryset, query, search_type)
    
    # 2. 필터 적용 (플랫폼, 모델, 카테고리)
    if categories: queryset = queryset.filter(category__name__in=category_names)
    if platforms: queryset = queryset.filter(platform__name__in=platform_names)
    if models: queryset = queryset.filter(q_objects_for_models)
    
    # 3. 정렬 적용
    queryset = SortManager.sort_posts(queryset, sort_by)
    
    # 4. 페이지네이션 적용
    paginator = PostPagination()
    page = paginator.paginate_queryset(queryset, request)
    """
    page_size = 10