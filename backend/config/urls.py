"""
PromptHub URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    # path('api/posts/', include('apps.posts.urls')),      # 나중에 추가
    # path('api/comments/', include('apps.comments.urls')), # 나중에 추가
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Django Debug Toolbar URL 추가
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        # Debug Toolbar가 설치되지 않은 경우 무시
        pass

# 관리자 사이트 커스터마이징
admin.site.site_header = "PromptHub 관리자"
admin.site.site_title = "PromptHub"
admin.site.index_title = "PromptHub 관리"
