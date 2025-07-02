/**
 * API 유틸리티 함수들
 *
 * 백엔드 API와의 통신을 담당하는 재사용 가능한 함수들을 제공합니다.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  message?: string
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

export interface UserProfile {
  avatar?: string
  avatar_url?: string
  avatar_color?: number
  avatar_color_class?: string
  has_custom_avatar?: boolean
  location?: string
  website?: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  username: string
  email: string
  created_at?: string
  last_login?: string | null
  profile?: UserProfile
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

// 토큰 관리 함수들
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token)
  }
}

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
  }
}

// HTTP 요청 헬퍼 함수
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken()
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Token ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // 응답이 JSON이 아닐 수 있으므로 체크
    const contentType = response.headers.get("content-type")
    const isJson = contentType && contentType.includes("application/json")

    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      // 401 에러 시 토큰 제거 (자동 로그아웃)
      if (response.status === 401) {
        removeAuthToken()
        window.location.href = "/login"
      }

      throw new Error(
        typeof data === "object" && data.message ? data.message : `HTTP error! status: ${response.status}`,
      )
    }

    return data
  } catch (error) {
    console.error("API 요청 실패:", error)
    throw error
  }
}

// 인증 관련 API 함수들
export const authApi = {
  // 회원가입
  register: async (userData: {
    email: string
    password: string
    password_confirm: string
  }): Promise<AuthResponse> => {
    return makeRequest<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  // 로그인
  login: async (credentials: {
    email: string
    password: string
  }): Promise<AuthResponse> => {
    return makeRequest<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  // 로그아웃
  logout: async (): Promise<{ message: string }> => {
    return makeRequest<{ message: string }>("/auth/logout/", {
      method: "POST",
    })
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    return makeRequest<User>("/auth/me/")
  },

  // 프로필 조회
  getProfile: async (): Promise<User> => {
    return makeRequest<User>("/auth/profile/")
  },

  // 프로필 수정
  updateProfile: async (
    profileData: Partial<User>,
  ): Promise<{
    message: string
    user: User
  }> => {
    return makeRequest<{ message: string; user: User }>("/auth/profile/", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    })
  },

  // 비밀번호 변경
  changePassword: async (passwordData: {
    old_password: string
    new_password: string
    new_password_confirm: string
  }): Promise<{ message: string; token: string }> => {
    return makeRequest<{ message: string; token: string }>("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(passwordData),
    })
  },
}

// 토큰 유효성 검사
export const validateToken = async (): Promise<boolean> => {
  try {
    await authApi.getCurrentUser()
    return true
  } catch {
    removeAuthToken()
    return false
  }
}
