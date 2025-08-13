

from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.utils.text import slugify



class Platform(models.Model):
    """
    AI 플랫폼 모델
    
    OpenAI, Google, Anthropic 등의 AI 서비스 플랫폼을 나타냅니다.
    각 플랫폼은 여러 개의 AI 모델을 가질 수 있습니다.
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="플랫폼명")
    slug = models.SlugField(max_length=50, unique=True, verbose_name="슬러그")
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        verbose_name = "플랫폼"
        verbose_name_plural = "플랫폼"
        ordering = ['id']
        indexes = [
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        """
        플랫폼 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: 플랫폼명
        """
        return self.name

    def _generate_unique_slug(self) -> str:
        base_name = (self.name or '').strip()
        base_slug = slugify(base_name)
        if not base_slug:
            lower_name = base_name.lower()
            if lower_name in {'기타', 'other'}:
                base_slug = 'other'
            else:
                base_slug = lower_name.replace(' ', '-') or 'platform'
        candidate = base_slug
        suffix = 2
        while Platform.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)


class AiModel(models.Model):
    """
    AI 모델 모델
    
    특정 플랫폼에 속하는 AI 모델을 나타냅니다.
    예: GPT-4, Claude-3, Gemini Pro 등
    """
    platform = models.ForeignKey(
        Platform, 
        on_delete=models.CASCADE, 
        related_name='models',
        verbose_name="플랫폼"
    )
    name = models.CharField(max_length=100, verbose_name="모델명")
    slug = models.SlugField(max_length=100, verbose_name="슬러그")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="정렬 순서")
    released_at = models.DateField(
        null=True,
        blank=True,
        help_text="알려진 정확한 출시일이 있을 경우 설정합니다.",
        verbose_name="출시일"
    )
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    is_deprecated = models.BooleanField(default=False, verbose_name="사용중단")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="삭제일시")
    variant_free_text_allowed = models.BooleanField(default=True, verbose_name="상세 모델 자유 입력 허용")
    
    class Meta:
        verbose_name = "모델"
        verbose_name_plural = "모델"
        unique_together = ['platform', 'name']  # 같은 플랫폼 내에서 모델명 중복 방지
        ordering = ['platform__name', 'sort_order', 'name']
        indexes = [
            models.Index(fields=['platform', 'sort_order']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['platform', 'slug'], name='unique_model_slug_per_platform')
        ]

    def __str__(self):
        """
        모델 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: "플랫폼명 - 모델명" 형식의 문자열
        """
        return f"{self.platform.name} - {self.name}"

    def _generate_unique_slug(self) -> str:
        base_name = (self.name or '').strip()
        base_slug = slugify(base_name)
        if not base_slug:
            lower_name = base_name.lower()
            if lower_name in {'기타', 'other'}:
                base_slug = 'other'
            else:
                base_slug = lower_name.replace(' ', '-') or 'model'
        candidate = base_slug
        suffix = 2
        while AiModel.objects.exclude(pk=self.pk).filter(platform=self.platform, slug=candidate).exists():
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        # '기타' 모델은 상세 모델 자유 입력을 허용하지 않도록 보정
        if self.name == '기타':
            self.variant_free_text_allowed = False
        super().save(*args, **kwargs)


class Category(models.Model):
    """
    게시글 카테고리 모델
    
    게시글을 범주별로 분류하기 위한 모델입니다.
    예: 개발/프로그래밍, 업무/문서, 창작/예술 등
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="카테고리명")

    class Meta:
        verbose_name = "카테고리"
        verbose_name_plural = "카테고리"
        ordering = ['id']

    def __str__(self):
        """
        카테고리 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: 카테고리명
        """
        return self.name


class Post(models.Model):
    """게시글 모델 - AI 프롬프트와 사용 경험을 담는 메인 모델"""
    
    # 기본 정보
    title = models.CharField(
        max_length=200, 
        validators=[MinLengthValidator(5), MaxLengthValidator(200)],
        verbose_name="제목"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posts',
        verbose_name="작성자"
    )
    
    # AI 관련 정보
    platform = models.ForeignKey(
        Platform, 
        on_delete=models.CASCADE, 
        related_name='posts',
        verbose_name="플랫폼"
    )
    model = models.ForeignKey(
        AiModel, 
        on_delete=models.CASCADE, 
        related_name='posts', 
        null=True, 
        blank=True,
        verbose_name="모델"
    )
    model_etc = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="기타 모델명"
    )  # 커스텀 모델명
    # 기본 모델의 상세 변형(variant) 명칭. 예: GPT-5-high, o4-mini, o4-mini-high
    # '기타' 모델 선택 시에는 사용하지 않음
    model_detail = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="상세 모델명"
    )
    
    # 분류 정보
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='posts',
        verbose_name="카테고리"
    )
    category_etc = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="기타 카테고리명"
    )  # 커스텀 카테고리명
    tags = models.TextField(
        blank=True, 
        default="",
        verbose_name="태그"
    )  # 쉼표로 구분된 태그들
    
    # 게시글 내용 (3개 필드로 분리)
    prompt = models.TextField(
        validators=[MinLengthValidator(10)], 
        default="",
        verbose_name="프롬프트"
    )  # LLM에게 질문한 내용
    ai_response = models.TextField(
        validators=[MinLengthValidator(10)], 
        default="",
        verbose_name="AI 응답"
    )  # AI가 응답한 내용
    additional_opinion = models.TextField(
        blank=True, 
        default="",
        verbose_name="추가 의견"
    )  # 추가 의견 (선택사항)
    
    # 만족도 (0.5~5.0점, 0.5점 단위)
    satisfaction = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.5')), MaxValueValidator(Decimal('5.0'))],
        verbose_name="만족도"
    )
    
    # 통계 정보
    view_count = models.PositiveIntegerField(default=0, verbose_name="조회수")
    like_count = models.PositiveIntegerField(default=0, verbose_name="좋아요 수")
    bookmark_count = models.PositiveIntegerField(default=0, verbose_name="북마크 수")
    
    # 메타 정보
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        verbose_name = "게시글"
        verbose_name_plural = "게시글"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['platform']),
            models.Index(fields=['category']),
            models.Index(fields=['author']),
            models.Index(fields=['model']),
        ]

    def __str__(self):
        """
        게시글 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: 게시글 제목
        """
        return self.title

    def get_model_display_name(self):
        """
        모델의 표시명을 반환합니다.
        
        우선순위:
        1) 상세 모델명(model_detail)이 있으면 해당 값을 사용
        2) 모델명이 '기타'이고 기타 모델명(model_etc)이 있으면 그 값을 사용
        3) 그렇지 않으면 선택된 기본 모델명을 반환
        
        Returns:
            str: 모델 표시명
        """
        if self.model_detail:
            return self.model_detail
        if self.model and self.model.name == '기타' and self.model_etc:
            return self.model_etc
        return self.model.name if self.model else "기타"

    def get_category_display_name(self):
        """
        카테고리의 표시명을 반환합니다.
        
        카테고리가 '기타'이고 기타 카테고리명이 있으면 그것을 반환하고,
        그렇지 않으면 선택된 카테고리명을 반환합니다.
        
        Returns:
            str: 카테고리 표시명
        """
        if self.category.name == '기타' and self.category_etc:
            return self.category_etc
        return self.category.name

    def get_tags_list(self):
        """
        태그 문자열을 리스트로 변환하여 반환합니다.
        
        콤마로 구분된 태그 문자열을 공백을 제거하고
        리스트로 변환합니다.
        
        Returns:
            list: 태그 리스트 (빈 문자열이면 빈 리스트)
        """
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]

    def clean(self):
        """
        모델 유효성 검사를 수행합니다.
        
        플랫폼과 모델의 조합 및 기타 모델명 필수 여부,
        만족도 범위 및 0.5 단위 여부를 검증합니다.
        
        Raises:
            ValidationError: 유효성 검사 실패 시
        """
        super().clean()
        
        # 시나리오 1: 플랫폼이 '기타'인 경우
        if self.platform and self.platform.name == '기타':
            # 기타 플랫폼의 기타 모델은 허용
            if self.model is not None and self.model.name != '기타':
                raise ValidationError({'model': '플랫폼이 기타인 경우 기타 모델만 선택할 수 있습니다.'})
            # 기타 모델명이 없으면 오류
            if not self.model_etc:
                raise ValidationError({'model_etc': '플랫폼이 기타인 경우 기타 모델명을 입력해야 합니다.'})
            # 기타 플랫폼에서는 상세 모델명을 사용하지 않음
            if self.model_detail:
                raise ValidationError({'model_detail': '플랫폼이 기타인 경우 상세 모델명을 사용할 수 없습니다.'})
        
        # 시나리오 2: 모델이 '기타'인 경우
        if self.model and self.model.name == '기타':
            if not self.model_etc:
                raise ValidationError({'model_etc': '모델이 기타인 경우 기타 모델명을 입력해야 합니다.'})
            # '기타' 모델에서는 상세 모델명을 사용하지 않음
            if self.model_detail:
                raise ValidationError({'model_detail': "'기타' 모델에서는 상세 모델명을 사용할 수 없습니다."})

        # 시나리오 3: 기본 모델을 선택한 경우 상세 모델명은 선택사항
        # 단, 모델이 선택되지 않은 상태에서 상세 모델명만 있는 것은 허용하지 않음
        if not self.model and self.model_detail:
            raise ValidationError({'model_detail': '상세 모델명을 사용하려면 기본 모델을 선택해야 합니다.'})
        
        # 만족도 범위 검증 (0.5 단위)
        if self.satisfaction is not None:
            # 0.5 단위인지 확인
            satisfaction_times_10 = int(self.satisfaction * 10)
            if satisfaction_times_10 % 5 != 0:
                raise ValidationError({'satisfaction': '만족도는 0.5점 단위로 입력해야 합니다.'})

    def save(self, *args, **kwargs):
        """
        게시글을 저장하기 전에 유효성 검사를 수행합니다.
        
        full_clean()을 호출하여 clean() 메서드의 유효성 검사를 수행한 후
        저장을 진행합니다.
        
        Args:
            *args: 가변 인수
            **kwargs: 키워드 인수
        """
        self.full_clean()
        super().save(*args, **kwargs)


class PostInteraction(models.Model):
    """게시글 상호작용 모델 - 사용자별 좋아요/북마크 상태 관리"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='post_interactions',
        verbose_name="사용자"
    )
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name='interactions',
        verbose_name="게시글"
    )
    is_liked = models.BooleanField(default=False, verbose_name="좋아요 여부")
    is_bookmarked = models.BooleanField(default=False, verbose_name="북마크 여부")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")
    
    class Meta:
        verbose_name = "게시글 상호작용"
        verbose_name_plural = "게시글 상호작용"
        unique_together = ['user', 'post']  # 한 사용자가 한 게시글에 대해 하나의 상호작용만 가능
        indexes = [
            models.Index(fields=['user', 'post']),
            models.Index(fields=['is_liked']),
            models.Index(fields=['is_bookmarked']),
        ]

    def __str__(self):
        """
        게시글 상호작용 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: "사용자명 - 게시글 제목" 형식의 문자열
        """
        return f"{self.user.username} - {self.post.title}"

    def save(self, *args, **kwargs):
        """
        상호작용 저장 시 게시글의 통계 필드를 업데이트합니다.
        
        좋아요/북마크 상태 변경 시 게시글의 like_count와 bookmark_count를
        자동으로 업데이트하여 데이터 일관성을 보장합니다.
        
        Args:
            *args: 가변 인수
            **kwargs: 키워드 인수
        """
        # 기존 상태 확인
        old_liked = False
        old_bookmarked = False
        
        if self.pk:
            try:
                old_interaction = PostInteraction.objects.get(pk=self.pk)
                old_liked = old_interaction.is_liked
                old_bookmarked = old_interaction.is_bookmarked
            except PostInteraction.DoesNotExist:
                pass
        
        with transaction.atomic():
            super().save(*args, **kwargs)
            
            # 좋아요 수 업데이트
            if old_liked != self.is_liked:
                if self.is_liked:
                    self.post.like_count += 1
                else:
                    self.post.like_count = max(0, self.post.like_count - 1)
            
            # 북마크 수 업데이트
            if old_bookmarked != self.is_bookmarked:
                if self.is_bookmarked:
                    self.post.bookmark_count += 1
                else:
                    self.post.bookmark_count = max(0, self.post.bookmark_count - 1)
            
            self.post.save(update_fields=['like_count', 'bookmark_count'])