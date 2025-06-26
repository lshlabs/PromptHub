#!/usr/bin/env python
"""
프로젝트 초기 설정 스크립트
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Django 환경 설정"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')
    django.setup()

def run_migrations():
    """데이터베이스 마이그레이션 실행"""
    print("🔄 데이터베이스 마이그레이션을 실행합니다...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    execute_from_command_line(['manage.py', 'migrate'])
    print("✅ 마이그레이션이 완료되었습니다.")

def create_superuser():
    """슈퍼유저 생성"""
    print("👤 관리자 계정을 생성합니다...")
    try:
        execute_from_command_line(['manage.py', 'createsuperuser'])
        print("✅ 관리자 계정이 생성되었습니다.")
    except KeyboardInterrupt:
        print("❌ 관리자 계정 생성이 취소되었습니다.")

def collect_static():
    """정적 파일 수집"""
    print("📁 정적 파일을 수집합니다...")
    execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
    print("✅ 정적 파일 수집이 완료되었습니다.")

if __name__ == '__main__':
    print("🚀 PromptHub 백엔드 프로젝트 설정을 시작합니다...")
    
    setup_django()
    run_migrations()
    
    create_superuser_choice = input("관리자 계정을 생성하시겠습니까? (y/N): ")
    if create_superuser_choice.lower() == 'y':
        create_superuser()
    
    print("🎉 프로젝트 설정이 완료되었습니다!")
    print("📝 다음 명령어로 서버를 실행하세요:")
    print("   cd backend && python manage.py runserver")
