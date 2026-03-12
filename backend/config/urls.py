from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include(('users.urls', 'users'), namespace='users')),
    path('api/posts/', include('posts.urls')),
    path('api/core/', include('core.urls')),
    path('api/stats/', include('stats.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
