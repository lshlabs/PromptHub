from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # 메타데이터 API
    path('platforms/', views.platforms_list, name='platforms_list'),
    path('models/', views.models_list, name='models_list'),
    path('models/suggest/', views.models_suggest, name='models_suggest'),
    path('platforms/<int:platform_id>/models/', views.platform_models_with_default, name='platform_models_with_default'),
    path('categories/', views.categories_list, name='categories_list'),
    path('tags/', views.tags_list, name='tags_list'),
    
    # 게시글 CRUD API
    path('', views.posts_list, name='posts_list'),
    path('create/', views.post_create, name='post_create'),
    path('<int:post_id>/', views.post_detail, name='post_detail'),
    path('<int:post_id>/update/', views.post_update, name='post_update'),
    
    # 상호작용 API
    path('<int:post_id>/like/', views.post_like, name='post_like'),
    path('<int:post_id>/bookmark/', views.post_bookmark, name='post_bookmark'),
    
    # 사용자별 게시글 조회 API
    path('liked/', views.user_liked_posts, name='user_liked_posts'),
    path('bookmarked/', views.user_bookmarked_posts, name='user_bookmarked_posts'),
    path('my/', views.user_my_posts, name='user_my_posts'),
    
    # 게시글 삭제 API
    path('<int:post_id>/delete/', views.post_delete, name='post_delete'),
]