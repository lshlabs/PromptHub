// API 클라이언트 공통 설정 및 유틸리티
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { API_BASE_URL, HTTP_STATUS } from '@/types/api'
import type { AuthTokens } from '@/types/api'

// Axios 인스턴스 생성
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use(
    config => {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Token ${token}`
      }
      // 세션 키를 헤더로 전달해 서버가 현재 세션 식별 가능하도록 함
      if (typeof window !== 'undefined') {
        const sessionKey = localStorage.getItem('prompthub_session_key')
        if (sessionKey) {
          ;(config.headers as any)['X-Session-Key'] = sessionKey
        }
      }
      return config
    },
    error => Promise.reject(error),
  )

  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
      return Promise.reject(createApiError(error))
    },
  )

  return client
}

export const apiClient: AxiosInstance = createApiClient()

// 토큰 관리
const TOKEN_KEYS = {
  ACCESS: 'prompthub_access_token',
  REFRESH: 'prompthub_refresh_token',
} as const

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEYS.ACCESS)
}

export const getRefreshToken = (): string | null => {
  return null // DRF TokenAuth에는 refresh 토큰이 없음
}

export const setTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.ACCESS, tokens.access)
}

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.ACCESS, token)
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEYS.ACCESS)
}

export const isAuthenticated = (): boolean => {
  return !!getAccessToken()
}

// 에러 공통 변환
export interface ApiRequestErrorLike {
  status?: number
  message: string
  detail?: string
  errors?: unknown
  timestamp?: string
  code?: string
  isNetworkError?: boolean
}

export const createApiError = (error: AxiosError): ApiRequestErrorLike => {
  if (!error.response) {
    return {
      message: '네트워크 연결을 확인해주세요.',
      code: error.code,
      isNetworkError: true,
    }
  }

  const { status, data } = error.response
  let message = '알 수 없는 오류가 발생했습니다.'

  if (typeof data === 'object' && data !== null) {
    if ('detail' in (data as any)) {
      message = String((data as any).detail)
    } else if ('message' in (data as any)) {
      message = String((data as any).message)
    } else if ('error' in (data as any)) {
      message = String((data as any).error)
    } else if (
      'non_field_errors' in (data as any) &&
      Array.isArray((data as any).non_field_errors)
    ) {
      message = (data as any).non_field_errors.join(' ')
    }
  }

  return {
    status,
    message,
    detail: typeof data === 'object' ? JSON.stringify(data) : String(data),
    errors: data as unknown,
    timestamp: new Date().toISOString(),
  }
}

// HTTP 메서드 래퍼
export const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, { params })
  return response.data
}

export const post = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data)
  return response.data
}

export const put = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data)
  return response.data
}

export const patch = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.patch(url, data)
  return response.data
}

export const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url)
  return response.data
}

export const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// 보조 유틸
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = createApiError(error)
    return apiError.message
  }
  // 인터셉터에서 변환된 객체 형태({ message, status, ... })도 처리
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in (error as Record<string, unknown>) &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다.'
}

export const isApiResponse = <T>(response: any): response is { status: string; data: T } => {
  return response && typeof response === 'object'
}

export const isPaginatedResponse = <T>(
  response: any,
): response is { results: T[]; pagination: any } => {
  return (
    response &&
    typeof response === 'object' &&
    'results' in response &&
    Array.isArray((response as any).results) &&
    'pagination' in response
  )
}
