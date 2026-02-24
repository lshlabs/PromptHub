"""
트렌딩 모델들을 새로 생성된 AiModel과 연결하는 명령어
"""
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models.trending import TrendingRanking
from posts.models import Platform, AiModel


def normalize_key(value: str) -> str:
    return re.sub(r'[\s\-_]+', '', (value or '').strip().lower())


# 트렌딩 모델명 → (플랫폼명, 모델명) 매핑
TRENDING_MODEL_MAPPING = {
    # OpenAI 모델들
    'GPT-5': ('OpenAI', 'GPT-5'),
    'GPT 5.1': ('OpenAI', 'GPT 5.1'),
    'GPT 5.2': ('OpenAI', 'GPT 5.2'),
    'GPT oss 20b': ('OpenAI', 'GPT OSS 20B'),  
    'GPT oss 120b': ('OpenAI', 'GPT OSS 120B'),
    'GPT-4o': ('OpenAI', 'GPT-4o'),
    
    # xAI 모델들
    'Grok 4': ('xAI', 'Grok-4'),
    
    # Google 모델들  
    'Gemini 2.5 Pro': ('Google', 'Gemini 2.5 Pro'),
    'Gemini 3 Pro': ('Google', 'Gemini 3 Pro'),
    'Gemini 1.5 Flash': ('Google', 'Gemini 1.5 Flash'),
    'Gemma 3 27b': ('Google', 'Gemma 3 27B'),
    
    # Anthropic 모델들
    'Claude 4.1 Opus': ('Anthropic', 'Claude 4.1 Opus'),
    'Claude Opus 4.1': ('Anthropic', 'Claude 4.1 Opus'),
    'Claude 4 Sonnet': ('Anthropic', 'Claude 4 Sonnet'),
    'Claude 4 Opus': ('Anthropic', 'Claude 4 Opus'),
    'Claude Sonnet 4.5': ('Anthropic', 'Claude Sonnet 4.5'),
    'Claude Opus 4.5': ('Anthropic', 'Claude Opus 4.5'),
    
    # Meta 모델들
    'Llama 3.1 405b': ('Meta', 'Llama 3.1'),
    'Llama 3.3 70b': ('Meta', 'Llama 3.3'),
    'Llama 3.1 70b': ('Meta', 'Llama 3.1'),
    'Llama 3.1 8b': ('Meta', 'Llama 3.1'),
    'Llama 4 Scout': ('Meta', 'Llama 4 Scout'),
    
    # 기타 (매핑되지 않는 모델들)
    'Nova Micro': ('기타', '기타'),  # Amazon → 기타 플랫폼으로 매핑
    'Kimi K2 Thinking': ('기타', '기타'),  # Moonshot AI 플랫폼 미도입 환경 대응
}

TRENDING_MODEL_MAPPING_NORMALIZED = {
    normalize_key(key): value for key, value in TRENDING_MODEL_MAPPING.items()
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
                
                mapping = TRENDING_MODEL_MAPPING.get(model_name)
                if not mapping:
                    mapping = TRENDING_MODEL_MAPPING_NORMALIZED.get(normalize_key(model_name))

                if mapping:
                    platform_name, ai_model_name = mapping
                    
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
