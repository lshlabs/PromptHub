from django.urls import path
from . import views
from .views import me_view, check_username_view

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.update_profile_view, name='profile'),
    path('me/', me_view, name='me'),
    path('check-username/', check_username_view, name='check_username'),
]
