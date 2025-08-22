from rest_framework import serializers
from decimal import Decimal
from .models import Platform, AiModel, Category, Post, PostInteraction
from .utils import format_relative_time


class PlatformSerializer(serializers.ModelSerializer):
    """플랫폼 시리얼라이저"""
    class Meta:
        model = Platform
        fields = ['id', 'name', 'slug', 'is_active']


class ModelSerializer(serializers.ModelSerializer):
    """모델 시리얼라이저"""
    platformName = serializers.CharField(source='platform.name', read_only=True)
    variantFreeTextAllowed = serializers.BooleanField(source='variant_free_text_allowed', read_only=True)
    isActive = serializers.BooleanField(source='is_active', read_only=True)
    isDeprecated = serializers.BooleanField(source='is_deprecated', read_only=True)
    
    class Meta:
        model = AiModel
        fields = ['id', 'name', 'slug', 'sort_order', 'platform', 'platformName', 'variantFreeTextAllowed', 'isActive', 'isDeprecated']


class CategorySerializer(serializers.ModelSerializer):
    """카테고리 시리얼라이저"""
    class Meta:
        model = Category
        fields = ['id', 'name']


class PostValidationMixin:
    """게시글 유효성 검사 공통 로직"""
    
    def validate_title(self, value):
        """제목 유효성 검사"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("제목은 최소 3자 이상이어야 합니다.")
        return value.strip()

    def validate_prompt(self, value):
        """프롬프트 유효성 검사"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("프롬프트는 최소 5자 이상이어야 합니다.")
        return value.strip()

    def validate_ai_response(self, value):
        """AI 응답 유효성 검사"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("AI 응답은 최소 10자 이상이어야 합니다.")
        return value.strip()

    def validate_tags_list(self, value):
        """태그 리스트 유효성 검사"""
        if value:
            if len(value) > 10:
                raise serializers.ValidationError("태그는 최대 10개까지 입력할 수 있습니다.")
            
            for tag in value:
                if len(tag.strip()) > 50:
                    raise serializers.ValidationError("각 태그는 최대 50자까지 입력할 수 있습니다.")
                if not tag.strip():
                    raise serializers.ValidationError("빈 태그는 입력할 수 없습니다.")
        
        return [tag.strip() for tag in value if tag.strip()]

    def validate_satisfaction(self, value):
        """만족도 유효성 검사"""
        if value is not None:
            satisfaction_times_10 = int(value * 10)
            if satisfaction_times_10 % 5 != 0:
                raise serializers.ValidationError("만족도는 0.5점 단위로 입력해야 합니다.")
        return value

    def validate(self, data):
        return self.validate_business_logic(data)

    def validate_platform(self, value):
        """플랫폼 유효성 검사"""
        if not value:
            raise serializers.ValidationError("플랫폼을 선택해야 합니다.")
        return value

    def validate_category(self, value):
        """카테고리 유효성 검사"""
        if not value:
            raise serializers.ValidationError("카테고리를 선택해야 합니다.")
        return value

    def validate_model_etc(self, value):
        """기타 모델명 유효성 검사"""
        if value and len(value.strip()) > 100:
            raise serializers.ValidationError("기타 모델명은 최대 100자까지 입력할 수 있습니다.")
        return value.strip() if value else ""

    def validate_category_etc(self, value):
        """기타 카테고리명 유효성 검사"""
        if value and len(value.strip()) > 100:
            raise serializers.ValidationError("기타 카테고리명은 최대 100자까지 입력할 수 있습니다.")
        return value.strip() if value else ""

    def validate_business_logic(self, data):
        """비즈니스 로직 유효성 검사"""
        platform = data.get('platform')
        model = data.get('model')
        model_etc = data.get('model_etc', '')
        
        # 플랫폼이 선택되었지만 모델이 선택되지 않은 경우
        if platform and not model and not model_etc:
            raise serializers.ValidationError("모델을 선택하거나 기타 모델명을 입력해야 합니다.")
        
        return data


class PostCardSerializer(serializers.ModelSerializer):
    """게시글 카드 시리얼라이저"""
    author = serializers.CharField(source='author.username', read_only=True)
    authorInitial = serializers.SerializerMethodField()
    avatarSrc = serializers.SerializerMethodField()
    authorAvatarColor1 = serializers.CharField(source='author.avatar_color1', read_only=True)
    authorAvatarColor2 = serializers.CharField(source='author.avatar_color2', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    relativeTime = serializers.SerializerMethodField()  # 상대적 시간 추가
    views = serializers.IntegerField(source='view_count', read_only=True)
    
    # ID 기반 필드들
    platformId = serializers.IntegerField(source='platform.id', read_only=True)
    modelId = serializers.IntegerField(source='model.id', read_only=True, allow_null=True)
    categoryId = serializers.IntegerField(source='category.id', read_only=True)
    
    # 기타 입력값들
    modelEtc = serializers.CharField(source='model_etc', read_only=True)
    modelDetail = serializers.CharField(source='model_detail', read_only=True)
    categoryEtc = serializers.CharField(source='category_etc', read_only=True)
    
    # 표시명 (계산된 값)
    modelDisplayName = serializers.SerializerMethodField()
    categoryDisplayName = serializers.SerializerMethodField()
    
    # 상호작용 필드들
    likes = serializers.IntegerField(source='like_count', read_only=True)
    isLiked = serializers.SerializerMethodField()
    bookmarks = serializers.IntegerField(source='bookmark_count', read_only=True)
    isBookmarked = serializers.SerializerMethodField()
    
    # 태그
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'author', 'authorInitial', 'avatarSrc', 'authorAvatarColor1', 'authorAvatarColor2',
            'createdAt', 'relativeTime', 'views',
            'platformId', 'modelId', 'categoryId',
            'modelEtc', 'modelDetail', 'categoryEtc',
            'modelDisplayName', 'categoryDisplayName',
            'likes', 'isLiked', 'bookmarks', 'isBookmarked',
            'satisfaction', 'tags'
        ]

    def get_authorInitial(self, obj):
        return obj.author.username[0].upper() if obj.author.username else 'U'

    def get_avatarSrc(self, obj):
        # 사용자 아바타 이미지 URL (없으면 None)
        try:
            return obj.author.avatar_url
        except Exception:
            return None

    def get_relativeTime(self, obj):
        """상대적 시간 반환"""
        return format_relative_time(obj.created_at)

    def get_isLiked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interactions.filter(user=request.user, is_liked=True).exists()
        return False

    def get_isBookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interactions.filter(user=request.user, is_bookmarked=True).exists()
        return False

    def get_tags(self, obj):
        return obj.get_tags_list()
    
    def get_modelDisplayName(self, obj):
        """모델 표시명 반환"""
        return obj.get_model_display_name()
    
    def get_categoryDisplayName(self, obj):
        """카테고리 표시명 반환"""
        return obj.get_category_display_name()


class PostDetailSerializer(serializers.ModelSerializer):
    """게시글 상세 시리얼라이저"""
    author = serializers.CharField(source='author.username', read_only=True)
    authorInitial = serializers.SerializerMethodField()
    avatarSrc = serializers.SerializerMethodField()
    authorAvatarColor1 = serializers.CharField(source='author.avatar_color1', read_only=True)
    authorAvatarColor2 = serializers.CharField(source='author.avatar_color2', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    relativeTime = serializers.SerializerMethodField()  # 상대적 시간 추가
    views = serializers.IntegerField(source='view_count', read_only=True)
    
    # ID 기반 필드들
    platformId = serializers.IntegerField(source='platform.id', read_only=True)
    modelId = serializers.IntegerField(source='model.id', read_only=True, allow_null=True)
    categoryId = serializers.IntegerField(source='category.id', read_only=True)
    
    # 기타 입력값들
    modelEtc = serializers.CharField(source='model_etc', read_only=True)
    modelDetail = serializers.CharField(source='model_detail', read_only=True)
    categoryEtc = serializers.CharField(source='category_etc', read_only=True)
    
    # 표시명 (계산된 값)
    modelDisplayName = serializers.SerializerMethodField()
    categoryDisplayName = serializers.SerializerMethodField()
    
    # 상호작용 필드들
    likes = serializers.IntegerField(source='like_count', read_only=True)
    isLiked = serializers.SerializerMethodField()
    bookmarks = serializers.IntegerField(source='bookmark_count', read_only=True)
    isBookmarked = serializers.SerializerMethodField()
    
    # 태그
    tags = serializers.SerializerMethodField()
    
    # 게시글 내용
    aiResponse = serializers.CharField(source='ai_response', read_only=True)
    additionalOpinion = serializers.CharField(source='additional_opinion', read_only=True)
    
    # 작성자 확인
    isAuthor = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'author', 'authorInitial', 'avatarSrc', 'authorAvatarColor1', 'authorAvatarColor2',
            'createdAt', 'relativeTime', 'views',
            'platformId', 'modelId', 'categoryId',
            'modelEtc', 'modelDetail', 'categoryEtc',
            'modelDisplayName', 'categoryDisplayName',
            'likes', 'isLiked', 'bookmarks', 'isBookmarked',
            'satisfaction', 'tags',
            'prompt', 'aiResponse', 'additionalOpinion',
            'isAuthor'
        ]

    def get_authorInitial(self, obj):
        return obj.author.username[0].upper() if obj.author.username else 'U'

    def get_avatarSrc(self, obj):
        try:
            return obj.author.avatar_url
        except Exception:
            return None

    def get_relativeTime(self, obj):
        """상대적 시간 반환"""
        return format_relative_time(obj.created_at)

    def get_isLiked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interactions.filter(user=request.user, is_liked=True).exists()
        return False

    def get_isBookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interactions.filter(user=request.user, is_bookmarked=True).exists()
        return False

    def get_tags(self, obj):
        return obj.get_tags_list()

    def get_isAuthor(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False
    
    def get_modelDisplayName(self, obj):
        """모델 표시명 반환"""
        return obj.get_model_display_name()
    
    def get_categoryDisplayName(self, obj):
        """카테고리 표시명 반환"""
        return obj.get_category_display_name()


class PostCreateSerializer(PostValidationMixin, serializers.ModelSerializer):
    """게시글 작성 시리얼라이저"""
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list
    )
    
    class Meta:
        model = Post
        fields = [
            'title', 'platform', 'model', 'model_etc', 'model_detail', 'category', 'category_etc',
            'tags', 'satisfaction', 'prompt', 'ai_response', 'additional_opinion'
        ]

    def validate_tags(self, value):
        return self.validate_tags_list(value)

    # 상위 Mixin의 validate 사용

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        validated_data['author'] = self.context['request'].user
        validated_data['tags'] = ', '.join(tags_data) if tags_data else ""
        return super().create(validated_data)


class PostEditSerializer(PostValidationMixin, serializers.ModelSerializer):
    """게시글 편집용 시리얼라이저"""
    
    # 읽기 전용 필드들 (편집 페이지 로드용)
    platformId = serializers.IntegerField(source='platform.id', read_only=True)
    modelId = serializers.IntegerField(source='model.id', read_only=True, allow_null=True)
    categoryId = serializers.IntegerField(source='category.id', read_only=True)
    modelEtc = serializers.CharField(source='model_etc', read_only=True)
    categoryEtc = serializers.CharField(source='category_etc', read_only=True)
    aiResponse = serializers.CharField(source='ai_response', read_only=True)
    additionalOpinion = serializers.CharField(source='additional_opinion', read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list
    )
    
    # 쓰기 가능 필드들 (수정 제출용)
    title = serializers.CharField(max_length=200)
    satisfaction = serializers.DecimalField(
        max_digits=3,
        decimal_places=1,
        min_value=Decimal('0.5'),
        max_value=Decimal('5.0')
    )
    prompt = serializers.CharField()
    platform = serializers.PrimaryKeyRelatedField(queryset=Platform.objects.all(), required=False)
    model = serializers.PrimaryKeyRelatedField(queryset=AiModel.objects.all(), required=False, allow_null=True)
    model_etc = serializers.CharField(max_length=100, required=False, allow_blank=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    category_etc = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tags_input = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
        write_only=True
    )
    ai_response = serializers.CharField(required=False)
    additional_opinion = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Post
        fields = [
            # 읽기 전용
            'id', 'title', 'platformId', 'modelId', 'modelEtc', 'categoryId', 'categoryEtc',
            'satisfaction', 'prompt', 'aiResponse', 'additionalOpinion',
            # 쓰기 가능
            'platform', 'model', 'model_etc', 'model_detail', 'category', 'category_etc',
            'tags', 'tags_input', 'ai_response', 'additional_opinion'
        ]

    def get_tags(self, obj):
        return obj.get_tags_list()

    def validate_tags_input(self, value):
        return self.validate_tags_list(value)

    # 상위 Mixin의 validate 사용

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        if tags_data is not None:
            validated_data['tags'] = ', '.join(tags_data) if tags_data else ""
        return super().update(instance, validated_data)


class TagSerializer(serializers.Serializer):
    """태그 시리얼라이저"""
    name = serializers.CharField()
    count = serializers.IntegerField()


class PostInteractionSerializer(serializers.ModelSerializer):
    """게시글 상호작용 시리얼라이저"""
    class Meta:
        model = PostInteraction
        fields = ['is_liked', 'is_bookmarked']