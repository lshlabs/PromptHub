"""
Trending 데이터 모델 정의
LLM 랭킹 데이터를 관리하는 모델들
"""
from django.db import models
from django.db.models import Value, F, Q
from django.db.models.functions import Lower, Replace
from django.core.validators import MinValueValidator, MaxValueValidator


class TrendingCategory(models.Model):
    """트렌딩 카테고리 (코딩, 멀티모달, 지식 등)"""
    name = models.CharField(max_length=50, unique=True, verbose_name="카테고리명")
    title = models.CharField(max_length=100, verbose_name="표시 제목")
    subtitle = models.CharField(max_length=200, verbose_name="부제목")
    icon_name = models.CharField(max_length=50, verbose_name="아이콘명")  # lucide-react 아이콘명
    order = models.PositiveIntegerField(default=0, verbose_name="순서")
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trending_categories'
        ordering = ['order', 'name']
        verbose_name = "트렌딩 카테고리"
        verbose_name_plural = "트렌딩 카테고리들"

    def __str__(self):
        return f"{self.title} ({self.name})"


class TrendingRanking(models.Model):
    """트렌딩 랭킹 데이터"""
    category = models.ForeignKey(
        TrendingCategory,
        on_delete=models.CASCADE,
        related_name='rankings',
        verbose_name="카테고리"
    )
    rank = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="순위"
    )
    name = models.CharField(max_length=100, verbose_name="모델명")
    score = models.CharField(max_length=50, verbose_name="점수")  # 숫자 또는 문자열 모두 가능
    provider = models.CharField(max_length=50, verbose_name="제공업체")
    
    # 관련 모델 연결 (게시글과 연결하기 위한 FK)
    related_model = models.ForeignKey(
        'posts.AiModel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trending_rankings',
        verbose_name="관련 모델",
        help_text="이 트렌딩 랭킹과 연결된 AI 모델을 선택하세요. 선택하면 해당 모델로 작성된 게시글을 보여줍니다."
    )
    
    # 정확한 매칭을 위한 추가 조건들
    use_exact_matching = models.BooleanField(
        default=False,
        verbose_name="정확한 매칭 사용",
        help_text="활성화하면 아래 조건들을 추가로 적용하여 더 정확한 게시글 매칭을 수행합니다."
    )
    model_detail_contains = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="모델 상세명 포함 조건",
        help_text="게시글의 model_detail 필드에 포함되어야 할 텍스트 (예: 'Sonnet', 'oss')"
    )
    model_etc_contains = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="기타 모델명 포함 조건", 
        help_text="게시글의 model_etc 필드에 포함되어야 할 텍스트 (예: 'GPT oss 20b')"
    )
    
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trending_rankings'
        ordering = ['category__order', 'rank']
        unique_together = ['category', 'rank']  # 카테고리별 순위 중복 방지
        verbose_name = "트렌딩 랭킹"
        verbose_name_plural = "트렌딩 랭킹들"

    def __str__(self):
        return f"{self.category.name} #{self.rank} - {self.name}"
    
    def get_filtered_posts(self):
        """
        이 트렌딩 랭킹의 매칭 조건에 따라 게시글을 필터링하여 반환
        
        Returns:
            QuerySet: 필터링된 게시글 쿼리셋
        """
        from posts.models import Post
        
        # 관련 모델이 설정되지 않은 경우 빈 쿼리셋 반환
        if not self.related_model:
            return Post.objects.none()
        
        # 기본 필터: 관련 모델로 작성된 게시글
        queryset = Post.objects.filter(model=self.related_model)
        
        # 정확한 매칭이 활성화된 경우 추가 필터링
        if self.use_exact_matching:
            # 공백/하이픈/언더스코어/대소문자 차이를 무시하는 정규화 매칭
            # 1) 키워드 정규화
            normalized_detail_kw = (
                (self.model_detail_contains or "").lower().replace(" ", "").replace("-", "").replace("_", "")
            )
            normalized_etc_kw = (
                (self.model_etc_contains or "").lower().replace(" ", "").replace("-", "").replace("_", "")
            )

            # 2) 대상 필드 정규화(쿼리 단계에서 annotate)
            queryset = queryset.annotate(
                normalized_model_detail=Lower(
                    Replace(
                        Replace(
                            Replace(F("model_detail"), Value(" "), Value("")),
                            Value("-"), Value("")
                        ),
                        Value("_"), Value("")
                    )
                ),
                normalized_model_etc=Lower(
                    Replace(
                        Replace(
                            Replace(F("model_etc"), Value(" "), Value("")),
                            Value("-"), Value("")
                        ),
                        Value("_"), Value("")
                    )
                ),
            )

            # 3) OR 매칭: model_detail 또는 model_etc 어느 한쪽이라도 포함되면 매칭
            normalized_q = Q()
            if normalized_detail_kw:
                normalized_q |= Q(normalized_model_detail__contains=normalized_detail_kw)
            if normalized_etc_kw:
                normalized_q |= Q(normalized_model_etc__contains=normalized_etc_kw)

            if normalized_q:
                queryset = queryset.filter(normalized_q)
        
        return queryset.select_related('author', 'platform', 'model', 'category')