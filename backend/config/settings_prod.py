from .settings_base import *  # noqa
import dj_database_url
import os

DEBUG = False

# 환경변수에서 SECRET_KEY 가져오기 (render에서 설정 필요)
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')

# render.com을 위한 ALLOWED_HOSTS 설정
ALLOWED_HOSTS = [
    host for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if host
]

# render.com 자동 도메인 허용
import re
if 'RENDER' in os.environ:
    # render.com에서 자동 생성되는 도메인 패턴 허용
    ALLOWED_HOSTS.extend([
        '.onrender.com',  # 모든 onrender.com 서브도메인 허용
        'prompthub-n9y3.onrender.com',  # 현재 도메인 명시적 허용
    ])
    
# 개발 환경 호스트도 추가
if DEBUG:
    ALLOWED_HOSTS.extend(['localhost', '127.0.0.1', '0.0.0.0'])

# PostgreSQL 데이터베이스 설정 (render 자동 제공)
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
else:
    # fallback to SQLite for local testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS 및 CSRF 설정 업데이트
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

# Security settings for production
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False  # render가 SSL을 처리하므로 False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False


