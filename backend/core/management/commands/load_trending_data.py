"""
트렌딩 데이터 로드 명령어
Frontend의 trending-data.ts 기반으로 초기 데이터 생성
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models.trending import TrendingCategory, TrendingRanking


class Command(BaseCommand):
    help = '트렌딩 초기 데이터를 로드합니다'

    def handle(self, *args, **options):
        """초기 트렌딩 데이터 로드"""
        
        # 트렌딩 카테고리와 랭킹 데이터 정의 (최신 Top models per tasks 기반)
        trending_data = {
            '논리적추론': {
                'title': '논리적 추론 최고 모델',
                'subtitle': 'GPQA Diamond 벤치마크 기준 - 생물학, 물리학, 화학 분야의 복잡한 벤치마크',
                'icon_name': 'Brain',
                'order': 1,
                'rankings': [
                    {'rank': 1, 'name': 'GPT-5', 'score': '89.4', 'provider': 'OpenAI'},
                    {'rank': 2, 'name': 'Grok 4', 'score': '87.5', 'provider': 'xAI'},
                    {'rank': 3, 'name': 'Gemini 2.5 Pro', 'score': '86.4', 'provider': 'Google'},
                ]
            },
            '고등수학': {
                'title': '고등 수학 최고 모델',
                'subtitle': 'AIME 2025 벤치마크 기준 - 고등학교 수학 경시대회 벤치마크',
                'icon_name': 'Calculator',
                'order': 2,
                'rankings': [
                    {'rank': 1, 'name': 'GPT-5', 'score': '100', 'provider': 'OpenAI'},
                    {'rank': 2, 'name': 'GPT oss 20b', 'score': '98.7', 'provider': 'OpenAI'},
                    {'rank': 3, 'name': 'GPT oss 120b', 'score': '97.9', 'provider': 'OpenAI'},
                ]
            },
            '에이전트코딩': {
                'title': '에이전트 코딩 최고 모델',
                'subtitle': 'SWE Bench 벤치마크 기준 - GitHub Issues 해결 능력을 측정하는 에이전트 추론 벤치마크',
                'icon_name': 'Code',
                'order': 3,
                'rankings': [
                    {'rank': 1, 'name': 'Grok 4', 'score': '75', 'provider': 'xAI'},
                    {'rank': 2, 'name': 'GPT-5', 'score': '74.9', 'provider': 'OpenAI'},
                    {'rank': 3, 'name': 'Claude 4.1 Opus', 'score': '74.5', 'provider': 'Anthropic'},
                ]
            },
            '도구사용': {
                'title': '도구 사용 최고 모델',
                'subtitle': 'BFCL 벤치마크 기준 - LLM의 도구 사용 능력 측정',
                'icon_name': 'Wrench',
                'order': 4,
                'rankings': [
                    {'rank': 1, 'name': 'Llama 3.1 405b', 'score': '81.1', 'provider': 'Meta'},
                    {'rank': 2, 'name': 'Llama 3.3 70b', 'score': '77.3', 'provider': 'Meta'},
                    {'rank': 3, 'name': 'GPT-4o', 'score': '72.08', 'provider': 'OpenAI'},
                ]
            },
            '적응적추론': {
                'title': '적응적 추론 최고 모델',
                'subtitle': 'GRIND 벤치마크 기준 - 기존 패턴 대신 새로운 맥락에 적응하는 능력 측정',
                'icon_name': 'Lightbulb',
                'order': 5,
                'rankings': [
                    {'rank': 1, 'name': 'Gemini 2.5 Pro', 'score': '82.1', 'provider': 'Google'},
                    {'rank': 2, 'name': 'Claude 4 Sonnet', 'score': '75', 'provider': 'Anthropic'},
                    {'rank': 3, 'name': 'Claude 4 Opus', 'score': '67.9', 'provider': 'Anthropic'},
                ]
            },
            '전반적성능': {
                'title': '전반적 성능 최고 모델',
                'subtitle': 'Humanity\'s Last Exam 벤치마크 기준 - 다중 도메인에서 가장 도전적인 벤치마크',
                'icon_name': 'Trophy',
                'order': 6,
                'rankings': [
                    {'rank': 1, 'name': 'GPT-5', 'score': '42', 'provider': 'OpenAI'},
                    {'rank': 2, 'name': 'Grok 4', 'score': '25.4', 'provider': 'xAI'},
                    {'rank': 3, 'name': 'Gemini 2.5 Pro', 'score': '21.6', 'provider': 'Google'},
                ]
            },
            '속도': {
                'title': '가장 빠른 모델',
                'subtitle': '초당 토큰 수 기준 - 높을수록 좋음',
                'icon_name': 'Zap',
                'order': 7,
                'rankings': [
                    {'rank': 1, 'name': 'Llama 4 Scout', 'score': '2600 tokens/s', 'provider': 'Meta'},
                    {'rank': 2, 'name': 'Llama 3.3 70b', 'score': '2500 tokens/s', 'provider': 'Meta'},
                    {'rank': 3, 'name': 'Llama 3.1 70b', 'score': '2100 tokens/s', 'provider': 'Meta'},
                ]
            },
            '지연시간': {
                'title': '최저 지연시간 모델',
                'subtitle': '첫 토큰까지의 시간(초) - 낮을수록 좋음',
                'icon_name': 'Clock',
                'order': 8,
                'rankings': [
                    {'rank': 1, 'name': 'Nova Micro', 'score': '0.3s', 'provider': 'Amazon'},
                    {'rank': 2, 'name': 'Llama 3.1 8b', 'score': '0.32s', 'provider': 'Meta'},
                    {'rank': 3, 'name': 'Llama 4 Scout', 'score': '0.33s', 'provider': 'Meta'},
                ]
            },
            '가격': {
                'title': '가장 저렴한 모델',
                'subtitle': '100만 토큰당 USD 가격 - 낮을수록 좋음',
                'icon_name': 'DollarSign',
                'order': 9,
                'rankings': [
                    {'rank': 1, 'name': 'Nova Micro', 'score': 'Input $0.04 / Output $0.14', 'provider': 'Amazon'},
                    {'rank': 2, 'name': 'Gemma 3 27b', 'score': 'Input $0.07 / Output $0.07', 'provider': 'Google'},
                    {'rank': 3, 'name': 'Gemini 1.5 Flash', 'score': 'Input $0.075 / Output $0.3', 'provider': 'Google'},
                ]
            }
        }

        try:
            with transaction.atomic():
                # 기존 데이터 삭제 (주의: 운영환경에서는 신중하게 사용)
                TrendingRanking.objects.all().delete()
                TrendingCategory.objects.all().delete()
                
                self.stdout.write('기존 트렌딩 데이터를 삭제했습니다.')
                
                # 새 데이터 생성
                for category_name, category_data in trending_data.items():
                    # 카테고리 생성
                    category = TrendingCategory.objects.create(
                        name=category_name,
                        title=category_data['title'],
                        subtitle=category_data['subtitle'],
                        icon_name=category_data['icon_name'],
                        order=category_data['order'],
                        is_active=True
                    )
                    
                    # 랭킹 데이터 생성
                    for ranking_data in category_data['rankings']:
                        TrendingRanking.objects.create(
                            category=category,
                            rank=ranking_data['rank'],
                            name=ranking_data['name'],
                            score=ranking_data['score'],
                            provider=ranking_data['provider'],
                            is_active=True
                        )
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'카테고리 "{category.title}" 및 {len(category_data["rankings"])}개 랭킹 생성 완료'
                        )
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'총 {len(trending_data)}개 카테고리와 트렌딩 데이터 로드 완료!'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'데이터 로드 중 오류 발생: {str(e)}')
            )