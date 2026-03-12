from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import DatabaseError
from posts.models import Category


class Command(BaseCommand):
    help = "카테고리를 ID 1부터 시작해 11개로 재구성합니다."

    CATEGORIES = [
        "코딩/프로그래밍",
        "일반지식/학습",
        "글쓰기/번역",
        "AI/자연어처리",
        "취업/커리어",
        "생활정보/상담",
        "문화/엔터테인먼트/게임",
        "비즈니스/경제",
        "기술문서/요약",
        "데이터분석/통계",
        "기타",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="기존 카테고리 데이터를 모두 삭제하고 새로 생성합니다.",
        )

    def handle(self, *args, **options):
        try:
            if options["reset"]:
                self._reset_categories()

            created_categories = 0
            with transaction.atomic():
                for category_name in self.CATEGORIES:
                    _, created = Category.objects.get_or_create(name=category_name)
                    if created:
                        created_categories += 1

            self.stdout.write(self.style.SUCCESS(f"완료: 카테고리 {created_categories}개 생성"))
            self.stdout.write("\n현재 카테고리 목록:")
            for category in Category.objects.order_by("id"):
                self.stdout.write(f"ID {category.id}: {category.name}")
        except DatabaseError as exc:
            raise CommandError(f"카테고리 로드 실패: {exc}") from exc

    def _reset_categories(self):
        self.stdout.write(self.style.WARNING("기존 카테고리 데이터를 삭제합니다..."))
        deleted_categories = Category.objects.count()
        Category.objects.all().delete()

        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='posts_category'")

        self.stdout.write(self.style.SUCCESS(f"삭제 완료: 카테고리 {deleted_categories}개"))
        self.stdout.write(self.style.SUCCESS("Auto increment 값이 리셋되었습니다."))

        
