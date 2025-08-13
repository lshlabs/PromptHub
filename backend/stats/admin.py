from django.contrib import admin
from .models import DashboardStats


@admin.register(DashboardStats)
class DashboardStatsAdmin(admin.ModelAdmin):
    """대시보드 통계 관리자"""
    list_display = [
        'total_posts', 'total_users', 'total_views', 
        'total_likes', 'total_bookmarks', 'updated_at'
    ]
    list_filter = ['updated_at']
    readonly_fields = ['updated_at']
    
    def has_add_permission(self, request):
        # 통계는 하나만 존재해야 하므로 추가 권한 제한
        return not DashboardStats.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # 통계 삭제 방지
        return False