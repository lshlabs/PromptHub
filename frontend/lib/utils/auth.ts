/**
 * 인증 관련 유틸리티 함수들
 *
 * 토큰 관리 및 인증 상태 확인 함수들을 제공합니다.
 */

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

// 사용자 데이터 관리
export const getUserData = () => {
  if (typeof window === "undefined") return null
  const userData = localStorage.getItem("userData")
  return userData ? JSON.parse(userData) : null
}

export const setUserData = (userData: any): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("userData", JSON.stringify(userData))
  }
}

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

// 토큰 유효성 검사 (간단한 형태)
export const isTokenValid = (token: string): boolean => {
  if (!token) return false

  try {
    // 토큰 형식 검사 (실제로는 서버에서 검증해야 함)
    return token.length > 0
  } catch {
    return false
  }
}
