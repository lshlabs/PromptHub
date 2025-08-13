from django_filters import rest_framework as filters
from django.db.models import Q
from posts.models import Post, Platform, AiModel, Category


class PostFilter(filters.FilterSet):
    """
    Post 모델용 필터 클래스
    
    프론트엔드 FilterPanel 컴포넌트와 연동하여 다음 기능을 제공합니다:
    1. 카테고리 필터링 (기타 카테고리 포함)
    2. 플랫폼 필터링 
    3. 모델 필터링 (기타 모델 포함)
    """
    categories = filters.CharFilter(method='categories_filter', label='카테고리')
    # platforms 필터 제거 - 플랫폼은 모델 선택의 관문 역할만 함
    models = filters.CharFilter(method='models_filter', label='모델')

    class Meta:
        model = Post
        fields = {
            'author': ['exact'],
        }

    def categories_filter(self, queryset, name, value):
        """
        카테고리 필터링 (쉼표로 구분된 카테고리 ID들)
        
        특수 처리:
        - '기타' 카테고리 선택 시 category='기타'이면서 category_etc가 있는 모든 게시물 포함
        - 일반 카테고리는 해당 category_id와 정확히 일치하는 게시물만 포함
        
        Args:
            queryset: 기본 쿼리셋
            name: 필터 이름 
            value: 쉼표로 구분된 카테고리 ID 문자열
            
        Returns:
            QuerySet: 필터링된 쿼리셋
        """
        if not value:
            return queryset
            
        category_ids = [id.strip() for id in value.split(',') if id.strip()]
        if not category_ids:
            return queryset
            
        # Q 객체로 조건 구성
        conditions = Q()
        
        for category_id in category_ids:
            try:
                category_id_int = int(category_id)
                category = Category.objects.get(id=category_id_int)
                
                if category.name == '기타':
                    # 기타 카테고리: category='기타'이면서 category_etc 필드가 있는 모든 게시물
                    conditions |= Q(category=category, category_etc__isnull=False, category_etc__gt='')
                else:
                    # 일반 카테고리: 해당 카테고리의 모든 게시물
                    conditions |= Q(category_id=category_id_int)
                    
            except (Category.DoesNotExist, ValueError, TypeError):
                # 존재하지 않는 카테고리 ID는 무시
                continue
                
        return queryset.filter(conditions) if conditions else queryset

    # platforms_filter 제거 - 플랫폼은 더 이상 필터로 사용하지 않음

    def models_filter(self, queryset, name, value):
        """
        모델 필터링 (쉼표로 구분된 모델 ID들)
        
        특수 처리:
        - '기타' 모델 선택 시 model_etc 필드가 있는 모든 게시물 포함
        - 일반 모델은 해당 model_id와 정확히 일치하는 게시물 + 해당 기본모델의 상세모델(model_detail) 포함
        
        Args:
            queryset: 기본 쿼리셋
            name: 필터 이름
            value: 쉼표로 구분된 모델 ID 문자열
            
        Returns:
            QuerySet: 필터링된 쿼리셋
        """
        if not value:
            return queryset
            
        model_ids = [id.strip() for id in value.split(',') if id.strip()]
        if not model_ids:
            return queryset
            
        # Q 객체로 조건 구성
        conditions = Q()
        
        for model_id in model_ids:
            try:
                model_id_int = int(model_id)
                model = AiModel.objects.get(id=model_id_int)
                
                if model.name == '기타':
                    # 기타 모델: 해당 플랫폼의 "기타" 모델이면서 model_etc 필드가 있는 게시물
                    conditions |= Q(model=model, model_etc__isnull=False, model_etc__gt='')
                else:
                    # 일반 모델: 기본 모델 게시물 + 해당 기본 모델에 종속된 상세 모델명
                    conditions |= Q(model_id=model_id_int) | (
                        Q(model_id=model_id_int) & Q(model_detail__isnull=False)  # 안전성
                    )
                    
            except (AiModel.DoesNotExist, ValueError, TypeError):
                # 존재하지 않는 모델 ID는 무시
                continue
                
        return queryset.filter(conditions) if conditions else queryset 