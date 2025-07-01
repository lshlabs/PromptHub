"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, LogIn, Home, Users, BookOpen, TrendingUp, Star, Bookmark, Chrome, Puzzle, Sun, Moon, Monitor, Globe, ChevronDown } from "lucide-react"
import AuthForm from "@/components/auth/auth-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"

export default function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({
    email: "testuser@example.com",
    username: "",
    avatar: null,
  })
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [language, setLanguage] = useState("한국어")
  const pathname = usePathname()
  const router = useRouter()

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const storedUserData = localStorage.getItem("userData")

    if (token && storedUserData) {
      setIsLoggedIn(true)
      setUserData(JSON.parse(storedUserData))
    }
  }, [])

  // 랜덤 그라디언트 생성 함수
  const generateRandomGradient = useMemo(() => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-blue-600",
      "from-purple-500 to-pink-600",
      "from-yellow-500 to-red-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-violet-500 to-purple-600",
    ]

    // 이메일이 없으면 기본값 사용
    const base = userData.email || "default@email.com"
    const hash = base.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return gradients[Math.abs(hash) % gradients.length]
  }, [userData.email])

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />
      case "dark":
        return <Moon className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const allNavigationItems = [
    {
      href: "/",
      label: "홈",
      shortLabel: "홈",
      icon: Home,
      description: "메인 대시보드",
    },
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
      requiresAuth: true, // 인증 필요 플래그
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
  ]

  // 인증 상태에 따른 네비게이션 아이템 필터링
  const navigationItems = allNavigationItems.filter((item) => !item.requiresAuth || isLoggedIn)

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        await fetch("http://localhost:8000/api/auth/logout/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        })
      }
    } catch (error) {
      console.error("로그아웃 요청 실패:", error)
    } finally {
      // 로컬 스토리지에서 인증 정보 제거
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      setIsLoggedIn(false)
      setUserData({
        email: "testuser@example.com",
        username: "",
        avatar: null,
      })
      if (pathname === "/profile") {
        router.push("/")
      }
    }
  }

  const handleLoginSuccess = () => {
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
    setIsLoggedIn(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* 로고 - PromptHub 브랜딩 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PromptHub
                </h1>
                <p className="text-xs text-gray-500 -mt-1 hidden xs:block">AI 프롬프트 리뷰 플랫폼</p>
              </div>
            </Link>
          </div>

          {/* 네비게이션 + 인증 */}
          <div className="flex items-center space-x-4">
            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center space-x-1">
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
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge === "Hot" ? "destructive" : item.badge === "New" ? "default" : "secondary"}
                        className="text-xs px-1 lg:px-1.5 py-0.5 h-4 lg:h-5 hidden xl:inline-flex"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {active && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* 태블릿 네비게이션 */}
            <nav className="hidden sm:flex md:hidden items-center space-x-1">
              {navigationItems
                .filter((item) => item.href !== "/extension")
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
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      {item.badge && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                      {active && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  )
                })}
            </nav>

            {/* 데스크톱 인증 버튼 */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {isLoggedIn ? (
                // 로그인된 상태: 드롭다운 메뉴
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={userData.avatar || "/placeholder.svg?height=32&width=32"}
                          alt={userData.email}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={`text-sm font-semibold text-white bg-gradient-to-br ${generateRandomGradient} border-2 border-white shadow-sm`}
                        >
                          {userData.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-0" align="end" sideOffset={8}>
                    {/* 사용자 정보 헤더 */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{userData.email}</p>
                    </div>
                    {/* 메뉴 항목들 */}
                    <div className="py-2">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          <span>프로필</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer">
                        <Bookmark className="w-4 h-4" />
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
                            {getThemeIcon()}
                            <span className="text-sm">테마</span>
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <Button
                              variant={theme === "light" ? "default" : "ghost"}
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setTheme("light")}
                            >
                              <Sun className="w-3 h-3" />
                            </Button>
                            <Button
                              variant={theme === "dark" ? "default" : "ghost"}
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setTheme("dark")}
                            >
                              <Moon className="w-3 h-3" />
                            </Button>
                            <Button
                              variant={theme === "system" ? "default" : "ghost"}
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setTheme("system")}
                            >
                              <Monitor className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* 언어 설정 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4" />
                              <span className="text-sm">언어</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>{language}</span>
                              <ChevronDown className="w-3 h-3" />
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          <DropdownMenuItem onClick={() => setLanguage("한국어")}>한국어</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLanguage("English")}>English</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLanguage("日本語")}>日本語</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLanguage("中文")}>中文</DropdownMenuItem>
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
                        <LogOut className="w-4 h-4" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // 로그인되지 않은 상태: 시작하기 + 다운로드
                <>
                  <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 flex items-center justify-center w-10 h-10 xl:w-auto xl:h-auto xl:px-3 xl:justify-start p-0 xl:p-2"
                      >
                        <LogIn className="w-4 h-4 xl:mr-2 flex-shrink-0" />
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
                  >
                    <Chrome className="w-4 h-4 xl:mr-2 flex-shrink-0" />
                    <span className="hidden xl:inline">다운로드</span>
                  </Button>
                </>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetTitle className="sr-only">네비게이션 메뉴</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* 모바일 메뉴 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900">PromptHub</h2>
                          <p className="text-xs text-gray-600">AI 프롬프트 리뷰 플랫폼</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* 모바일 사용자 프로필 (로그인된 경우) */}
                    {isLoggedIn && (
                      <div className="p-4 border-b bg-gray-50">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage
                              src={userData.avatar || "/placeholder.svg?height=48&width=48"}
                              alt={userData.email}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className={`text-lg font-bold text-white bg-gradient-to-br ${generateRandomGradient} border-2 border-white shadow-sm`}
                            >
                              {userData.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{userData.email}</div>
                            <div className="text-sm text-gray-600">프로필 보기</div>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* 모바일 네비게이션 */}
                    <nav className="flex-1 px-4 py-6">
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
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
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

                      {/* 모바일 확장프로그램 하이라이트 */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Chrome className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">크롬 확장프로그램</span>
                          <Badge className="bg-blue-600 text-white">Soon</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">ChatGPT에서 바로 프롬프트 추천을 받아보세요!</p>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Puzzle className="w-4 h-4 mr-2" />
                          설치 가이드 보기
                        </Button>
                      </div>
                    </nav>

                    {/* 모바일 빠른 액션 */}
                    {isLoggedIn && (
                      <div className="p-4 border-t bg-gray-50">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12 mb-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Bookmark className="w-5 h-5" />내 북마크
                        </Button>
                      </div>
                    )}

                    {/* 모바일 인증 섹션 */}
                    <div className="p-4 border-t">
                      <div className="space-y-3">
                        {isLoggedIn ? (
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => {
                              handleLogout()
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <LogIn className="w-5 h-5" />
                            로그아웃
                          </Button>
                        ) : (
                          <>
                            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-3 h-12"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <LogIn className="w-5 h-5" />
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
                            >
                              <Chrome className="w-5 h-5" />
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
