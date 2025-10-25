import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const getGoogleCredentials = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || clientId.length === 0) {
    throw new Error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  }

  if (!clientSecret || clientSecret.length === 0) {
    throw new Error('Missing GOOGLE_CLIENT_SECRET')
  }

  return { clientId, clientSecret }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // 로그인 재시도 또는 새로운 인증 시도 감지
      if (trigger === 'signIn' || (account && profile)) {
        console.log('🔗 Google OAuth 로그인 시도:', {
          trigger,
          hasAccount: !!account,
          hasProfile: !!profile,
          userEmail: profile?.email,
          existingToken: !!token.djangoToken,
        })

        // 기존 토큰이 있어도 재연동 시도 (재로그인 문제 해결)
        if (account && profile) {
          // Google 계정 정보를 토큰에 저장
          token.googleProfile = profile
          token.accessToken = account.access_token
          token.idToken = account.id_token

          // Django 백엔드에서 토큰 정보 가져와서 저장
          try {
            console.log('🔗 Django 백엔드 연동 시작')

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/auth/google/`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id_token: account.id_token,
                }),
              },
            )

            if (response.ok) {
              const djangoData = await response.json()
              console.log('✅ JWT 콜백에서 Django 데이터 저장 완료')
              console.log('🔑 Django 토큰:', djangoData.token?.substring(0, 10) + '...')
              console.log('👤 Django 사용자:', djangoData.user?.email)
              token.djangoToken = djangoData.token
              token.djangoUser = djangoData.user
            } else {
              const errorData = await response.text()
              console.error('❌ Django 응답 오류:', response.status, errorData)
              console.error('❌ Google 프로필:', profile)
              console.error('❌ 계정 정보:', account)
            }
          } catch (error) {
            console.error('❌ JWT 콜백에서 Django 연동 오류:', error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      // 디버깅 로그 제거 (무한 출력 방지)

      // 세션에 Google 프로필 정보 포함
      if (token.googleProfile) {
        session.googleProfile = token.googleProfile
      }
      if (token.idToken) {
        session.idToken = token.idToken
      }
      // Django 토큰과 사용자 정보 포함
      if (token.djangoToken && token.djangoUser) {
        session.djangoToken = token.djangoToken
        session.djangoUser = token.djangoUser
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Django 연동은 jwt 콜백에서 처리되므로 여기서는 단순히 허용
      console.log('✅ signIn 콜백 - 로그인 허용:', {
        userEmail: user?.email,
        accountProvider: account?.provider,
        profileEmail: profile?.email,
      })
      return true
    },
  },
})

export { handler as GET, handler as POST }
