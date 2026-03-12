from django.contrib import admin
from .models import DashboardStats


@admin.register(DashboardStats)
class DashboardStatsAdmin(admin.ModelAdmin):
    list_display = [
        'total_posts', 'total_users', 'total_views', 
        'total_likes', 'total_bookmarks', 'updated_at'
    ]
    list_filter = ['updated_at']
    readonly_fields = ['updated_at']
    
    def has_add_permission(self, request):
        return not DashboardStats.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False
