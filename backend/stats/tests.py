from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Platform, AiModel, Category, Post


User = get_user_model()


class StatsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='u@u.com', password='Test1234!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.platform = Platform.objects.create(name='OpenAI')
        self.model = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.category = Category.objects.create(name='개발')
        Post.objects.create(
            title='테스트 제목',
            author=self.user,
            platform=self.platform,
            model=self.model,
            category=self.category,
            tags='tag1, tag2',
            satisfaction=4.0,
            prompt='충분히 긴 테스트 프롬프트입니다.',
            ai_response='충분히 긴 테스트 응답입니다.'
        )

    def test_dashboard_stats(self):
        url = reverse('stats:dashboard_stats')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('total_posts', data['data'])

    def test_user_stats_requires_auth(self):
        url = reverse('stats:user_stats')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'success')


