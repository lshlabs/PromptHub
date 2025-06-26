/**
 * 인증 관련 타입 정의
 *
 * 사용자 인증과 관련된 모든 타입을 정의합니다.
 */

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
  last_login: string | null
  profile: UserProfile
}

export interface UserProfile {
  bio: string
  location: string
  birth_date: string | null
  avatar: string | null
  phone_number: string
  is_email_verified: boolean
  full_name: string
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
  first_name?: string
  last_name?: string
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
