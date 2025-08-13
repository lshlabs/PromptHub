from django.urls import path
from . import views

urlpatterns = [
    # 인증 관련 URL
    path('register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('login/', views.UserLoginView.as_view(), name='user_login'),
    path('logout/', views.UserLogoutView.as_view(), name='user_logout'),
    
    # 프로필 관련 URL
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/password/', views.PasswordChangeView.as_view(), name='password_change'),
    path('profile/settings/', views.UserSettingsView.as_view(), name='user_settings'),
    path('profile/sessions/', views.UserSessionsView.as_view(), name='user_sessions'),
    path('profile/delete/', views.AccountDeleteView.as_view(), name='account_delete'),
    path('info/', views.user_info, name='user_info'),
]