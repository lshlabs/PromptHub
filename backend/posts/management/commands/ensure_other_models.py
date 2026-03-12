from django.core.management.base import BaseCommand
from django.db import transaction
from posts.models import Platform, AiModel


class Command(BaseCommand):
    help = "모든 플랫폼에 '기타' 모델을 생성합니다(없으면 생성)."

    def handle(self, *args, **options):
        created = 0
        with transaction.atomic():
            for platform in Platform.objects.all():
                _, was_created = AiModel.objects.get_or_create(
                    platform=platform,
                    name="기타",
                    defaults={"variant_free_text_allowed": False, "slug": "other"},
                )
                if was_created:
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f"'{platform.name}' 플랫폼에 '기타' 모델 생성"))

        self.stdout.write(self.style.SUCCESS(f'완료: 기타 모델 {created}개 생성'))

