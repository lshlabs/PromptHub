from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    """
    커스텀 사용자 모델 매니저
    
    이메일을 기본 사용자명으로 사용하는 사용자 모델을 위한 매니저입니다.
    자동으로 username과 아바타 색상을 생성합니다.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        일반 사용자를 생성합니다.
        
        Args:
            email (str): 사용자 이메일 주소 (필수)
            password (str, optional): 사용자 비밀번호
            **extra_fields: 추가 사용자 필드들
            
        Returns:
            CustomUser: 생성된 사용자 객체
            
        Raises:
            ValueError: 이메일이 제공되지 않았을 때
        """
        if not email:
            raise ValueError('이메일은 필수입니다.')
        email = self.normalize_email(email)
        
        # utils 함수들을 직접 import하여 사용
        from .utils import generate_random_username, generate_avatar_colors
        
        # username은 항상 자동 생성
        extra_fields['username'] = generate_random_username()
        
        # 아바타 색상도 항상 자동 생성
        color1, color2 = generate_avatar_colors(email)
        extra_fields['avatar_color1'] = color1
        extra_fields['avatar_color2'] = color2
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        슈퍼유저를 생성합니다.
        
        Args:
            email (str): 사용자 이메일 주소 (필수)
            password (str, optional): 사용자 비밀번호
            **extra_fields: 추가 사용자 필드들
            
        Returns:
            CustomUser: 생성된 슈퍼유저 객체
            
        Raises:
            ValueError: 슈퍼유저 권한이 올바르지 않을 때
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('슈퍼유저는 is_staff=True여야 합니다.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('슈퍼유저는 is_superuser=True여야 합니다.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    커스텀 사용자 모델
    
    AbstractUser를 확장하여 프로필 이미지, 아바타 색상, 생성 날짜 필드를 추가합니다.
    프론트엔드의 UserData 인터페이스와 호환되도록 설계되었습니다.
    """
    email = models.EmailField('이메일', unique=True)
    avatar = models.ImageField('프로필 이미지', upload_to='avatars/', blank=True, null=True)
    avatar_color1 = models.CharField('아바타 첫 번째 색상', max_length=7, blank=True, default='#6B73FF')
    avatar_color2 = models.CharField('아바타 두 번째 색상', max_length=7, blank=True, default='#9EE5FF')
    created_at = models.DateTimeField('가입일', auto_now_add=True)
    
    # Edit Profile에서 수정 가능한 필드들
    bio = models.TextField('자기소개', blank=True, null=True)
    location = models.CharField('위치', max_length=100, blank=True, null=True)
    github_handle = models.CharField('GitHub 핸들', max_length=100, blank=True, null=True)
    profile_image = models.ImageField('프로필 이미지', upload_to='profile_images/', blank=True, null=True)
    
    # 이메일을 기본 사용자명으로 사용 (username은 자동 생성됨)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
    
    def __str__(self):
        """
        사용자 객체의 문자열 표현을 반환합니다.
        
        Returns:
            str: 사용자의 이메일 주소
        """
        return self.email
    
    @property
    def avatar_url(self):
        """
        사용자의 프로필 이미지 URL을 반환합니다.
        
        Returns:
            str or None: 프로필 이미지가 있으면 URL, 없으면 None
        """
        """프로필 이미지 URL 반환"""
        if self.avatar:
            return self.avatar.url
        return None


class UserSettings(models.Model):
    """
    사용자별 설정값을 저장하는 모델
    - 이메일/앱 내 알림
    - 프로필 공개 여부
    - 데이터 공유 여부
    - 2단계 인증 사용 여부 (플래그)
    """
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
    """
    토큰 기반 인증을 사용하는 클라이언트 단의 활성 세션 추적용 모델
    - 각 로그인 시 생성되며, 클라이언트는 X-Session-Key 헤더로 식별됨
    - 개별 세션 종료(로그아웃) 또는 다른 모든 세션 종료를 지원
    """
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
