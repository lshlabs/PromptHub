import re

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import DatabaseError

from core.models.trending import TrendingRanking
from posts.models import AiModel, Platform


def normalize_key(value: str) -> str:
    return re.sub(r"[\s\-_]+", "", (value or "").strip().lower())


TRENDING_MODEL_MAPPING = {
    "GPT-5": ("OpenAI", "GPT-5"),
    "GPT 5.1": ("OpenAI", "GPT 5.1"),
    "GPT 5.2": ("OpenAI", "GPT 5.2"),
    "GPT oss 20b": ("OpenAI", "GPT OSS 20B"),
    "GPT oss 120b": ("OpenAI", "GPT OSS 120B"),
    "GPT-4o": ("OpenAI", "GPT-4o"),
    "Grok 4": ("xAI", "Grok-4"),
    "Gemini 2.5 Pro": ("Google", "Gemini 2.5 Pro"),
    "Gemini 3 Pro": ("Google", "Gemini 3 Pro"),
    "Gemini 1.5 Flash": ("Google", "Gemini 1.5 Flash"),
    "Gemma 3 27b": ("Google", "Gemma 3 27B"),
    "Claude 4.1 Opus": ("Anthropic", "Claude 4.1 Opus"),
    "Claude Opus 4.1": ("Anthropic", "Claude 4.1 Opus"),
    "Claude 4 Sonnet": ("Anthropic", "Claude 4 Sonnet"),
    "Claude 4 Opus": ("Anthropic", "Claude 4 Opus"),
    "Claude Sonnet 4.5": ("Anthropic", "Claude Sonnet 4.5"),
    "Claude Opus 4.5": ("Anthropic", "Claude Opus 4.5"),
    "Llama 3.1 405b": ("Meta", "Llama 3.1"),
    "Llama 3.3 70b": ("Meta", "Llama 3.3"),
    "Llama 3.1 70b": ("Meta", "Llama 3.1"),
    "Llama 3.1 8b": ("Meta", "Llama 3.1"),
    "Llama 4 Scout": ("Meta", "Llama 4 Scout"),
    "Nova Micro": ("기타", "기타"),
    "Kimi K2 Thinking": ("기타", "기타"),
}

NORMALIZED_TRENDING_MODEL_MAPPING = {
    normalize_key(name): model_ref for name, model_ref in TRENDING_MODEL_MAPPING.items()
}


class Command(BaseCommand):
    help = "트렌딩 모델을 AiModel 레코드에 연결합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 저장 없이 연결 결과만 출력합니다.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN 모드로 실행합니다."))

        linked_count = 0
        skipped_count = 0

        try:
            with transaction.atomic():
                for trending in TrendingRanking.objects.filter(is_active=True):
                    mapping = self._resolve_mapping(trending.name)
                    if mapping is None:
                        skipped_count += 1
                        self.stdout.write(self.style.WARNING(f"⚠ {trending.name}: 매핑 정보가 없습니다"))
                        continue

                    platform_name, model_name = mapping
                    ai_model = self._find_model(platform_name=platform_name, model_name=model_name)
                    if ai_model is None:
                        skipped_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"✗ {trending.name}: {platform_name} - {model_name} 모델을 찾을 수 없습니다"
                            )
                        )
                        continue

                    if not dry_run:
                        trending.related_model = ai_model
                        trending.use_exact_matching = False
                        trending.model_detail_contains = ""
                        trending.model_etc_contains = ""
                        trending.save(
                            update_fields=[
                                "related_model",
                                "use_exact_matching",
                                "model_detail_contains",
                                "model_etc_contains",
                            ]
                        )

                    linked_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ {trending.name} -> {platform_name} - {model_name}")
                    )

                if dry_run:
                    transaction.set_rollback(True)
        except DatabaseError as exc:
            raise CommandError(f"트렌딩 모델 연결 실패: {exc}") from exc

        label = "연결 예정" if dry_run else "연결 완료"
        self.stdout.write(self.style.SUCCESS(f"{label}: 성공 {linked_count}개, 건너뜀 {skipped_count}개"))

    def _resolve_mapping(self, model_name: str):
        direct = TRENDING_MODEL_MAPPING.get(model_name)
        if direct is not None:
            return direct
        return NORMALIZED_TRENDING_MODEL_MAPPING.get(normalize_key(model_name))

    def _find_model(self, *, platform_name: str, model_name: str) -> AiModel | None:
        platform = Platform.objects.filter(name=platform_name).first()
        if platform is None:
            return None
        return AiModel.objects.filter(platform=platform, name=model_name).first()
