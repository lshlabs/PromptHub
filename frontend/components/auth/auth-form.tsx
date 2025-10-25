'use client'

import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuthContext } from '@/components/layout/auth-provider'

interface AuthFormProps {
  defaultTab?: 'login' | 'signup'
  onSuccess?: () => void
}

export default function AuthForm({ defaultTab = 'login', onSuccess }: AuthFormProps) {
  const { login, register, loginWithGoogle, setAuthData } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('🔐 auth-form.tsx handleLogin 시작:', { email, password: '***' })

    const result = await login(email, password)

    console.log('🔐 auth-form.tsx login 결과:', result)

    if (result.success) {
      console.log('✅ 로그인 성공, onSuccess 호출')
      onSuccess?.()
    } else {
      console.log('❌ 로그인 실패:', result.message)
      setError(result.message)
    }

    setIsLoading(false)
  }

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    const result = await register(email, password, confirmPassword)

    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.message)
    }

    setIsLoading(false)
  }

  /**
   * Google 로그인 처리
   * next-auth로 Google 인증 후 Django 백엔드와 연동
   */
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🔍 Google 로그인 시작')

      // next-auth의 signIn 함수로 Google 인증
      // NextAuth가 자동으로 적절한 리다이렉트를 처리
      const result = await signIn('google', {
        redirect: false, // 수동으로 리다이렉트 처리
      })

      console.log('🔍 Google 로그인 결과:', result)

      if (result?.error) {
        console.error('❌ Google 인증 실패:', result.error)
        setError('Google 로그인에 실패했습니다.')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        console.log('✅ Google 인증 성공, 홈페이지로 이동')
        // 로그인 성공 시 홈페이지로 이동
        window.location.href = '/home'
      }
    } catch (error) {
      console.error('❌ Google 로그인 오류:', error)
      setError('Google 로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="w-full border-0 shadow-lg">
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'login' | 'signup')}
          className="w-full">
          <CardHeader className="gap-1 pb-4">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="login" className="text-sm">
                로그인
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">
                회원가입
              </TabsTrigger>
            </TabsList>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </CardHeader>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-0">
                <div className="mb-6 text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">로그인</CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
                    계정에 로그인하여 PromptHub를 이용하세요
                  </CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="block text-left text-sm font-medium">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      className="h-12 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="block text-left text-sm font-medium">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호를 입력하세요"
                      className="h-12 pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 h-12 -translate-y-1/2 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      로그인 상태 유지
                    </Label>
                  </div>
                  <Button variant="link" className="px-0 text-sm text-blue-600 hover:text-blue-700">
                    비밀번호 찾기
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">또는</span>
                  </div>
                </div>

                <div className="flex w-full justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {isLoading ? '로그인 중...' : 'Google로 로그인'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-0">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-0">
                <div className="mb-6 text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">회원가입</CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
                    새 계정을 만들어 PromptHub를 시작하세요
                  </CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="block text-left text-sm font-medium">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      className="h-12 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="block text-left text-sm font-medium">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호를 입력하세요 (8자 이상)"
                      className="h-12 pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 h-12 -translate-y-1/2 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="block text-left text-sm font-medium">
                    비밀번호 확인
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="비밀번호를 다시 입력하세요"
                      className="h-12 pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 h-12 -translate-y-1/2 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600">
                    <span className="cursor-pointer text-blue-600 hover:text-blue-700">
                      이용약관
                    </span>
                    과{' '}
                    <span className="cursor-pointer text-blue-600 hover:text-blue-700">
                      개인정보처리방침
                    </span>
                    에 동의합니다
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}>
                  {isLoading ? '가입 중...' : '회원가입'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">또는</span>
                  </div>
                </div>

                <div className="flex w-full justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {isLoading ? '로그인 중...' : 'Google로 회원가입'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
