"""
정확한 매칭 조건 설정 명령어
문제가 있던 트렌딩 모델들에 대해 정확한 매칭 조건을 적용합니다
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models.trending import TrendingRanking
from posts.models import AiModel, Platform


class Command(BaseCommand):
    help = '트렌딩 모델들에 정확한 매칭 조건을 설정합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제로 적용하지 않고 변경사항만 미리 확인',
        )

    def handle(self, *args, **options):
        """정확한 매칭 조건 설정 실행"""
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN 모드: 실제 변경사항은 적용되지 않습니다.'))
        
        # 설정할 매칭 조건들
        exact_matching_configs = [
            # GPT oss 모델들 - model_etc로 구분
            {
                'name': 'GPT oss 20b',
                'platform_name': 'OpenAI',
                'model_name': '기타',
                'use_exact_matching': True,
                'model_etc_contains': 'GPT oss 20b',
                'model_detail_contains': '',
            },
            {
                'name': 'GPT oss 120b', 
                'platform_name': 'OpenAI',
                'model_name': '기타',
                'use_exact_matching': True,
                'model_etc_contains': 'GPT oss 120b',
                'model_detail_contains': '',
            },
            # Claude 4 모델들 - model_detail로 구분
            {
                'name': 'Claude 4 Sonnet',
                'platform_name': 'Anthropic',
                'model_name': 'Claude 4',
                'use_exact_matching': True,
                'model_etc_contains': '',
                'model_detail_contains': 'Sonnet',
            },
            {
                'name': 'Claude 4 Opus',
                'platform_name': 'Anthropic', 
                'model_name': 'Claude 4',
                'use_exact_matching': True,
                'model_etc_contains': '',
                'model_detail_contains': 'Opus',
            },
        ]
        
        try:
            with transaction.atomic():
                updated_count = 0
                created_models = 0
                
                for config in exact_matching_configs:
                    # 트렌딩 랭킹 찾기
                    trending = TrendingRanking.objects.filter(
                        name=config['name'],
                        is_active=True
                    ).first()
                    
                    if not trending:
                        self.stdout.write(
                            self.style.WARNING(f'트렌딩 랭킹을 찾을 수 없습니다: {config["name"]}')
                        )
                        continue
                    
                    # 플랫폼과 모델 찾기 (없으면 생성)
                    platform, created_platform = Platform.objects.get_or_create(
                        name=config['platform_name']
                    )
                    if created_platform:
                        created_models += 1
                        self.stdout.write(f'플랫폼 생성: {platform.name}')
                    
                    ai_model, created_model = AiModel.objects.get_or_create(
                        platform=platform,
                        name=config['model_name']
                    )
                    if created_model:
                        created_models += 1
                        self.stdout.write(f'모델 생성: {ai_model.platform.name} - {ai_model.name}')
                    
                    # 정확한 매칭 조건 설정
                    if not dry_run:
                        trending.related_model = ai_model
                        trending.use_exact_matching = config['use_exact_matching']
                        trending.model_detail_contains = config['model_detail_contains']
                        trending.model_etc_contains = config['model_etc_contains']
                        trending.save()
                    
                    # 현재 상태와 변경될 상태 표시
                    current_posts = trending.get_filtered_posts().count()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {trending.name}: '
                            f'정확한 매칭 {"적용" if config["use_exact_matching"] else "해제"} '
                            f'→ {current_posts}개 게시글'
                        )
                    )
                    
                    if config['model_detail_contains']:
                        self.stdout.write(f'  - 상세명 조건: "{config["model_detail_contains"]}"')
                    if config['model_etc_contains']:
                        self.stdout.write(f'  - 기타명 조건: "{config["model_etc_contains"]}"')
                    
                    updated_count += 1
                
                if dry_run:
                    # DRY RUN인 경우 롤백
                    transaction.set_rollback(True)
                    self.stdout.write(
                        self.style.WARNING(f'DRY RUN 완료: {updated_count}개 항목 변경 예정')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'정확한 매칭 설정 완료! '
                            f'{updated_count}개 트렌딩 랭킹 업데이트, '
                            f'{created_models}개 새 모델 생성'
                        )
                    )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'설정 중 오류 발생: {str(e)}')
            )

    def get_posts_preview(self, trending_ranking, config):
        """매칭 조건 적용 시 어떤 게시글들이 매칭될지 미리보기"""
        # 임시로 조건 설정해서 테스트
        old_exact = trending_ranking.use_exact_matching
        old_detail = trending_ranking.model_detail_contains  
        old_etc = trending_ranking.model_etc_contains
        
        try:
            trending_ranking.use_exact_matching = config['use_exact_matching']
            trending_ranking.model_detail_contains = config['model_detail_contains']
            trending_ranking.model_etc_contains = config['model_etc_contains']
            
            return trending_ranking.get_filtered_posts().count()
        finally:
            # 원래 값으로 복원
            trending_ranking.use_exact_matching = old_exact
            trending_ranking.model_detail_contains = old_detail
            trending_ranking.model_etc_contains = old_etc
