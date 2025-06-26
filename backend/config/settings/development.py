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
