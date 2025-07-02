"""
사용자 계정 관리자 설정

Django 관리자 사이트에서 User와 UserProfile 모델을 관리하기 위한
커스텀 관리자 클래스들을 정의합니다.

주요 기능:
- 사용자 목록 표시 및 필터링
- 사용자 생성/수정 폼 커스터마이징
- 프로필 정보 통합 관리
- 검색 및 정렬 기능
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    사용자 관리자 클래스
    
    Django 기본 UserAdmin을 확장하여 커스텀 User 모델에 맞게 설정합니다.
    이메일 기반 인증과 추가 필드들을 관리자 인터페이스에서 처리할 수 있도록 합니다.
    """
    
    # 목록 페이지 설정
    list_display = (
        'email', 
        'username', 
        'is_active', 
        'is_staff', 
        'has_profile_display',
        'created_at'
    )
    list_filter = (
        'is_staff', 
        'is_superuser', 
        'is_active', 
        'created_at'
    )
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    list_per_page = 25
    
    # 상세 페이지 필드셋
    fieldsets = (
        ('기본 정보', {
            'fields': ('email', 'username', 'password')
        }),
        ('권한', {
            'fields': (
                'is_active', 
                'is_staff', 
                'is_superuser', 
                'groups', 
                'user_permissions'
            ),
            'classes': ('collapse',)
        }),
        ('중요 날짜', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 사용자 생성 페이지 필드셋
    add_fieldsets = (
        ('새 사용자 생성', {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
            'description': '새로운 사용자 계정을 생성합니다. username은 비워두면 자동 생성됩니다.'
        }),
    )
    
    # 읽기 전용 필드
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    def has_profile_display(self, obj):
        """프로필 존재 여부 표시"""
        if hasattr(obj, 'profile'):
            return format_html(
                '<span style="color: green;">✓</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">✗</span>'
            )
    has_profile_display.short_description = '프로필'
    has_profile_display.admin_order_field = 'profile'


class UserProfileInline(admin.StackedInline):
    """
    사용자 프로필 인라인 관리자
    
    User 관리 페이지에서 UserProfile을 함께 편집할 수 있도록 합니다.
    """
    model = UserProfile
    can_delete = False
    verbose_name_plural = '프로필 정보'
    fields = ('location', 'website', 'avatar', 'avatar_color')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    사용자 프로필 관리자 클래스
    
    UserProfile 모델을 독립적으로 관리할 수 있는 인터페이스를 제공합니다.
    """
    
    # 목록 페이지 설정
    list_display = (
        'user_email', 
        'user_username',
        'location',
        'avatar_color_display', 
        'has_avatar',
        'created_at'
    )
    list_filter = ('location', 'created_at')
    search_fields = ('user__email', 'user__username')
    ordering = ('-created_at',)
    list_per_page = 25
    
    # 상세 페이지 필드셋
    fieldsets = (
        ('사용자 정보', {
            'fields': ('user',)
        }),
                 ('프로필 정보', {
             'fields': ('location', 'website', 'avatar', 'avatar_color')
         }),
        ('타임스탬프', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 읽기 전용 필드
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        """사용자 이메일 표시"""
        return obj.user.email
    user_email.short_description = '이메일'
    user_email.admin_order_field = 'user__email'
    
    def user_username(self, obj):
        """사용자명 표시"""
        return obj.user.username
    user_username.short_description = '사용자명'
    user_username.admin_order_field = 'user__username'
    

    
    def avatar_color_display(self, obj):
        """아바타 색상 시각적 표시"""
        color_class = obj.get_avatar_color_class()
        
        # 그라디언트 색상 추출 (CSS 클래스에서 색상명 추출)
        colors = color_class.split(' ')
        start_color = colors[0].replace('from-', '').replace('-500', '')
        end_color = colors[1].replace('to-', '').replace('-600', '')
        
        return format_html(
            '<div style="display: inline-flex; align-items: center; gap: 8px;">'
            '<div style="width: 24px; height: 24px; border-radius: 50%; '
            'background: linear-gradient(135deg, {}, {}); '
            'border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">'
            '</div>'
            '<span>#{} ({} → {})</span>'
            '</div>',
            start_color,
            end_color,
            obj.avatar_color,
            start_color,
            end_color
        )
    avatar_color_display.short_description = '아바타 색상'
    
    def has_avatar(self, obj):
        """프로필 이미지 존재 여부"""
        return bool(obj.avatar)
    has_avatar.boolean = True
    has_avatar.short_description = '프로필 이미지'


# User 관리자에 프로필 인라인 추가
UserAdmin.inlines = [UserProfileInline]
