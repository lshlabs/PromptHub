from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Platform, AiModel, Category, Post


User = get_user_model()


class CoreSearchTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@a.com', password='Test1234!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.platform = Platform.objects.create(name='OpenAI')
        self.model = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.category = Category.objects.create(name='개발')
        # Seed a post
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

