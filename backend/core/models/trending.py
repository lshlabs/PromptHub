from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator


class TrendingCategory(models.Model):
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
    
    related_model = models.ForeignKey(
        'posts.AiModel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trending_rankings',
        verbose_name="관련 모델",
        help_text="이 트렌딩 랭킹과 연결된 AI 모델을 선택하세요. 선택하면 해당 모델로 작성된 게시글을 보여줍니다."
    )
    
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
        unique_together = ['category', 'rank']
        verbose_name = "트렌딩 랭킹"
        verbose_name_plural = "트렌딩 랭킹들"

    def __str__(self):
        return f"{self.category.name} #{self.rank} - {self.name}"
    
    def get_filtered_posts(self):
        from posts.models import Post

        if not self.related_model:
            return Post.objects.none()

        queryset = Post.objects.filter(model=self.related_model)

        if self.use_exact_matching:
            conditions = Q()
            if self.model_detail_contains:
                clean_keyword = self.model_detail_contains.lower().replace(' ', '').replace('-', '').replace('_', '')
                conditions |= Q(model_detail__icontains=clean_keyword)
            if self.model_etc_contains:
                clean_keyword = self.model_etc_contains.lower().replace(' ', '').replace('-', '').replace('_', '')
                conditions |= Q(model_etc__icontains=clean_keyword)
            if conditions:
                queryset = queryset.filter(conditions)

        return queryset.select_related('author', 'platform', 'model', 'category')
