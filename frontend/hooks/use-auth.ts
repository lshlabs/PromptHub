'use client'

import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api/auth'
import { getAccessToken, clearTokens, setTokens } from '@/lib/api/client'
import type { UserData as BackendUserData } from '@/types/api'

export interface UseAuthReturn {
  user: BackendUserData | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message: string }>
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  regenerateAvatar: (regenerateUsername?: boolean) => Promise<{ success: boolean; message: string }>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<BackendUserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!token && !!user

  // 초기화 시 토큰과 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAccessToken()
        console.log('🔍 initAuth - 토큰 확인:', token ? '토큰 존재' : '토큰 없음')

        if (token) {
          setToken(token)
          console.log('🔍 initAuth - 프로필 정보 가져오기 시도')
          const response = await authApi.getProfile()
          console.log('🔍 initAuth - 프로필 응답:', response)
          if (response) {
            // 백엔드 응답이 {user: {...}} 형태이므로 user 객체 추출
            const userData = (response as any).user || response
            setUser(userData)
            console.log('✅ initAuth - 사용자 정보 설정 완료:', userData)
          }
        } else {
          console.log('❌ initAuth - 토큰이 없어서 인증되지 않음')
        }
      } catch (error) {
        console.error('❌ 인증 초기화 오류:', error)
        clearTokens()
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    console.log('🔑 useAuth login 시작:', { email, password: '***' })

    try {
      const response = await authApi.login({ email, password })
      console.log('🔑 useAuth authApi.login 응답:', response)

      if (response.token && response.user) {
        console.log('🔑 토큰과 사용자 정보 존재:', {
          token: response.token,
          user: response.user,
        })

        // 토큰은 authApi.login에서 자동으로 저장됨
        setToken(response.token)
        setUser(response.user)

        // 상태 업데이트가 완료될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))

        console.log('✅ useAuth login 성공 - 토큰과 사용자 정보 설정 완료')
        console.log('🔍 저장된 토큰 확인:', getAccessToken())
        console.log('🔍 설정된 사용자 정보:', response.user)
        console.log('🔍 인증 상태 확인:', !!response.token && !!response.user)

        return { success: true, message: response.message }
      }

      console.log('❌ useAuth 응답에 토큰이나 사용자 정보 없음')
      return { success: false, message: '로그인에 실패했습니다.' }
    } catch (error: any) {
      console.error('❌ useAuth login 오류:', error)
      console.error('❌ 오류 타입:', typeof error)
      console.error('❌ 오류 메시지:', error?.message)
      console.error('❌ 오류 응답:', error?.response)
      console.error('❌ 오류 상태:', error?.response?.status)
      console.error('❌ 오류 데이터:', error?.response?.data)

      let message = '로그인 중 오류가 발생했습니다.'

      if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error?.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error?.message) {
        message = error.message
      }

      return { success: false, message }
    }
  }

  const loginWithGoogle = async (
    idToken: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.loginWithGoogle(idToken)
      if (response.token && response.user) {
        setToken(response.token)
        setUser(response.user)
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true, message: response.message }
      }
      return { success: false, message: 'Google 로그인에 실패했습니다.' }
    } catch (error: any) {
      let message = 'Google 로그인 중 오류가 발생했습니다.'
      if (error?.response?.data?.message) message = error.response.data.message
      else if (error?.message) message = error.message
      return { success: false, message }
    }
  }

  const register = async (
    email: string,
    password: string,
    passwordConfirm: string,
  ): Promise<{ success: boolean; message: string }> => {
    console.log('🔑 useAuth register 시작:', { email, password: '***' })

    try {
      const response = await authApi.register({
        email,
        password,
        password_confirm: passwordConfirm,
      })

      console.log('🔑 useAuth authApi.register 응답:', response)

      if (response.token && response.user) {
        // 토큰은 authApi.register에서 자동으로 저장됨
        setToken(response.token)
        setUser(response.user)

        console.log('✅ useAuth register 성공 - 반환')
        return { success: true, message: response.message }
      }

      console.log('❌ useAuth register 응답에 토큰이나 사용자 정보 없음')
      return { success: false, message: '회원가입에 실패했습니다.' }
    } catch (error: any) {
      console.error('❌ useAuth register 오류:', error)
      console.error('❌ 오류 타입:', typeof error)
      console.error('❌ 오류 메시지:', error?.message)
      console.error('❌ 오류 응답:', error?.response)
      console.error('❌ 오류 상태:', error?.response?.status)
      console.error('❌ 오류 데이터:', error?.response?.data)

      let message = '회원가입 중 오류가 발생했습니다.'

      if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error?.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error?.message) {
        message = error.message
      }

      return { success: false, message }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('로그아웃 요청 오류:', error)
    } finally {
      // 항상 로컬 상태 클리어
      clearTokens()
      setToken(null)
      setUser(null)
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      if (!token) return

      const response = await authApi.getProfile()
      if (response) {
        const userData = (response as any).user || response
        setUser(userData)
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error)
    }
  }

  const regenerateAvatar = async (
    regenerateUsername = false,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // regenerateAvatar API가 구현되지 않은 경우를 위한 임시 처리
      // TODO: 실제 API 구현 후 수정 필요
      return { success: false, message: '아바타 재생성 기능이 아직 구현되지 않았습니다.' }
    } catch (error: any) {
      const message = error.message || '아바타 재생성 중 오류가 발생했습니다.'
      return { success: false, message }
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
    regenerateAvatar,
  }
}
