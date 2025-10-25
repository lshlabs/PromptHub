from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, UserSettings, UserSession
from posts.serializers import PostCardSerializer
from posts.models import PostInteraction
from django.db import models


class UserRegistrationSerializer(serializers.ModelSerializer):
    """사용자 회원가입 시리얼라이저"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'password_confirm', 'username')
        extra_kwargs = {
            'username': {'read_only': True}  # username은 자동 생성
        }

    def validate(self, attrs):
        """
        비밀번호와 비밀번호 확인이 일치하는지 검증합니다.
        
        Args:
            attrs (dict): 시리얼라이저 입력 데이터
            
        Returns:
            dict: 검증된 데이터
            
        Raises:
            ValidationError: 비밀번호가 일치하지 않을 때
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """사용자 로그인 시리얼라이저"""
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        """
        이메일과 비밀번호로 사용자 인증을 수행합니다.
        
        Args:
            attrs (dict): 로그인 요청 데이터 (email, password)
            
        Returns:
            dict: 인증된 사용자를 포함한 검증된 데이터
            
        Raises:
            ValidationError: 인증 실패 또는 비활성 계정일 때
        """
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('이메일 또는 비밀번호가 올바르지 않습니다.')
            if not user.is_active:
                raise serializers.ValidationError('비활성화된 계정입니다.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('이메일과 비밀번호를 입력해주세요.')

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """사용자 프로필 시리얼라이저"""
    posts = PostCardSerializer(many=True, read_only=True, source='posts.all')
    posts_count = serializers.SerializerMethodField()
    total_likes = serializers.SerializerMethodField()
    total_views = serializers.SerializerMethodField()
    total_bookmarks = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'bio', 'location',
            'github_handle', 'profile_image', 'avatar_color1',
            'avatar_color2', 'created_at', 'posts', 'posts_count',
            'total_likes', 'total_views', 'total_bookmarks'
        )
        read_only_fields = ('id', 'email', 'created_at')

    def validate_username(self, value):
        """사용자명 중복 검증"""
        user = self.context['request'].user
        if CustomUser.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError('이미 사용 중인 사용자명입니다.')
        return value

    def get_posts_count(self, obj):
        """사용자의 게시글 수"""
        return obj.posts.count()
    
    def get_total_likes(self, obj):
        """사용자가 받은 총 좋아요 수"""
        return PostInteraction.objects.filter(
            post__author=obj, 
            is_liked=True
        ).count()
    
    def get_total_views(self, obj):
        """사용자 게시글의 총 조회수"""
        return obj.posts.aggregate(
            total_views=models.Sum('view_count')
        )['total_views'] or 0
    
    def get_total_bookmarks(self, obj):
        """사용자가 받은 총 북마크 수"""
        return PostInteraction.objects.filter(
            post__author=obj, 
            is_bookmarked=True
        ).count()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """사용자 프로필 수정 시리얼라이저"""
    class Meta:
        model = CustomUser
        fields = ('bio', 'location', 'github_handle', 'profile_image')

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    비밀번호 변경 시리얼라이저
    
    현재 비밀번호와 새 비밀번호를 받아 비밀번호 변경을 처리합니다.
    새 비밀번호와 확인 비밀번호의 일치성을 검증합니다.
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        """
        새 비밀번호와 확인 비밀번호가 일치하는지 검증합니다.
        
        Args:
            attrs (dict): 비밀번호 변경 요청 데이터
            
        Returns:
            dict: 검증된 데이터
            
        Raises:
            ValidationError: 새 비밀번호가 일치하지 않을 때
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("새 비밀번호가 일치하지 않습니다.")
        return attrs

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """
    비밀번호 변경 시리얼라이저 (views.py 호환용)
    
    ChangePasswordSerializer와 동일한 기능을 제공하며,
    views.py의 PasswordChangeView와 호환되도록 만들어진 시리얼라이저입니다.
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password], write_only=True)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        """
        새 비밀번호와 확인 비밀번호가 일치하는지 검증합니다.
        
        Args:
            attrs (dict): 비밀번호 변경 요청 데이터
            
        Returns:
            dict: 검증된 데이터
            
        Raises:
            ValidationError: 새 비밀번호가 일치하지 않을 때
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("새 비밀번호가 일치하지 않습니다.")
        return attrs

    def validate_current_password(self, value):
        """
        현재 비밀번호가 올바른지 검증합니다.
        
        Args:
            value (str): 현재 비밀번호
            
        Returns:
            str: 검증된 현재 비밀번호
            
        Raises:
            ValidationError: 현재 비밀번호가 틀렸을 때
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value

    def save(self, **kwargs):
        """
        유효성 검증 후 실제로 사용자의 비밀번호를 변경합니다.

        Returns:
            CustomUser: 비밀번호가 변경된 사용자 객체
        """
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """
    사용자 상세 정보 시리얼라이저
    
    사용자의 기본 정보를 읽기 전용으로 제공하는 시리얼라이저입니다.
    다른 사용자의 공개 프로필 정보를 조회할 때 사용됩니다.
    """
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'bio', 'location', 
            'github_handle', 'profile_image', 'avatar_color1', 
            'avatar_color2', 'created_at'
        ) 


class UserSettingsSerializer(serializers.ModelSerializer):
    """사용자 설정 시리얼라이저"""
    class Meta:
        model = UserSettings
        fields = (
            'email_notifications_enabled',
            'in_app_notifications_enabled',
            'public_profile',
            'data_sharing',
            'two_factor_auth_enabled',
            'updated_at',
        )
        read_only_fields = ('updated_at',)


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = (
            'key', 'user_agent', 'ip_address', 'device', 'browser', 'os', 'location',
            'created_at', 'last_active', 'revoked_at'
        )