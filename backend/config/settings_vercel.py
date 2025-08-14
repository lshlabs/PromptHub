"""
Vercel 배포용 Django 설정
Serverless function 환경에 최적화된 설정
"""
from .settings_base import *
import os
import dj_database_url

# DEBUG는 항상 False (production)
DEBUG = False

# SECRET_KEY 설정 (Vercel 환경변수에서 가져오기)
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')

# ALLOWED_HOSTS 설정 (Vercel 도메인 허용)
ALLOWED_HOSTS = [
    '.vercel.app',  # 모든 Vercel 앱 도메인
    'localhost',
    '127.0.0.1',
]

# 환경변수에서 추가 호스트 허용
if 'DJANGO_ALLOWED_HOSTS' in os.environ:
    ALLOWED_HOSTS.extend([
        host.strip() for host in os.environ['DJANGO_ALLOWED_HOSTS'].split(',') 
        if host.strip()
    ])

# 데이터베이스 설정 (Vercel Postgres)
if 'POSTGRES_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('POSTGRES_URL'))
    }
elif 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
else:
    # 로컬 테스트용 SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Static files 설정 (Vercel 최적화)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Serverless 환경 최적화
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# CORS 설정 (Vercel 도메인 허용)
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000'
    ).split(',') if origin.strip()
]

# Vercel 프론트엔드 도메인 자동 허용
if 'VERCEL_URL' in os.environ:
    vercel_url = f"https://{os.environ['VERCEL_URL']}"
    CORS_ALLOWED_ORIGINS.append(vercel_url)
    CSRF_TRUSTED_ORIGINS = [vercel_url]

# 보안 설정 (HTTPS 강제)
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 로깅 설정 (Vercel 로그에 최적화)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
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

# Serverless 환경에서 migration 자동 실행 방지
# (Vercel에서는 별도로 관리)
MIGRATION_MODULES = {}
