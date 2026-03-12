from django.core.management.base import BaseCommand

from posts.models import AiModel, Category, Platform

PLATFORMS = ["OpenAI", "Google", "Anthropic", "Meta", "xAI", "Mistral", "Perplexity", "기타"]

MODELS_BY_PLATFORM = {
    "OpenAI": ["GPT-4o", "GPT-4o mini", "GPT-4 Turbo", "GPT-3.5 Turbo", "기타"],
    "Google": ["Gemini Pro", "Gemini Flash", "Gemini Ultra", "기타"],
    "Anthropic": ["Claude 3.5 Sonnet", "Claude 3.5 Haiku", "Claude 3 Opus", "기타"],
    "Meta": ["Llama 3.1", "Llama 3", "기타"],
    "xAI": ["Grok-2", "Grok-1", "기타"],
    "Mistral": ["Mistral Large", "Mistral 7B", "기타"],
    "Perplexity": ["Perplexity AI", "기타"],
    "기타": [],
}

CATEGORIES = [
    "개발/프로그래밍",
    "업무/문서",
    "데이터/분석",
    "창작/글쓰기",
    "번역",
    "요약",
    "기획/아이디어",
    "교육/학습",
    "기타",
]


class Command(BaseCommand):
    help = "posts 앱 초기 플랫폼/모델/카테고리 데이터를 로드합니다."

    def handle(self, *args, **options):
        self.stdout.write("posts 앱 초기 데이터 로드를 시작합니다...")
        self._load_platforms()
        self._load_models()
        self._load_categories()
        self.stdout.write(self.style.SUCCESS("posts 앱 초기 데이터 로드 완료"))

    def _load_platforms(self):
        for platform_name in PLATFORMS:
            _, created = Platform.objects.get_or_create(name=platform_name)
            marker = "생성" if created else "존재"
            self.stdout.write(f"플랫폼 {marker}: {platform_name}")

    def _load_models(self):
        for platform_name, model_names in MODELS_BY_PLATFORM.items():
            platform = Platform.objects.filter(name=platform_name).first()
            if platform is None:
                self.stdout.write(self.style.ERROR(f"플랫폼 없음: {platform_name}"))
                continue

            for model_name in model_names:
                _, created = AiModel.objects.get_or_create(platform=platform, name=model_name)
                marker = "생성" if created else "존재"
                self.stdout.write(f"모델 {marker}: {platform_name} - {model_name}")

    def _load_categories(self):
        for category_name in CATEGORIES:
            _, created = Category.objects.get_or_create(name=category_name)
            marker = "생성" if created else "존재"
            self.stdout.write(f"카테고리 {marker}: {category_name}")
