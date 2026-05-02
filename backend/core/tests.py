from django.urls import reverse
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Platform, AiModel, Category, Post
from core.filters import PostFilter
from core.models.trending import TrendingCategory, TrendingRanking
from core.services.trending_service import TrendingService


User = get_user_model()


class CoreSearchTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@a.com', password='Test1234!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.platform = Platform.objects.create(name='OpenAI')
        self.model = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.category = Category.objects.create(name='개발')
        Post.objects.create(
            title='파이썬 예제',
            author=self.user,
            platform=self.platform,
            model=self.model,
            category=self.category,
            tags='python, django',
            satisfaction=4.5,
            prompt='충분히 긴 프롬프트 내용입니다.',
            ai_response='충분히 긴 AI 응답 내용입니다.'
        )

    def test_core_search(self):
        url = reverse('core:search_posts')
        res = self.client.get(url, {'q': '파이썬', 'sort': 'latest'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)
        self.assertGreaterEqual(len(res.data['results']), 1)


class TrendingCachePermissionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='user@example.com', password='Test1234!')
        self.admin = User.objects.create_superuser(email='admin@example.com', password='Admin1234!')
        self.user_token, _ = Token.objects.get_or_create(user=self.user)
        self.admin_token, _ = Token.objects.get_or_create(user=self.admin)
        self.refresh_url = reverse('core:refresh_trending_cache')

    def test_refresh_trending_cache_requires_authentication(self):
        res = self.client.post(self.refresh_url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_trending_cache_forbids_non_admin(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        res = self.client.post(self.refresh_url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_trending_cache_allows_admin(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        res = self.client.post(self.refresh_url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'success')


class PostFilterQueryEfficiencyTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='filters@example.com', password='Test1234!')
        self.platform = Platform.objects.create(name='OpenAI')
        self.category_dev = Category.objects.create(name='개발')
        self.category_other = Category.objects.create(name='기타')
        self.model_main = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.model_other = AiModel.objects.create(platform=self.platform, name='기타')

        Post.objects.create(
            title='개발 일반 모델',
            author=self.user,
            platform=self.platform,
            model=self.model_main,
            category=self.category_dev,
            prompt='충분히 긴 프롬프트 내용입니다.',
            ai_response='충분히 긴 AI 응답 내용입니다.',
        )
        Post.objects.create(
            title='기타 카테고리',
            author=self.user,
            platform=self.platform,
            model=self.model_main,
            category=self.category_other,
            category_etc='실험',
            prompt='충분히 긴 프롬프트 내용입니다.',
            ai_response='충분히 긴 AI 응답 내용입니다.',
        )
        Post.objects.create(
            title='기타 모델',
            author=self.user,
            platform=self.platform,
            model=self.model_other,
            model_etc='커스텀 모델',
            category=self.category_dev,
            prompt='충분히 긴 프롬프트 내용입니다.',
            ai_response='충분히 긴 AI 응답 내용입니다.',
        )

    def _count_filter_queries(self, params: dict) -> int:
        with CaptureQueriesContext(connection) as captured:
            filtered = PostFilter(params, queryset=Post.objects.all()).qs
            _ = filtered.count()
        return len(captured)

    def test_categories_filter_query_count_does_not_scale_with_id_count(self):
        small_queries = self._count_filter_queries({'categories': str(self.category_dev.id)})
        large_queries = self._count_filter_queries(
            {
                'categories': (
                    f"{self.category_dev.id},{self.category_other.id},999999,abc,"
                    f"{self.category_dev.id},{self.category_other.id}"
                )
            }
        )
        self.assertLessEqual(
            large_queries,
            small_queries + 2,
            msg=f"Expected near-constant query count for categories filter, got small={small_queries}, large={large_queries}",
        )

        result_ids = list(
            PostFilter({'categories': str(self.category_other.id)}, queryset=Post.objects.all())
            .qs.values_list('category_id', flat=True)
        )
        self.assertIn(self.category_other.id, result_ids)

    def test_models_filter_query_count_does_not_scale_with_id_count(self):
        small_queries = self._count_filter_queries({'models': str(self.model_main.id)})
        large_queries = self._count_filter_queries(
            {
                'models': (
                    f"{self.model_main.id},{self.model_other.id},999999,abc,"
                    f"{self.model_main.id},{self.model_other.id}"
                )
            }
        )
        self.assertLessEqual(
            large_queries,
            small_queries + 2,
            msg=f"Expected near-constant query count for models filter, got small={small_queries}, large={large_queries}",
        )

        result_ids = list(
            PostFilter({'models': str(self.model_other.id)}, queryset=Post.objects.all())
            .qs.values_list('model_id', flat=True)
        )
        self.assertIn(self.model_other.id, result_ids)


class TrendingCategoryRankingsQueryTests(APITestCase):
    def setUp(self):
        TrendingService.refresh_cache()
        self.category_a = TrendingCategory.objects.create(
            name="llm_speed",
            title="속도",
            subtitle="응답 속도",
            icon_name="zap",
            order=1,
            is_active=True,
        )
        self.category_b = TrendingCategory.objects.create(
            name="llm_quality",
            title="품질",
            subtitle="응답 품질",
            icon_name="star",
            order=2,
            is_active=True,
        )

        TrendingRanking.objects.create(
            category=self.category_a,
            rank=1,
            name="Model A",
            score="100",
            provider="Provider A",
            is_active=True,
        )
        TrendingRanking.objects.create(
            category=self.category_a,
            rank=2,
            name="Model B",
            score="90",
            provider="Provider B",
            is_active=True,
        )
        TrendingRanking.objects.create(
            category=self.category_a,
            rank=3,
            name="Inactive Model",
            score="10",
            provider="Provider C",
            is_active=False,
        )
        TrendingRanking.objects.create(
            category=self.category_b,
            rank=1,
            name="Model C",
            score="95",
            provider="Provider D",
            is_active=True,
        )

    def test_fetch_category_rankings_uses_constant_query_count(self):
        with CaptureQueriesContext(connection) as captured:
            data = TrendingService._fetch_category_rankings()

        self.assertLessEqual(
            len(captured),
            3,
            msg=f"Expected category rankings fetch to avoid N+1 queries, got {len(captured)} queries",
        )
        self.assertIn("llm_speed", data)
        self.assertIn("llm_quality", data)
        self.assertEqual(len(data["llm_speed"]["data"]), 2)
        self.assertEqual(data["llm_speed"]["data"][0]["rank"], 1)
