from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('이메일은 필수입니다.')
        email = self.normalize_email(email)
        
        from .utils import generate_random_username, generate_avatar_colors
        
        extra_fields['username'] = generate_random_username()
        
        color1, color2 = generate_avatar_colors(email)
        extra_fields['avatar_color1'] = color1
        extra_fields['avatar_color2'] = color2
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('슈퍼유저는 is_staff=True여야 합니다.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('슈퍼유저는 is_superuser=True여야 합니다.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    email = models.EmailField('이메일', unique=True)
    avatar = models.ImageField('프로필 이미지', upload_to='avatars/', blank=True, null=True)
    avatar_color1 = models.CharField('아바타 첫 번째 색상', max_length=7, blank=True, default='#6B73FF')
    avatar_color2 = models.CharField('아바타 두 번째 색상', max_length=7, blank=True, default='#9EE5FF')
    created_at = models.DateTimeField('가입일', auto_now_add=True)
    
    bio = models.TextField('자기소개', blank=True, null=True)
    location = models.CharField('위치', max_length=100, blank=True, null=True)
    github_handle = models.CharField('GitHub 핸들', max_length=100, blank=True, null=True)
    profile_image = models.ImageField('프로필 이미지', upload_to='profile_images/', blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
    
    def __str__(self):
        return self.email
    
    @property
    def avatar_url(self):
        if self.profile_image:
            return self.profile_image.url
        if self.avatar:
            return self.avatar.url
        return None


class UserSettings(models.Model):
    user = models.OneToOneField('users.CustomUser', related_name='settings', on_delete=models.CASCADE)
    email_notifications_enabled = models.BooleanField(default=True)
    in_app_notifications_enabled = models.BooleanField(default=True)
    public_profile = models.BooleanField(default=True)
    data_sharing = models.BooleanField(default=False)
    two_factor_auth_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '사용자 설정'
        verbose_name_plural = '사용자 설정들'

    def __str__(self) -> str:
        return f"{self.user.email} 설정"


class UserSession(models.Model):
    user = models.ForeignKey('users.CustomUser', related_name='sessions', on_delete=models.CASCADE)
    key = models.CharField(max_length=64, unique=True)
    user_agent = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    os = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = '사용자 세션'
        verbose_name_plural = '사용자 세션들'
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None

    def __str__(self) -> str:
        return f"{self.user.email} 세션 ({self.device or 'Unknown'})"
