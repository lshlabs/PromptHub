from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Platform, AiModel, Category, Post


User = get_user_model()


class PostsApiTests(APITestCase):
    def setUp(self):
        # Users and tokens
        self.author = User.objects.create_user(email='author@example.com', password='Test1234!')
        self.liker = User.objects.create_user(email='liker@example.com', password='Test1234!')
        self.author_token, _ = Token.objects.get_or_create(user=self.author)
        self.liker_token, _ = Token.objects.get_or_create(user=self.liker)

        # Metadata
        self.platform = Platform.objects.create(name='OpenAI')
        self.model = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.category = Category.objects.create(name='개발')

        # URLs (namespaced by app_name)
        self.list_url = reverse('posts:posts_list')
        self.create_url = reverse('posts:post_create')

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_update_like_bookmark_and_user_lists(self):
        # Create
        self.auth(self.author_token)
        payload = {
            'title': '테스트 제목',
            'platform': self.platform.id,
            'model': self.model.id,
            'category': self.category.id,
            'tags': ['python', 'django'],
            'satisfaction': 4.5,
            'prompt': '이것은 충분히 긴 프롬프트 내용입니다.',
            'ai_response': '이것은 충분히 긴 AI 응답 내용입니다.',
            'additional_opinion': '추가 의견입니다.',
        }
        res = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        post_id = data['data']['id']

        # Update by author
        update_url = reverse('posts:post_update', kwargs={'post_id': post_id})
        res = self.client.patch(update_url, {'title': '수정된 제목'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['data']['title'], '수정된 제목')

        # Detail view count increments
        detail_url = reverse('posts:post_detail', kwargs={'post_id': post_id})
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['views'], 1)

        # Like and bookmark by another user
        self.auth(self.liker_token)
        like_url = reverse('posts:post_like', kwargs={'post_id': post_id})
        res = self.client.post(like_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data['data']['is_liked'])

        bookmark_url = reverse('posts:post_bookmark', kwargs={'post_id': post_id})
        res = self.client.post(bookmark_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data['data']['is_bookmarked'])

        # Liked list
        liked_url = reverse('posts:user_liked_posts')
        res = self.client.get(liked_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

        # Bookmarked list
        bookmarked_url = reverse('posts:user_bookmarked_posts')
        res = self.client.get(bookmarked_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

        # Author's posts
        self.auth(self.author_token)
        my_url = reverse('posts:user_my_posts')
        res = self.client.get(my_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

        # List with search
        res = self.client.get(self.list_url, {'search': '수정된 제목'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)


