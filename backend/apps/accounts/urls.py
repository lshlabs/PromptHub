"""
사용자 계정 관리 URL 설정

사용자 인증 및 프로필 관리와 관련된 API 엔드포인트들의 URL 패턴을 정의합니다.

URL 구조:
- /api/auth/register/     : 회원가입
- /api/auth/login/        : 로그인  
- /api/auth/logout/       : 로그아웃
- /api/auth/profile/      : 프로필 조회/수정
- /api/auth/me/           : 현재 사용자 정보
- /api/auth/check-username/ : 사용자명 중복 확인
"""
from django.urls import path
from . import views

# 네임스페이스 설정
app_name = 'accounts'

urlpatterns = [
    # 회원가입 (POST)
    path(
        'register/', 
        views.RegisterView.as_view(), 
        name='register'
    ),
    
    # 로그인 (POST)  
    path(
        'login/', 
        views.login_view, 
        name='login'
    ),
    
    # 로그아웃 (POST)
    path(
        'logout/', 
        views.logout_view, 
        name='logout'
    ),
    
    # 프로필 조회 (GET) / 수정 (PUT, PATCH)
    path(
        'profile/', 
        views.update_profile_view, 
        name='profile'
    ),
    
    # 현재 사용자 정보 조회 (GET)
    path(
        'me/', 
        views.me_view, 
        name='me'
    ),
    
    # 사용자명 중복 확인 (GET)
    path(
        'check-username/', 
        views.check_username_view, 
        name='check_username'
    ),
    
    # 비밀번호 변경 (POST)
    path(
        'change-password/', 
        views.change_password_view, 
        name='change_password'
    ),
    
    # 계정 삭제 (POST)
    path(
        'delete-account/', 
        views.delete_account_view, 
        name='delete_account'
    ),
]
