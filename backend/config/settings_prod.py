from .settings_base import *  # noqa
import dj_database_url
import os
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

def require_env(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise ImproperlyConfigured(f"Missing required environment variable: {name}")
    return value


def env_csv(name: str) -> list[str]:
    return [item.strip() for item in require_env(name).split(',') if item.strip()]


SECRET_KEY = os.getenv('SECRET_KEY') or require_env('DJANGO_SECRET_KEY')

ALLOWED_HOSTS = env_csv('DJANGO_ALLOWED_HOSTS')

database_url = os.getenv('DATABASE_URL', '').strip()
postgres_url = os.getenv('POSTGRES_URL', '').strip()

if database_url:
    DATABASES = {
        'default': dj_database_url.parse(database_url)
    }
elif postgres_url:
    DATABASES = {
        'default': dj_database_url.parse(postgres_url)
    }
else:
    raise ImproperlyConfigured("Missing required environment variable: DATABASE_URL or POSTGRES_URL")

CORS_ALLOWED_ORIGINS = env_csv('CORS_ALLOWED_ORIGINS')

CSRF_TRUSTED_ORIGINS = env_csv('CSRF_TRUSTED_ORIGINS')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

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
