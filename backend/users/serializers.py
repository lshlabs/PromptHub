from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, UserSettings, UserSession
from posts.models import PostInteraction
from django.db import models


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'password_confirm', 'username')
        extra_kwargs = {
            'username': {'read_only': True}  # username은 자동 생성
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
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
    posts_count = serializers.SerializerMethodField()
    total_likes = serializers.SerializerMethodField()
    total_views = serializers.SerializerMethodField()
    total_bookmarks = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'bio', 'location',
            'github_handle', 'profile_image', 'avatar_color1',
            'avatar_color2', 'created_at', 'posts_count',
            'total_likes', 'total_views', 'total_bookmarks'
        )
        read_only_fields = ('id', 'email', 'created_at')

    def validate_username(self, value):
        user = self.context['request'].user
        if CustomUser.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError('이미 사용 중인 사용자명입니다.')
        return value

    def get_posts_count(self, obj):
        return obj.posts.count()
    
    def get_total_likes(self, obj):
        return PostInteraction.objects.filter(
            post__author=obj, 
            is_liked=True
        ).count()
    
    def get_total_views(self, obj):
        return obj.posts.aggregate(
            total_views=models.Sum('view_count')
        )['total_views'] or 0
    
    def get_total_bookmarks(self, obj):
        return PostInteraction.objects.filter(
            post__author=obj, 
            is_bookmarked=True
        ).count()


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password], write_only=True)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("새 비밀번호가 일치하지 않습니다.")
        return attrs

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return user


class UserSettingsSerializer(serializers.ModelSerializer):
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
