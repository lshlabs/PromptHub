from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('search/', views.search_posts, name='search_posts'),
    path('sort-options/', views.get_sort_options, name='get_sort_options'),
    path('filter-options/', views.get_filter_options, name='get_filter_options'),
    path('trending/category-rankings/', views.get_category_rankings, name='category_rankings'),
    path('trending/refresh-cache/', views.refresh_trending_cache, name='refresh_trending_cache'),
    path('trending/model/<str:model_name>/posts/', views.get_trending_model_posts, name='trending_model_posts'),
    path('trending/model/<str:model_name>/info/', views.get_trending_model_info, name='trending_model_info'),
] 