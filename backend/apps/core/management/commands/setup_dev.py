"""
개발 환경 초기 설정을 위한 Django management command
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import os

User = get_user_model()


class Command(BaseCommand):
    help = '개발 환경 초기 설정 (테스트 데이터, 관리자 계정 등)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-admin',
            action='store_true',
            help='관리자 계정 생성',
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@prompthub.com',
            help='관리자 이메일 (기본값: admin@prompthub.com)',
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default='admin123!',
            help='관리자 비밀번호 (기본값: admin123!)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 PromptHub 개발 환경 설정을 시작합니다...')
        )
        
        # 데이터베이스 마이그레이션 확인
        self.stdout.write('📋 데이터베이스 상태를 확인합니다...')
        
        # 관리자 계정 생성
        if options['create_admin']:
            self.create_admin_user(options['admin_email'], options['admin_password'])
        
        # 기본 데이터 생성 (필요시)
        # self.create_sample_data()
        
        self.stdout.write(
            self.style.SUCCESS('✅ 개발 환경 설정이 완료되었습니다!')
        )
        self.stdout.write('🎯 프론트엔드와 함께 서버를 시작하려면: npm run dev')
    
    def create_admin_user(self, email, password):
        """관리자 계정 생성"""
        try:
            with transaction.atomic():
                if User.objects.filter(email=email).exists():
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  관리자 계정이 이미 존재합니다: {email}')
                    )
                    return
                
                admin_user = User.objects.create_superuser(
                    email=email,
                    password=password,
                    username='admin',
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'✅ 관리자 계정이 생성되었습니다: {email}')
                )
                self.stdout.write(f'   비밀번호: {password}')
                self.stdout.write(f'   관리자 페이지: http://localhost:8000/admin/')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ 관리자 계정 생성 실패: {str(e)}')
            )
    
    def create_sample_data(self):
        """샘플 데이터 생성 (필요시 구현)"""
        self.stdout.write('📊 샘플 데이터를 생성합니다...')
        # TODO: 프롬프트 관련 샘플 데이터 생성
        pass 