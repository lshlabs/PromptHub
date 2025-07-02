/**
 * 인증 상태 관리 훅
 *
 * 사용자 인증 상태와 관련 함수들을 제공합니다.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { authApi, getAuthToken, setAuthToken, removeAuthToken, type User } from "@/lib/api"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // 초기 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken()

      if (!token) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const user = await authApi.getCurrentUser()
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch (error) {
        console.error("인증 초기화 실패:", error)
        removeAuthToken()
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initializeAuth()
  }, [])

  // 로그인
  const login = useCallback(
    async (credentials: {
      email: string
      password: string
    }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }))

        const response = await authApi.login({
          email: credentials.email,
          password: credentials.password,
        })

        setAuthToken(response.token)

        setAuthState({
          user: response.user,
          token: response.token,
          isLoading: false,
          isAuthenticated: true,
        })

        return { success: true, message: response.message }
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return {
          success: false,
          message: error instanceof Error ? error.message : "로그인에 실패했습니다.",
        }
      }
    },
    [],
  )

  // 회원가입
  const register = useCallback(
    async (userData: {
      email: string
      password: string
      password_confirm: string
    }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }))

        const response = await authApi.register({
          email: userData.email,
          password: userData.password,
          password_confirm: userData.password_confirm,
        })

        setAuthToken(response.token)

        setAuthState({
          user: response.user,
          token: response.token,
          isLoading: false,
          isAuthenticated: true,
        })

        return { success: true, message: response.message }
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return {
          success: false,
          message: error instanceof Error ? error.message : "회원가입에 실패했습니다.",
        }
      }
    },
    [],
  )

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error)
    } finally {
      removeAuthToken()
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  // 프로필 업데이트
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(profileData)

      setAuthState((prev) => ({
        ...prev,
        user: response.user,
      }))

      return { success: true, message: response.message }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "프로필 업데이트에 실패했습니다.",
      }
    }
  }, [])

  // 비밀번호 변경
  const changePassword = useCallback(
    async (passwordData: {
      old_password: string
      new_password: string
      new_password_confirm: string
    }) => {
      try {
        const response = await authApi.changePassword(passwordData)

        // 새 토큰으로 업데이트
        setAuthToken(response.token)
        setAuthState((prev) => ({
          ...prev,
          token: response.token,
        }))

        return { success: true, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.",
        }
      }
    },
    [],
  )

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser()
      setAuthState((prev) => ({
        ...prev,
        user,
      }))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "사용자 정보 새로고침에 실패했습니다.",
      }
    }
  }, [])

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    changePassword,
  }
}
