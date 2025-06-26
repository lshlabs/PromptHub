#!/usr/bin/env python
"""Django의 명령줄 유틸리티 - Monorepo 구조용"""
import os
import sys

if __name__ == '__main__':
    # 백엔드 디렉토리를 Python 경로에 추가
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Django를 가져올 수 없습니다. 가상환경이 활성화되어 있고 "
            "Django가 설치되어 있는지 확인하세요."
        ) from exc
    execute_from_command_line(sys.argv)
