#!/bin/bash

# 🚀 PromptHub 완벽한 프로젝트 설정 스크립트 (진짜 최종 완성 버전)
# Django + Next.js 모범 사례 구조 + Debug Toolbar + 회원가입 오류 수정 모두 포함

echo "🎯 PromptHub 프로젝트 완벽 설정을 시작합니다..."
echo "=================================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 처리 함수
handle_error() {
    echo -e "${RED}❌ 오류 발생: $1${NC}"
    echo -e "${YELLOW}💡 문제 해결을 위해 다음을 확인해주세요:${NC}"
    echo "   1. Python 3.8+ 설치 확인: python3 --version"
    echo "   2. Node.js 16+ 설치 확인: node --version"
    echo "   3. 인터넷 연결 상태 확인"
    echo "   4. 디스크 공간 확인"
    exit 1
}

# 성공 메시지 함수
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 경고 메시지 함수
warning_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 정보 메시지 함수
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 진행률 표시 함수
progress_msg() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------"
}

# 1. 프로젝트 구조 정리
progress_msg "📁 1단계: 프로젝트 구조 정리"

# 중복된 디렉토리들 제거
info_msg "중복된 Django 디렉토리들 제거 중..."

if [ -d "backend/settings/" ]; then
    rm -rf backend/settings/
    success_msg "backend/settings/ 제거 완료"
fi

if [ -d "backend/accounts/" ]; then
    rm -rf backend/accounts/
    success_msg "backend/accounts/ 제거 완료 (apps/accounts/ 사용)"
fi

if [ -d "backend/backend/" ]; then
    rm -rf backend/backend/
    success_msg "backend/backend/ 제거 완료 (config/ 사용)"
fi

if [ -d "backend/core/" ]; then
    rm -rf backend/core/
    success_msg "backend/core/ 제거 완료 (apps/core/ 사용)"
fi

# 중복된 파일들 제거
info_msg "중복된 Django 파일들 제거 중..."

[ -f "backend/urls.py" ] && rm -f backend/urls.py && success_msg "backend/urls.py 제거"
[ -f "backend/wsgi.py" ] && rm -f backend/wsgi.py && success_msg "backend/wsgi.py 제거"
[ -f "backend/asgi.py" ] && rm -f backend/asgi.py && success_msg "backend/asgi.py 제거"

# 2. Django 설정 파일들 생성/수정
progress_msg "⚙️  2단계: Django 설정 파일 생성/수정"

# manage.py 수정
info_msg "manage.py 설정 경로 수정 중..."
if [ -f "backend/manage.py" ]; then
    # macOS와 Linux 호환성을 위한 sed 명령어
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/backend\.settings\.development/config.settings.development/g' backend/manage.py
    else
        sed -i 's/backend\.settings\.development/config.settings.development/g' backend/manage.py
    fi
    success_msg "manage.py 설정 경로 수정 완료"
fi

# config/settings/base.py 생성 (수정된 버전 - 존재하는 앱만 포함)
info_msg "Django 기본 설정 파일 생성 중..."
cat > backend/config/settings/base.py << 'EOF'
"""
Django 기본 설정

모든 환경에서 공통으로 사용되는 설정들을 정의합니다.
"""
from pathlib import Path
import os

# 프로젝트 기본 경로 (backend/ 디렉토리)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production-very-long-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# 애플리케이션 정의
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.core',
    # 'apps.posts',      # 나중에 생성할 때 주석 해제
    # 'apps.comments',   # 나중에 생성할 때 주석 해제
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# 미들웨어 설정
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# 템플릿 설정
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# 데이터베이스 설정
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 커스텀 사용자 모델
AUTH_USER_MODEL = 'accounts.User'

# 패스워드 검증
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# 국제화 설정
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# 미디어 파일 설정
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 기본 자동 필드 타입
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework 설정
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js 개발 서버
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# 로깅 설정
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# 로그 디렉토리 생성
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)
EOF
success_msg "Django 기본 설정 파일 생성 완료"

# config/settings/development.py 생성 (Debug Toolbar 수정 포함)
info_msg "개발 환경 설정 파일 생성 중..."
cat > backend/config/settings/development.py << 'EOF'
from .base import *

# 개발 환경 설정
DEBUG = True

# 개발용 데이터베이스 (SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 개발용 이메일 백엔드 (콘솔 출력)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# 개발용 캐시 (더미 캐시)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# 개발용 로깅 (콘솔만)
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'

# Django Debug Toolbar 설정 (수정된 버전)
if DEBUG:
    try:
        import debug_toolbar
        # Debug Toolbar를 INSTALLED_APPS에 추가
        INSTALLED_APPS += ['debug_toolbar']
        
        # Debug Toolbar 미들웨어 추가 (가장 위에)
        MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
        
        # 내부 IP 설정 (로컬 개발 환경)
        INTERNAL_IPS = [
            '127.0.0.1',
            'localhost',
            '::1',  # IPv6 localhost
        ]
        
        # Debug Toolbar 설정
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
            'SHOW_COLLAPSED': True,
        }
        
    except ImportError:
        # Debug Toolbar가 설치되지 않은 경우 무시
        pass
EOF
success_msg "개발 환경 설정 파일 생성 완료"

# config/settings/production.py 생성
info_msg "프로덕션 설정 파일 생성 중..."
cat > backend/config/settings/production.py << 'EOF'
from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Database for production (PostgreSQL 권장)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_SECONDS = 31536000
SECURE_REDIRECT_EXEMPT = []
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Static files for production
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Email settings for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
}
EOF
success_msg "프로덕션 설정 파일 생성 완료"

# config/urls.py 생성 (Debug Toolbar URL 포함)
info_msg "URL 설정 파일 생성 중..."
cat > backend/config/urls.py << 'EOF'
"""
PromptHub URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    # path('api/posts/', include('apps.posts.urls')),      # 나중에 추가
    # path('api/comments/', include('apps.comments.urls')), # 나중에 추가
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Django Debug Toolbar URL 추가
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        # Debug Toolbar가 설치되지 않은 경우 무시
        pass

# 관리자 사이트 커스터마이징
admin.site.site_header = "PromptHub 관리자"
admin.site.site_title = "PromptHub"
admin.site.index_title = "PromptHub 관리"
EOF
success_msg "URL 설정 파일 생성 완료"

# config/wsgi.py 생성
info_msg "WSGI 설정 파일 생성 중..."
cat > backend/config/wsgi.py << 'EOF'
"""
WSGI config for PromptHub project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_wsgi_application()
EOF
success_msg "WSGI 설정 파일 생성 완료"

# config/asgi.py 생성
info_msg "ASGI 설정 파일 생성 중..."
cat > backend/config/asgi.py << 'EOF'
"""
ASGI config for PromptHub project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
EOF
success_msg "ASGI 설정 파일 생성 완료"

# 3. Django 앱 파일들 생성/수정
progress_msg "🏗️  3단계: Django 앱 파일들 설정"

# apps/core/pagination.py 생성
info_msg "페이지네이션 파일 생성 중..."
cat > backend/apps/core/pagination.py << 'EOF'
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardResultsSetPagination(PageNumberPagination):
    """표준 페이지네이션 클래스"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.page_size,
            'results': data
        })
EOF
success_msg "페이지네이션 파일 생성 완료"

# apps/accounts/models.py 수정
info_msg "사용자 모델 생성 중..."
cat > backend/apps/accounts/models.py << 'EOF'
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
EOF
success_msg "사용자 모델 생성 완료"

# apps/accounts/serializers.py 생성 (회원가입 오류 수정 포함)
info_msg "인증 시리얼라이저 생성 중..."
cat > backend/apps/accounts/serializers.py << 'EOF'
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile
import logging

logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    """사용자 회원가입 시리얼라이저 (개선된 버전)"""
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'},
        help_text="8자 이상의 비밀번호를 입력하세요."
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="비밀번호를 다시 입력하세요."
    )
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {
                'required': True,
                'help_text': '유효한 이메일 주소를 입력하세요.'
            },
            'username': {
                'required': True,
                'help_text': '사용자명을 입력하세요.'
            },
            'first_name': {
                'required': True,
                'help_text': '이름을 입력하세요.'
            },
            'last_name': {
                'required': True,
                'help_text': '성을 입력하세요.'
            }
        }
        
    def validate_email(self, value):
        """이메일 중복 검사"""
        if User.objects.filter(email=value).exists():
            logger.warning(f"이메일 중복 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value
        
    def validate_username(self, value):
        """사용자명 검증"""
        if User.objects.filter(username=value).exists():
            logger.warning(f"사용자명 중복 시도: {value}")
            raise serializers.ValidationError("이미 사용 중인 사용자명입니다.")
        
        # 사용자명 길이 및 형식 검증
        if len(value) < 3:
            raise serializers.ValidationError("사용자명은 3자 이상이어야 합니다.")
        
        if len(value) > 30:
            raise serializers.ValidationError("사용자명은 30자 이하여야 합니다.")
            
        return value
        
    def validate_password(self, value):
        """비밀번호 검증"""
        try:
            validate_password(value)
        except ValidationError as e:
            logger.warning(f"비밀번호 검증 실패: {e}")
            raise serializers.ValidationError(list(e.messages))
        return value
        
    def validate(self, attrs):
        """전체 데이터 검증"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            logger.warning("비밀번호 확인 불일치")
            raise serializers.ValidationError({
                'password_confirm': '비밀번호가 일치하지 않습니다.'
            })
            
        return attrs
        
    def create(self, validated_data):
        """사용자 생성"""
        try:
            # password_confirm 제거
            validated_data.pop('password_confirm', None)
            
            # 사용자 생성
            user = User.objects.create_user(**validated_data)
            
            logger.info(f"새 사용자 생성 성공: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"사용자 생성 실패: {e}")
            raise serializers.ValidationError("사용자 생성 중 오류가 발생했습니다.")

class UserLoginSerializer(serializers.Serializer):
    """사용자 로그인 시리얼라이저 (개선된 버전)"""
    email = serializers.EmailField(
        help_text="등록된 이메일 주소를 입력하세요."
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="비밀번호를 입력하세요."
    )
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('이메일과 비밀번호를 모두 입력해주세요.')
        
        # 이메일로 사용자 찾기
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"존재하지 않는 이메일로 로그인 시도: {email}")
            raise serializers.ValidationError('등록되지 않은 이메일입니다.')
        
        # 비밀번호 확인
        user = authenticate(username=email, password=password)
        if not user:
            logger.warning(f"잘못된 비밀번호로 로그인 시도: {email}")
            raise serializers.ValidationError('비밀번호가 올바르지 않습니다.')
            
        if not user.is_active:
            logger.warning(f"비활성화된 계정으로 로그인 시도: {email}")
            raise serializers.ValidationError('비활성화된 계정입니다.')
            
        attrs['user'] = user
        logger.info(f"로그인 성공: {email}")
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    """사용자 프로필 시리얼라이저"""
    class Meta:
        model = UserProfile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    """사용자 정보 시리얼라이저"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'bio', 'avatar', 'profile', 'created_at')
        read_only_fields = ('id', 'created_at')
EOF
success_msg "인증 시리얼라이저 생성 완료"

# apps/accounts/views.py 생성 (상세한 에러 로깅 포함)
info_msg "인증 뷰 생성 중..."
cat > backend/apps/accounts/views.py << 'EOF'
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer
)
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    """사용자 회원가입 (개선된 버전)"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        logger.info(f"회원가입 시도: {request.data.get('email', 'Unknown')}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"회원가입 검증 실패: {serializer.errors}")
            return Response({
                'success': False,
                'message': '입력 정보를 확인해주세요.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            logger.info(f"회원가입 성공: {user.email}")
            
            return Response({
                'success': True,
                'message': '회원가입이 완료되었습니다.',
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"회원가입 처리 중 오류: {e}")
            return Response({
                'success': False,
                'message': '회원가입 처리 중 오류가 발생했습니다.',
                'errors': {'non_field_errors': [str(e)]}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """사용자 로그인 (개선된 버전)"""
    logger.info(f"로그인 시도: {request.data.get('email', 'Unknown')}")
    
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        logger.error(f"로그인 검증 실패: {serializer.errors}")
        return Response({
            'success': False,
            'message': '로그인 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        
        logger.info(f"로그인 성공: {user.email}")
        
        return Response({
            'success': True,
            'message': '로그인되었습니다.',
            'user': UserSerializer(user).data,
            'token': token.key
        })
        
    except Exception as e:
        logger.error(f"로그인 처리 중 오류: {e}")
        return Response({
            'success': False,
            'message': '로그인 처리 중 오류가 발생했습니다.',
            'errors': {'non_field_errors': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """사용자 로그아웃"""
    try:
        request.user.auth_token.delete()
        logger.info(f"로그아웃 성공: {request.user.email}")
    except Exception as e:
        logger.warning(f"토큰 삭제 실패: {e}")
    
    logout(request)
    return Response({
        'success': True,
        'message': '로그아웃되었습니다.'
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """사용자 프로필 조회"""
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': serializer.data
    })

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """사용자 프로필 수정"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': '입력 정보를 확인해주세요.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        serializer.save()
        logger.info(f"프로필 수정 성공: {request.user.email}")
        
        return Response({
            'success': True,
            'message': '프로필이 수정되었습니다.',
            'user': serializer.data
        })
        
    except Exception as e:
        logger.error(f"프로필 수정 실패: {e}")
        return Response({
            'success': False,
            'message': '프로필 수정 중 오류가 발생했습니다.',
            'errors': {'non_field_errors': [str(e)]}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
EOF
success_msg "인증 뷰 생성 완료"

# apps/accounts/urls.py 생성
info_msg "인증 URL 패턴 생성 중..."
cat > backend/apps/accounts/urls.py << 'EOF'
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
]
EOF
success_msg "인증 URL 패턴 생성 완료"

# apps/accounts/admin.py 생성
info_msg "관리자 설정 생성 중..."
cat > backend/apps/accounts/admin.py << 'EOF'
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """사용자 관리자"""
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('추가 정보', {'fields': ('bio', 'avatar')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('추가 정보', {'fields': ('email', 'first_name', 'last_name')}),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """사용자 프로필 관리자"""
    list_display = ('user', 'phone', 'location', 'birth_date')
    search_fields = ('user__email', 'user__username', 'phone')
    list_filter = ('location',)
EOF
success_msg "관리자 설정 생성 완료"

# 4. 환경 변수 파일들 생성
progress_msg "🔐 4단계: 환경 변수 파일 생성"

# backend/.env 생성
info_msg "백엔드 환경 변수 파일 생성 중..."
cat > backend/.env << 'EOF'
# Django 기본 설정
SECRET_KEY=django-insecure-change-this-in-production-very-long-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# 데이터베이스 설정 (개발용 SQLite)
DATABASE_URL=sqlite:///db.sqlite3

# 프로덕션용 PostgreSQL (필요시 주석 해제)
# DB_NAME=prompthub
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# CORS 설정
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 이메일 설정 (프로덕션용)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your_email@gmail.com
# EMAIL_HOST_PASSWORD=your_app_password
EOF
success_msg "백엔드 환경 변수 파일 생성 완료"

# .env.local 생성 (프론트엔드용)
info_msg "프론트엔드 환경 변수 파일 생성 중..."
cat > .env.local << 'EOF'
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 앱 설정
NEXT_PUBLIC_APP_NAME=PromptHub
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_DESCRIPTION=AI 프롬프트 최적화 및 커뮤니티 플랫폼

# 개발 모드
NODE_ENV=development
EOF
success_msg "프론트엔드 환경 변수 파일 생성 완료"

# 5. 필수 파일들 생성
progress_msg "📄 5단계: 필수 파일들 생성"

# .gitignore 업데이트
info_msg ".gitignore 파일 업데이트 중..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
backend/venv/
backend/env/

# Environment variables
.env
.env.local
.env.production
backend/.env
backend/.env.local

# Database
backend/db.sqlite3
backend/*.db

# Django
backend/staticfiles/
backend/media/
backend/logs/*.log
backend/__pycache__/
backend/*/__pycache__/
backend/*/*/__pycache__/
backend/*/*/*/__pycache__/
*.pyc
*.pyo
*.pyd
__pycache__/
.Python

# Next.js
.next/
out/
build/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Coverage
coverage/
*.lcov

# Temporary files
*.tmp
*.temp
EOF
success_msg ".gitignore 파일 업데이트 완료"

# 6. 백엔드 의존성 설치 및 설정
progress_msg "🐍 6단계: 백엔드 설정"

cd backend

# 가상환경 생성
info_msg "Python 가상환경 생성 중..."
if [ ! -d "venv" ]; then
    python3 -m venv venv || handle_error "가상환경 생성 실패"
    success_msg "가상환경 생성 완료"
else
    warning_msg "가상환경이 이미 존재합니다"
fi

# 가상환경 활성화
info_msg "가상환경 활성화 중..."
source venv/bin/activate || handle_error "가상환경 활성화 실패"
success_msg "가상환경 활성화 완료"

# 의존성 설치
info_msg "Python 패키지 설치 중..."
pip install --upgrade pip
pip install -r requirements/development.txt || handle_error "패키지 설치 실패"
success_msg "Python 패키지 설치 완료"

# Django 설정 확인
info_msg "Django 설정 확인 중..."
python manage.py check || handle_error "Django 설정 오류"
success_msg "Django 설정 확인 완료"

# 마이그레이션 생성 및 적용
info_msg "데이터베이스 마이그레이션 중..."
python manage.py makemigrations accounts || handle_error "마이그레이션 생성 실패"
python manage.py migrate || handle_error "마이그레이션 적용 실패"
success_msg "데이터베이스 마이그레이션 완료"

# 정적 파일 수집
info_msg "정적 파일 수집 중..."
python manage.py collectstatic --noinput || warning_msg "정적 파일 수집 실패 (무시 가능)"

cd ..

# 7. 프론트엔드 의존성 설치
progress_msg "⚛️  7단계: 프론트엔드 설정"

# Node.js 의존성 설치
info_msg "Node.js 패키지 설치 중..."
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install || npm install || handle_error "패키지 설치 실패"
elif [ -f "yarn.lock" ]; then
    yarn install || npm install || handle_error "패키지 설치 실패"
else
    npm install || handle_error "패키지 설치 실패"
fi
success_msg "Node.js 패키지 설치 완료"

# Next.js 설정 확인
info_msg "Next.js 설정 확인 중..."
if [ -f "next.config.mjs" ]; then
    success_msg "Next.js 설정 파일 확인 완료"
else
    warning_msg "Next.js 설정 파일이 없습니다"
fi

# 8. 최종 확인 및 테스트
progress_msg "🧪 8단계: 최종 확인 및 테스트"

# 프로젝트 구조 확인
info_msg "프로젝트 구조 확인 중..."
if [ -d "backend/config" ] && [ -d "backend/apps" ] && [ -d "app" ] && [ -d "components" ]; then
    success_msg "프로젝트 구조 확인 완료"
else
    handle_error "프로젝트 구조가 올바르지 않습니다"
fi

# Django 서버 테스트 (빠른 확인)
info_msg "Django 서버 테스트 중..."
cd backend
source venv/bin/activate
timeout 5s python manage.py runserver --noreload > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2
if kill -0 $SERVER_PID 2>/dev/null; then
    kill $SERVER_PID
    success_msg "Django 서버 테스트 통과"
else
    warning_msg "Django 서버 테스트 실패 (수동 확인 필요)"
fi
cd ..

# 9. 실행 스크립트들 권한 부여
info_msg "실행 스크립트 권한 설정 중..."
chmod +x create_superuser.sh 2>/dev/null || true
chmod +x quick_start.sh 2>/dev/null || true
success_msg "실행 스크립트 권한 설정 완료"

# 10. 완료 메시지 및 다음 단계 안내
echo -e "\n${GREEN}🎉 PromptHub 프로젝트 설정이 완료되었습니다!${NC}"
echo "=================================================="

echo -e "\n${BLUE}📁 최종 프로젝트 구조:${NC}"
echo "prompthub/"
echo "├── app/                    # Next.js App Router"
echo "├── components/             # React 컴포넌트"
echo "├── lib/                   # 유틸리티 함수"
echo "├── hooks/                 # 커스텀 훅"
echo "├── types/                 # TypeScript 타입"
echo "├── backend/               # Django 백엔드"
echo "│   ├── config/           # Django 설정"
echo "│   ├── apps/             # Django 앱들"
echo "│   ├── requirements/     # Python 의존성"
echo "│   └── manage.py         # Django 관리"
echo "└── package.json          # Node.js 의존성"

echo -e "\n${BLUE}🚀 다음 단계:${NC}"
echo "----------------------------------------"
echo "1. 관리자 계정 생성:"
echo "   ./create_superuser.sh"
echo ""
echo "2. 서버 실행:"
echo "   ./quick_start.sh"
echo ""
echo "3. 브라우저에서 확인:"
echo "   - 프론트엔드: http://localhost:3000"
echo "   - 백엔드 관리자: http://localhost:8000/admin/"
echo "   - Debug Toolbar: 개발 중 자동 표시"

echo -e "\n${BLUE}💡 추가 명령어:${NC}"
echo "----------------------------------------"
echo "• 백엔드만 실행: cd backend && source venv/bin/activate && python manage.py runserver"
echo "• 프론트엔드만 실행: npm run dev"
echo "• Django 쉘: cd backend && source venv/bin/activate && python manage.py shell"
echo "• 새 마이그레이션: cd backend && source venv/bin/activate && python manage.py makemigrations"

echo -e "\n${GREEN}✅ 모든 설정이 완료되었습니다!${NC}"
echo -e "${GREEN}✅ Debug Toolbar 오류 해결됨!${NC}"
echo -e "${GREEN}✅ 회원가입 API 오류 수정됨!${NC}"
echo -e "${GREEN}✅ 상세한 에러 로깅 추가됨!${NC}"
echo -e "${GREEN}🎉 이제 완벽하게 작동하는 Django + Next.js 프로젝트입니다! 🚀${NC}"
