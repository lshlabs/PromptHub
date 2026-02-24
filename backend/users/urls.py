from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # 인증 관련 URL
    path('register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('login/', views.UserLoginView.as_view(), name='user_login'),
    path('logout/', views.UserLogoutView.as_view(), name='user_logout'),
    path('google/', views.GoogleLoginView.as_view(), name='user_google_login'),
    
    # 프로필 관련 URL
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/password/', views.PasswordChangeView.as_view(), name='password_change'),
    path('profile/settings/', views.UserSettingsView.as_view(), name='user_settings'),
    path('profile/avatar/regenerate/', views.RegenerateAvatarView.as_view(), name='regenerate_avatar'),
    path('profile/sessions/', views.UserSessionsView.as_view(), name='user_sessions'),
    path('profile/delete/', views.AccountDeleteView.as_view(), name='account_delete'),
    path('info/', views.user_info, name='user_info'),
]
