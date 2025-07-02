"""
사용자 계정 모델

Django의 기본 User 모델을 확장하여 PromptHub에 특화된 사용자 관리 기능을 제공합니다.
- 이메일 기반 인증
- 자동 username 생성
- 확장 가능한 프로필 시스템
"""
import string
import random
import hashlib
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.core.validators import MinLengthValidator


class UserManager(BaseUserManager):
    """
    사용자 관리자 클래스
    
    Django의 기본 UserManager를 확장하여 이메일 기반 인증과
    자동 username 생성 기능을 제공합니다.
    """
    
    def create_user(self, email, password=None, username=None, **extra_fields):
        """
        일반 사용자 생성
        
        Args:
            email (str): 사용자 이메일 (필수)
            password (str): 비밀번호
            username (str): 사용자명 (선택, 없으면 자동 생성)
            **extra_fields: 추가 필드
            
        Returns:
            User: 생성된 사용자 객체
            
        Raises:
            ValueError: 이메일이 제공되지 않은 경우
        """
        if not email:
            raise ValueError('이메일은 필수입니다.')
            
        # 이메일 정규화 (도메인을 소문자로 변환)
        email = self.normalize_email(email)
        
        # username이 없으면 자동 생성
        if not username:
            username = self.generate_random_username()
            
        # 사용자 객체 생성
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)  # 비밀번호 해싱
        user.save(using=self._db)
        
        return user

    def create_superuser(self, email, password=None, username=None, **extra_fields):
        """
        슈퍼유저(관리자) 생성
        
        Args:
            email (str): 관리자 이메일
            password (str): 비밀번호
            username (str): 사용자명 (선택)
            **extra_fields: 추가 필드
            
        Returns:
            User: 생성된 슈퍼유저 객체
        """
        # 슈퍼유저 권한 설정
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        # 필수 권한 검증
        if extra_fields.get('is_staff') is not True:
            raise ValueError('슈퍼유저는 is_staff=True여야 합니다.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('슈퍼유저는 is_superuser=True여야 합니다.')
            
        return self.create_user(email, password, username, **extra_fields)

    def generate_random_username(self, length=8):
        """
        중복되지 않는 랜덤 username 생성
        
        Args:
            length (int): 랜덤 부분의 길이 (기본값: 8)
            
        Returns:
            str: 생성된 고유한 username (예: user_abc123de)
            
        Note:
            - 형식: "user_" + 8자리 랜덤 문자열
            - 문자열: 소문자 + 숫자 조합
            - 중복 체크를 통해 고유성 보장
        """
        prefix = "user_"
        chars = string.ascii_lowercase + string.digits
        
        # 중복이 없을 때까지 반복
        while True:
            random_part = ''.join(random.choices(chars, k=length))
            username = prefix + random_part
            
            # 중복 체크
            if not self.model.objects.filter(username=username).exists():
                return username


class User(AbstractBaseUser, PermissionsMixin):
    """
    PromptHub 사용자 모델
    
    Django의 AbstractBaseUser를 확장하여 이메일 기반 인증을 사용하며,
    사용자 프로필과 연결되어 확장 가능한 사용자 정보를 제공합니다.
    
    주요 특징:
    - 이메일을 USERNAME_FIELD로 사용
    - 자동 username 생성
    - 사용자 프로필과 1:1 관계
    - 생성/수정 시간 자동 관리
    """
    
    # 기본 필드
    email = models.EmailField(
        unique=True, 
        verbose_name='이메일',
        help_text='로그인에 사용될 이메일 주소'
    )
    username = models.CharField(
        max_length=150, 
        unique=True, 
        verbose_name='사용자명',
        help_text='고유한 사용자 식별자 (자동 생성)',
        validators=[MinLengthValidator(3)]
    )
    
    # 권한 관련 필드
    is_active = models.BooleanField(
        default=True,
        verbose_name='활성 상태',
        help_text='계정 활성화 여부'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='스태프 권한',
        help_text='관리자 사이트 접근 권한'
    )
    
    # 타임스탬프 필드
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name='가입일',
        help_text='계정 생성 일시'
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name='수정일',
        help_text='계정 정보 최종 수정 일시'
    )
    
    # Django 인증 설정
    USERNAME_FIELD = 'email'  # 로그인에 사용할 필드
    REQUIRED_FIELDS = ['username']  # createsuperuser 명령어에서 요구할 필드
    
    # 사용자 관리자 지정
    objects = UserManager()
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
        db_table = 'auth_user'  # 테이블명 명시
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        """문자열 표현"""
        return self.email

    def get_short_name(self):
        """짧은 이름 반환"""
        return self.username

    def get_full_name(self):
        """전체 이름 반환 (현재는 username과 동일)"""
        return self.username
        
    def has_profile(self):
        """프로필 존재 여부 확인"""
        return hasattr(self, 'profile')


class UserProfile(models.Model):
    """
    사용자 프로필 확장 모델
    
    User 모델과 1:1 관계로 연결되어 추가적인 사용자 정보를 저장합니다.
    signals.py를 통해 User 생성 시 자동으로 생성됩니다.
    """
    
    # User와의 관계
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='사용자'
    )
    
    # 프로필 정보
    website = models.URLField(
        blank=True, 
        verbose_name='웹사이트',
        help_text='개인 웹사이트 또는 블로그 URL'
    )
    location = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name='위치',
        help_text='거주 지역 또는 활동 지역'
    )

    avatar = models.ImageField(
        upload_to='avatars/%Y/%m/', 
        blank=True, 
        null=True, 
        verbose_name='프로필 이미지',
        help_text='프로필 사진 (선택사항)'
    )
    
    # 아바타 색상 정보 (그라디언트 인덱스)
    avatar_color = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='아바타 색상',
        help_text='기본 아바타의 그라디언트 색상 인덱스'
    )
    
    # 타임스탬프
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='생성일'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='수정일'
    )
    
    class Meta:
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필들'
        db_table = 'user_profile'
        
    def __str__(self):
        return f"{self.user.email}의 프로필"
        
    def get_display_name(self):
        """표시용 이름 반환"""
        return self.user.username
    
    @classmethod
    def get_avatar_gradients(cls):
        """
        사용 가능한 아바타 그라디언트 색상 목록
        
        Returns:
            list: 그라디언트 CSS 클래스명 목록
        """
        return [
            "from-blue-500 to-purple-600",
            "from-green-500 to-blue-600",
            "from-purple-500 to-pink-600",
            "from-yellow-500 to-red-600",
            "from-indigo-500 to-purple-600",
            "from-pink-500 to-rose-600",
            "from-cyan-500 to-blue-600",
            "from-emerald-500 to-teal-600",
            "from-orange-500 to-red-600",
            "from-violet-500 to-purple-600",
        ]
    
    @classmethod
    def generate_avatar_color_from_email(cls, email):
        """
        이메일을 기반으로 일관된 아바타 색상 인덱스 생성
        
        Args:
            email (str): 사용자 이메일
            
        Returns:
            int: 그라디언트 인덱스 (0-9)
            
        Note:
            같은 이메일은 항상 같은 색상 인덱스를 반환합니다.
        """
        # 이메일을 SHA256으로 해시화
        hash_object = hashlib.sha256(email.encode('utf-8'))
        hash_hex = hash_object.hexdigest()
        
        # 해시값을 정수로 변환하고 그라디언트 개수로 나눈 나머지 사용
        hash_int = int(hash_hex, 16)
        gradients = cls.get_avatar_gradients()
        return hash_int % len(gradients)
    
    def get_avatar_color_class(self):
        """
        현재 사용자의 아바타 그라디언트 CSS 클래스 반환
        
        Returns:
            str: Tailwind CSS 그라디언트 클래스
        """
        gradients = self.get_avatar_gradients()
        return gradients[self.avatar_color]
    
    def has_custom_avatar(self):
        """
        사용자가 커스텀 아바타 이미지를 업로드했는지 확인
        
        Returns:
            bool: 커스텀 아바타 존재 여부
        """
        return bool(self.avatar and self.avatar.name)
