from django.db import models


class DashboardStats(models.Model):
    total_posts = models.IntegerField(default=0, verbose_name="총 게시글 수")
    total_users = models.IntegerField(default=0, verbose_name="총 사용자 수")
    total_views = models.BigIntegerField(default=0, verbose_name="총 조회수")
    total_likes = models.BigIntegerField(default=0, verbose_name="총 좋아요 수")
    total_bookmarks = models.BigIntegerField(default=0, verbose_name="총 북마크 수")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="업데이트 일시")
    
    class Meta:
        verbose_name = "대시보드 통계"
        verbose_name_plural = "대시보드 통계"
        
    def __str__(self):
        return f"대시보드 통계 ({self.updated_at.strftime('%Y-%m-%d %H:%M')})"
