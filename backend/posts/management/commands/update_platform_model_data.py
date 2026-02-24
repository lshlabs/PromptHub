from django.core.management.base import BaseCommand
from posts.models import Platform, AiModel, Category


PLATFORM_DEFINITIONS = {
    # 명시적 ID로 플랫폼 정의
    1: 'OpenAI',
    2: 'Anthropic',
    3: 'Google',
    4: 'Meta',
    5: 'xAI',
    6: 'Mistral',
    7: '기타',  # 기타 플랫폼 ID를 7로 변경
    8: 'DeepSeek',
}

# 각 플랫폼별 모델 목록을 (모델 ID, 모델명) 형식으로 정의
# 공백 이름은 무시되고, 동일 플랫폼 내 중복 모델명은 최초 항목만 생성됩니다.
MODEL_DEFINITIONS = {
    1: [
        (10, 'GPT 5.2'),
        (11, 'GPT 5.1'),
        (12, 'GPT-5'),
        (13, 'o3'),
        (14, 'o4-mini'),
        (15, 'o1'),
        (16, '기타'),
    ],
    2: [
        (20, 'Claude Sonnet 4.6'),
        (21, 'Claude Opus 4.6'),
        (22, 'Claude Sonnet 4.5'),
        (23, 'Claude Opus 4.5'),
        (24, 'Claude 4.1 Opus'),
        (25, '기타'),
    ],
    3: [
        (30, 'Gemini 3.1 Pro'),
        (31, 'Gemini 3 Pro'),
        (32, 'Gemini 2.5 Pro'),
        (33, 'Gemini 2.5 Flash'),
        (34, 'Gemini 2.0 Flash'),
        (35, '기타'),
    ],
    4: [
        (40, 'Llama 4 Behemoth'),
        (41, 'Llama 4 Maverick'),
        (42, 'Llama 4 Scout'),
        (43, 'Llama 3.3 70B'),
        (44, 'Llama 3.1 405B'),
        (45, '기타'),
    ],
    5: [
        (50, 'Grok-4.1'),
        (51, 'Grok-4.1 Fast'),
        (52, 'Grok-2'),
        (53, 'Grok-4'),
        (54, 'Grok-3'),
        (55, '기타'),
    ],
    6: [
        (60, 'Mistral Large 3'),
        (61, 'Mistral Medium 3.1'),
        (62, 'Devstral 2'),
        (63, 'Codestral 25.08'),
        (64, 'Magistral Medium'),
        (65, '기타'),
    ],
    7: [
        (70, '기타'),
    ],
    8: [
        (80, 'DeepSeek V3.2'),
        (81, 'DeepSeek V3.2-Exp'),
        (82, 'DeepSeek R1'),
        (83, 'DeepSeek R1-0528'),
        (84, 'DeepSeek V3-0324'),
        (85, '기타'),
    ],
}


class Command(BaseCommand):
    help = '플랫폼/모델 테이블을 개편된 공식 목록으로 초기화합니다(명시적 ID 반영)'

    def handle(self, *args, **options):
        self.stdout.write('플랫폼/모델 데이터 개편(초기화)을 시작합니다...')
        
        # 기존 데이터 삭제
        self.clear_existing_data()
        
        # 새로운 플랫폼 데이터 생성
        self.load_platforms()
        
        # 새로운 모델 데이터 생성
        self.load_models()
        
        # 카테고리 데이터 업데이트
        self.load_categories()
        
        self.stdout.write(
            self.style.SUCCESS('✅ 플랫폼-모델 데이터 업데이트가 완료되었습니다!')
        )

    def clear_existing_data(self):
        """기존 데이터 삭제"""
        self.stdout.write('🗑️  기존 데이터를 삭제합니다...')

        # 모델 먼저 삭제 (외래키 때문에)
        model_count = AiModel.objects.count()
        AiModel.objects.all().delete()
        self.stdout.write(f'  ❌ 기존 모델 {model_count}개 삭제')

        # 플랫폼 삭제
        platform_count = Platform.objects.count()
        Platform.objects.all().delete()
        self.stdout.write(f'  ❌ 기존 플랫폼 {platform_count}개 삭제')

        # 카테고리 삭제
        category_count = Category.objects.count()
        Category.objects.all().delete()
        self.stdout.write(f'  ❌ 기존 카테고리 {category_count}개 삭제')

    def load_platforms(self):
        """개편된 플랫폼 데이터 로드(명시적 ID 반영)"""
        for platform_id in sorted(PLATFORM_DEFINITIONS.keys()):
            platform_name = PLATFORM_DEFINITIONS[platform_id]
            platform = Platform.objects.create(id=platform_id, name=platform_name)
            self.stdout.write(f'  ✅ 플랫폼 생성: (id={platform_id}) {platform_name}')

    def load_models(self):
        """개편된 모델 데이터 로드(명시적 ID 반영, 공백/중복 처리)"""
        for platform_id in sorted(MODEL_DEFINITIONS.keys()):
            try:
                platform = Platform.objects.get(id=platform_id)
            except Platform.DoesNotExist:
                self.stdout.write(f'  ❌ 플랫폼을 찾을 수 없음: id={platform_id}')
                continue

            seen_names = set()
            for model_id, model_name in MODEL_DEFINITIONS[platform_id]:
                model_name = (model_name or '').strip()
                if not model_name:
                    # 공백 이름 무시
                    continue
                if model_name in seen_names:
                    # 동일 플랫폼 내 중복 모델명 무시(유니크 제약 보호)
                    continue
                seen_names.add(model_name)

                AiModel.objects.create(
                    id=model_id,
                    platform=platform,
                    name=model_name,
                )
                self.stdout.write(
                    f'  ✅ 모델 생성: (p_id={platform_id}) {platform.name} - (m_id={model_id}) {model_name}'
                )

    def load_categories(self):
        """SampleSelector.ts 기반 카테고리 데이터 로드"""
        # SampleSelector.ts의 sampleCategory 배열과 동일한 순서
        categories = [
            '업무/문서',
            '개발/프로그래밍',
            '창작/글쓰기',
            '데이터/분석',
            '교육/학습',
            '번역',
            '요약',
            '기획/아이디어',
            '기타',
        ]
        
        for category_name in categories:
            category = Category.objects.create(name=category_name)
            self.stdout.write(f'  ✅ 카테고리 생성: {category_name}')
