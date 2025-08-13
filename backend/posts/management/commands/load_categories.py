"""
카테고리 데이터를 로드하는 Django 관리 명령어

사용법:
    python manage.py load_categories --reset
    
옵션:
    --reset: 기존 카테고리 데이터를 모두 삭제하고 새로 생성
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from posts.models import Category


class Command(BaseCommand):
    help = '카테고리를 ID 1부터 시작하여 11개로 재구성합니다.'
    
    # 11개 카테고리 정의 (순서대로 ID 1-11 할당)
    CATEGORIES = [
        '코딩/프로그래밍',
        '일반지식/학습',
        '글쓰기/번역', 
        'AI/자연어처리',
        '취업/커리어',
        '생활정보/상담',
        '문화/엔터테인먼트/게임',
        '비즈니스/경제',
        '기술문서/요약',
        '데이터분석/통계',
        '기타',
    ]
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='기존 카테고리 데이터를 모두 삭제하고 새로 생성합니다',
        )
    
    def handle(self, *args, **options):
        reset = options['reset']
        
        if reset:
            self.stdout.write(
                self.style.WARNING('기존 카테고리 데이터를 삭제합니다...')
            )
            
            # 기존 카테고리 삭제
            deleted_categories = Category.objects.count()
            Category.objects.all().delete()
            
            # SQLite의 auto increment 값을 리셋
            from django.db import connection
            with connection.cursor() as cursor:
                # SQLite의 sqlite_sequence 테이블에서 auto increment 값 리셋
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='posts_category'")
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'삭제 완료: 카테고리 {deleted_categories}개'
                )
            )
            self.stdout.write(
                self.style.SUCCESS('Auto increment 값이 리셋되었습니다.')
            )
        
        created_categories = 0
        
        with transaction.atomic():
            for order, category_name in enumerate(self.CATEGORIES, 1):
                category, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={}
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'카테고리 생성: {category.name} (ID: {category.id})')
                    )
                    created_categories += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'카테고리 이미 존재: {category.name} (ID: {category.id})')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'완료: 카테고리 {created_categories}개 생성'
            )
        )
        
        # 결과 확인
        self.stdout.write('\n현재 카테고리 목록:')
        for category in Category.objects.all():
            self.stdout.write(f'ID {category.id}: {category.name}')
