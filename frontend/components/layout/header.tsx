"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Menu, 
  LogIn, 
  Home, 
  Users, 
  BookOpen, 
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
  User 
} from "lucide-react"
import AuthForm from "@/components/auth/auth-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
type Theme = "light" | "dark" | "system"

/**
 * 언어 타입
 */
type Language = "한국어" | "English" | "日本語" | "中文"

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 네비게이션 메뉴 아이템 목록
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    href: "/community",
    label: "커뮤니티",
    shortLabel: "커뮤니티",
    icon: Users,
    description: "프롬프트 리뷰 & 공유",
  },
  {
    href: "/my-reviews",
    label: "내 리뷰",
    shortLabel: "내 리뷰",
    icon: BookOpen,
    description: "나의 프롬프트 기록",
    requiresAuth: true,
  },
  {
    href: "/trending",
    label: "트렌딩",
    shortLabel: "트렌딩",
    icon: TrendingUp,
    description: "인기 프롬프트 모음",
    badge: "Hot",
  },
  {
    href: "/extension",
    label: "확장프로그램",
    shortLabel: "확장",
    icon: Chrome,
    description: "ChatGPT 프롬프트 추천 도구",
    badge: "Soon",
  },
] as const

/**
 * 기본 사용자 데이터
 */
const DEFAULT_USER_DATA: UserData = {
  email: "testuser@example.com",
  username: "",
  profile: {
    avatar_color_class: "from-blue-500 to-purple-600",
  },
} as const

/**
 * 지원 언어 목록
 */
const SUPPORTED_LANGUAGES: Language[] = ["한국어", "English", "日本語", "中文"] as const

/**
 * 테마 옵션 목록
 */
const THEME_OPTIONS: { value: Theme; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
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
  
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA)
  const [theme, setTheme] = useState<Theme>("system")
  const [language, setLanguage] = useState<Language>("한국어")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // ========================================================================
  // Next.js 훅
  // ========================================================================
  
  const pathname = usePathname()
  const router = useRouter()

  // ========================================================================
  // 메모화된 값들
  // ========================================================================

  /**
   * 인증 상태에 따라 필터링된 네비게이션 아이템들
   */
  const navigationItems = useMemo(() => 
    NAVIGATION_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn),
    [isLoggedIn]
  )

  /**
   * 아바타 색상 클래스 (백엔드에서 제공되는 그라디언트)
   */
  const avatarColorClass = useMemo(() => 
    userData.profile?.avatar_color_class || "from-blue-500 to-purple-600",
    [userData.profile?.avatar_color_class]
  )

  /**
   * 현재 테마에 맞는 아이콘 컴포넌트
   */
  const ThemeIcon = useMemo(() => {
    const themeOption = THEME_OPTIONS.find(option => option.value === theme)
    return themeOption?.icon || Monitor
  }, [theme])

  // ========================================================================
  // 유틸리티 함수들
  // ========================================================================

  /**
   * 백엔드 원시 데이터를 프론트엔드 형식으로 변환
   * 
   * @param rawUserData - 백엔드에서 받은 원시 사용자 데이터
   * @returns 변환된 사용자 데이터
   */
  const processUserData = useCallback((rawUserData: any): UserData => {
    try {
      return {
        email: rawUserData.email || "",
        username: rawUserData.username || "",
        profile: {
          avatar_color: rawUserData.profile?.avatar_color || 0,
          avatar_color_class: rawUserData.profile?.avatar_color_class || "from-blue-500 to-purple-600",
          location: rawUserData.profile?.location || "",
          website: rawUserData.profile?.website || "",
        },
      }
    } catch (error) {
      console.error("사용자 데이터 처리 중 오류:", error)
      return DEFAULT_USER_DATA
    }
  }, [])

  /**
   * 현재 경로가 활성 상태인지 확인
   * 
   * @param href - 확인할 경로
   * @returns 활성 상태 여부
   */
  const isActive = useCallback((href: string): boolean => {
    if (href === "/") {
      return pathname === "/" || pathname === "/home"
    }
    return pathname.startsWith(href)
  }, [pathname])

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
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      const token = localStorage.getItem("authToken")
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        
        try {
          await fetch(`${apiUrl}/auth/logout/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          })
        } catch (apiError) {
          console.error("로그아웃 API 요청 실패:", apiError)
          // API 실패해도 로컬 로그아웃은 진행
        }
      }
    } catch (error) {
      console.error("로그아웃 처리 중 오류:", error)
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      
      // 상태 초기화
      setIsLoggedIn(false)
      setUserData(DEFAULT_USER_DATA)
      setIsLoading(false)
      
      // 프로필 페이지에 있을 경우 홈으로 리다이렉트
      if (pathname === "/profile") {
        router.push("/")
      }
    }
  }, [pathname, router])

  /**
   * 로그인 성공 후 처리
   * - 로컬 스토리지에서 사용자 데이터 가져와서 상태 업데이트
   */
  const handleLoginSuccess = useCallback((): void => {
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      try {
        const rawUserData = JSON.parse(storedUserData)
        const processedData = processUserData(rawUserData)
        setUserData(processedData)
        setIsLoggedIn(true)
        setIsAuthOpen(false)
      } catch (error) {
        console.error("로그인 후 사용자 데이터 처리 오류:", error)
      }
    }
  }, [processUserData])

  /**
   * 테마 변경 핸들러
   * 
   * @param newTheme - 새로운 테마
   */
  const handleThemeChange = useCallback((newTheme: Theme): void => {
    setTheme(newTheme)
    // 실제 구현에서는 여기서 테마를 localStorage에 저장하고 document에 적용
    localStorage.setItem("theme", newTheme)
  }, [])

  /**
   * 언어 변경 핸들러
   * 
   * @param newLanguage - 새로운 언어
   */
  const handleLanguageChange = useCallback((newLanguage: Language): void => {
    setLanguage(newLanguage)
    // 실제 구현에서는 여기서 i18n 라이브러리를 통해 언어 변경
    localStorage.setItem("language", newLanguage)
  }, [])

  // ========================================================================
  // 생명주기 및 부수효과
  // ========================================================================

  /**
   * 컴포넌트 마운트 시 로컬 스토리지에서 인증 상태 및 설정 복원
   */
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        setIsLoading(true)
        
        // 인증 상태 확인
        const token = localStorage.getItem("authToken")
        const storedUserData = localStorage.getItem("userData")

        if (token && storedUserData) {
          try {
            const rawUserData = JSON.parse(storedUserData)
            const processedData = processUserData(rawUserData)
            setIsLoggedIn(true)
            setUserData(processedData)
          } catch (error) {
            console.error("사용자 데이터 파싱 오류:", error)
            // 오류 발생 시 로그아웃 처리
            localStorage.removeItem("authToken")
            localStorage.removeItem("userData")
          }
        }

        // 테마 설정 복원
        const savedTheme = localStorage.getItem("theme") as Theme
        if (savedTheme && THEME_OPTIONS.some(option => option.value === savedTheme)) {
          setTheme(savedTheme)
        }

        // 언어 설정 복원
        const savedLanguage = localStorage.getItem("language") as Language
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("초기화 중 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [processUserData])

  // ========================================================================
  // 렌더링 헬퍼 함수들
  // ========================================================================

  /**
   * 네비게이션 링크 렌더링
   * 
   * @param item - 네비게이션 아이템
   * @param className - 추가 CSS 클래스
   * @param onClick - 클릭 핸들러
   * @returns 네비게이션 링크 JSX
   */
  const renderNavigationLink = useCallback((
    item: NavigationItem,
    className: string = "",
    onClick?: () => void
  ): JSX.Element => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        key={item.label}
        href={item.href}
        className={`${className} ${active ? "active" : ""}`}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
        {item.badge && (
          <Badge
            variant={
              item.badge === "Hot" ? "destructive" :
              item.badge === "New" ? "default" : "secondary"
            }
            className="text-xs px-1.5 py-0.5 h-5"
            aria-label={`${item.label} ${item.badge}`}
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }, [isActive])

  /**
   * 사용자 아바타 렌더링
   * 
   * @param size - 아바타 크기 클래스
   * @returns 아바타 JSX
   */
  const renderUserAvatar = useCallback((size: string = "w-8 h-8"): JSX.Element => (
    <Avatar className={size}>
      <AvatarFallback
        className={`text-sm font-semibold text-white border-2 border-white shadow-sm bg-gradient-to-br ${avatarColorClass} ${
          !avatarColorClass.includes('from-') ? 'bg-blue-500' : ''
        }`}
        aria-label={`${userData.username}의 아바타`}
      >
      </AvatarFallback>
    </Avatar>
  ), [avatarColorClass, userData.username])

  // ========================================================================
  // 로딩 상태 처리
  // ========================================================================

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="ml-3 w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // ========================================================================
  // 메인 렌더링
  // ========================================================================

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* ================================================================
              로고 섹션
              ================================================================ */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0"
              aria-label="PromptHub 홈페이지로 이동"
            >
              <div className="relative">
                {/* 로고 아이콘 */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" aria-hidden="true" />
                </div>
                {/* 상태 표시 점 */}
                <div 
                  className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse"
                  aria-hidden="true"
                ></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PromptHub
                </h1>
                <p className="text-xs text-gray-500 -mt-1 hidden xs:block">
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
            <nav className="hidden md:flex items-center space-x-1" role="navigation" aria-label="주요 네비게이션">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`
                      relative flex items-center gap-1.5 lg:gap-2 px-2 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                    aria-current={active ? "page" : undefined}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge === "Hot" ? "destructive" : item.badge === "New" ? "default" : "secondary"}
                        className="text-xs px-1 lg:px-1.5 py-0.5 h-4 lg:h-5 hidden xl:inline-flex"
                        aria-label={`${item.label} ${item.badge}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {/* 활성 상태 표시점 */}
                    {active && (
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                        aria-hidden="true"
                      ></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* 태블릿 네비게이션 (sm ~ md) */}
            <nav className="hidden sm:flex md:hidden items-center space-x-1" role="navigation" aria-label="태블릿 네비게이션">
              {navigationItems
                .filter((item) => item.href !== "/extension") // 확장프로그램 제외
                .map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`
                      relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                      ${
                        active
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                      title={item.description}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      {/* 뱃지 표시 */}
                      {item.badge && (
                        <div 
                          className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                          aria-label={`${item.label}에 새로운 내용이 있습니다`}
                        ></div>
                      )}
                      {/* 활성 상태 표시점 */}
                      {active && (
                        <div 
                          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                          aria-hidden="true"
                        ></div>
                      )}
                    </Link>
                  )
                })}
            </nav>

            {/* 데스크톱 인증 버튼 (md 이상) */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {isLoggedIn ? (
                /* 로그인된 상태: 사용자 드롭다운 메뉴 */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                      aria-label={`${userData.username} 사용자 메뉴`}
                    >
                      {renderUserAvatar()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-0" align="end" sideOffset={8}>
                    {/* 사용자 정보 헤더 */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {userData.username} 님, 환영합니다!
                      </p>
                    </div>
                    
                    {/* 주요 메뉴 항목 */}
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2 cursor-pointer">
                          <User className="w-4 h-4" aria-hidden="true" />
                          <span>프로필</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer">
                        <Bookmark className="w-4 h-4" aria-hidden="true" />
                        <span>북마크</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    {/* 환경설정 섹션 */}
                    <div className="py-2">
                      <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        환경설정
                      </DropdownMenuLabel>
                      
                      {/* 테마 설정 */}
                      <div className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ThemeIcon className="w-4 h-4" aria-hidden="true" />
                            <span className="text-sm">테마</span>
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-lg p-1" role="radiogroup" aria-label="테마 선택">
                            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                              <Button
                                key={value}
                                variant={theme === value ? "default" : "ghost"}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleThemeChange(value)}
                                role="radio"
                                aria-checked={theme === value}
                                aria-label={`${value} 테마`}
                              >
                                <Icon className="w-3 h-3" aria-hidden="true" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* 언어 설정 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4" aria-hidden="true" />
                              <span className="text-sm">언어</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>{language}</span>
                              <ChevronDown className="w-3 h-3" aria-hidden="true" />
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <DropdownMenuItem 
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              className={language === lang ? "bg-blue-50 text-blue-700" : ""}
                            >
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
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer text-red-600 focus:text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
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
                        className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 flex items-center justify-center w-10 h-10 xl:w-auto xl:h-auto xl:px-3 xl:justify-start p-0 xl:p-2"
                        aria-label="로그인 또는 회원가입"
                      >
                        <LogIn className="w-4 h-4 xl:mr-2 flex-shrink-0" aria-hidden="true" />
                        <span className="hidden xl:inline">시작하기</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-md [&>button]:hidden">
                      <DialogTitle className="sr-only">로그인</DialogTitle>
                      <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center w-10 h-10 xl:w-auto xl:h-auto xl:px-4 xl:justify-start p-0 xl:p-2"
                    aria-label="Chrome 확장프로그램 다운로드"
                  >
                    <Chrome className="w-4 h-4 xl:mr-2 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden xl:inline">다운로드</span>
                  </Button>
                </>
              )}
            </div>

            {/* 모바일 메뉴 버튼 (md 미만) */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    aria-label="모바일 메뉴 열기"
                  >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 [&>button]:hidden">
                  <SheetTitle className="sr-only">네비게이션 메뉴</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* 모바일 사용자 프로필 (로그인된 경우만 표시) */}
                    {isLoggedIn && (
                      <div className="p-4 border-b bg-gray-50">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="프로필 페이지로 이동"
                        >
                          {renderUserAvatar("w-12 h-12")}
                          <div>
                            <div className="font-semibold text-gray-900">{userData.username}</div>
                            <div className="text-sm text-gray-600">프로필 보기</div>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* 모바일 네비게이션 메뉴 */}
                    <nav className="flex-1 px-4 py-6" role="navigation" aria-label="모바일 네비게이션">
                      <div className="space-y-2">
                        {navigationItems.map((item) => {
                          const Icon = item.icon
                          const active = isActive(item.href)

                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                ${
                                  active
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-gray-700 hover:bg-gray-50"
                                }
                              `}
                              onClick={() => setIsMobileMenuOpen(false)}
                              aria-current={active ? "page" : undefined}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.label}</span>
                                  {item.badge && (
                                    <Badge
                                      variant={
                                        item.badge === "Hot"
                                          ? "destructive"
                                          : item.badge === "New"
                                            ? "default"
                                            : "secondary"
                                      }
                                      className="text-xs px-1.5 py-0.5 h-5"
                                      aria-label={`${item.label} ${item.badge}`}
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </nav>

                    {/* 모바일 빠른 액션 (로그인된 경우만 표시) */}
                    {isLoggedIn && (
                      <div className="p-4 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12 mb-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="북마크 페이지로 이동"
                        >
                          <Bookmark className="w-5 h-5" aria-hidden="true" />
                          내 북마크
                        </Button>
                      </div>
                    )}

                    {/* 모바일 인증 섹션 */}
                    <div className="p-4 border-t">
                      <div className="space-y-3">
                        {isLoggedIn ? (
                          /* 로그인된 상태: 로그아웃 버튼 */
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => {
                              handleLogout()
                              setIsMobileMenuOpen(false)
                            }}
                            aria-label="로그아웃"
                          >
                            <LogOut className="w-5 h-5" aria-hidden="true" />
                            로그아웃
                          </Button>
                        ) : (
                          /* 로그인되지 않은 상태: 시작하기 + 다운로드 버튼 */
                          <>
                            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-3 h-12"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  aria-label="로그인 또는 회원가입"
                                >
                                  <LogIn className="w-5 h-5" aria-hidden="true" />
                                  시작하기
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="p-0 max-w-md [&>button]:hidden">
                                <DialogTitle className="sr-only">로그인</DialogTitle>
                                <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
                              </DialogContent>
                            </Dialog>

                            <Button
                              className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              onClick={() => setIsMobileMenuOpen(false)}
                              aria-label="Chrome 확장프로그램 다운로드"
                            >
                              <Chrome className="w-5 h-5" aria-hidden="true" />
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