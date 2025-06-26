from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """확장된 사용자 모델"""
    email = models.EmailField(unique=True, verbose_name='이메일')
    first_name = models.CharField(max_length=30, verbose_name='이름')
    last_name = models.CharField(max_length=30, verbose_name='성')
    bio = models.TextField(max_length=500, blank=True, verbose_name='자기소개')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='프로필 이미지')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='가입일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
        
    def __str__(self):
        return self.email

class UserProfile(models.Model):
    """사용자 프로필 확장 정보"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, verbose_name='전화번호')
    website = models.URLField(blank=True, verbose_name='웹사이트')
    location = models.CharField(max_length=100, blank=True, verbose_name='위치')
    birth_date = models.DateField(null=True, blank=True, verbose_name='생년월일')
    
    class Meta:
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필들'
        
    def __str__(self):
        return f"{self.user.email}의 프로필"
