"""
일반적인 Production 환경 설정
Docker, Render 등 다양한 배포 플랫폼에서 사용 가능
"""
from .settings_base import *  # noqa
import dj_database_url
import os

DEBUG = False

# 환경변수에서 SECRET_KEY 가져오기 (기존 키명 호환)
SECRET_KEY = os.getenv('SECRET_KEY') or os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me')

# ALLOWED_HOSTS 설정
ALLOWED_HOSTS = [
    host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') 
    if host.strip()
]

# PostgreSQL 데이터베이스 설정
database_url = os.getenv('DATABASE_URL', '').strip()
postgres_url = os.getenv('POSTGRES_URL', '').strip()

if database_url:
    DATABASES = {
        'default': dj_database_url.parse(database_url)
    }
elif postgres_url:
    # 보조 호환 키 (기존 환경)
    DATABASES = {
        'default': dj_database_url.parse(postgres_url)
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

# Static files 최적화 (Render/Django 단독 서빙 대비)
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Cloudinary (선택: 프로필/미디어 파일 영구 저장)
USE_CLOUDINARY = all(
    os.getenv(key)
    for key in (
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    )
)

if USE_CLOUDINARY:
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
        'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    }
    STORAGES['default'] = {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
    }
