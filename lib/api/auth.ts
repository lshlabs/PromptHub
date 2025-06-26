/**
 * 인증 관련 API 함수들
 *
 * 사용자 인증과 관련된 모든 API 호출을 관리합니다.
 */
import { apiClient } from "./client"
import type { User, AuthResponse } from "@/types/auth"

export const authApi = {
  // 회원가입
  register: async (userData: {
    username: string
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
  }): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register/", userData)
    return response.data
  },

  // 로그인
  login: async (credentials: {
    username: string
    password: string
  }): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login/", credentials)
    return response.data
  },

  // 로그아웃
  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post("/auth/logout/")
    return response.data
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get("/auth/me/")
    return response.data
  },

  // 프로필 조회
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/auth/profile/")
    return response.data
  },

  // 프로필 수정
  updateProfile: async (
    profileData: Partial<User>,
  ): Promise<{
    message: string
    user: User
  }> => {
    const response = await apiClient.patch("/auth/profile/", profileData)
    return response.data
  },

  // 비밀번호 변경
  changePassword: async (passwordData: {
    old_password: string
    new_password: string
    new_password_confirm: string
  }): Promise<{ message: string; token: string }> => {
    const response = await apiClient.post("/auth/change-password/", passwordData)
    return response.data
  },
}
