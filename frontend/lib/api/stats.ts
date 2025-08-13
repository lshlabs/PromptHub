import type { ApiResponse, PostCard, Tag } from '@/types/api'
import { API_ENDPOINTS } from '@/types/api'
import { get } from '@/lib/api/client'

export const statsApi = {
  getDashboardStats: async () => {
    return get<
      ApiResponse<{
        total_posts: number
        total_users: number
        total_views: number
        total_likes: number
        total_bookmarks: number
        avg_satisfaction?: number
        weekly_added_posts?: number
        active_users?: number
        recent_posts: PostCard[]
        popular_tags: Tag[]
        platform_distribution: Array<{ platform: string; count: number }>
      }>
    >(API_ENDPOINTS.stats.dashboard)
  },

  getUserStats: async () => {
    return get<
      ApiResponse<{
        posts_count: number
        total_views: number
        total_likes: number
        total_bookmarks: number
        avg_satisfaction: number
        most_used_platform: string | null
        most_used_category: string | null
        recent_activity: {
          last_post_date: string | null
          last_like_date: string | null
          last_bookmark_date: string | null
        }
      }>
    >(API_ENDPOINTS.stats.user)
  },
}
