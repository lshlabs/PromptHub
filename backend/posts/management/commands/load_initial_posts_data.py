from django.core.management.base import BaseCommand
from posts.models import Platform, Model, Category


class Command(BaseCommand):
    """
    posts 앱의 초기 데이터를 로드하는 Django 관리 명령어
    
    플랫폼, 모델, 카테고리 데이터를 생성합니다.
    """
    help = 'posts 앱의 초기 데이터를 로드합니다'

    def handle(self, *args, **options):
        """
        메인 명령어 실행 함수
        
        플랫폼, 모델, 카테고리 데이터를 순차적으로 로드합니다.
        
        Args:
            *args: 명령줄 인수
            **options: 명령줄 옵션
        """
        self.stdout.write('posts 앱 초기 데이터 로드를 시작합니다...')
        
        # 플랫폼 데이터 생성
        self.load_platforms()
        
        # 모델 데이터 생성
        self.load_models()
        
        # 카테고리 데이터 생성
        self.load_categories()
        
        self.stdout.write(
            self.style.SUCCESS('✅ posts 앱 초기 데이터 로드가 완료되었습니다!')
        )

    def load_platforms(self):
        """
        AI 플랫폼 데이터를 로드합니다.
        
        주요 AI 서비스 플랫폼들을 데이터베이스에 생성합니다.
        이미 존재하는 플랫폼은 건너뛁니다.
        """
        """플랫폼 데이터 로드"""
        platforms = [
            'OpenAI', 'Google', 'Anthropic', 'Meta', 
            'xAI', 'Mistral', 'Perplexity', '기타'
        ]
        
        for platform_name in platforms:
            platform, created = Platform.objects.get_or_create(name=platform_name)
            if created:
                self.stdout.write(f'  ✅ 플랫폼 생성: {platform_name}')
            else:
                self.stdout.write(f'  ⚪ 플랫폼 존재: {platform_name}')

    def load_models(self):
        """
        AI 모델 데이터를 로드합니다.
        
        각 플랫폼에 해당하는 AI 모델들을 데이터베이스에 생성합니다.
        이미 존재하는 모델은 건너뛁니다.
        """
        """모델 데이터 로드"""
        models_data = {
            'OpenAI': ['GPT-4o', 'GPT-4o mini', 'GPT-4 Turbo', 'GPT-3.5 Turbo', '기타'],
            'Google': ['Gemini Pro', 'Gemini Flash', 'Gemini Ultra', '기타'],
            'Anthropic': ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus', '기타'],
            'Meta': ['Llama 3.1', 'Llama 3', '기타'],
            'xAI': ['Grok-2', 'Grok-1', '기타'],
            'Mistral': ['Mistral Large', 'Mistral 7B', '기타'],
            'Perplexity': ['Perplexity AI', '기타'],
            '기타': []  # 기타 플랫폼에는 모델 없음
        }
        
        for platform_name, model_names in models_data.items():
            try:
                platform = Platform.objects.get(name=platform_name)
                for model_name in model_names:
                    model, created = Model.objects.get_or_create(
                        platform=platform,
                        name=model_name
                    )
                    if created:
                        self.stdout.write(f'  ✅ 모델 생성: {platform_name} - {model_name}')
                    else:
                        self.stdout.write(f'  ⚪ 모델 존재: {platform_name} - {model_name}')
            except Platform.DoesNotExist:
                self.stdout.write(f'  ❌ 플랫폼을 찾을 수 없음: {platform_name}')

    def load_categories(self):
        """
        게시글 카테고리 데이터를 로드합니다.
        
        다양한 분야의 게시글 카테고리들을 데이터베이스에 생성합니다.
        이미 존재하는 카테고리는 건너뛁니다.
        """
        """카테고리 데이터 로드"""
        categories = [
            '개발/프로그래밍', '업무/문서', '데이터/분석', '창작/글쓰기',
            '번역', '요약', '기획/아이디어', '교육/학습', '기타'
        ]
        
        for category_name in categories:
            category, created = Category.objects.get_or_create(name=category_name)
            if created:
                self.stdout.write(f'  ✅ 카테고리 생성: {category_name}')
            else:
                self.stdout.write(f'  ⚪ 카테고리 존재: {category_name}')