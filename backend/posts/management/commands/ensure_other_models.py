"""
모든 플랫폼에 '기타' 기본 모델이 존재하도록 보장합니다.

사용 예시:
  manage.py ensure_other_models
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from posts.models import Platform, AiModel


class Command(BaseCommand):
    help = "모든 플랫폼에 '기타' 모델을 생성합니다(없으면 생성)."

    def handle(self, *args, **options):
        created = 0
        with transaction.atomic():
            for platform in Platform.objects.all():
                exists = AiModel.objects.filter(platform=platform, name='기타').exists()
                if not exists:
                    AiModel.objects.create(
                        platform=platform,
                        name='기타',
                        variant_free_text_allowed=False,
                        slug='other'
                    )
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f"'{platform.name}' 플랫폼에 '기타' 모델 생성"))

        self.stdout.write(self.style.SUCCESS(f'완료: 기타 모델 {created}개 생성'))


