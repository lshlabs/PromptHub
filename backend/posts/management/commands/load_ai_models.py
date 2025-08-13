"""
주요 AI 모델들을 데이터베이스에 출시일(또는 출시 순서) 오름차순으로 등록하는 명령어
제공받은 목록을 기반으로 플랫폼/모델을 생성합니다.

사용 예시:
  - 기본 내장 목록 사용:    manage.py load_ai_models
  - JSON에서 로드:         manage.py load_ai_models --file backend/posts/fixtures/platform_models.openai.json
  - 초기화 후 재생성:      manage.py load_ai_models --reset
  - JSON + 초기화:         manage.py load_ai_models --file path.json --reset
"""
import json
from typing import Dict, List, Any
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from posts.models import Platform, AiModel


PLATFORM_MODELS = {
    # 출시 순서: 낮을수록 먼저
    'OpenAI': [
        ('GPT-3.5 Turbo', 0),
        ('GPT-4', 0),
        ('GPT-4 Turbo', 0),
        ('GPT-4.1', 0),
        ('GPT-4.1 mini', 0),
        ('GPT-4.1 nano', 0),
        ('GPT-4.5', 0),
        ('GPT-4o', 0),
        ('GPT-4o mini', 0),
        ('o1', 0),
        ('o3', 0),
        ('o3-mini', 0),
        ('o3-pro', 0),
        ('o4-mini', 0),
        ('GPT OSS 20B', 0),
        ('GPT OSS 120B', 0),
        ('GPT-5 nano', 0),
        ('GPT-5 mini', 0),
        ('GPT-5', 0),
        ('기타', 0),
    ],
    'Anthropic': [
        ('Claude 3 Haiku', 1),
        ('Claude 3 Sonnet', 2),
        ('Claude 3 Opus', 3),
        ('Claude 3.5 Haiku', 4),
        ('Claude 3.5 Sonnet', 5),
        ('Claude 3.7 Sonnet', 6),
        ('Claude 4 Sonnet', 7),
        ('Claude 4 Opus', 8),
        ('Claude 4.1 Opus', 9),
        ('기타', 10),
    ],
    'Google': [
        ('Gemini 1.0 Pro', 1),
        ('Gemini 1.5 Pro', 2),
        ('Gemini 1.5 Flash', 3),
        ('Gemini 1.5 Flash 8B', 4),
        ('Gemini 2.0 Flash', 5),
        ('Gemni 2.0 Flash-Lite', 6),
        ('Gemini 2.0 Flash Thinking', 7),
        ('Gemini 2.5 Pro Preview 06-05', 8),
        ('Gemini 2.5 Pro', 9),
        ('Gemini 2.5 Flash', 10),
        ('Gemini 2.5 Flash-Lite', 11),
        ('Gemma 2 9B', 12),
        ('Gemma 2 27B', 13),
        ('Gemma 3 1B', 14),
        ('Gemma 3 4B', 15),
        ('Gemma 3 12B', 16),
        ('Gemma 3 27B', 17),
        ('Gemma 3n E2B', 18),
        ('Gemma 3n E2B Instructed', 19),
        ('Gemma 3n E2B Instructed LiteRT (Preview)', 20),
        ('Gemma 3n E4B', 21),
        ('Gemma 3n E4B Instructed', 22),
        ('Gemma 3n E4B Instructed LiteRT Preview', 23),
        ('MedGemma 4B IT', 24),
        ('Gemini Diffusion', 25),
        ('기타', 26),
    ],
    'xAI': [
        ('Grok-1.5', 1),
        ('Grok-1.5V', 2),
        ('Grok-2 mini', 3),
        ('Grok-2', 4),
        ('Grok-3 Mini', 5),
        ('Grok-3', 6),
        ('Grok-4', 7),
        ('Grok-4 Heavy', 8),
        ('기타', 9),
    ],
    'Meta': [
        ('Llama 3.1 8B Instruct', 1),
        ('Llama 3.1 70B Instruct', 2),
        ('Llama 3.1 405B Instruct', 3),
        ('Llama 3.2 3B Instruct', 4),
        ('Llama 3.2 11B Instruct', 5),
        ('Llama 3.2 90B Instruct', 6),
        ('Llama 3.3 70B Instruct', 7),
        ('Llama 4 Maverick', 8),
        ('Llama 4 Scout', 9),
        ('기타', 10),
    ],
    'Mistral': [
        ('Magistral Small 2506', 1),
        ('Magistral Medium', 2),
        ('Devstral Small 1.1', 3),
        ('Devstral Medium', 4),
        ('Mistral Small', 5),
        ('Mistral Small 3 24B Base', 6),
        ('Mistral Small 3.1 24B Base', 7),
        ('Mistral Small 3 24B Instruct', 8),
        ('Mistral Small 3.1 24B Instruct', 9),
        ('Mistral Small 3.2 24B Instruct', 10),
        ('Mistral NeMo Instruct', 11),
        ('Mistral Large 2', 12),
        ('Pixtral-12B', 13),
        ('Pixtral Large', 14),
        ('Codestral-22B', 15),
        ('기타', 16),
    ],
    'Qwen': [
        ('Qwen2 7B Instruct', 1),
        ('Qwen2 72B Instruct', 2),
        ('Qwen2-VL-72B-Instruct', 3),
        ('Qwen2.5 7B Instruct', 4),
        ('Qwen2.5 14B Instruct', 5),
        ('Qwen2.5 32B Instruct', 6),
        ('Qwen2.5 72B Instruct', 7),
        ('Qwen2.5 VL 7B Instruct', 8),
        ('Qwen2.5 VL 32B Instruct', 9),
        ('Qwen2.5 VL 72B Instruct', 10),
        ('Qwen2.5-Coder 7B Instruct', 11),
        ('Qwen2.5-Coder 32B Instruct', 12),
        ('QwQ-32B', 13),
        ('QwQ-32B-Preview', 14),
        ('QvQ-72B-Preview', 15),
        ('Qwen3 30B A3B', 16),
        ('Qwen3 32B', 17),
        ('Qwen3 235B A22B', 18),
        ('Qwen3-235B-A22B-Instruct-2507', 19),
        ('Qwen3 30B A3B', 20),
        ('Qwen3 32B', 21),
        ('기타', 22),
    ],
    'DeepSeek': [
        ('DeepSeek R1 Distill Qwen 1.5B', 1),
        ('DeepSeek R1 Distill Qwen 7B', 2),
        ('DeepSeek R1 Distill Qwen 14B', 3),
        ('DeepSeek R1 Distill Qwen 32B', 4),
        ('DeepSeek R1 Distill Llama 8B', 5),
        ('DeepSeek R1 Distill Llama 70B', 6),
        ('DeepSeek-R1', 7),
        ('DeepSeek-R1-0528', 8),
        ('DeepSeek R1 Zero', 9),
        ('DeepSeek-V2.5', 10),
        ('DeepSeek-V3', 11),
        ('DeepSeek-V3 0324', 12),
        ('DeepSeek VL2 Tiny', 13),
        ('DeepSeek VL2 Small', 14),
        ('DeepSeek VL2', 15),
        ('기타', 16),
    ],
    'Other': [
        ('기타', 1),
    ],
}


class Command(BaseCommand):
    help = '플랫폼/모델을 출시 순서대로 대량 등록합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='기존 플랫폼/모델 데이터를 모두 삭제하고 새로 생성합니다',
        )
        parser.add_argument(
            '--file',
            type=str,
            default='',
            help='플랫폼/모델 정보가 담긴 JSON 파일 경로(미지정 시 내장 목록 사용)',
        )

    def _load_from_json(self, file_path: str) -> Dict[str, List[Any]]:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        loaded: Dict[str, List[Any]] = {}
        platforms = data.get('platforms', [])
        for p in platforms:
            name = p.get('name')
            models = p.get('models', [])
            # JSON에는 각 플랫폼에 모델 배열이 존재한다고 가정
            loaded[name] = []
            for m in models:
                m_name = m.get('name')
                # released_order 폐기: 정렬값 미사용, sort_order(선택)만 허용
                variant_free_text_allowed = bool(m.get('variant_free_text_allowed', True))
                slug = m.get('slug') or slugify(m_name)
                sort_order = int(m.get('sort_order', 0))
                loaded[name].append({
                    'name': m_name,
                    'variant_free_text_allowed': variant_free_text_allowed,
                    'slug': slug,
                    'sort_order': sort_order,
                })
        return loaded

    def handle(self, *args, **options):
        reset = options['reset']
        json_file = options.get('file') or ''

        if reset:
            self.stdout.write(
                self.style.WARNING('기존 플랫폼/모델 데이터를 삭제합니다...')
            )
            # AiModel을 먼저 삭제 (외래키 제약 조건 때문에)
            deleted_models = AiModel.objects.count()
            AiModel.objects.all().delete()

            # Platform 삭제
            deleted_platforms = Platform.objects.count()
            Platform.objects.all().delete()

            # SQLite의 auto increment 값을 리셋
            from django.db import connection
            with connection.cursor() as cursor:
                # SQLite의 sqlite_sequence 테이블에서 auto increment 값 리셋
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='posts_platform'")
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='posts_aimodel'")

            self.stdout.write(
                self.style.SUCCESS(
                    f'삭제 완료: 플랫폼 {deleted_platforms}개, 모델 {deleted_models}개'
                )
            )
            self.stdout.write(
                self.style.SUCCESS('Auto increment 값이 리셋되었습니다.')
            )

        # 데이터 소스 결정
        if json_file:
            try:
                source = self._load_from_json(json_file)
                self.stdout.write(self.style.WARNING(f'JSON 파일에서 로드: {json_file}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'JSON 로드 실패: {e}'))
                return
        else:
            # 기존 상수 → 내부적으로 동일 포맷으로 변환
            source = {}
            for platform_name, models in PLATFORM_MODELS.items():
                source[platform_name] = [
                    {
                        'name': model_name,
                        'variant_free_text_allowed': (model_name != '기타'),
                        'slug': slugify(model_name) if model_name != '기타' else 'other',
                        'sort_order': 0,
                    }
                    for (model_name, order) in models
                ]

        created_platforms = 0
        created_models = 0
        updated_models = 0
        with transaction.atomic():
            for platform_name, models in source.items():
                platform, p_created = Platform.objects.get_or_create(name=platform_name)
                if p_created:
                    created_platforms += 1
                    self.stdout.write(self.style.SUCCESS(f"플랫폼 생성: {platform_name}"))
                # slug 보정: 비어있으면 저장하여 자동 슬러그 생성
                if not platform.slug:
                    platform.save(update_fields=['slug'])

                for m in models:
                    model_name = m['name']
                    vfta = bool(m.get('variant_free_text_allowed', True))
                    slug_val = m.get('slug') or slugify(model_name)
                    sort_order = int(m.get('sort_order', 0))

                    aimodel, m_created = AiModel.objects.get_or_create(
                        platform=platform,
                        name=model_name,
                        defaults={
                            'variant_free_text_allowed': vfta,
                            'slug': slug_val,
                            'sort_order': sort_order,
                        }
                    )
                    if m_created:
                        created_models += 1
                    else:
                        changed = False
                    # 플랫폼 변경 없이 이름 동일 레코드 기준으로만 업데이트
                        if aimodel.variant_free_text_allowed != vfta:
                            aimodel.variant_free_text_allowed = vfta
                            changed = True
                        # slug 보정: 비어있으면 채움
                        if not aimodel.slug:
                            aimodel.slug = slug_val
                            changed = True
                        # sort_order 업데이트
                        if aimodel.sort_order != sort_order:
                            aimodel.sort_order = sort_order
                            changed = True
                        # '기타' 모델은 상세 자유 입력 금지 보정
                        if aimodel.name == '기타' and aimodel.variant_free_text_allowed:
                            aimodel.variant_free_text_allowed = False
                            changed = True
                        if changed:
                            aimodel.save(update_fields=['variant_free_text_allowed', 'slug', 'sort_order'])
                            updated_models += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"완료: 플랫폼 {created_platforms}개 생성, 모델 {created_models}개 생성, {updated_models}개 업데이트"
            )
        )


