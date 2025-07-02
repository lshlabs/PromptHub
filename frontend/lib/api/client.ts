/**
 * API 클라이언트 설정
 *
 * 모든 API 호출에 사용되는 기본 설정과 인터셉터를 관리합니다.
 */
import axios from "axios"
import { getAuthToken, removeAuthToken } from "@/lib/utils/auth"

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// 요청 인터셉터: 모든 요청에 인증 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 응답 인터셉터: 에러 처리 및 토큰 만료 시 자동 로그아웃
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      removeAuthToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  },
)
