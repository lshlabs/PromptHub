"""
동작 유지 검증을 위한 테스트 케이스
기존 로직과 개선된 로직이 동일한 결과를 반환하는지 확인
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from posts.models import Post, AiModel, Platform, Category
from core.models.trending import TrendingCategory, TrendingRanking
from posts.views import get_model_suggestions, models_list
from django.test import RequestFactory
from django.http import JsonResponse
import json

User = get_user_model()


class BehaviorVerificationTests(TestCase):
    """동작 일관성 검증 테스트"""
    
    def setUp(self):
        """테스트 데이터 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 플랫폼 생성
        self.platform = Platform.objects.create(
            name='OpenAI',
            slug='openai',
            is_active=True
        )
        
        # AI 모델 생성
        self.model1 = AiModel.objects.create(
            name='GPT-4',
            slug='gpt-4',
            platform=self.platform,
            sort_order=1,
            is_active=True
        )
        self.model2 = AiModel.objects.create(
            name='GPT-3.5',
            slug='gpt-3-5',
            platform=self.platform,
            sort_order=2,
            is_active=True
        )
        self.model3 = AiModel.objects.create(
            name='ChatGPT',
            slug='chatgpt',
            platform=self.platform,
            sort_order=0,  # 0은 맨 뒤로 가야 함
            is_active=True
        )
        
        # 카테고리 생성
        self.category = Category.objects.create(
            name='coding',
            title='코딩',
            is_active=True
        )
        
        # 게시글 생성
        self.post1 = Post.objects.create(
            title='GPT-4 사용법',
            content='GPT-4를 사용하는 방법입니다.',
            author=self.user,
            platform=self.platform,
            model=self.model1,
            category=self.category,
            model_detail='GPT-4 Sonnet',
            model_etc='GPT-4 Turbo'
        )
        
        self.post2 = Post.objects.create(
            title='GPT-3.5 튜토리얼',
            content='GPT-3.5 사용법입니다.',
            author=self.user,
            platform=self.platform,
            model=self.model2,
            category=self.category,
            model_detail='GPT-3.5 Turbo',
            model_etc='GPT-3.5 16K'
        )
        
        # 트렌딩 카테고리 및 랭킹 생성
        self.trending_category = TrendingCategory.objects.create(
            name='coding',
            title='코딩',
            subtitle='프로그래밍 관련 트렌드',
            icon_name='code',
            order=1
        )
        
        self.trending_ranking = TrendingRanking.objects.create(
            category=self.trending_category,
            rank=1,
            name='GPT-4',
            score='95',
            provider='OpenAI',
            related_model=self.model1,
            use_exact_matching=True,
            model_detail_contains='Sonnet',
            model_etc_contains='Turbo'
        )
        
        self.factory = RequestFactory()
    
    def test_original_matching_logic(self):
        """기존 정규화 매칭 로직 테스트"""
        # 기존 로직으로 필터링된 게시글 가져오기
        posts = self.trending_ranking.get_filtered_posts()
        
        # 결과 검증
        self.assertEqual(posts.count(), 1)
        self.assertEqual(posts.first().title, 'GPT-4 사용법')
        
        # 정규화 매칭이 제대로 작동하는지 확인
        # "Sonnet"이 "sonnet"으로 매칭되는지 확인
        ranking_with_lowercase = TrendingRanking.objects.create(
            category=self.trending_category,
            rank=2,
            name='GPT-4 Lowercase',
            score='90',
            provider='OpenAI',
            related_model=self.model1,
            use_exact_matching=True,
            model_detail_contains='sonnet',  # 소문자
            model_etc_contains='turbo'  # 소문자
        )
        
        posts_lowercase = ranking_with_lowercase.get_filtered_posts()
        self.assertEqual(posts_lowercase.count(), 1)
        self.assertEqual(posts_lowercase.first().title, 'GPT-4 사용법')
    
    def test_original_scoring_algorithm(self):
        """기존 스코어링 알고리즘 테스트"""
        # 모델 검색 요청 생성
        request = self.factory.get('/api/models/suggestions/', {'query': 'GPT'})
        
        # 기존 로직으로 검색 결과 가져오기
        response = get_model_suggestions(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        suggestions = data['suggestions']
        
        # 결과 검증: GPT로 시작하는 모델들이 우선순위를 가져야 함
        self.assertGreater(len(suggestions), 0)
        
        # GPT-4가 GPT-3.5보다 먼저 나와야 함 (startswith 가중치)
        gpt4_found = False
        gpt35_found = False
        for suggestion in suggestions:
            if suggestion['name'] == 'GPT-4':
                gpt4_found = True
            elif suggestion['name'] == 'GPT-3.5':
                gpt35_found = True
                # GPT-4가 먼저 나와야 함
                self.assertTrue(gpt4_found, "GPT-4가 GPT-3.5보다 먼저 나와야 함")
    
    def test_original_sort_order_logic(self):
        """기존 정렬 로직 테스트"""
        # 모델 목록 요청 생성
        request = self.factory.get('/api/models/')
        
        # 기존 로직으로 모델 목록 가져오기
        response = models_list(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        models = data['models']
        
        # 결과 검증: sort_order=0인 모델이 맨 뒤에 와야 함
        self.assertGreater(len(models), 0)
        
        # ChatGPT (sort_order=0)가 맨 뒤에 있는지 확인
        chatgpt_index = None
        for i, model in enumerate(models):
            if model['name'] == 'ChatGPT':
                chatgpt_index = i
                break
        
        self.assertIsNotNone(chatgpt_index, "ChatGPT 모델을 찾을 수 없음")
        self.assertEqual(chatgpt_index, len(models) - 1, "ChatGPT가 맨 뒤에 와야 함")
    
    def test_matching_edge_cases(self):
        """매칭 엣지 케이스 테스트"""
        # 공백, 하이픈, 언더스코어가 포함된 키워드 테스트
        ranking_with_special_chars = TrendingRanking.objects.create(
            category=self.trending_category,
            rank=3,
            name='GPT-4 Special',
            score='85',
            provider='OpenAI',
            related_model=self.model1,
            use_exact_matching=True,
            model_detail_contains='GPT-4 Sonnet',  # 공백과 하이픈 포함
            model_etc_contains='GPT_4_Turbo'  # 언더스코어 포함
        )
        
        posts_special = ranking_with_special_chars.get_filtered_posts()
        self.assertEqual(posts_special.count(), 1)
        self.assertEqual(posts_special.first().title, 'GPT-4 사용법')
    
    def test_scoring_edge_cases(self):
        """스코어링 엣지 케이스 테스트"""
        # 빈 쿼리 테스트
        request = self.factory.get('/api/models/suggestions/', {'query': ''})
        response = get_model_suggestions(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertEqual(data['suggestions'], [])
        
        # 존재하지 않는 모델 검색
        request = self.factory.get('/api/models/suggestions/', {'query': 'NonExistentModel'})
        response = get_model_suggestions(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertEqual(data['suggestions'], [])
    
    def test_sort_order_edge_cases(self):
        """정렬 엣지 케이스 테스트"""
        # 플랫폼 ID로 필터링 테스트
        request = self.factory.get('/api/models/', {'platform_id': self.platform.id})
        response = models_list(request)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        models = data['models']
        
        # 모든 모델이 같은 플랫폼에 속해야 함
        for model in models:
            self.assertEqual(model['platform']['id'], self.platform.id)
        
        # 잘못된 플랫폼 ID 테스트
        request = self.factory.get('/api/models/', {'platform_id': 'invalid'})
        response = models_list(request)
        self.assertEqual(response.status_code, 400)
