"""
실제 서비스처럼 보이는 샘플 게시글을 생성하는 명령어.

특징:
- 최신 curated 플랫폼/모델명 기준 사용
- 10개의 서로 다른 긴 프롬프트/응답/후기 데이터 포함
- 사용자 없을 때 dummy user 자동 생성 옵션 제공

사용 예시:
  venv/bin/python manage.py generate_sample_posts
  venv/bin/python manage.py generate_sample_posts --count 5
  venv/bin/python manage.py generate_sample_posts --create-dummy-users
  venv/bin/python manage.py generate_sample_posts --dry-run
"""

from decimal import Decimal
import random
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from posts.models import AiModel, Category, Platform, Post


class Command(BaseCommand):
    help = "실제와 유사한 샘플 게시글(최대 10개)을 생성합니다."

    DUMMY_USER_EMAILS = [
        "sample.alpha@prompthub.test",
        "sample.bravo@prompthub.test",
        "sample.charlie@prompthub.test",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 저장 없이 생성 계획만 출력합니다.",
        )
        parser.add_argument(
            "--count",
            type=int,
            default=10,
            help="생성할 샘플 게시글 수 (1~10, 기본 10)",
        )
        parser.add_argument(
            "--create-dummy-users",
            action="store_true",
            help="사용자가 없거나 부족할 때 더미 사용자를 자동 생성합니다.",
        )
        parser.add_argument(
            "--dummy-password",
            type=str,
            default="SamplePass123!@#",
            help="자동 생성 더미 사용자 비밀번호 (기본값: SamplePass123!@#)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        count = max(1, min(int(options["count"]), 10))
        create_dummy_users = options["create_dummy_users"]
        dummy_password = options["dummy_password"]

        users = self._get_or_create_users(
            create_dummy_users=create_dummy_users,
            dummy_password=dummy_password,
            dry_run=dry_run,
        )
        if not users:
            self.stdout.write(
                self.style.ERROR(
                    "사용자가 없습니다. 먼저 회원가입을 하거나 `--create-dummy-users` 옵션을 사용하세요."
                )
            )
            return

        categories = list(Category.objects.all())
        if not categories:
            self.stdout.write(self.style.ERROR("카테고리가 없습니다. `load_categories`를 먼저 실행하세요."))
            return

        model_refs = self._load_model_refs()
        if model_refs is None:
            return

        samples = self._build_samples(users=users, categories=categories, models=model_refs)[:count]
        # 사용 가능한 사용자 수만큼 라운드로빈 할당 (10명 생성 시 10명 모두 활용, 부족하면 중복 허용)
        for idx, sample in enumerate(samples):
            sample["user"] = users[idx % len(users)]

        created = 0
        skipped = 0
        with transaction.atomic():
            for idx, sample in enumerate(samples, start=1):
                summary = (
                    f"[{idx}] {sample['title']} | "
                    f"{sample['platform'].name} / {sample['model'].name} | "
                    f"{sample['category'].name}"
                )

                if dry_run:
                    self.stdout.write(self.style.WARNING(f"[DRY-RUN] {summary}"))
                    continue

                if Post.objects.filter(title=sample["title"]).exists():
                    skipped += 1
                    self.stdout.write(self.style.WARNING(f"[SKIP] 이미 존재: {sample['title']}"))
                    continue

                post = Post.objects.create(
                    title=sample["title"],
                    author=sample["user"],
                    platform=sample["platform"],
                    model=sample["model"],
                    model_etc=sample.get("model_etc", ""),
                    model_detail=sample.get("model_detail", ""),
                    category=sample["category"],
                    tags=sample.get("tags", ""),
                    prompt=sample["prompt"],
                    ai_response=sample["ai_response"],
                    additional_opinion=sample.get("additional_opinion", ""),
                    satisfaction=sample["satisfaction"],
                )
                Post.objects.filter(pk=post.pk).update(
                    view_count=sample["views"],
                    like_count=sample["likes"],
                    bookmark_count=sample["bookmarks"],
                    created_at=sample["created_at"],
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATE] {summary}"))

            if dry_run:
                transaction.set_rollback(True)

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"DRY RUN 완료: {len(samples)}개 계획 확인"))
        else:
            self.stdout.write(self.style.SUCCESS(f"완료: {created}개 생성, {skipped}개 건너뜀"))

    def _get_or_create_users(self, *, create_dummy_users: bool, dummy_password: str, dry_run: bool):
        User = get_user_model()
        users = list(
            User.objects.filter(is_superuser=False, is_staff=False).order_by("id")[:10]
        )
        if len(users) >= 10 or not create_dummy_users:
            return users

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY-RUN] 사용자 부족({len(users)}명). 더미 사용자 최대 {max(0, 10-len(users))}명 생성 예정"
                )
            )
            return users

        created_count = 0
        for email in self.DUMMY_USER_EMAILS:
            if User.objects.filter(email=email).exists():
                continue
            User.objects.create_user(email=email, password=dummy_password)
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"더미 사용자 생성: {email}"))
            if User.objects.count() >= 10:
                break

        if created_count:
            self.stdout.write(
                self.style.WARNING(
                    f"더미 사용자 비밀번호: {dummy_password} (운영 공개 전 변경/삭제 권장)"
                )
            )
        return list(
            User.objects.filter(is_superuser=False, is_staff=False).order_by("id")[:10]
        )

    def _get_model(self, platform_name: str, model_name: str) -> AiModel | None:
        try:
            platform = Platform.objects.get(name=platform_name)
            return AiModel.objects.get(platform=platform, name=model_name)
        except (Platform.DoesNotExist, AiModel.DoesNotExist):
            return None

    def _load_model_refs(self):
        # 최신 curated.json 기준 모델명으로 구성
        refs = {
            "gpt52": self._get_model("OpenAI", "GPT 5.2"),
            "o4mini": self._get_model("OpenAI", "o4-mini"),
            "gpt4o": self._get_model("OpenAI", "GPT-4o"),
            "gptoss120b": self._get_model("OpenAI", "GPT OSS 120B"),
            "openai_other": self._get_model("OpenAI", "기타"),
            "claude45_sonnet": self._get_model("Anthropic", "Claude Sonnet 4.5"),
            "claude46_sonnet": self._get_model("Anthropic", "Claude Sonnet 4.6"),
            "gemini3pro": self._get_model("Google", "Gemini 3 Pro"),
            "google_other": self._get_model("Google", "기타"),
            "grok41": self._get_model("xAI", "Grok-4.1"),
            "llama4scout": self._get_model("Meta", "Llama 4 Scout"),
            "mistral_large3": self._get_model("Mistral", "Mistral Large 3"),
            "deepseek_v32": self._get_model("DeepSeek", "DeepSeek V3.2"),
        }

        missing = [key for key, value in refs.items() if value is None]
        if missing:
            self.stdout.write(
                self.style.ERROR(
                    "필수 모델이 없습니다. 먼저 `load_ai_models --file posts/fixtures/platform_models.curated.json`를 실행하세요.\n"
                    f"누락 키: {', '.join(missing)}"
                )
            )
            return None
        return refs

    def _pick_category(self, category_map: dict[str, Category], categories: list[Category], preferred: str) -> Category:
        return category_map.get(preferred) or random.choice(categories)

    def _build_samples(self, *, users, categories, models) -> list[dict[str, Any]]:
        now = timezone.now()
        category_map = {c.name: c for c in categories}
        user_a = users[0]
        user_b = users[1 if len(users) > 1 else 0]
        user_c = users[2 if len(users) > 2 else 0]

        return [
            {
                "user": user_a,
                "platform": models["gpt52"].platform,
                "model": models["gpt52"],
                "model_detail": "gpt-5.2-high",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "코딩/프로그래밍"),
                "title": "레거시 Django API를 단계적으로 모듈화하는 리팩토링 플랜 생성",
                "tags": "django,리팩토링,설계,백엔드",
                "prompt": (
                    "현재 운영 중인 Django API 프로젝트를 큰 장애 없이 리팩토링하려고 합니다.\n"
                    "문제는 앱 경계가 흐리고 서비스 로직이 view에 섞여 있으며, serializer와 model이 서로 강하게 결합되어 있다는 점입니다.\n"
                    "아래 조건을 만족하는 8주짜리 리팩토링 계획을 작성해 주세요.\n"
                    "1) 주차별 목표/산출물/리스크\n"
                    "2) 무중단 배포 전략(점진적 전환)\n"
                    "3) 테스트 전략(회귀 테스트 우선순위)\n"
                    "4) 팀원이 2명인 상황에서 현실적인 작업 분배\n"
                    "5) 기존 기능 회귀 시 롤백 기준\n"
                    "응답은 표 + 체크리스트 + 기술적 판단 근거 순서로 작성해주세요."
                ),
                "ai_response": (
                    "좋습니다. 이 프로젝트는 '한 번에 구조를 바꾸는 리라이트'보다 '안전한 경계 추출'이 핵심입니다.\n\n"
                    "[핵심 전략]\n"
                    "- 1~2주차: 관찰 가능성 확보 (로그/에러/핵심 API 회귀테스트)\n"
                    "- 3~5주차: 서비스 레이어 추출 + 읽기 경로 분리\n"
                    "- 6~7주차: 쓰기 경로 정리 + 데이터 검증 책임 재배치\n"
                    "- 8주차: 구 경로 제거 후보 정리 및 운영 안정화\n\n"
                    "[주차별 계획 요약]\n"
                    "1주차: 핵심 API 10개 선정, 실패 로그 패턴 수집, smoke test 작성\n"
                    "2주차: 도메인 경계 초안 작성(예: 인증/게시글/통계), view 책임 분류표 작성\n"
                    "3주차: posts 서비스 함수 도입(read-only 엔드포인트 우선), 기존 view는 thin wrapper로 유지\n"
                    "4주차: serializer validation 규칙을 use-case 단위로 분리, 공통 에러 포맷 통일\n"
                    "5주차: DB 쿼리 최적화(select_related/prefetch)와 정렬/검색 로직 모듈화\n"
                    "6주차: 쓰기 API(create/update/delete) 서비스 레이어 이관, feature flag로 전환\n"
                    "7주차: 회귀 테스트 확장 + 성능 비교, 장애 시 롤백 절차 문서화\n"
                    "8주차: deprecated 코드 후보 제거, 운영 기준 문서/온보딩 문서 작성\n\n"
                    "[무중단 배포 포인트]\n"
                    "- 동일 URL 유지, 내부 구현만 교체\n"
                    "- feature flag 또는 settings flag로 old/new 경로 전환\n"
                    "- 배포 후 15분 모니터링 기준(5xx, p95 latency, 주요 write API 실패율)\n\n"
                    "[2인 팀 작업 분배]\n"
                    "- A: 서비스 레이어/쿼리 정리/테스트 구조 개선\n"
                    "- B: 회귀 테스트/운영 체크리스트/배포 검증 자동화\n"
                    "- 리뷰는 API 계약 변경(PR마다 request/response diff 포함) 중심으로 진행"
                ),
                "additional_opinion": (
                    "실제로 써보니 계획이 과장되지 않고 현실적이었습니다. 특히 2인 팀 기준으로 '리팩토링 속도보다 회귀 방지'를 우선한 점이 좋았어요. "
                    "다만 우리 프로젝트 특성상 인증/세션 쪽은 독립된 주차를 하나 더 잡는 게 안전해 보여서 6주차 일부를 인증 안정화 작업으로 재배치했습니다."
                ),
                "satisfaction": Decimal("4.5"),
                "views": 1280,
                "likes": 41,
                "bookmarks": 24,
                "created_at": now - timezone.timedelta(days=6, hours=4),
            },
            {
                "user": user_b,
                "platform": models["gemini3pro"].platform,
                "model": models["gemini3pro"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "기술문서/요약"),
                "title": "분기 실적 발표 자료를 3종 청중 버전으로 재구성하기 (임원/실무/영업)",
                "tags": "요약,문서작성,프레젠테이션,비즈니스",
                "prompt": (
                    "실적 발표 초안(텍스트 기준 12페이지 분량)을 가지고 있습니다. 같은 내용을 아래 3개 버전으로 재구성해야 합니다.\n"
                    "- 임원 보고용: 핵심 지표와 리스크 위주 (5분)\n"
                    "- 실무팀 공유용: 실행과제/원인분석 위주 (15분)\n"
                    "- 영업팀 공유용: 고객 커뮤니케이션 포인트 위주 (10분)\n"
                    "각 버전별로 목차, 슬라이드별 한 줄 메시지, 발표자 멘트 초안을 만들어 주세요.\n"
                    "숫자는 임의로 바꾸지 말고, 확신 없는 내용은 가정이라고 표시해 주세요."
                ),
                "ai_response": (
                    "좋습니다. 동일 원문을 다르게 '강조'하는 방식으로 3개의 발표 구조를 분리하겠습니다.\n\n"
                    "[1) 임원 보고용 (5분)]\n"
                    "목적: 의사결정에 필요한 지표/리스크/요청사항만 빠르게 전달\n"
                    "슬라이드 1: 이번 분기 한 줄 요약 (성장률, 마진, 리스크)\n"
                    "슬라이드 2: 계획 대비 실적 편차와 원인(Top 3)\n"
                    "슬라이드 3: 다음 분기 위험요인과 대응안\n"
                    "슬라이드 4: 경영진 결정 필요 항목(예산/인력/가격 정책)\n\n"
                    "[2) 실무팀 공유용 (15분)]\n"
                    "목적: 숫자의 배경 설명과 개선 액션 정렬\n"
                    "- 채널별 성과 분해\n"
                    "- 전환율/이탈률 변화 원인\n"
                    "- 운영/개발/마케팅 협업 액션아이템 담당자 지정\n\n"
                    "[3) 영업팀 공유용 (10분)]\n"
                    "목적: 고객 응대 메시지와 제안 포인트 통일\n"
                    "- 고객이 체감할 개선 사항\n"
                    "- 가격/공급/일정 관련 질의 응답 템플릿\n"
                    "- 경쟁사 비교 질문 대응 메시지\n\n"
                    "각 버전에 공통으로 사용 가능한 '숫자 검증 체크리스트'와 '질문 예상 목록'도 부록으로 추가하는 것을 권장합니다."
                ),
                "additional_opinion": (
                    "보고 대상별로 같은 데이터를 다르게 말해야 할 때 정말 유용했습니다. 특히 영업팀 버전에서 고객 질문을 미리 예상해서 답변 톤까지 잡아준 점이 실무에 바로 쓸 만했어요. "
                    "다만 우리 회사 템플릿 용어와 맞지 않는 표현이 몇 개 있어서 마지막에 내부 용어로 치환은 필요했습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 860,
                "likes": 23,
                "bookmarks": 12,
                "created_at": now - timezone.timedelta(days=5, hours=9),
            },
            {
                "user": user_c,
                "platform": models["claude45_sonnet"].platform,
                "model": models["claude45_sonnet"],
                "model_detail": "claude-sonnet-4.5-latest",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "글쓰기/번역"),
                "title": "영문 고객 컴플레인 메일을 한국어 응대안으로 바꾸는 템플릿 프롬프트",
                "tags": "번역,고객응대,메일,업무자동화",
                "prompt": (
                    "영문 고객 불만 메일을 한국어 응대안으로 변환하는 템플릿 프롬프트를 만들고 싶습니다.\n"
                    "조건은 아래와 같습니다.\n"
                    "1) 감정 진정 문장 1개\n"
                    "2) 사실관계 재확인 문장 2개\n"
                    "3) 해결안 제시 2개 (즉시/후속)\n"
                    "4) 내부 확인이 필요한 경우의 보류 문장\n"
                    "5) 법적 책임 인정처럼 보이는 표현 금지\n"
                    "6) 톤은 정중하지만 기계적이지 않게\n"
                    "실제 예시 3개도 같이 만들어 주세요."
                ),
                "ai_response": (
                    "아래는 운영팀이 재사용하기 쉬운 형태의 응대안 생성 템플릿입니다.\n\n"
                    "[프롬프트 템플릿]\n"
                    "- 입력: 고객 메일 원문, 주문/계약 정보, 현재 확인된 사실, 제약사항\n"
                    "- 출력 구조:\n"
                    "  1. 공감/사과 표현(과도한 책임 인정 없이)\n"
                    "  2. 확인된 사실 요약\n"
                    "  3. 확인 중인 항목 명시\n"
                    "  4. 즉시 가능한 조치\n"
                    "  5. 후속 일정/재연락 약속\n"
                    "  6. 마무리 문장\n\n"
                    "[금지 표현 예시]\n"
                    "- '당사 과실이 명백합니다' 같은 단정형 문장\n"
                    "- 확인되지 않은 환불/보상 확정 문구\n\n"
                    "[예시 1~3]\n"
                    "배송 지연, 기능 오작동, 과금 이슈 각각에 대해 톤과 구조를 유지한 응대안 예시를 포함했습니다.\n"
                    "각 예시는 고객 감정 단계(격앙/불안/실망)에 따라 첫 문장의 표현 강도를 다르게 제안했습니다."
                ),
                "additional_opinion": (
                    "고객 응대 톤 통일 목적에는 만족스러웠고, 특히 '금지 표현' 섹션이 법무팀 검토 전 단계에서 도움이 많이 됐습니다. "
                    "실제 운영에서는 제품군별 FAQ 링크 삽입 규칙까지 추가해서 사용하고 있습니다."
                ),
                "satisfaction": Decimal("4.5"),
                "views": 640,
                "likes": 18,
                "bookmarks": 14,
                "created_at": now - timezone.timedelta(days=4, hours=7),
            },
            {
                "user": user_a,
                "platform": models["gpt4o"].platform,
                "model": models["gpt4o"],
                "model_detail": "gpt-4o-vision",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "기술문서/요약"),
                "title": "회의실 화이트보드 사진을 작업 항목 목록으로 정리하는 멀티모달 프롬프트",
                "tags": "멀티모달,회의정리,작업관리,생산성",
                "prompt": (
                    "회의실 화이트보드 사진(글씨가 조금 기울어져 있고 일부는 흐릿함)을 입력으로 주고,\n"
                    "회의 액션아이템을 다음 형식으로 정리하고 싶습니다.\n"
                    "- 담당자\n"
                    "- 작업 항목\n"
                    "- 마감일\n"
                    "- 의존성/블로커\n"
                    "- 확정/가정 여부\n"
                    "사진에서 판독이 어려운 내용은 추측하지 말고 '확인 필요'로 표시하게 해주세요.\n"
                    "최종 출력은 표 + 체크리스트 두 형태를 모두 생성해 주세요."
                ),
                "ai_response": (
                    "멀티모달 입력에서는 OCR 정확도보다 '불확실성 표시 규칙'을 먼저 정의하는 것이 중요합니다.\n\n"
                    "[추천 프롬프트 구조]\n"
                    "1) 이미지에서 읽은 텍스트를 원문 그대로 1차 추출\n"
                    "2) 줄 단위로 항목화\n"
                    "3) 액션아이템 후보/논의사항 후보 분리\n"
                    "4) 불명확한 글자는 [확인 필요] 태그 부착\n"
                    "5) 표 형식과 체크리스트 형식으로 동시 출력\n\n"
                    "[출력 예시]\n"
                    "| 담당자 | 작업 항목 | 마감일 | 블로커 | 상태 |\n"
                    "| --- | --- | --- | --- | --- |\n"
                    "| 김OO | 로그인 오류 재현 | 3/12 | QA 로그 필요 | 확정 |\n"
                    "| 박OO | API 응답속도 측정 | 확인 필요 | APM 권한 | 가정 |\n\n"
                    "마감일이 사진에 명확히 없으면 임의로 넣지 않고 '확인 필요'로 유지하는 정책을 권장합니다."
                ),
                "additional_opinion": (
                    "사진 품질이 나쁘면 완벽하진 않지만, '확인 필요'를 강하게 유지해서 잘못된 TODO가 생기는 걸 줄여줬습니다. "
                    "실무에서는 이 결과를 노션 템플릿에 붙여넣는 용도로 충분히 쓸 만했습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 910,
                "likes": 26,
                "bookmarks": 15,
                "created_at": now - timezone.timedelta(days=3, hours=18),
            },
            {
                "user": user_b,
                "platform": models["grok41"].platform,
                "model": models["grok41"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "데이터분석/통계"),
                "title": "실시간 로그 이상 징후를 운영자 액션 중심으로 요약하는 프롬프트",
                "tags": "로그분석,모니터링,SRE,운영",
                "prompt": (
                    "5분 단위로 쌓이는 애플리케이션 로그 요약을 운영자가 빠르게 판단할 수 있게 만들고 싶습니다.\n"
                    "단순 에러 집계 말고 아래 기준으로 요약해 주세요.\n"
                    "- 신규 패턴 여부\n"
                    "- 사용자 영향도 추정(결제/로그인/핵심 기능)\n"
                    "- 즉시 조치 가능 항목\n"
                    "- 추적용 추가 로그 필요 여부\n"
                    "- 팀 슬랙에 공유할 3줄 요약\n"
                    "오탐 줄이기 위한 규칙(반복 잡음 제외 조건)도 포함해 주세요."
                ),
                "ai_response": (
                    "운영자 요약용 프롬프트는 '에러 수'보다 '행동 우선순위'를 잘 뽑아야 합니다.\n\n"
                    "[요약 프레임]\n"
                    "- 사건 요약: 무엇이, 언제부터, 얼마나 자주 발생하는지\n"
                    "- 영향 추정: 로그인/결제/핵심 API 영향 여부\n"
                    "- 패턴 분류: 신규 / 재발 / 알려진 잡음\n"
                    "- 즉시 액션: 재시도, 롤백, feature flag off, 담당자 호출 등\n"
                    "- 추가 수집: request id, user id segment, region, app version\n\n"
                    "[슬랙 공유 3줄 포맷 예시]\n"
                    "1) 14:05 이후 로그인 API 5xx 증가(평시 대비 +320%)\n"
                    "2) 모바일 앱 v2.4.1 사용자 영향 가능성 높음, 웹 영향 낮음\n"
                    "3) 임시로 신규 배포 feature flag 비활성화 후 지표 재확인 중\n\n"
                    "오탐 감소를 위해 cron/헬스체크성 에러와 알려진 외부 API 타임아웃은 별도 버킷으로 분리하는 규칙을 넣는 걸 권장합니다."
                ),
                "additional_opinion": (
                    "운영팀 공유용 3줄 요약 포맷이 특히 좋았습니다. 기존엔 길게 적다가 대응이 늦었는데, 이 포맷으로 팀 내 커뮤니케이션이 빨라졌습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 570,
                "likes": 17,
                "bookmarks": 9,
                "created_at": now - timezone.timedelta(days=3, hours=2),
            },
            {
                "user": user_c,
                "platform": models["llama4scout"].platform,
                "model": models["llama4scout"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "코딩/프로그래밍"),
                "title": "프론트엔드 에러 로그를 재현 시나리오로 바꾸는 디버깅 프롬프트 (운영용)",
                "tags": "frontend,디버깅,재현,에러로그",
                "prompt": (
                    "브라우저 콘솔 에러 로그와 Sentry 이벤트를 기반으로 QA가 바로 따라할 수 있는 재현 시나리오를 만들고 싶습니다.\n"
                    "입력 데이터는 스택트레이스, 브라우저/OS, 사용자 동선 일부, 발생 시각, 릴리즈 버전입니다.\n"
                    "출력은 다음 순서로 해주세요.\n"
                    "1) 추정 원인 상위 3개\n"
                    "2) 재현 가능성이 높은 경로 (클릭 순서)\n"
                    "3) 필요한 테스트 계정/권한\n"
                    "4) 재현 실패 시 추가로 수집할 정보\n"
                    "5) 개발자에게 전달할 최소 요약"
                ),
                "ai_response": (
                    "좋은 운영용 프롬프트 주제입니다. 핵심은 '로그 해석'보다 '재현 절차화'입니다.\n\n"
                    "[출력 템플릿 예시]\n"
                    "A. 추정 원인 Top 3\n"
                    "- 상태 동기화 지연으로 null 접근\n"
                    "- 특정 권한 계정에서만 노출되는 버튼 경로\n"
                    "- 캐시된 구버전 JS와 신규 API 응답 shape 불일치\n\n"
                    "B. 재현 시나리오(우선순위 1)\n"
                    "1. 테스트 계정 A로 로그인\n"
                    "2. 북마크 페이지 진입 후 필터 열기\n"
                    "3. 브라우저 뒤로가기 후 상세 페이지 재진입\n"
                    "4. 콘솔/네트워크에서 특정 응답 필드 누락 확인\n\n"
                    "C. 개발 전달용 최소 요약\n"
                    "- 릴리즈 버전, 라우트, 재현율, 임시 회피법, 영향 사용자 범위\n\n"
                    "실제 운영에서는 '재현 성공/실패' 체크박스와 캡처 첨부 칸을 추가하면 QA 핸드오프 품질이 더 좋아집니다."
                ),
                "additional_opinion": (
                    "개발자에게 전달할 요약 포맷까지 같이 나와서 좋았습니다. QA 인수인계 문서 템플릿으로 거의 그대로 쓰고 있습니다."
                ),
                "satisfaction": Decimal("4.5"),
                "views": 1490,
                "likes": 44,
                "bookmarks": 22,
                "created_at": now - timezone.timedelta(days=2, hours=22),
            },
            {
                "user": user_a,
                "platform": models["mistral_large3"].platform,
                "model": models["mistral_large3"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "취업/커리어"),
                "title": "이력서 기반 모의면접 질문 + 꼬리질문 설계 프롬프트 (실무형)",
                "tags": "면접,커리어,질문생성,실무",
                "prompt": (
                    "지원자의 이력서/포트폴리오 내용을 기반으로 실무 면접 질문 세트를 만들고 싶습니다.\n"
                    "단순한 질문 나열이 아니라, 지원자 답변에 따라 이어질 꼬리질문까지 포함해 주세요.\n"
                    "요구사항:\n"
                    "- 기술 역량 / 협업 / 문제해결 / 우선순위 판단 영역 분리\n"
                    "- 프로젝트 경험 과장 여부를 검증하는 질문 포함\n"
                    "- 좋은 답변/아쉬운 답변 판단 기준 포함\n"
                    "- 면접관 메모 칸 템플릿 포함"
                ),
                "ai_response": (
                    "면접 질문 생성 프롬프트는 '검증 가능성'을 중심으로 설계하는 것이 좋습니다.\n\n"
                    "[질문 세트 구조]\n"
                    "1. 프로젝트 맥락 확인 질문\n"
                    "2. 본인 기여도 확인 질문\n"
                    "3. 의사결정 근거 질문\n"
                    "4. 실패/개선 경험 질문\n"
                    "5. 협업/갈등 해결 질문\n\n"
                    "[꼬리질문 예시]\n"
                    "- '성능 개선했다'고 하면: 기준 지표는 무엇이었나?\n"
                    "- '리팩토링했다'고 하면: 회귀 위험은 어떻게 줄였나?\n"
                    "- '주도했다'고 하면: 의사결정 반대 의견은 무엇이었나?\n\n"
                    "[평가 기준]\n"
                    "- 구체성(숫자/상황/역할)\n"
                    "- 재현성(실제로 했던 행동 설명 가능)\n"
                    "- 트레이드오프 인식\n"
                    "- 팀 협업 맥락 이해\n\n"
                    "면접관 메모 템플릿까지 포함하면 면접관 간 평가 편차를 줄일 수 있습니다."
                ),
                "additional_opinion": (
                    "실무 면접관 입장에서 바로 쓸 수 있는 수준이었습니다. 특히 꼬리질문이 '깊이 확인'용으로 좋아서, 포트폴리오가 화려한 지원자 검증에 도움이 됐습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 730,
                "likes": 20,
                "bookmarks": 13,
                "created_at": now - timezone.timedelta(days=2, hours=8),
            },
            {
                "user": user_b,
                "platform": models["deepseek_v32"].platform,
                "model": models["deepseek_v32"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "데이터분석/통계"),
                "title": "LLM 평가셋 오답 패턴 분석 프롬프트 (라벨 품질 점검 포함)",
                "tags": "LLM평가,데이터품질,분석,벤치마크",
                "prompt": (
                    "LLM 평가셋의 오답 로그를 분석해서 모델 문제인지, 프롬프트 문제인지, 라벨 문제인지 구분하고 싶습니다.\n"
                    "입력으로는 질문, 정답 라벨, 모델 응답, 평가 점수, 오답 코멘트가 들어옵니다.\n"
                    "출력에는 다음이 필요합니다.\n"
                    "- 오답 유형 taxonomy\n"
                    "- 라벨 오류 의심 사례 추출 기준\n"
                    "- 프롬프트 수정으로 개선 가능한 케이스 분류\n"
                    "- 추가 데이터 수집이 필요한 영역\n"
                    "- 다음 실험 우선순위"
                ),
                "ai_response": (
                    "오답 분석은 '정답률'보다 '재발 가능한 패턴'을 찾는 작업으로 보는 것이 좋습니다.\n\n"
                    "[권장 분류 축]\n"
                    "1) 지식 부족 / 추론 실패 / 지시 불이행 / 출력 형식 오류\n"
                    "2) 입력 모호성 / 라벨 불일치 / 채점 규칙 과도함\n"
                    "3) 단일 실패 vs 반복 실패\n\n"
                    "[라벨 오류 의심 기준]\n"
                    "- 동일 질문에서 다수 모델이 일관되게 다른 답을 내고 근거가 충분함\n"
                    "- 라벨이 최신 문서/정책 기준과 불일치\n"
                    "- 채점 규칙이 표현 다양성을 허용하지 않음\n\n"
                    "[다음 실험 우선순위 예시]\n"
                    "- 고빈도 오답 유형부터 프롬프트 수정 실험\n"
                    "- 라벨 품질 검토가 필요한 그룹 별도 큐 분리\n"
                    "- 평가셋 확장보다 기준 정제 먼저 수행\n\n"
                    "실무에서는 오답 사례를 20개 단위 샘플링해 사람이 직접 재분류하는 단계가 품질 향상에 큰 영향을 줍니다."
                ),
                "additional_opinion": (
                    "단순히 '오답률 높은 항목'을 나열하는 수준이 아니라, 라벨 오류 의심 기준까지 잡아줘서 평가 운영 프로세스를 개선하는 데 도움이 됐습니다."
                ),
                "satisfaction": Decimal("4.5"),
                "views": 820,
                "likes": 25,
                "bookmarks": 16,
                "created_at": now - timezone.timedelta(days=1, hours=21),
            },
            {
                "user": user_c,
                "platform": models["claude46_sonnet"].platform,
                "model": models["claude46_sonnet"],
                "model_detail": "claude-sonnet-4.6",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "기술문서/요약"),
                "title": "장문의 장애 회고 문서를 경영진 보고용 1페이지로 압축하는 프롬프트",
                "tags": "장애회고,요약,경영보고,문서",
                "prompt": (
                    "장애 회고 문서가 8페이지 분량인데 경영진 공유용으로 1페이지로 압축해야 합니다.\n"
                    "단, 아래 내용은 반드시 유지되어야 합니다.\n"
                    "- 장애 영향 범위/시간\n"
                    "- 고객 영향도\n"
                    "- 근본 원인(기술/프로세스)\n"
                    "- 재발 방지 액션과 담당자/기한\n"
                    "기술 세부사항은 너무 깊지 않게, 하지만 원인 책임이 흐려지지 않도록 정리해 주세요."
                ),
                "ai_response": (
                    "경영진 보고용 압축에서는 '무슨 일이 있었는지'보다 '왜 중요하고 어떻게 재발을 막는지'가 핵심입니다.\n\n"
                    "[1페이지 구성 제안]\n"
                    "1. 사건 개요 (언제/무엇/얼마나 영향)\n"
                    "2. 고객 영향 요약 (사용자 수, 핵심 기능 영향 여부)\n"
                    "3. 원인 요약 (기술 원인 + 프로세스 원인 분리)\n"
                    "4. 즉시 조치와 현재 상태\n"
                    "5. 재발 방지 액션 (담당자/마감일 포함)\n\n"
                    "[주의점]\n"
                    "- 기술 설명을 줄이되 책임 소재를 모호하게 쓰지 않기\n"
                    "- '예방 강화 예정' 같은 추상 표현 대신 실행 항목으로 변환\n"
                    "- 고객 영향이 제한적이었더라도 탐지/대응 지연은 별도 명시\n\n"
                    "원문 회고가 길수록 '삭제 기준'을 먼저 정하는 것이 좋고, 부록 링크로 상세 문서를 연결하면 이해관계자 요구를 모두 만족시키기 쉽습니다."
                ),
                "additional_opinion": (
                    "임원 보고에서 필요한 정보만 남기는 기준이 명확해서 좋았습니다. 특히 원인 요약을 기술/프로세스로 분리해 준 부분이 사후 액션 정렬에 도움이 됐습니다."
                ),
                "satisfaction": Decimal("4.5"),
                "views": 610,
                "likes": 16,
                "bookmarks": 10,
                "created_at": now - timezone.timedelta(days=1, hours=10),
            },
            {
                "user": user_a,
                "platform": models["gptoss120b"].platform,
                "model": models["gptoss120b"],
                "model_detail": "",
                "model_etc": "",
                "category": self._pick_category(category_map, categories, "AI/자연어처리"),
                "title": "오픈 웨이트 모델 도입 검토: 비용/품질/운영 난이도 비교 프롬프트",
                "tags": "오픈소스LLM,비용분석,아키텍처,의사결정",
                "prompt": (
                    "사내 서비스에 상용 API 모델 대신 오픈 웨이트 모델 일부를 도입할지 검토 중입니다.\n"
                    "후보는 상용 API 유지 / 하이브리드 운영 / 온프레미스 중심 3안입니다.\n"
                    "비교 기준은 비용, 응답속도, 품질, 운영 난이도, 보안/컴플라이언스, 장애 대응 체계입니다.\n"
                    "최종적으로 CTO 의사결정용 비교표와 권고안, 전환 시범 프로젝트 범위까지 제안해 주세요."
                ),
                "ai_response": (
                    "좋은 검토 주제입니다. 이 경우는 모델 성능 비교보다 운영 체계 비용을 포함한 TCO 관점이 중요합니다.\n\n"
                    "[3안 비교 프레임]\n"
                    "- 상용 API 유지: 운영 간단, 품질 안정적, 단가/정책 의존성 높음\n"
                    "- 하이브리드: 민감 데이터/반복 업무는 내부 모델, 고난도는 상용 API\n"
                    "- 온프레미스 중심: 통제력 높지만 MLOps/서빙 운영 비용 큼\n\n"
                    "[권고안 예시]\n"
                    "단기에는 하이브리드 운영을 추천합니다. FAQ/요약/분류 등 반복적 고빈도 태스크부터 내부 모델로 시범 전환하고,\n"
                    "고객 영향이 큰 생성/추론 태스크는 상용 API를 유지하는 구조가 리스크와 비용 균형이 좋습니다.\n\n"
                    "[시범 프로젝트 범위]\n"
                    "- 대상 업무 1~2개\n"
                    "- 품질 KPI/비용 KPI/지연시간 KPI 정의\n"
                    "- 롤백 기준 및 모니터링 체계 포함\n"
                    "- 4주 운영 후 확장 여부 결정"
                ),
                "additional_opinion": (
                    "실제로 내부 의사결정 문서 초안에 거의 그대로 사용했습니다. 단순 성능 비교가 아니라 운영 인력/장애 대응 비용까지 포함한 프레임이 특히 좋았습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 540,
                "likes": 14,
                "bookmarks": 11,
                "created_at": now - timezone.timedelta(hours=19),
            },
            {
                "user": user_b,
                "platform": models["google_other"].platform,
                "model": models["google_other"],
                "model_detail": "",
                "model_etc": "Gemini 3.1 Pro preview routing test",
                "category": self._pick_category(category_map, categories, "기타"),
                "title": "신규 모델 A/B 테스트 결과를 운영팀이 이해하기 쉽게 요약하는 템플릿",
                "tags": "AB테스트,평가,운영공유,기타모델",
                "prompt": (
                    "사내에서 신규 LLM 모델 A/B 테스트를 진행했는데, 결과를 운영팀/기획팀이 함께 이해할 수 있게 요약하고 싶습니다.\n"
                    "입력에는 정량 지표(정확도, 지연시간, 비용), 정성 피드백, 실패 사례가 포함됩니다.\n"
                    "출력은 아래 형식으로 해주세요.\n"
                    "- 한 줄 결론\n"
                    "- 지표 비교 표\n"
                    "- 사용 시 주의할 케이스\n"
                    "- 적용 추천 범위 / 비추천 범위\n"
                    "- 추가 실험 제안"
                ),
                "ai_response": (
                    "여러 팀이 같이 보는 A/B 테스트 요약은 '읽는 사람별 관심사'를 동시에 만족시켜야 합니다.\n\n"
                    "[권장 출력 구조]\n"
                    "1) 한 줄 결론: 어떤 업무에선 유리하고, 어떤 업무에선 아직 위험한지\n"
                    "2) 지표 비교 표: 정확도/지연시간/비용을 동일 단위로 표시\n"
                    "3) 실패 사례 Top 5: 실제 운영에서 문제될 패턴 위주\n"
                    "4) 적용 권장 범위 / 보류 범위\n"
                    "5) 다음 실험 제안: 데이터 추가, 프롬프트 보정, 라우팅 기준 조정\n\n"
                    "운영팀 공유용으로는 '비추천 범위'를 명확히 쓰는 것이 중요합니다. 그래야 기대치 관리가 쉬워지고 불필요한 확산을 막을 수 있습니다."
                ),
                "additional_opinion": (
                    "기획/운영/개발이 같이 보는 문서 템플릿으로 쓰기 좋았습니다. 특히 비추천 범위를 명시하게 해준 덕분에 테스트 결과가 과장되어 전달되는 걸 막을 수 있었습니다."
                ),
                "satisfaction": Decimal("4.0"),
                "views": 430,
                "likes": 11,
                "bookmarks": 7,
                "created_at": now - timezone.timedelta(hours=7),
            },
        ]
