from django.urls import reverse
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from posts.models import Platform, AiModel, Category, Post, PostInteraction


User = get_user_model()


class PostsApiTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(email='author@example.com', password='Test1234!')
        self.liker = User.objects.create_user(email='liker@example.com', password='Test1234!')
        self.author_token, _ = Token.objects.get_or_create(user=self.author)
        self.liker_token, _ = Token.objects.get_or_create(user=self.liker)

        self.platform = Platform.objects.create(name='OpenAI')
        self.model = AiModel.objects.create(platform=self.platform, name='GPT-4')
        self.category = Category.objects.create(name='개발')

        self.list_url = reverse('posts:posts_list')
        self.create_url = reverse('posts:post_create')
        self.models_list_url = reverse('posts:models_list')
        self.models_suggest_url = reverse('posts:models_suggest')

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def _build_create_payload(self, *, title: str = '테스트 제목'):
        return {
            'title': title,
            'platform': self.platform.id,
            'model': self.model.id,
            'category': self.category.id,
            'tags': ['python', 'django'],
            'satisfaction': 4.5,
            'prompt': '이것은 충분히 긴 프롬프트 내용입니다.',
            'ai_response': '이것은 충분히 긴 AI 응답 내용입니다.',
            'additional_opinion': '추가 의견입니다.',
        }

    def _create_post_via_api(self, *, title: str = '테스트 제목') -> int:
        self.auth(self.author_token)
        payload = self._build_create_payload(title=title)
        res = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        return data['data']['id']

    def test_post_create_returns_success_payload(self):
        post_id = self._create_post_via_api()
        self.assertTrue(Post.objects.filter(id=post_id).exists())

    def test_post_update_changes_title(self):
        post_id = self._create_post_via_api()
        update_url = reverse('posts:post_update', kwargs={'post_id': post_id})
        res = self.client.patch(update_url, {'title': '수정된 제목'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['data']['title'], '수정된 제목')

    def test_post_detail_increments_views(self):
        post_id = self._create_post_via_api()
        detail_url = reverse('posts:post_detail', kwargs={'post_id': post_id})
        res = self.client.get(detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['views'], 1)

    def test_like_and_bookmark_endpoints_mark_interaction_flags(self):
        post_id = self._create_post_via_api()
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

    def _seed_liker_interaction(self, post_id: int):
        PostInteraction.objects.create(
            user=self.liker,
            post_id=post_id,
            is_liked=True,
            is_bookmarked=True,
        )

    def test_user_liked_posts_list_includes_liked_item(self):
        post_id = self._create_post_via_api()
        self._seed_liker_interaction(post_id)

        self.auth(self.liker_token)
        liked_url = reverse('posts:user_liked_posts')
        res = self.client.get(liked_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

    def test_user_bookmarked_posts_list_includes_bookmarked_item(self):
        post_id = self._create_post_via_api()
        self._seed_liker_interaction(post_id)

        self.auth(self.liker_token)
        bookmarked_url = reverse('posts:user_bookmarked_posts')
        res = self.client.get(bookmarked_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

    def test_posts_list_search_returns_matching_post(self):
        post_id = self._create_post_via_api(title='수정된 제목')
        self.auth(self.author_token)
        res = self.client.get(self.list_url, {'search': '수정된 제목'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        ids = [p['id'] for p in data['data']['results']]
        self.assertIn(post_id, ids)

    def _create_post(self, suffix: str):
        return Post.objects.create(
            title=f'테스트 제목 {suffix}',
            author=self.author,
            platform=self.platform,
            model=self.model,
            category=self.category,
            tags='python, django',
            satisfaction=4.5,
            prompt='충분히 긴 테스트 프롬프트 내용입니다.',
            ai_response='충분히 긴 테스트 AI 응답 내용입니다.',
            additional_opinion='추가 의견',
        )

    def _count_list_queries(self, *, page_size: int):
        with CaptureQueriesContext(connection) as captured:
            res = self.client.get(self.list_url, {'page_size': page_size})
            self.assertEqual(res.status_code, status.HTTP_200_OK)
        return len(captured)

    def test_posts_list_query_count_does_not_scale_with_result_size(self):
        first_post = self._create_post('1')
        PostInteraction.objects.create(user=self.liker, post=first_post, is_liked=True, is_bookmarked=True)

        self.auth(self.liker_token)
        self.client.get(self.list_url, {'page_size': 1})  # warm-up request

        small_query_count = self._count_list_queries(page_size=1)

        for idx in range(2, 7):
            post = self._create_post(str(idx))
            PostInteraction.objects.create(
                user=self.liker,
                post=post,
                is_liked=(idx % 2 == 0),
                is_bookmarked=(idx % 3 == 0),
            )

        large_query_count = self._count_list_queries(page_size=6)
        self.assertLessEqual(
            large_query_count,
            small_query_count + 2,
            msg=f"Expected near-constant query count, got small={small_query_count}, large={large_query_count}",
        )

        res = self.client.get(self.list_url, {'page_size': 6})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        first_item = res.json()['data']['results'][0]
        self.assertIn('isLiked', first_item)
        self.assertIn('isBookmarked', first_item)

    def test_models_list_orders_with_db_sort_key(self):
        secondary_platform = Platform.objects.create(name='Anthropic')
        AiModel.objects.create(platform=self.platform, name='Gamma', sort_order=2)
        AiModel.objects.create(platform=self.platform, name='Alpha', sort_order=1)
        AiModel.objects.create(platform=secondary_platform, name='Beta', sort_order=1)
        AiModel.objects.create(platform=self.platform, name='ZeroOrder', sort_order=0)

        res = self.client.get(self.models_list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()['data']
        self.assertGreaterEqual(len(data), 4)

        sort_orders = [item['sort_order'] for item in data]
        first_zero_index = sort_orders.index(0)
        self.assertFalse(any(order != 0 for order in sort_orders[first_zero_index:]))

    def test_models_suggest_returns_ranked_and_limited(self):
        AiModel.objects.create(platform=self.platform, name='GPT-4.1-mini', sort_order=1)
        AiModel.objects.create(platform=self.platform, name='GPT-4.1-nano', sort_order=2)
        AiModel.objects.create(platform=self.platform, name='Super GPT Variant', sort_order=3)

        res = self.client.get(self.models_suggest_url, {'query': 'gpt', 'limit': 2})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()['data']
        self.assertEqual(len(body['suggestions']), 2)

        top_name = body['suggestions'][0]['name'].lower()
        self.assertTrue(top_name.startswith('gpt'))
