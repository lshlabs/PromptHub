from collections import defaultdict
from difflib import SequenceMatcher

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from posts.models import AiModel, Post


class Command(BaseCommand):
    help = "기존 게시글의 model_detail 값을 표준 모델명에 맞게 정리합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 변경 없이 변경 대상만 출력합니다.",
        )
        parser.add_argument(
            "--auto-confirm",
            action="store_true",
            help="유사도 0.7 이상은 자동 승인합니다.",
        )
        parser.add_argument(
            "--threshold",
            type=float,
            default=0.6,
            help="매칭 후보로 인정할 최소 유사도(기본: 0.6).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        auto_confirm = options["auto_confirm"]
        threshold = options["threshold"]

        grouped_post_ids = self._group_post_ids_by_platform_and_detail()
        if not grouped_post_ids:
            self.stdout.write(self.style.WARNING("정리할 model_detail 데이터가 없습니다."))
            return

        platform_models = self._load_platform_models()
        stats = {
            "processed_groups": 0,
            "already_standard_posts": 0,
            "matched_posts": 0,
            "unmatched_posts": 0,
            "updated_posts": 0,
        }
        updates = []
        unmatched_rows = []

        self.stdout.write(
            self.style.SUCCESS(
                f'모델 상세명 정리 {"시뮬레이션" if dry_run else "실행"} (임계값: {threshold})'
            )
        )

        for (platform_id, detail_value), post_ids in sorted(grouped_post_ids.items()):
            model_pool = platform_models.get(platform_id, [])
            post_count = len(post_ids)
            stats["processed_groups"] += 1
            self.stdout.write(f'\n처리: "{detail_value}" (플랫폼 id={platform_id}, 게시글 {post_count}개)')

            exact_match = next((model for model in model_pool if model.name == detail_value), None)
            if exact_match is not None:
                stats["already_standard_posts"] += post_count
                self.stdout.write(self.style.SUCCESS("이미 표준 모델명입니다."))
                continue

            best_match = self._find_best_match(detail_value, model_pool, threshold)
            if best_match is None:
                stats["unmatched_posts"] += post_count
                unmatched_rows.append((platform_id, detail_value, post_count))
                self.stdout.write(self.style.ERROR("매칭 후보를 찾지 못했습니다."))
                continue

            candidate_model, score, match_type = best_match
            stats["matched_posts"] += post_count
            self.stdout.write(
                f'매칭 후보: "{candidate_model.name}" (유사도 {score:.3f}, 방식: {match_type}, 게시글 {post_count}개)'
            )

            if not self._should_apply_update(
                dry_run=dry_run,
                auto_confirm=auto_confirm,
                score=score,
                source_value=detail_value,
                target_value=candidate_model.name,
            ):
                continue

            updates.append((post_ids, detail_value, candidate_model.name))
            stats["updated_posts"] += post_count

        if updates and not dry_run:
            self._apply_updates(updates)
        elif dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN 모드: 실제 저장은 수행하지 않았습니다."))

        self._print_summary(stats=stats, dry_run=dry_run, unmatched_rows=unmatched_rows)

    def _group_post_ids_by_platform_and_detail(self):
        rows = Post.objects.exclude(Q(model_detail__isnull=True) | Q(model_detail__exact="")).values_list(
            "id",
            "platform_id",
            "model_detail",
        )
        grouped: dict[tuple[int, str], list[int]] = defaultdict(list)
        for post_id, platform_id, model_detail in rows:
            normalized = (model_detail or "").strip()
            if normalized:
                grouped[(platform_id, normalized)].append(post_id)
        return grouped

    def _load_platform_models(self):
        models_by_platform: dict[int, list[AiModel]] = defaultdict(list)
        for model in AiModel.objects.select_related("platform"):
            models_by_platform[model.platform_id].append(model)
        return models_by_platform

    def _find_best_match(self, query: str, models: list[AiModel], threshold: float):
        best_candidate = None
        normalized_query = query.lower().strip()
        for model in models:
            normalized_model_name = model.name.lower().strip()
            similarity = SequenceMatcher(None, normalized_query, normalized_model_name).ratio()
            contains_score = 0.8 if normalized_query in normalized_model_name else 0.6 if normalized_model_name in normalized_query else 0
            final_score = max(similarity, contains_score)
            if final_score < threshold:
                continue
            if best_candidate is None or final_score > best_candidate[1]:
                match_type = "contains" if contains_score > similarity else "similarity"
                best_candidate = (model, final_score, match_type)
        return best_candidate

    def _should_apply_update(
        self,
        *,
        dry_run: bool,
        auto_confirm: bool,
        score: float,
        source_value: str,
        target_value: str,
    ) -> bool:
        if dry_run:
            self.stdout.write("변경 예정 (dry-run)")
            return True
        if auto_confirm and score >= 0.7:
            self.stdout.write(self.style.SUCCESS("자동 승인 (유사도 0.7 이상)"))
            return True
        answer = input(f'"{source_value}" -> "{target_value}" 로 변경할까요? (y/n): ').strip().lower()
        return answer == "y"

    def _apply_updates(self, updates: list[tuple[list[int], str, str]]):
        self.stdout.write(f"\n{len(updates)}개 그룹의 변경사항을 적용합니다.")
        with transaction.atomic():
            for post_ids, old_value, new_value in updates:
                Post.objects.filter(id__in=post_ids).update(model_detail=new_value)
                self.stdout.write(self.style.SUCCESS(f'"{old_value}" -> "{new_value}" ({len(post_ids)}개 게시글)'))

    def _print_summary(self, *, stats, dry_run: bool, unmatched_rows):
        self.stdout.write(self.style.SUCCESS("\n=== 정리 완료 ==="))
        self.stdout.write(f'처리된 고유 그룹: {stats["processed_groups"]}개')
        self.stdout.write(f'이미 표준화된 게시글: {stats["already_standard_posts"]}개')
        self.stdout.write(f'매칭된 게시글: {stats["matched_posts"]}개')
        self.stdout.write(f'매칭 실패 게시글: {stats["unmatched_posts"]}개')
        self.stdout.write(
            f'{"업데이트 예정" if dry_run else "실제 업데이트"} 게시글: {stats["updated_posts"]}개'
        )

        if not unmatched_rows:
            return

        self.stdout.write("\n=== 매칭 실패 목록 ===")
        for platform_id, detail_value, count in unmatched_rows:
            self.stdout.write(f'"{detail_value}" (플랫폼 id={platform_id}, {count}개 게시글)')
