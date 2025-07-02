/**
 * 인증 관련 타입 정의
 *
 * 사용자 인증과 관련된 모든 타입을 정의합니다.
 */

export interface User {
  id: number
  username: string
  email: string
  created_at: string
  updated_at: string
  last_login: string | null
  profile: UserProfile
}

export interface UserProfile {
  location: string
  website: string
  avatar: string | null
  avatar_url: string | null
  avatar_color: number
  avatar_color_class: string
  has_custom_avatar: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}
