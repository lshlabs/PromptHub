from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token


User = get_user_model()


class UserAuthAndProfileTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user_register')
        self.login_url = reverse('user_login')
        self.profile_url = reverse('user_profile')

    def test_register_login_and_profile_flow(self):
        # 회원가입
        register_data = {
            'email': 'test@example.com',
            'password': 'Str0ng-Passw0rd!',
            'password_confirm': 'Str0ng-Passw0rd!'
        }
        res = self.client.post(self.register_url, register_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        token = res.data['token']

        # 토큰으로 프로필 조회
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'test@example.com')

        # 프로필 업데이트(PUT)
        res = self.client.put(self.profile_url, {'bio': 'hello'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['bio'], 'hello')

        # 프로필 부분 업데이트(PATCH)
        res = self.client.patch(self.profile_url, {'location': 'Seoul'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['location'], 'Seoul')

    def test_change_password_and_delete_account(self):
        # 회원가입 및 로그인
        register_data = {
            'email': 'pwtest@example.com',
            'password': 'Str0ng-Passw0rd!',
            'password_confirm': 'Str0ng-Passw0rd!'
        }
        res = self.client.post(self.register_url, register_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        token = res.data['token']

        # 비밀번호 변경
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        password_url = reverse('password_change')
        res = self.client.post(password_url, {
            'current_password': 'Str0ng-Passw0rd!',
            'new_password': 'NewStr0ng-Passw0rd!',
            'new_password_confirm': 'NewStr0ng-Passw0rd!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('message', res.data)

        # 새 비밀번호로 로그인 가능 확인
        self.client.credentials()  # 인증 해제
        login_url = reverse('user_login')
        res = self.client.post(login_url, {
            'email': 'pwtest@example.com',
            'password': 'NewStr0ng-Passw0rd!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        new_token = res.data['token']

        # 계정 삭제
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {new_token}')
        delete_url = reverse('account_delete')
        res = self.client.delete(delete_url, {'confirmation': '계정 삭제'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('message', res.data)

        # 삭제된 계정 로그인 실패 확인
        self.client.credentials()
        res = self.client.post(login_url, {
            'email': 'pwtest@example.com',
            'password': 'NewStr0ng-Passw0rd!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
