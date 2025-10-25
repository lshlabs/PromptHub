'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { authApi, getAccessToken, clearTokens, setTokens } from '@/lib/api'
import type { UserData as BackendUserData } from '@/types/api'

export interface UseAuthReturn {
  user: BackendUserData | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  authError: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message: string }>
  setAuthData: (token: string, user: BackendUserData) => void
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
  const [initAttempted, setInitAttempted] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // NextAuth 세션 확인 (세션 동기화 상태 파악)
  const { data: session, status: sessionStatus } = useSession()

  const isAuthenticated = !!token && !!user

  // 초기화 시 토큰과 사용자 정보 확인
  useEffect(() => {
    // 이미 초기화를 시도했으면 중복 실행 방지
    if (initAttempted) return

    // NextAuth 세션이 로딩 중이면 대기
    if (sessionStatus === 'loading') {
      console.log('⏳ NextAuth 세션 로딩 중, initAuth 대기...')
      return
    }

    // 이미 토큰과 사용자 정보가 모두 있으면 스킵 (중복 호출 방지)
    if (token && user) {
      console.log('🔄 initAuth - 이미 인증 완료됨, 스킵')
      setIsLoading(false)
      setInitAttempted(true)
      return
    }

    // NextAuth 세션이 있고 Django 데이터가 있으면 세션 동기화를 우선하되, 사용자 데이터는 여전히 로드
    if (sessionStatus === 'authenticated' && session?.djangoToken && session?.djangoUser) {
      console.log('🔄 NextAuth 세션 존재, 세션 동기화 우선 - 사용자 데이터 로드 진행')
      // initAuth는 계속 진행하되, 토큰은 이미 설정된 것으로 간주
    }

    // localStorage에 토큰이 있고 아직 상태에 설정되지 않은 경우 우선 설정
    const storedToken = getAccessToken()
    if (storedToken && !token) {
      console.log('🔄 localStorage 토큰 발견, 상태 복원 시도')
      setToken(storedToken)
      // 사용자 정보는 initAuth에서 별도로 로드
    }

    const initAuth = async () => {
      try {
        setAuthError(null)

        // NextAuth 세션의 토큰을 우선 사용
        let tokenToUse = getAccessToken()
        if (!tokenToUse && session?.djangoToken) {
          console.log('🔍 initAuth - NextAuth 세션에서 Django 토큰 사용')
          tokenToUse = session.djangoToken
          setToken(session.djangoToken)
          // localStorage에도 토큰 저장
          setTokens(session.djangoToken)
        }

        console.log('🔍 initAuth - 토큰 확인:', tokenToUse ? '토큰 존재' : '토큰 없음')

        if (tokenToUse) {
          // 이미 사용자 정보가 있으면 getProfile 호출 스킵
          if (user) {
            console.log('🔄 initAuth - 토큰 설정됨, 사용자 정보는 이미 존재함')
          } else {
            console.log('🔍 initAuth - 프로필 정보 가져오기 시도')
            const response = await authApi.getProfile()
            console.log('🔍 initAuth - 프로필 응답:', response)
            if (response) {
              // 백엔드 응답이 {user: {...}} 형태이므로 user 객체 추출
              const userData = (response as any).user || response
              setUser(userData)
              console.log('✅ initAuth - 사용자 정보 설정 완료:', userData)
            }
          }
        } else {
          console.log('❌ initAuth - 토큰이 없어서 인증되지 않음')
        }
      } catch (error: any) {
        console.error('❌ 인증 초기화 오류:', error)
        setAuthError(error?.message || '인증 초기화 중 오류가 발생했습니다.')

        // API 오류가 401 (Unauthorized)인 경우 NextAuth 세션도 정리
        if (error?.response?.status === 401 || error?.status === 401) {
          console.log('🧹 401 오류로 인한 전체 인증 상태 초기화')
          try {
            const { signOut } = await import('next-auth/react')
            await signOut({ redirect: false })
            console.log('🧹 NextAuth 세션도 정리 완료')
          } catch (signOutError) {
            console.error('NextAuth signOut 오류:', signOutError)
          }
        }

        clearTokens()
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
        setInitAttempted(true)
      }
    }

    initAuth()
  }, [initAttempted, sessionStatus, session?.djangoToken, session?.djangoUser])

  // 인증 만료 이벤트 리스너 추가
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('🔓 인증 만료 이벤트 수신, 상태 초기화')
      clearTokens()
      setToken(null)
      setUser(null)
      setAuthError('인증이 만료되었습니다. 다시 로그인해주세요.')
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
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
      // Django 백엔드 로그아웃 시도 (실패해도 계속 진행)
      await authApi.logout()
    } catch (error) {
      console.error('Django 로그아웃 요청 오류 (무시하고 계속 진행):', error)
    }

    try {
      // NextAuth 세션 정리
      const { signOut } = await import('next-auth/react')
      await signOut({ redirect: false })
      console.log('🧹 NextAuth 세션 정리 완료')
    } catch (error) {
      console.error('NextAuth 로그아웃 오류 (무시하고 계속 진행):', error)
    }

    // 항상 로컬 상태 클리어
    clearTokens()
    setToken(null)
    setUser(null)

    console.log('✅ 로그아웃 완료 - 모든 인증 상태 초기화됨')
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

  /**
   * Django에서 받은 토큰과 사용자 정보를 직접 설정
   * Google 로그인 등에서 사용
   */
  const setAuthData = (djangoToken: string, userData: BackendUserData): void => {
    // 이미 같은 토큰과 사용자가 설정되어 있으면 중복 설정 방지
    if (token === djangoToken && user?.email === userData?.email) {
      console.log('🔄 setAuthData - 이미 같은 데이터가 설정되어 있음, 스킵')
      return
    }

    console.log('🔑 setAuthData 호출:', {
      token: djangoToken?.substring(0, 10) + '...',
      user: userData?.email,
    })

    // 토큰을 localStorage에 저장
    setTokens(djangoToken)

    // 상태 업데이트
    setToken(djangoToken)
    setUser(userData)

    // 저장 확인
    setTimeout(() => {
      const storedToken = getAccessToken()
      console.log('✅ 인증 데이터 설정 완료 - 저장 확인:', {
        stored: storedToken?.substring(0, 10) + '...',
        state: djangoToken?.substring(0, 10) + '...',
        match: storedToken === djangoToken,
      })
    }, 50)
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    authError,
    login,
    loginWithGoogle,
    setAuthData,
    register,
    logout,
    refreshUser,
    regenerateAvatar,
  }
}
