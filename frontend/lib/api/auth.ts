import type {
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserData,
  UserProfileResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  ChangePasswordResponse,
  TokenRefreshResponse,
  UserSettingsDTO,
  UserSessionDTO,
} from '@/types/api'
import { API_ENDPOINTS as endpoints } from '@/types/api'
import { apiClient, post, put } from '@/lib/api/client'

export const authApi = {
  /** 회원가입 */
  register: async (data: UserRegistrationRequest): Promise<UserRegistrationResponse> => {
    const response = await post<UserRegistrationResponse>(endpoints.auth.register, data)
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('prompthub_access_token', response.token)
    }
    return response
  },

  /** 로그인 (세션 키 저장 포함) */
  login: async (data: UserLoginRequest): Promise<UserLoginResponse> => {
    const response = await post<any>(endpoints.auth.login, data)
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('prompthub_access_token', response.token)
      // 서버에서 세션 정보가 오면 세션 키 저장
      if (response.session?.key) {
        localStorage.setItem('prompthub_session_key', response.session.key)
      }
    }
    return response as UserLoginResponse
  },

  /** Google 로그인: id_token 제출 */
  loginWithGoogle: async (idToken: string): Promise<UserLoginResponse> => {
    const response = await post<any>(endpoints.auth.google, { id_token: idToken })
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('prompthub_access_token', response.token)
      if (response.session?.key) {
        localStorage.setItem('prompthub_session_key', response.session.key)
      }
    }
    return response as UserLoginResponse
  },

  /** 로그아웃 (토큰 제거) */
  logout: async (): Promise<void> => {
    try {
      await post(endpoints.auth.logout)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prompthub_access_token')
      }
    }
  },

  /** TokenAuth 환경: 토큰 갱신 미지원 */
  refreshToken: async (_refreshToken: string): Promise<TokenRefreshResponse> => {
    throw new Error('Django Token Authentication은 토큰 갱신을 지원하지 않습니다.')
  },

  /** 사용자 프로필 조회 */
  getProfile: async (): Promise<UserProfileResponse> => {
    return (await apiClient.get<UserProfileResponse>(endpoints.auth.profile)).data
  },

  /** 사용자 프로필 업데이트 (파일이면 multipart PUT) */
  updateProfile: async (data: UserProfileUpdateRequest): Promise<UserData> => {
    if (data.profile_image instanceof File) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as File | string)
        }
      })
      const response = await apiClient.put<UserData>(endpoints.auth.profile, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    return put<UserData>(endpoints.auth.profile, data)
  },

  /** 비밀번호 변경 (성공 시 신규 토큰 저장) */
  changePassword: async (data: PasswordChangeRequest): Promise<ChangePasswordResponse> => {
    const res = await post<ChangePasswordResponse>(endpoints.auth.passwordChange, data)
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('prompthub_access_token', res.token)
    }
    return res
  },

  /** 계정 삭제 (확인 문구 옵션) */
  deleteAccount: async (confirmation?: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(endpoints.auth.profileDelete, {
      data: confirmation ? { confirmation } : undefined,
    })
    return response.data
  },

  /** 간단 사용자 정보 */
  getUserInfo: async (): Promise<UserData> => {
    return (await apiClient.get<UserData>(endpoints.auth.userInfo)).data
  },

  /** 사용자 설정 조회 */
  getSettings: async (): Promise<UserSettingsDTO> => {
    return (await apiClient.get<UserSettingsDTO>(endpoints.auth.settings)).data
  },

  /** 사용자 설정 업데이트 (Partial) */
  updateSettings: async (data: Partial<UserSettingsDTO>): Promise<UserSettingsDTO> => {
    return (await apiClient.patch<UserSettingsDTO>(endpoints.auth.settings, data)).data
  },

  /** 사용자 세션 목록 */
  getSessions: async (): Promise<UserSessionDTO[]> => {
    return (await apiClient.get<UserSessionDTO[]>(endpoints.auth.sessions)).data
  },

  /** 특정 세션 종료 */
  endSession: async (key: string): Promise<{ message: string }> => {
    return (
      await apiClient.delete<{ message: string }>(
        `${endpoints.auth.sessions}?key=${encodeURIComponent(key)}`,
      )
    ).data
  },

  /** 기타 모든 세션 종료 */
  endOtherSessions: async (): Promise<{ message: string; count: number }> => {
    return (
      await apiClient.delete<{ message: string; count: number }>(
        `${endpoints.auth.sessions}?all=true`,
      )
    ).data
  },
}

export type {
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserData,
  UserProfileResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
}
