import json
from typing import Dict, List, Any
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
from posts.models import Platform, AiModel


PLATFORM_MODELS = {
    'OpenAI': [
        ('GPT-5.4', 1),
        ('GPT-5.3', 2),
        ('GPT-5 mini', 3),
        ('o3', 4),
        ('GPT-5.2', 5),
    ],
    'Anthropic': [
        ('Claude Opus 4.6', 1),
        ('Claude Sonnet 4.6', 2),
        ('Claude Opus 4.5', 3),
        ('Claude Sonnet 4.5', 4),
        ('Claude Haiku 4.5', 5),
    ],
    'Google': [
        ('Gemini 3.1 Pro', 1),
        ('Gemini 3.1 Deep Think', 2),
        ('Gemini 3.1 Flash', 3),
        ('Gemini 3 Pro', 4),
        ('Gemini 2.5 Pro', 5),
    ],
    'Meta': [
        ('Llama 4 Maverick', 1),
        ('Llama 4 Scout', 2),
        ('Llama 4 Behemoth', 3),
        ('Llama 3.3 70B', 4),
        ('Llama 3.1 405B', 5),
    ],
    'xAI': [
        ('Grok 4.20 Beta', 1),
        ('Grok 4.1', 2),
        ('Grok 4.1 Fast', 3),
        ('Grok 4', 4),
        ('Grok 3', 5),
    ],
    'Mistral': [
        ('Mistral Large 3', 1),
        ('Magistral Medium 1.2', 2),
        ('Mistral Medium 3.1', 3),
        ('Ministral 14B', 4),
        ('Devstral 2', 5),
    ],
    'DeepSeek': [
        ('DeepSeek V3.2', 1),
        ('DeepSeek V3.2-Exp', 2),
        ('DeepSeek R1', 3),
        ('DeepSeek V3', 4),
        ('DeepSeek R1-0528', 5),
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
            loaded[name] = []
            for m in models:
                m_name = m.get('name')
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
            deleted_models = AiModel.objects.count()
            AiModel.objects.all().delete()

            deleted_platforms = Platform.objects.count()
            Platform.objects.all().delete()

            from django.db import connection
            with connection.cursor() as cursor:
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

        if json_file:
            try:
                source = self._load_from_json(json_file)
                self.stdout.write(self.style.WARNING(f'JSON 파일에서 로드: {json_file}'))
            except (FileNotFoundError, OSError, ValueError) as e:
                raise CommandError(f'JSON 로드 실패: {e}') from e
        else:
            source = {}
            for platform_name, models in PLATFORM_MODELS.items():
                source[platform_name] = [
                    {
                        'name': model_name,
                        'variant_free_text_allowed': (model_name != '기타'),
                        'slug': slugify(model_name) if model_name != '기타' else 'other',
                        'sort_order': 0,
                    }
                    for (model_name, _) in models
                ]

        created_platforms = 0
        created_models = 0
        updated_models = 0
        aimodel_field_names = {f.name for f in AiModel._meta.get_fields()}
        supports_variant_free_text = 'variant_free_text_allowed' in aimodel_field_names
        with transaction.atomic():
            for platform_name, models in source.items():
                platform, p_created = Platform.objects.get_or_create(name=platform_name)
                if p_created:
                    created_platforms += 1
                    self.stdout.write(self.style.SUCCESS(f"플랫폼 생성: {platform_name}"))
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
                        defaults=(
                            {
                                'slug': slug_val,
                                'sort_order': sort_order,
                                **(
                                    {'variant_free_text_allowed': vfta}
                                    if supports_variant_free_text
                                    else {}
                                ),
                            }
                        )
                    )
                    if m_created:
                        created_models += 1
                    else:
                        changed = False
                        if supports_variant_free_text and aimodel.variant_free_text_allowed != vfta:
                            aimodel.variant_free_text_allowed = vfta
                            changed = True
                        if not aimodel.slug:
                            aimodel.slug = slug_val
                            changed = True
                        if aimodel.sort_order != sort_order:
                            aimodel.sort_order = sort_order
                            changed = True
                        if (
                            supports_variant_free_text
                            and aimodel.name == '기타'
                            and aimodel.variant_free_text_allowed
                        ):
                            aimodel.variant_free_text_allowed = False
                            changed = True
                        if changed:
                            update_fields = ['slug', 'sort_order']
                            if supports_variant_free_text:
                                update_fields.insert(0, 'variant_free_text_allowed')
                            aimodel.save(update_fields=update_fields)
                            updated_models += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"완료: 플랫폼 {created_platforms}개 생성, 모델 {created_models}개 생성, {updated_models}개 업데이트"
            )
        )
