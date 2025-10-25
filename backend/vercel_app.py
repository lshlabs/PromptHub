"""
Vercel serverless function을 위한 Django 애플리케이션 엔트리 포인트
"""
import os
import sys
from pathlib import Path

# Django 프로젝트 경로를 Python path에 추가
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_prod')

import django
from django.core.wsgi import get_wsgi_application

# Django 초기화
django.setup()

# WSGI 애플리케이션
application = get_wsgi_application()

# Vercel 핸들러
app = application
