from django.urls import path
from . import views

app_name = 'stats'

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard_stats'),
    path('user/', views.user_stats, name='user_stats'),
]