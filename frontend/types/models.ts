/**
 * 데이터 모델 타입 정의
 *
 * 애플리케이션의 핵심 데이터 모델들을 정의합니다.
 */

// 사용자 모델
export interface User {
  id: number
  email: string
  username: string
  bio: string | null
  location: string | null
  github_handle: string | null
  profile_image: string | null
  avatar_color1: string
  avatar_color2: string
  created_at: string
  date_joined: string
}

// 통계 모델 (api.ts의 Tag는 다른 구조이므로 별도 유지)
export interface Stats {
  activeUsers: number
  sharedPrompts: number
  averageSatisfaction: number
  totalBookmarks: number
  totalViews: number
  weeklyAdded: number
}

// 검색 결과 모델
export interface SearchResult {
  count: number
  next: string | null
  previous: string | null
  results: any[]
  current_page: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// 북마크 모델
export interface Bookmark {
  id: number
  post: any
  created_at: string
}

// 좋아요 모델
export interface Like {
  id: number
  post: any
  created_at: string
}

// 댓글 모델 (향후 확장용)
export interface Comment {
  id: number
  post_id: number
  author: string
  content: string
  created_at: string
  updated_at: string
}

// 알림 모델 (향후 확장용)
export interface Notification {
  id: number
  user_id: number
  type: 'like' | 'comment' | 'bookmark' | 'follow'
  message: string
  is_read: boolean
  created_at: string
  related_post_id?: number
  related_user_id?: number
}

// 설정 모델
export interface UserSettings {
  user_id: number
  email_notifications: boolean
  push_notifications: boolean
  privacy_level: 'public' | 'private' | 'friends'
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
}

// 트렌딩 데이터 모델
export interface TrendingData {
  posts: any[]
  categoryRankings: {
    [key: string]: {
      title: string
      subtitle: string
      icon: any
      data: Array<{
        rank: number
        name: string
        score: number | string
        provider: string
      }>
    }
  }
}
