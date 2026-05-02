import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key")
os.environ.setdefault("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("CSRF_TRUSTED_ORIGINS", "http://localhost,http://testserver")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost,http://testserver")

from .settings_base import *  # noqa

# Tests must never depend on externally provisioned databases.
DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

# Speed up tests while preserving behavior.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Isolate test runtime from external services.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
