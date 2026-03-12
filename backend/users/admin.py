from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserSettings, UserSession
from .utils import generate_random_username, generate_avatar_colors


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'bio', 'location', 'github_handle', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('email', 'username', 'bio', 'location', 'github_handle')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('개인 정보', {'fields': ('username', 'bio', 'location', 'github_handle')}),
        ('프로필 이미지', {'fields': ('avatar', 'profile_image')}),
        ('아바타 색상', {'fields': ('avatar_color1', 'avatar_color2')}),
        ('권한', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('중요한 날짜', {'fields': ('last_login', 'created_at')}),
    )
    
    readonly_fields = ('created_at', 'last_login')
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('프로필 정보', {
            'classes': ('wide',),
            'fields': ('bio', 'location', 'github_handle', 'avatar', 'profile_image'),
        }),
        ('자동 생성 필드', {
            'classes': ('collapse',),
            'fields': ('username', 'avatar_color1', 'avatar_color2'),
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            if not obj.username:
                obj.username = generate_random_username()
            if not obj.avatar_color1 or not obj.avatar_color2:
                color1, color2 = generate_avatar_colors(obj.email)
                obj.avatar_color1 = color1
                obj.avatar_color2 = color2
        super().save_model(request, obj, form, change)


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'email_notifications_enabled', 'in_app_notifications_enabled',
        'public_profile', 'data_sharing', 'two_factor_auth_enabled', 'updated_at'
    )
    list_filter = (
        'email_notifications_enabled', 'in_app_notifications_enabled',
        'public_profile', 'data_sharing', 'two_factor_auth_enabled'
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'key', 'device', 'browser', 'ip_address', 'is_active', 'last_active')
    list_filter = ('revoked_at',)
    search_fields = ('user__email', 'key', 'device', 'browser', 'ip_address')
