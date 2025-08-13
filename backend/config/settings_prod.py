from .settings_base import *  # noqa

DEBUG = False

# SECURITY: override via environment in deployment
SECRET_KEY = 'django-insecure-change-me'

# Example hardened settings (adjust per infra)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False


