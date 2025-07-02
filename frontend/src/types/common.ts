/**
 * 공통 타입 정의
 */

export interface UserData {
  email: string
  username: string
  profile?: {
    avatar?: string | null
    avatar_url?: string | null
    avatar_color?: number
    avatar_color_class?: string
    has_custom_avatar?: boolean
    location?: string
    website?: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// 테마 관련 타입
export type Theme = "light" | "dark" | "system"

// 언어 관련 타입
export type Language = "ko" | "en" | "ja" | "zh" 