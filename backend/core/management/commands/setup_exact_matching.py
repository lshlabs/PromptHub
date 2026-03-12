from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import DatabaseError

from core.models.trending import TrendingRanking
from posts.models import AiModel, Platform

EXACT_MATCHING_CONFIGS = [
    {
        "name": "GPT oss 20b",
        "platform_name": "OpenAI",
        "model_name": "기타",
        "use_exact_matching": True,
        "model_etc_contains": "GPT oss 20b",
        "model_detail_contains": "",
    },
    {
        "name": "GPT oss 120b",
        "platform_name": "OpenAI",
        "model_name": "기타",
        "use_exact_matching": True,
        "model_etc_contains": "GPT oss 120b",
        "model_detail_contains": "",
    },
    {
        "name": "Claude 4 Sonnet",
        "platform_name": "Anthropic",
        "model_name": "Claude 4",
        "use_exact_matching": True,
        "model_etc_contains": "",
        "model_detail_contains": "Sonnet",
    },
    {
        "name": "Claude 4 Opus",
        "platform_name": "Anthropic",
        "model_name": "Claude 4",
        "use_exact_matching": True,
        "model_etc_contains": "",
        "model_detail_contains": "Opus",
    },
]


class Command(BaseCommand):
    help = "트렌딩 모델들에 정확 매칭 조건을 설정합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 적용 없이 변경 예정 사항만 출력합니다.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN 모드로 실행합니다."))

        updated_count = 0
        created_platform_count = 0
        created_model_count = 0

        try:
            with transaction.atomic():
                for config in EXACT_MATCHING_CONFIGS:
                    trending = TrendingRanking.objects.filter(
                        name=config["name"],
                        is_active=True,
                    ).first()
                    if trending is None:
                        self.stdout.write(self.style.WARNING(f'트렌딩 랭킹 없음: {config["name"]}'))
                        continue

                    platform, created_platform = Platform.objects.get_or_create(name=config["platform_name"])
                    if created_platform:
                        created_platform_count += 1
                        self.stdout.write(self.style.SUCCESS(f"플랫폼 생성: {platform.name}"))

                    ai_model, created_model = AiModel.objects.get_or_create(
                        platform=platform,
                        name=config["model_name"],
                    )
                    if created_model:
                        created_model_count += 1
                        self.stdout.write(self.style.SUCCESS(f"모델 생성: {platform.name} - {ai_model.name}"))

                    if not dry_run:
                        trending.related_model = ai_model
                        trending.use_exact_matching = config["use_exact_matching"]
                        trending.model_detail_contains = config["model_detail_contains"]
                        trending.model_etc_contains = config["model_etc_contains"]
                        trending.save(
                            update_fields=[
                                "related_model",
                                "use_exact_matching",
                                "model_detail_contains",
                                "model_etc_contains",
                            ]
                        )

                    post_count = trending.get_filtered_posts().count()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {trending.name}: 정확 매칭 {"적용" if config["use_exact_matching"] else "해제"} -> {post_count}개 게시글'
                        )
                    )
                    if config["model_detail_contains"]:
                        self.stdout.write(f'  상세명 조건: "{config["model_detail_contains"]}"')
                    if config["model_etc_contains"]:
                        self.stdout.write(f'  기타명 조건: "{config["model_etc_contains"]}"')

                    updated_count += 1

                if dry_run:
                    transaction.set_rollback(True)
        except (DatabaseError, TypeError, ValueError) as exc:
            raise CommandError(f"정확 매칭 설정 실패: {exc}") from exc

        status = "변경 예정" if dry_run else "업데이트"
        self.stdout.write(
            self.style.SUCCESS(
                f"{status}: 랭킹 {updated_count}개, 플랫폼 생성 {created_platform_count}개, 모델 생성 {created_model_count}개"
            )
        )
