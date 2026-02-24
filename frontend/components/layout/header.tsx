'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Menu,
  LogIn,
  Users,
  TrendingUp,
  Star,
  Bookmark,
  Chrome,
  Sun,
  Moon,
  Monitor,
  Globe,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react'
import { default as AuthForm } from '@/components/auth/auth-form'
import { useAuthContext } from '@/components/layout/auth-provider'
import { getAvatarGradientStyle, getAvatarInitialFromUsername } from '@/lib/utils'
import { API_BASE_URL } from '@/types/api'
import { useDelayedLoading } from '@/hooks/use-delayed-loading'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 사용자 프로필 정보 인터페이스
 */
interface UserProfile {
  /** 아바타 색상 번호 */
  avatar_color?: number
  /** 아바타 색상 CSS 클래스 */
  avatar_color_class?: string
  /** 사용자 위치 */
  location?: string
  /** 사용자 웹사이트 */
  website?: string
}

/**
 * 사용자 데이터 인터페이스
 */
interface UserData {
  /** 사용자 이메일 */
  email: string
  /** 사용자명 */
  username: string
  /** 사용자 프로필 정보 */
  profile?: UserProfile
}

/**
 * 네비게이션 아이템 인터페이스
 */
interface NavigationItem {
  /** 링크 경로 */
  href: string
  /** 전체 라벨 */
  label: string
  /** 축약 라벨 */
  shortLabel: string
  /** 아이콘 컴포넌트 */
  icon: React.ComponentType<{ className?: string }>
  /** 설명 텍스트 */
  description: string
  /** 뱃지 텍스트 (옵션) */
  badge?: string
  /** 인증 필요 여부 (옵션) */
  requiresAuth?: boolean
}

/**
 * 테마 타입
 */
type Theme = 'light' | 'dark' | 'system'

/**
 * 언어 타입
 */
type Language = '한국어' | 'English' | '日本語' | '中文'

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 네비게이션 메뉴 아이템 목록
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    href: '/community',
    label: '커뮤니티',
    shortLabel: '커뮤니티',
    icon: Users,
    description: '프롬프트 리뷰 & 공유',
  },
  {
    href: '/trending',
    label: '트렌딩',
    shortLabel: '트렌딩',
    icon: TrendingUp,
    description: 'AI 모델 성능 랭킹 및 리뷰',
  },
  {
    href: '/extension',
    label: '확장프로그램',
    shortLabel: '확장',
    icon: Chrome,
    description: 'ChatGPT 프롬프트 추천 도구',
    badge: 'Soon',
  },
] as const

/**
 * 지원 언어 목록
 */
const SUPPORTED_LANGUAGES: Language[] = ['한국어', 'English', '日本語', '中文'] as const

/**
 * 테마 옵션 목록
 */
const THEME_OPTIONS: { value: Theme; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 메인 헤더 컴포넌트
 *
 * @description
 * - 로고, 네비게이션, 인증 상태 관리를 담당하는 상단 헤더
 * - 반응형 디자인으로 데스크톱, 태블릿, 모바일 화면에 대응
 * - 테마 및 언어 설정 기능 제공
 * - 인증된 사용자를 위한 드롭다운 메뉴 제공
 *
 * @features
 * - 반응형 네비게이션 (데스크톱/태블릿/모바일)
 * - 사용자 인증 상태 관리
 * - 테마 전환 (라이트/다크/시스템)
 * - 다국어 지원
 * - 키보드 접근성
 * - 로딩 상태 처리
 */
export default function Header(): JSX.Element {
  // ========================================================================
  // 상태 관리
  // ========================================================================

  // 인증 상태 관리
  const { user, isAuthenticated, logout, isLoading } = useAuthContext()

  const [isAuthOpen, setIsAuthOpen] = React.useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false)
  // 로컬 테마 상태 (원복)
  const [theme, setTheme] = React.useState<Theme>('system')
  const [language, setLanguage] = React.useState<Language>('한국어')

  // ========================================================================
  // Next.js 훅
  // ========================================================================

  const pathname = usePathname()
  const router = useRouter()

  // ========================================================================
  // 메모화된 값들
  // ========================================================================

  const navigationItems = NAVIGATION_ITEMS.filter(item => !item.requiresAuth || isAuthenticated)
  const authPending = isLoading && !isAuthenticated && !user
  const showAuthPending = useDelayedLoading(authPending, { delayMs: 150, minVisibleMs: 300 })

  const getAvatarColors = () => {
    return {
      color1: user?.avatar_color1 || '#6B73FF',
      color2: user?.avatar_color2 || '#9EE5FF',
      gradient: getAvatarGradientStyle(user?.avatar_color1, user?.avatar_color2),
    }
  }

  const getThemeIcon = () => {
    const themeOption = THEME_OPTIONS.find(option => option.value === theme)
    return themeOption?.icon || Monitor
  }
  const ThemeIcon = getThemeIcon()

  // ========================================================================
  // 유틸리티 함수들
  // ========================================================================

  /**
   * 현재 경로가 활성 상태인지 확인
   *
   * @param href - 확인할 경로
   * @returns 활성 상태 여부
   */
  const isActive = React.useCallback(
    (href: string): boolean => {
      if (!pathname) return false
      if (href === '/') {
        return pathname === '/' || pathname === '/home'
      }
      return pathname.startsWith(href)
    },
    [pathname],
  )

  // ========================================================================
  // 이벤트 핸들러들
  // ========================================================================

  /**
   * 로그아웃 처리
   * - 백엔드 로그아웃 API 호출
   * - 로컬 스토리지 정리
   * - 상태 초기화
   * - 필요시 홈으로 리다이렉트
   */
  const handleLogout = React.useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 Header: 로그아웃 시작')
      await logout()

      // 홈으로 리다이렉트 (필요시)
      if (pathname !== '/' && pathname !== '/home') {
        console.log('🏠 홈페이지로 리다이렉트')
        router.push('/')
      }

      console.log('✅ Header: 로그아웃 완료')
    } catch (error) {
      console.error('❌ Header: 로그아웃 처리 중 오류:', error)
    }
  }, [logout, pathname, router])

  /**
   * 로그인 성공 후 처리
   * - 로컬 스토리지에서 사용자 데이터 가져와서 상태 업데이트
   */
  const handleLoginSuccess = React.useCallback((): void => {
    console.log('🎉 Header: 로그인 성공 콜백 실행')

    // 모달 닫기
    setIsAuthOpen(false)

    // 현재 페이지가 특별한 페이지가 아니라면 홈으로 리다이렉트
    if (pathname && (pathname === '/test' || pathname.includes('/auth'))) {
      console.log('🏠 홈페이지로 리다이렉트')
      router.push('/')
    }

    console.log('✅ Header: 로그인 후속 처리 완료')
  }, [pathname, router])

  /**
   * 테마 변경 핸들러
   *
   * @param newTheme - 새로운 테마
   */
  const handleThemeChange = React.useCallback((newTheme: Theme): void => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  /**
   * 언어 변경 핸들러
   *
   * @param newLanguage - 새로운 언어
   */
  const handleLanguageChange = React.useCallback((newLanguage: Language): void => {
    setLanguage(newLanguage)
    // 실제 구현에서는 여기서 i18n 라이브러리를 통해 언어 변경
    localStorage.setItem('language', newLanguage)
  }, [])

  // ========================================================================
  // 생명주기 및 부수효과
  // ========================================================================

  // 테마 및 언어 설정 초기화 (클라이언트에서만 실행)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && THEME_OPTIONS.some(option => option.value === savedTheme)) {
      setTheme(savedTheme)
    }
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, []) // 빈 의존성 배열로 마운트 시에만 실행

  // ========================================================================
  // 렌더링 헬퍼 함수들
  // ========================================================================

  /**
   * 사용자 아바타 렌더링
   *
   * @param size - 아바타 크기 클래스
   * @returns 아바타 JSX
   */
  const renderUserAvatar = React.useCallback(
    (size: string = 'w-8 h-8'): JSX.Element => {
      // 로딩 중일 때 스켈레톤 반환
      if (showAuthPending) {
        return <div className={`${size} animate-pulse rounded-full bg-gray-200`}></div>
      }

      const profileImage =
        typeof (user as any)?.profile_image === 'string' && (user as any).profile_image
          ? (user as any).profile_image.startsWith('http')
            ? (user as any).profile_image
            : `${API_BASE_URL}${(user as any).profile_image}`
          : null

      return (
        <Avatar className={size}>
          {profileImage ? <AvatarImage src={profileImage} alt={`${user?.username || '사용자'} 아바타`} /> : null}
          <AvatarFallback
            className="border-2 border-white text-sm font-semibold text-white shadow-sm"
            style={{ background: getAvatarColors().gradient }}
            aria-label={`${user?.username || '사용자'}의 아바타`}>
            {getAvatarInitialFromUsername(user?.username)}
          </AvatarFallback>
        </Avatar>
      )
    },
    [user?.avatar_color1, user?.avatar_color2, user?.email, user?.username, showAuthPending],
  )

  // ========================================================================
  // 메인 렌더링
  // ========================================================================

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* ================================================================
              로고 섹션
              ================================================================ */}
          <div className="flex items-center">
            <Link
              href="/"
              className="group flex flex-shrink-0 items-center space-x-2 sm:space-x-3"
              aria-label="PromptHub 홈페이지로 이동">
              <div className="relative">
                {/* 로고 아이콘 */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg transition-all duration-200 group-hover:shadow-xl sm:h-9 sm:w-9 sm:rounded-xl">
                  <Star
                    className="h-4 w-4 fill-white text-white sm:h-5 sm:w-5"
                    aria-hidden="true"
                  />
                </div>
                {/* 상태 표시 점 */}
                <div
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-400 sm:-right-1 sm:-top-1 sm:h-3 sm:w-3"
                  aria-hidden="true"></div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                  PromptHub
                </h1>
                <p className="-mt-1 hidden text-xs text-gray-500 xs:block">
                  AI 프롬프트 리뷰 플랫폼
                </p>
              </div>
            </Link>
          </div>

          {/* ================================================================
              네비게이션 및 인증 섹션
              ================================================================ */}
          <div className="flex items-center space-x-4">
            {/* 데스크톱 네비게이션 (md 이상) */}
            <nav
              className="hidden items-center space-x-1 md:flex"
              role="navigation"
              aria-label="주요 네비게이션">
              {navigationItems.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200 lg:gap-2 lg:px-4 ${
                      active
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } `}
                    aria-current={active ? 'page' : undefined}
                    title={item.description}>
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                    {item.badge && (
                      <Badge
                        variant={
                          item.badge === 'Hot'
                            ? 'destructive'
                            : item.badge === 'New'
                              ? 'default'
                              : 'secondary'
                        }
                        className="hidden h-4 px-1 py-0.5 text-xs lg:h-5 lg:px-1.5 xl:inline-flex"
                        aria-label={`${item.label} ${item.badge}`}>
                        {item.badge}
                      </Badge>
                    )}
                    {/* 활성 상태 표시점 */}
                    {active && (
                      <div
                        className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-600"
                        aria-hidden="true"></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* 태블릿 네비게이션 (sm ~ md) */}
            <nav
              className="hidden items-center space-x-1 sm:flex md:hidden"
              role="navigation"
              aria-label="태블릿 네비게이션">
              {navigationItems
                .filter(item => item.href !== '/extension') // 확장프로그램 제외
                .map(item => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } `}
                      title={item.description}
                      aria-current={active ? 'page' : undefined}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {/* 뱃지 표시 */}
                      {item.badge && (
                        <div
                          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"
                          aria-label={`${item.label}에 새로운 내용이 있습니다`}></div>
                      )}
                      {/* 활성 상태 표시점 */}
                      {active && (
                        <div
                          className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-600"
                          aria-hidden="true"></div>
                      )}
                    </Link>
                  )
                })}
            </nav>

            {/* 데스크톱 인증 버튼 (md 이상) */}
            <div className="hidden items-center space-x-2 md:flex lg:space-x-3">
              {authPending ? (
                <>
                  <div
                    className={`h-10 w-10 rounded-lg xl:w-24 ${showAuthPending ? 'animate-pulse bg-gray-200' : 'invisible'}`}
                  />
                  <div
                    className={`h-10 w-10 rounded-full ${showAuthPending ? 'animate-pulse bg-gray-200' : 'invisible'}`}
                  />
                </>
              ) : isAuthenticated ? (
                /* 로그인된 상태: 사용자 드롭다운 메뉴 */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 rounded-full p-1 transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
                      aria-label={`${user?.username || '사용자'} 사용자 메뉴`}>
                      {renderUserAvatar()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-0" align="end" sideOffset={8}>
                    {/* 사용자 정보 헤더 */}
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.username || '사용자'} 님, 환영합니다!
                      </p>
                    </div>

                    {/* 주요 메뉴 항목 */}
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex cursor-pointer items-center gap-3 px-4 py-2">
                          <User className="h-4 w-4" aria-hidden="true" />
                          <span>프로필</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/bookmarks"
                          className="flex cursor-pointer items-center gap-3 px-4 py-2">
                          <Bookmark className="h-4 w-4" aria-hidden="true" />
                          <span>북마크</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator />

                    {/* 환경설정 섹션 */}
                    <div className="py-2">
                      <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        환경설정
                      </DropdownMenuLabel>

                      {/* 테마 설정 */}
                      <div className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ThemeIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="text-sm">테마</span>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-gray-100 p-1"
                            role="radiogroup"
                            aria-label="테마 선택">
                            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                              <Button
                                key={value}
                                variant={theme === value ? 'default' : 'ghost'}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleThemeChange(value)}
                                role="radio"
                                aria-checked={theme === value}
                                aria-label={`${value} 테마`}>
                                <Icon className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 언어 설정 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4" aria-hidden="true" />
                              <span className="text-sm">언어</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>{language}</span>
                              <ChevronDown className="h-3 w-3" aria-hidden="true" />
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <DropdownMenuItem
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              className={language === lang ? 'bg-blue-50 text-blue-700' : ''}>
                              {lang}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <DropdownMenuSeparator />

                    {/* 로그아웃 */}
                    <div className="py-2">
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center gap-3 px-4 py-2 text-red-600 focus:text-red-600"
                        onClick={handleLogout}>
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* 로그인되지 않은 상태: 시작하기 + 다운로드 버튼 */
                <>
                  <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex h-10 w-10 items-center justify-center border-gray-200 p-0 text-gray-600 hover:border-gray-300 hover:text-gray-900 xl:h-auto xl:w-auto xl:justify-start xl:p-2 xl:px-3"
                        aria-label="로그인 또는 회원가입">
                        <LogIn className="h-4 w-4 flex-shrink-0 xl:mr-2" aria-hidden="true" />
                        <span className="hidden xl:inline">시작하기</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0 [&>button]:hidden">
                      <DialogTitle className="sr-only">로그인</DialogTitle>
                      <DialogDescription className="sr-only">
                        계정에 로그인하거나 새 계정을 만들어 PromptHub를 시작하세요
                      </DialogDescription>
                      <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    className="flex h-10 w-10 items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 p-0 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl xl:h-auto xl:w-auto xl:justify-start xl:p-2 xl:px-4"
                    aria-label="Chrome 확장프로그램 다운로드"
                    onClick={() => router.push('/extension')}>
                    <Chrome className="h-4 w-4 flex-shrink-0 xl:mr-2" aria-hidden="true" />
                    <span className="hidden xl:inline">다운로드</span>
                  </Button>
                </>
              )}
            </div>

            {/* 모바일 메뉴 버튼 (md 미만) */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2" aria-label="모바일 메뉴 열기">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 [&>button]:hidden">
                  <SheetTitle className="sr-only">네비게이션 메뉴</SheetTitle>
                  <div className="flex h-full flex-col">
                    {/* 모바일 사용자 프로필 (로그인된 경우만 표시) */}
                    {isAuthenticated && (
                      <div className="border-b bg-gray-50 p-4">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="프로필 페이지로 이동">
                          {renderUserAvatar('w-12 h-12')}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user?.username || '사용자'}
                            </div>
                            <div className="text-sm text-gray-600">프로필 보기</div>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* 모바일 로고 섹션 (로그인되지 않은 경우만 표시) */}
                    {!isAuthenticated && (
                      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                        <Link
                          href="/"
                          className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/80"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="PromptHub 홈페이지로 이동">
                          <div className="relative">
                            {/* 로고 아이콘 */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                              <Star className="h-5 w-5 fill-white text-white" aria-hidden="true" />
                            </div>
                            {/* 상태 표시 점 */}
                            <div
                              className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-400"
                              aria-hidden="true"></div>
                          </div>
                          <div>
                            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent">
                              PromptHub
                            </h1>
                            <p className="-mt-1 text-xs text-gray-500">AI 프롬프트 리뷰 플랫폼</p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* 모바일 네비게이션 메뉴 */}
                    <nav
                      className="flex-1 px-4 py-6"
                      role="navigation"
                      aria-label="모바일 네비게이션">
                      <div className="space-y-2">
                        {navigationItems.map(item => {
                          const Icon = item.icon
                          const active = isActive(item.href)

                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                                active
                                  ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              } `}
                              onClick={() => setIsMobileMenuOpen(false)}
                              aria-current={active ? 'page' : undefined}>
                              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.label}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </nav>

                    {/* 모바일 빠른 액션 (로그인된 경우만 표시) */}
                    {!authPending && isAuthenticated && (
                      <div className="border-t bg-gray-50 p-4">
                        <Link
                          href="/bookmarks"
                          className="flex h-12 w-full items-center justify-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="북마크 페이지로 이동">
                          <Bookmark className="h-5 w-5" aria-hidden="true" />내 북마크
                        </Link>
                      </div>
                    )}

                    {/* 모바일 인증 섹션 */}
                    <div className="border-t p-4">
                      <div className="space-y-3">
                        {authPending ? (
                          <>
                            <div
                              className={`h-12 w-full rounded-lg ${showAuthPending ? 'animate-pulse bg-gray-200' : 'invisible'}`}
                            />
                            <div
                              className={`h-12 w-full rounded-lg ${showAuthPending ? 'animate-pulse bg-gray-200' : 'invisible'}`}
                            />
                          </>
                        ) : isAuthenticated ? (
                          /* 로그인된 상태: 로그아웃 버튼 */
                          <Button
                            variant="outline"
                            className="h-12 w-full justify-start gap-3"
                            onClick={() => {
                              handleLogout()
                              setIsMobileMenuOpen(false)
                            }}
                            aria-label="로그아웃">
                            <LogOut className="h-5 w-5" aria-hidden="true" />
                            로그아웃
                          </Button>
                        ) : (
                          /* 로그인되지 않은 상태: 시작하기 + 다운로드 버튼 */
                          <>
                            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="h-12 w-full justify-start gap-3"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  aria-label="로그인 또는 회원가입">
                                  <LogIn className="h-5 w-5" aria-hidden="true" />
                                  시작하기
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md p-0 [&>button]:hidden">
                                <DialogTitle className="sr-only">로그인</DialogTitle>
                                <DialogDescription className="sr-only">
                                  계정에 로그인하거나 새 계정을 만들어 PromptHub를 시작하세요
                                </DialogDescription>
                                <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
                              </DialogContent>
                            </Dialog>

                            <Button
                              className="h-12 w-full justify-start gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                router.push('/extension')
                              }}
                              aria-label="Chrome 확장프로그램 다운로드">
                              <Chrome className="h-5 w-5" aria-hidden="true" />
                              다운로드
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
