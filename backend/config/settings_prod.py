"""
일반적인 Production 환경 설정
Docker, Vercel 등 다양한 배포 플랫폼에서 사용 가능
"""
from .settings_base import *  # noqa
import dj_database_url
import os

DEBUG = False

# 환경변수에서 SECRET_KEY 가져오기
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')

# ALLOWED_HOSTS 설정
ALLOWED_HOSTS = [
    host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') 
    if host.strip()
]

# PostgreSQL 데이터베이스 설정
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
elif 'POSTGRES_URL' in os.environ:
    # Vercel Postgres 지원
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('POSTGRES_URL'))
    }
else:
    # 로컬 테스트용 SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000'
    ).split(',') if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:3000'
    ).split(',') if origin.strip()
]

# Production 보안 설정
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True  # HTTPS 강제
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1년
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files 최적화
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'


