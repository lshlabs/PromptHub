from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.utils.text import slugify



class Platform(models.Model):
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
    
    class Meta:
        verbose_name = "모델"
        verbose_name_plural = "모델"
        unique_together = ['platform', 'name']
        ordering = ['platform__name', 'sort_order', 'name']
        indexes = [
            models.Index(fields=['platform', 'sort_order']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['platform', 'slug'], name='unique_model_slug_per_platform')
        ]

    def __str__(self):
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
        super().save(*args, **kwargs)


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="카테고리명")

    class Meta:
        verbose_name = "카테고리"
        verbose_name_plural = "카테고리"
        ordering = ['id']

    def __str__(self):
        return self.name


class Post(models.Model):
    
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
    )
    model_detail = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="상세 모델명"
    )
    
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
    )
    tags = models.TextField(
        blank=True, 
        default="",
        verbose_name="태그"
    )
    
    prompt = models.TextField(
        validators=[MinLengthValidator(10)], 
        default="",
        verbose_name="프롬프트"
    )
    ai_response = models.TextField(
        validators=[MinLengthValidator(10)], 
        default="",
        verbose_name="AI 응답"
    )
    additional_opinion = models.TextField(
        blank=True, 
        default="",
        verbose_name="추가 의견"
    )
    
    satisfaction = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.5')), MaxValueValidator(Decimal('5.0'))],
        verbose_name="만족도"
    )
    
    view_count = models.PositiveIntegerField(default=0, verbose_name="조회수")
    like_count = models.PositiveIntegerField(default=0, verbose_name="좋아요 수")
    bookmark_count = models.PositiveIntegerField(default=0, verbose_name="북마크 수")
    
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
        return self.title

    def get_model_display_name(self):
        if self.model_detail:
            return self.model_detail
        if self.model and self.model.name == '기타' and self.model_etc:
            return self.model_etc
        return self.model.name if self.model else "기타"

    def get_category_display_name(self):
        if self.category.name == '기타' and self.category_etc:
            return self.category_etc
        return self.category.name

    def get_tags_list(self):
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]

    def clean(self):
        super().clean()
        
        if self.platform and self.platform.name == '기타':
            if self.model is not None and self.model.name != '기타':
                raise ValidationError({'model': '플랫폼이 기타인 경우 기타 모델만 선택할 수 있습니다.'})
            if not self.model_etc:
                raise ValidationError({'model_etc': '플랫폼이 기타인 경우 기타 모델명을 입력해야 합니다.'})
            if self.model_detail:
                raise ValidationError({'model_detail': '플랫폼이 기타인 경우 상세 모델명을 사용할 수 없습니다.'})
        
        if self.model and self.model.name == '기타':
            if not self.model_etc:
                raise ValidationError({'model_etc': '모델이 기타인 경우 기타 모델명을 입력해야 합니다.'})
            if self.model_detail:
                raise ValidationError({'model_detail': "'기타' 모델에서는 상세 모델명을 사용할 수 없습니다."})

        if not self.model and self.model_detail:
            raise ValidationError({'model_detail': '상세 모델명을 사용하려면 기본 모델을 선택해야 합니다.'})
        
        if self.satisfaction is not None:
            satisfaction_times_10 = int(self.satisfaction * 10)
            if satisfaction_times_10 % 5 != 0:
                raise ValidationError({'satisfaction': '만족도는 0.5점 단위로 입력해야 합니다.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class PostInteraction(models.Model):
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
        unique_together = ['user', 'post']
        indexes = [
            models.Index(fields=['user', 'post']),
            models.Index(fields=['is_liked']),
            models.Index(fields=['is_bookmarked']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.post.title}"

    def save(self, *args, **kwargs):
        old_liked = False
        old_bookmarked = False
        
        if self.pk:
            try:
                old_interaction = PostInteraction.objects.get(pk=self.pk)
                old_liked = old_interaction.is_liked
                old_bookmarked = old_interaction.is_bookmarked
            except PostInteraction.DoesNotExist:
                old_liked = False
                old_bookmarked = False
        
        with transaction.atomic():
            super().save(*args, **kwargs)
            
            if old_liked != self.is_liked:
                if self.is_liked:
                    self.post.like_count += 1
                else:
                    self.post.like_count = max(0, self.post.like_count - 1)
            
            if old_bookmarked != self.is_bookmarked:
                if self.is_bookmarked:
                    self.post.bookmark_count += 1
                else:
                    self.post.bookmark_count = max(0, self.post.bookmark_count - 1)
            
            self.post.save(update_fields=['like_count', 'bookmark_count'])
