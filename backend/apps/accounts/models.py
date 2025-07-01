from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, username=None, **extra_fields):
        if not email:
            raise ValueError('이메일은 필수입니다.')
        email = self.normalize_email(email)
        if not username:
            username = self.generate_random_username()
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, username=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, username, **extra_fields)

    def generate_random_username(self, length=8):
        import string, random
        prefix = "user_"
        chars = string.ascii_lowercase + string.digits
        while True:
            random_part = ''.join(random.choices(chars, k=length))
            username = prefix + random_part
            if not self.model.objects.filter(username=username).exists():
                return username

class User(AbstractBaseUser, PermissionsMixin):
    """확장된 사용자 모델"""
    email = models.EmailField(unique=True, verbose_name='이메일')
    username = models.CharField(max_length=150, unique=True, verbose_name='사용자명')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='가입일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
        
    def __str__(self):
        return self.email

    def get_short_name(self):
        return self.username

    def get_full_name(self):
        return self.username

class UserProfile(models.Model):
    """사용자 프로필 확장 정보"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    website = models.URLField(blank=True, verbose_name='웹사이트')
    location = models.CharField(max_length=100, blank=True, verbose_name='위치')
    bio = models.TextField(max_length=500, blank=True, verbose_name='자기소개')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='프로필 이미지')
    
    class Meta:
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필들'
        
    def __str__(self):
        return f"{self.user.email}의 프로필"
