"""
트렌딩 모델들을 새로 생성된 AiModel과 연결하는 명령어
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models.trending import TrendingRanking
from posts.models import Platform, AiModel


# 트렌딩 모델명 → (플랫폼명, 모델명) 매핑
TRENDING_MODEL_MAPPING = {
    # OpenAI 모델들
    'GPT-5': ('OpenAI', 'GPT-5'),
    'GPT oss 20b': ('OpenAI', 'GPT OSS 20B'),  
    'GPT oss 120b': ('OpenAI', 'GPT OSS 120B'),
    'GPT-4o': ('OpenAI', 'GPT-4o'),
    
    # xAI 모델들
    'Grok 4': ('xAI', 'Grok-4'),
    
    # Google 모델들  
    'Gemini 2.5 Pro': ('Google', 'Gemini 2.5 Pro'),
    'Gemini 1.5 Flash': ('Google', 'Gemini 1.5 Flash'),
    'Gemma 3 27b': ('Google', 'Gemma 3 27B'),
    
    # Anthropic 모델들
    'Claude 4.1 Opus': ('Anthropic', 'Claude 4.1 Opus'),
    'Claude 4 Sonnet': ('Anthropic', 'Claude 4 Sonnet'),
    'Claude 4 Opus': ('Anthropic', 'Claude 4 Opus'),
    
    # Meta 모델들
    'Llama 3.1 405b': ('Meta', 'Llama 3.1 405B Instruct'),
    'Llama 3.3 70b': ('Meta', 'Llama 3.3 70B Instruct'),  
    'Llama 3.1 70b': ('Meta', 'Llama 3.1 70B Instruct'),
    'Llama 3.1 8b': ('Meta', 'Llama 3.1 8B Instruct'),
    'Llama 4 Scout': ('Meta', 'Llama 4 Scout'),
    
    # 기타 (매핑되지 않는 모델들)
    'Nova Micro': ('Other', '기타'),  # Amazon → Other로 매핑
}


class Command(BaseCommand):
    help = '트렌딩 모델들을 새로 생성된 AiModel과 연결합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제로 적용하지 않고 변경사항만 미리 확인',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN 모드: 실제 변경사항은 적용되지 않습니다.'))
        
        linked_count = 0
        skipped_count = 0
        
        trending_models = TrendingRanking.objects.filter(is_active=True)
        
        with transaction.atomic():
            for trending in trending_models:
                model_name = trending.name
                
                if model_name in TRENDING_MODEL_MAPPING:
                    platform_name, ai_model_name = TRENDING_MODEL_MAPPING[model_name]
                    
                    try:
                        platform = Platform.objects.get(name=platform_name)
                        ai_model = AiModel.objects.get(platform=platform, name=ai_model_name)
                        
                        if not dry_run:
                            # 정확한 매칭 설정 초기화 (단순한 모델 매칭으로 전환)
                            trending.related_model = ai_model
                            trending.use_exact_matching = False
                            trending.model_detail_contains = ''
                            trending.model_etc_contains = ''
                            trending.save()
                        
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ {trending.name} → {platform_name} - {ai_model_name}'
                            )
                        )
                        linked_count += 1
                        
                    except (Platform.DoesNotExist, AiModel.DoesNotExist):
                        self.stdout.write(
                            self.style.ERROR(
                                f'✗ {trending.name}: {platform_name} - {ai_model_name} 모델을 찾을 수 없습니다'
                            )
                        )
                        skipped_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠ {trending.name}: 매핑 정보가 없습니다'
                        )
                    )
                    skipped_count += 1
            
            if dry_run:
                transaction.set_rollback(True)
                self.stdout.write(
                    self.style.WARNING(f'DRY RUN 완료: {linked_count}개 연결 예정, {skipped_count}개 건너뜀')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'연결 완료: {linked_count}개 성공, {skipped_count}개 건너뜀'
                    )
                )
