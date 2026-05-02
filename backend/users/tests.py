from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from posts.models import Platform, Category, Post
from users.models import UserSettings


User = get_user_model()


class UserAuthAndProfileTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('users:user_register')
        self.login_url = reverse('users:user_login')
        self.profile_url = reverse('users:user_profile')
        self.password_url = reverse('users:password_change')
        self.delete_url = reverse('users:account_delete')

    def _register(self, *, email: str, password: str = 'Str0ng-Passw0rd!') -> str:
        register_data = {
            'email': email,
            'password': password,
            'password_confirm': password,
        }
        res = self.client.post(self.register_url, register_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        return res.data['token']

    def _auth_token(self, token: str):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

    def test_register_returns_token(self):
        token = self._register(email='test@example.com')
        self.assertTrue(token)

    def test_profile_get_returns_authenticated_user(self):
        token = self._register(email='profile-get@example.com')
        self._auth_token(token)

        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'profile-get@example.com')

    def test_profile_put_updates_bio(self):
        token = self._register(email='profile-put@example.com')
        self._auth_token(token)
        res = self.client.put(self.profile_url, {'bio': 'hello'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['bio'], 'hello')

    def test_profile_patch_updates_location(self):
        token = self._register(email='profile-patch@example.com')
        self._auth_token(token)
        res = self.client.patch(self.profile_url, {'location': 'Seoul'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['location'], 'Seoul')

    def test_change_password_allows_login_with_new_password(self):
        token = self._register(email='pwtest@example.com')
        self._auth_token(token)
        res = self.client.post(self.password_url, {
            'current_password': 'Str0ng-Passw0rd!',
            'new_password': 'NewStr0ng-Passw0rd!',
            'new_password_confirm': 'NewStr0ng-Passw0rd!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('message', res.data)

        self.client.credentials()
        res = self.client.post(self.login_url, {
            'email': 'pwtest@example.com',
            'password': 'NewStr0ng-Passw0rd!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_delete_account_blocks_subsequent_login(self):
        token = self._register(email='delete@example.com')
        self._auth_token(token)

        res = self.client.delete(self.delete_url, {'confirmation': '계정 삭제'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('message', res.data)

        self.client.credentials()
        res = self.client.post(self.login_url, {
            'email': 'delete@example.com',
            'password': 'Str0ng-Passw0rd!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class UserSummaryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='summary@example.com',
            password='Str0ng-Passw0rd!',
        )
        self.user.username = 'summary-user'
        self.user.bio = '요약 팝오버 테스트 계정'
        self.user.save(update_fields=['username', 'bio'])

        UserSettings.objects.update_or_create(
            user=self.user,
            defaults={'public_profile': True},
        )

        self.platform = Platform.objects.create(name='Test Platform')
        self.category = Category.objects.create(name='Test Category')

        Post.objects.create(
            title='테스트 게시글 1',
            author=self.user,
            platform=self.platform,
            category=self.category,
            prompt='prompt text 12345',
            ai_response='ai response text 12345',
            like_count=3,
            bookmark_count=2,
            view_count=100,
        )
        Post.objects.create(
            title='테스트 게시글 2',
            author=self.user,
            platform=self.platform,
            category=self.category,
            prompt='prompt text abcde',
            ai_response='ai response text abcde',
            like_count=4,
            bookmark_count=5,
            view_count=200,
        )

    def test_user_summary_returns_public_data(self):
        url = reverse('users:user_summary', kwargs={'username': self.user.username})
        res = self.client.get(url, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'summary-user')
        self.assertEqual(res.data['bio'], '요약 팝오버 테스트 계정')
        self.assertEqual(res.data['post_count'], 2)
        self.assertEqual(res.data['total_views'], 300)
        self.assertEqual(res.data['total_likes_received'], 7)
        self.assertEqual(res.data['total_bookmarks_received'], 7)

    def test_user_summary_returns_404_for_unknown_username(self):
        url = reverse('users:user_summary', kwargs={'username': 'not-found-user'})
        res = self.client.get(url, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_summary_hides_bio_for_private_profile(self):
        UserSettings.objects.filter(user=self.user).update(public_profile=False)
        url = reverse('users:user_summary', kwargs={'username': self.user.username})
        res = self.client.get(url, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data['bio'])
