'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAuthContext } from '@/components/layout/auth-provider'
import { logger } from '@/lib/logger'
import { authApi } from '@/lib/api'

/**
 * NextAuth 세션과 로컬 인증 상태를 동기화하는 훅
 *
 * 사용법:
 * - Google 로그인 후 리다이렉트된 페이지에서 호출
 * - 토큰 유효성을 검증한 후에만 동기화
 */
export function useSessionSync() {
  const { data: session, status } = useSession()
  const { setAuthData, isAuthenticated, user } = useAuthContext()
  const [syncAttempted, setSyncAttempted] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    // 로딩 중이면 대기
    if (status === 'loading') return

    // sessionStorage를 통한 동기화 상태 확인 (Hot Refresh에 안전)
    const userEmail = session?.user?.email || 'anonymous'
    const syncKey = `session_sync_${userEmail}`
    const alreadySynced = sessionStorage.getItem(syncKey)

    if (syncAttempted || alreadySynced) {
      logger.debug('🔄 세션 동기화 이미 완료됨, 스킵')
      return
    }

    // Google OAuth 재로그인 시도 시 이전 동기화 상태 초기화
    if (status === 'unauthenticated' && alreadySynced && userEmail !== 'anonymous') {
      logger.debug('🔄 Google OAuth 재로그인 감지, 동기화 상태 초기화')
      sessionStorage.removeItem(syncKey)
      setSyncAttempted(false)
      setSyncError(null)
      return
    }

    // 인증된 세션이 있고, Django 데이터가 있으며, 아직 로컬 상태가 동기화되지 않은 경우
    if (
      status === 'authenticated' &&
      session?.djangoToken &&
      session?.djangoUser &&
      (!isAuthenticated || user?.email !== session.djangoUser?.email)
    ) {
      const syncSession = async () => {
        try {
          logger.debug('🔄 세션 동기화 시작:', session.djangoUser?.email)
          setSyncError(null)

          // Django 토큰 유효성 검증
          const tempClient = {
            headers: { Authorization: `Token ${session.djangoToken}` },
          }

          // 간단한 프로필 요청으로 토큰 유효성 확인
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/profile/`,
            {
              headers: {
                Authorization: `Token ${session.djangoToken}`,
                'Content-Type': 'application/json',
              },
            },
          )

          if (response.ok) {
            // 프로필 응답을 받아서 최신 사용자 정보로 동기화
            const profileData = await response.json()
            const latestUserData = profileData.user || session.djangoUser

            logger.debug('✅ Django 토큰 유효성 확인 완료, 최신 프로필로 동기화')

            // TypeScript 타입 안전성을 위해 djangoToken 존재 확인
            if (session.djangoToken && latestUserData) {
              setAuthData(session.djangoToken, latestUserData)

              // 동기화 완료 표시 (sessionStorage에 저장)
              if (latestUserData.email) {
                const syncKey = `session_sync_${latestUserData.email}`
                sessionStorage.setItem(syncKey, 'true')
              }

              logger.debug('🎉 세션 동기화 완료 - 사용자:', latestUserData.email)
            } else {
              throw new Error('Django 토큰 또는 사용자 데이터 누락')
            }
          } else {
            // 토큰이 무효하면 NextAuth 세션도 정리
            const errorText = await response.text()
            logger.debug(`❌ Django 토큰이 무효함 (상태: ${response.status})`, errorText)
            throw new Error('Django 토큰이 무효합니다.')
          }
        } catch (error) {
          logger.error('❌ 세션 동기화 중 오류:', error)
          setSyncError(error instanceof Error ? error.message : '알 수 없는 오류')

          // 오류 발생 시 NextAuth 세션 정리
          try {
            await signOut({ redirect: false })
          } catch (signOutError) {
            logger.error('NextAuth 세션 정리 실패:', signOutError)
          }
        } finally {
          setSyncAttempted(true)
        }
      }

      syncSession()
    }
  }, [
    status,
    session?.djangoToken,
    session?.djangoUser?.email,
    syncAttempted,
    isAuthenticated,
    user?.email,
  ])

  return { syncError, syncAttempted }
}
