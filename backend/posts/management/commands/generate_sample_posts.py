"""
실제와 유사한 게시글 10개를 생성하는 명령어.

요구사항:
- 기존 사용자만 사용 (새 사용자 생성하지 않음)
- model_detail 적극 사용 (2~3건)
- 카테고리/플랫폼/모델의 '기타' 적극 사용 (2~3건)
- 충분히 긴 prompt/ai_response/additional_opinion
- 조회수/좋아요/북마크/작성시간 다양화
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
import random

from posts.models import Platform, AiModel, Category, Post


class Command(BaseCommand):
    help = "실제와 유사한 게시글 10개를 생성합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true', help='실제로 저장하지 않고 어떤 데이터가 생성될지 미리 출력'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        User = get_user_model()
        users = list(User.objects.all()[:3])
        if not users:
            self.stdout.write(self.style.ERROR('생성된 사용자가 없어 게시글을 만들 수 없습니다. 먼저 사용자를 생성하세요.'))
            return

        categories = list(Category.objects.all())
        if not categories:
            self.stdout.write(self.style.ERROR('카테고리가 없습니다. 카테고리를 먼저 생성하세요.'))
            return

        # 필수 플랫폼/모델 존재 확인
        def get_model(platform_name: str, model_name: str) -> AiModel:
            try:
                platform = Platform.objects.get(name=platform_name)
                return AiModel.objects.get(platform=platform, name=model_name)
            except (Platform.DoesNotExist, AiModel.DoesNotExist):
                return None

        openai_gpt5 = get_model('OpenAI', 'GPT-5')
        openai_gpt4o = get_model('OpenAI', 'GPT-4o')
        anthropic_sonnet = get_model('Anthropic', 'Claude 4 Sonnet')
        meta_llama33 = get_model('Meta', 'Llama 3.3')
        xai_grok3 = get_model('xAI', 'Grok-3')
        deepseek_v3 = get_model('DeepSeek', 'DeepSeek V3')
        google_other = get_model('Google', '기타')
        platform_other = None
        try:
            platform_other = Platform.objects.get(name='기타')
        except Platform.DoesNotExist:
            pass

        if not all([openai_gpt5, openai_gpt4o, anthropic_sonnet, xai_grok3, deepseek_v3]) or google_other is None:
            self.stdout.write(self.style.ERROR('필수 AI 모델이 존재하지 않습니다. 플랫폼/모델 시드를 먼저 로드하세요.'))
            return

        category_other = next((c for c in categories if c.name == '기타'), None)

        def random_category(exclude_other=False) -> Category:
            if exclude_other:
                candidates = [c for c in categories if c != category_other]
                return random.choice(candidates) if candidates else random.choice(categories)
            return random.choice(categories)

        long_prompt = (
            "프로젝트의 맥락, 목표, 제약 조건을 명확히 설명하고 다양한 입력 예시를 포함한 상세 프롬프트입니다. "
            "모델이 단계별 추론을 수행하도록 지시하며, 실패 사례와 엣지 케이스까지 고려해 답변하도록 요청합니다. "
            "또한 출력 포맷과 평가 기준을 명확히 지정하여 일관된 품질을 확보하려고 합니다."
        )
        long_response = (
            "요청하신 사양에 따라 문제를 구조화하고 가정과 전제를 명시했습니다. "
            "이후 단계별 해결 과정을 통해 선택지 비교, 장단점 분석, 의사결정 근거를 제시했습니다. "
            "마지막으로 재현 가능한 절차와 검증 방법, 리스크 완화 방안, 향후 개선 아이디어를 포함합니다."
        )
        long_opinion = (
            "추가로, 현실 환경에서의 적용 가능성과 운영 이슈(성능, 비용, 보안)를 고려할 것을 권장합니다. "
            "데이터 품질과 프롬프트 관리 체계를 갖추면 결과 안정성이 크게 향상됩니다."
        )

        # 샘플 계획: 10건 구성
        now = timezone.now()
        samples = [
            # 1) OpenAI GPT-5 + model_detail
            {
                'user': users[0], 'platform': openai_gpt5.platform, 'model': openai_gpt5,
                'category': random_category(True), 'title': '고난도 코드 리뷰 자동화 파이프라인 구성',
                'model_detail': 'GPT-5-high-fast', 'model_etc': '',
                'satisfaction': Decimal('4.5'), 'views': 1200, 'likes': 35, 'bookmarks': 18,
                'created_at': now - timezone.timedelta(days=6, hours=3)
            },
            # 2) OpenAI GPT-4o + detail
            {
                'user': users[1 if len(users) > 1 else 0], 'platform': openai_gpt4o.platform, 'model': openai_gpt4o,
                'category': random_category(), 'title': '멀티모달 회의 요약 및 액션아이템 추출',
                'model_detail': 'GPT-4o-mini-vision', 'model_etc': '',
                'satisfaction': Decimal('4.0'), 'views': 860, 'likes': 22, 'bookmarks': 11,
                'created_at': now - timezone.timedelta(days=5, hours=1)
            },
            # 3) Anthropic Claude 4 Sonnet + detail
            {
                'user': users[0], 'platform': anthropic_sonnet.platform, 'model': anthropic_sonnet,
                'category': random_category(), 'title': '고객 피드백 카테고라이징과 인사이트 요약',
                'model_detail': 'Claude-4-Sonnet-latest', 'model_etc': '',
                'satisfaction': Decimal('4.0'), 'views': 540, 'likes': 15, 'bookmarks': 7,
                'created_at': now - timezone.timedelta(days=4, hours=6)
            },
            # 4) Google 기타 모델 사용 (model_etc 필요)
            {
                'user': users[1 if len(users) > 1 else 0], 'platform': google_other.platform, 'model': google_other,
                'category': random_category(), 'title': '대규모 스프레드시트 자동 정리 및 시각화',
                'model_detail': '', 'model_etc': 'Gemini Ultra 1.0 experimental',
                'satisfaction': Decimal('3.5'), 'views': 410, 'likes': 9, 'bookmarks': 4,
                'created_at': now - timezone.timedelta(days=3, hours=2)
            },
            # 5) 플랫폼=기타 + 모델=기타 (model_etc 필수)
            {
                'user': users[0], 'platform': platform_other, 'model': None,  # placeholder, 채우기 아래에서
                'category': category_other or random_category(), 'title': '사내 프라이빗 LLM로 보안 문서 요약',
                'model_detail': '', 'model_etc': 'Local LLM 13B fine-tuned',
                'satisfaction': Decimal('4.5'), 'views': 980, 'likes': 28, 'bookmarks': 13,
                'created_at': now - timezone.timedelta(days=3, hours=20)
            },
            # 6) Meta Llama 3.3
            {
                'user': users[0], 'platform': meta_llama33.platform if meta_llama33 else openai_gpt4o.platform,
                'model': meta_llama33 or openai_gpt4o, 'category': random_category(),
                'title': '기술 블로그 초안 작성 자동화', 'model_detail': '', 'model_etc': '',
                'satisfaction': Decimal('3.5'), 'views': 300, 'likes': 8, 'bookmarks': 5,
                'created_at': now - timezone.timedelta(days=2, hours=16)
            },
            # 7) xAI Grok-3
            {
                'user': users[1 if len(users) > 1 else 0], 'platform': xai_grok3.platform, 'model': xai_grok3,
                'category': random_category(), 'title': '실시간 로그 스트림 이상 탐지 규칙 생성',
                'model_detail': '', 'model_etc': '',
                'satisfaction': Decimal('4.0'), 'views': 620, 'likes': 17, 'bookmarks': 10,
                'created_at': now - timezone.timedelta(days=2, hours=1)
            },
            # 8) DeepSeek V3
            {
                'user': users[0], 'platform': deepseek_v3.platform, 'model': deepseek_v3,
                'category': random_category(), 'title': '복잡한 수학 증명 보조 및 해설',
                'model_detail': '', 'model_etc': '',
                'satisfaction': Decimal('4.5'), 'views': 1500, 'likes': 45, 'bookmarks': 21,
                'created_at': now - timezone.timedelta(days=1, hours=5)
            },
            # 9) OpenAI o3 (detail 없음)
            {
                'user': users[0], 'platform': openai_gpt4o.platform, 'model': get_model('OpenAI', 'o3') or openai_gpt4o,
                'category': random_category(), 'title': '대규모 테스트 케이스 생성 및 경계값 설계',
                'model_detail': '', 'model_etc': '',
                'satisfaction': Decimal('3.0'), 'views': 270, 'likes': 6, 'bookmarks': 3,
                'created_at': now - timezone.timedelta(hours=20)
            },
            # 10) 카테고리=기타 + 모델=기타 사용
            {
                'user': users[1 if len(users) > 1 else 0], 'platform': openai_gpt5.platform, 'model': get_model('OpenAI', '기타'),
                'category': category_other or random_category(), 'title': '특수 도메인 규정 문서 질의응답 봇',
                'model_detail': '', 'model_etc': 'GPT-OSS 34B community',
                'satisfaction': Decimal('4.0'), 'views': 520, 'likes': 14, 'bookmarks': 9,
                'created_at': now - timezone.timedelta(hours=12)
            },
        ]

        # 플랫폼=기타인 샘플(5번)에 모델=기타 강제 설정
        if platform_other is not None:
            try:
                other_model = AiModel.objects.get(platform=platform_other, name='기타')
                samples[4]['model'] = other_model
            except AiModel.DoesNotExist:
                pass

        created = 0
        with transaction.atomic():
            for idx, s in enumerate(samples, start=1):
                # Post 생성 전 검증 데이터 만들기
                post_kwargs = dict(
                    title=s['title'], platform=s['platform'], model=s['model'], category=s['category'],
                    model_etc=s['model_etc'], model_detail=s['model_detail'],
                    satisfaction=s['satisfaction'], prompt=long_prompt, ai_response=long_response,
                    additional_opinion=long_opinion,
                )
                if dry_run:
                    self.stdout.write(self.style.WARNING(f"[{idx}] {post_kwargs['title']} → platform={post_kwargs['platform']}, model={getattr(post_kwargs['model'],'name',None)}"))
                    continue

                post = Post.objects.create(author=s['user'], **post_kwargs)
                # 카운터/작성시간 업데이트
                Post.objects.filter(pk=post.pk).update(
                    view_count=s['views'], like_count=s['likes'], bookmark_count=s['bookmarks'], created_at=s['created_at']
                )
                created += 1

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'게시글 {created}개 생성 완료'))
        else:
            self.stdout.write(self.style.SUCCESS('DRY RUN 완료'))


