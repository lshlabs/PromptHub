from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import DatabaseError

from posts.models import AiModel, Platform


PLATFORM_MODEL_DEFINITIONS: dict[str, list[str]] = {
    'OpenAI': ['GPT-5.4', 'GPT-5.3', 'GPT-5 mini', 'o3', 'GPT-5.2'],
    'Anthropic': [
        'Claude Opus 4.6',
        'Claude Sonnet 4.6',
        'Claude Opus 4.5',
        'Claude Sonnet 4.5',
        'Claude Haiku 4.5',
    ],
    'Google': [
        'Gemini 3.1 Pro',
        'Gemini 3.1 Deep Think',
        'Gemini 3.1 Flash',
        'Gemini 3 Pro',
        'Gemini 2.5 Pro',
    ],
    'Meta': [
        'Llama 4 Maverick',
        'Llama 4 Scout',
        'Llama 4 Behemoth',
        'Llama 3.3 70B',
        'Llama 3.1 405B',
    ],
    'xAI': ['Grok 4.20 Beta', 'Grok 4.1', 'Grok 4.1 Fast', 'Grok 4', 'Grok 3'],
    'Mistral': [
        'Mistral Large 3',
        'Magistral Medium 1.2',
        'Mistral Medium 3.1',
        'Ministral 14B',
        'Devstral 2',
    ],
    'DeepSeek': ['DeepSeek V3.2', 'DeepSeek V3.2-Exp', 'DeepSeek R1', 'DeepSeek V3', 'DeepSeek R1-0528'],
}


class Command(BaseCommand):
    help = '플랫폼/모델 데이터를 최신 라인업으로 동기화합니다. (기존 게시글은 보존, 구형 모델은 비활성화)'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                platform_map = self._sync_platforms()
                self._sync_models(platform_map)
        except DatabaseError as exc:
            raise CommandError(f'플랫폼/모델 데이터 업데이트 실패: {exc}') from exc

        self.stdout.write(self.style.SUCCESS('플랫폼-모델 데이터 동기화 완료'))

    def _sync_platforms(self) -> dict[str, Platform]:
        target_names = set(PLATFORM_MODEL_DEFINITIONS.keys())
        platform_map: dict[str, Platform] = {}

        created = 0
        reactivated = 0

        for platform_name in PLATFORM_MODEL_DEFINITIONS:
            platform, is_created = Platform.objects.get_or_create(name=platform_name)
            if is_created:
                created += 1
            if not platform.is_active:
                platform.is_active = True
                platform.save(update_fields=['is_active'])
                reactivated += 1
            platform_map[platform_name] = platform

        deactivated = Platform.objects.exclude(name__in=target_names).filter(is_active=True).update(is_active=False)

        self.stdout.write(self.style.SUCCESS(f'플랫폼 생성: {created}개'))
        self.stdout.write(self.style.SUCCESS(f'플랫폼 재활성화: {reactivated}개'))
        self.stdout.write(self.style.WARNING(f'플랫폼 비활성화: {deactivated}개'))

        return platform_map

    def _sync_models(self, platform_map: dict[str, Platform]) -> None:
        created = 0
        updated = 0
        reactivated = 0
        deprecated = 0

        for platform_name, model_names in PLATFORM_MODEL_DEFINITIONS.items():
            platform = platform_map[platform_name]
            target_names = set(model_names)

            for sort_order, model_name in enumerate(model_names, start=1):
                model, is_created = AiModel.objects.get_or_create(
                    platform=platform,
                    name=model_name,
                    defaults={
                        'sort_order': sort_order,
                        'is_active': True,
                        'is_deprecated': False,
                    },
                )

                if is_created:
                    created += 1
                    continue

                changed_fields: list[str] = []
                if model.sort_order != sort_order:
                    model.sort_order = sort_order
                    changed_fields.append('sort_order')
                if not model.is_active:
                    model.is_active = True
                    changed_fields.append('is_active')
                    reactivated += 1
                if model.is_deprecated:
                    model.is_deprecated = False
                    changed_fields.append('is_deprecated')

                if changed_fields:
                    model.save(update_fields=changed_fields)
                    updated += 1

            # 타겟 목록 밖 모델은 보존하되 비활성/사용중단 처리
            deprecated += (
                AiModel.objects.filter(platform=platform)
                .exclude(name__in=target_names)
                .exclude(is_active=False, is_deprecated=True)
                .update(is_active=False, is_deprecated=True)
            )

        self.stdout.write(self.style.SUCCESS(f'모델 생성: {created}개'))
        self.stdout.write(self.style.SUCCESS(f'모델 업데이트: {updated}개'))
        self.stdout.write(self.style.SUCCESS(f'모델 재활성화: {reactivated}개'))
        self.stdout.write(self.style.WARNING(f'구형 모델 비활성화: {deprecated}개'))
