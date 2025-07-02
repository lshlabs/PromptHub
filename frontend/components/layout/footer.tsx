import Link from "next/link"
import { useMemo } from "react"
import { Star, Chrome, Github, MessageCircle, Twitter, Youtube, Zap, HelpCircle } from "lucide-react"

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 소셜 링크 인터페이스
 */
interface SocialLink {
  /** 링크 URL */
  href: string
  /** 아이콘 컴포넌트 */
  icon: React.ComponentType<{ className?: string }>
  /** 접근성을 위한 라벨 */
  label: string
}

/**
 * 푸터 메뉴 아이템 인터페이스
 */
interface FooterMenuItem {
  /** 링크 URL */
  href: string
  /** 표시 텍스트 */
  label: string
  /** 뱃지 텍스트 (옵션) */
  badge?: string
  /** 뱃지 스타일 (옵션) */
  badgeStyle?: string
}

/**
 * 푸터 섹션 인터페이스
 */
interface FooterSection {
  /** 섹션 제목 */
  title: string
  /** 섹션 아이콘 */
  icon: React.ComponentType<{ className?: string }>
  /** 아이콘 색상 클래스 */
  iconColor: string
  /** 메뉴 아이템들 */
  items: FooterMenuItem[]
}

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 소셜 미디어 링크 목록
 */
const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://github.com/lshlabs/PromptHub",
    icon: Github,
    label: "GitHub 프로필",
  },
  {
    href: "#",
    icon: MessageCircle,
    label: "Discord 커뮤니티",
  },
  {
    href: "#",
    icon: Twitter,
    label: "Twitter 팔로우",
  },
  {
    href: "#",
    icon: Youtube,
    label: "YouTube 채널",
  },
] as const

/**
 * 푸터 섹션 목록
 */
const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "플랫폼",
    icon: Zap,
    iconColor: "text-blue-400",
    items: [
      { href: "/", label: "홈" },
      { href: "/community", label: "커뮤니티" },
      { href: "/trending", label: "트렌딩", badge: "Hot", badgeStyle: "bg-red-500" },
      { href: "#", label: "북마크" },
      { href: "/my-reviews", label: "내 리뷰" },
    ],
  },
  {
    title: "도구",
    icon: Chrome,
    iconColor: "text-green-400",
    items: [
      { href: "/extension", label: "크롬 확장프로그램", badge: "Soon", badgeStyle: "bg-gray-600" },
      { href: "#", label: "프롬프트 분석" },
      { href: "#", label: "API 문서" },
      { href: "#", label: "개발자 도구" },
    ],
  },
  {
    title: "지원",
    icon: HelpCircle,
    iconColor: "text-purple-400",
    items: [
      { href: "#", label: "사용 가이드" },
      { href: "#", label: "FAQ" },
      { href: "#", label: "문의하기" },
      { href: "#", label: "피드백" },
      { href: "#", label: "서비스 상태" },
    ],
  },
] as const

/**
 * 하단 링크 목록
 */
const BOTTOM_LINKS: FooterMenuItem[] = [
  { href: "#", label: "개인정보처리방침" },
  { href: "#", label: "이용약관" },
  { href: "#", label: "쿠키 정책" },
] as const

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 푸터 컴포넌트
 * 
 * @description
 * - 사이트 하단에 위치하는 푸터 영역
 * - 브랜드 정보, 네비게이션 링크, 소셜 미디어 링크 제공
 * - Chrome 확장프로그램 홍보 섹션 포함
 * - 반응형 디자인으로 모든 화면 크기에 대응
 * 
 * @features
 * - 브랜드 로고 및 소개
 * - 카테고리별 네비게이션 링크
 * - 소셜 미디어 링크
 * - Chrome 확장프로그램 CTA
 * - 저작권 및 법적 링크
 * - 키보드 접근성
 * - SEO 최적화
 */
export default function Footer(): JSX.Element {
  // ========================================================================
  // 메모화된 값들
  // ========================================================================

  /**
   * 현재 연도 (저작권 표시용)
   */
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  // ========================================================================
  // 렌더링 헬퍼 함수들
  // ========================================================================

  /**
   * 소셜 링크 렌더링
   * 
   * @param link - 소셜 링크 객체
   * @returns 소셜 링크 JSX
   */
  const renderSocialLink = (link: SocialLink): JSX.Element => {
    const Icon = link.icon

    return (
      <Link
        key={link.label}
        href={link.href}
        className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label={link.label}
        target={link.href.startsWith("http") ? "_blank" : undefined}
        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </Link>
    )
  }

  /**
   * 푸터 메뉴 아이템 렌더링
   * 
   * @param item - 메뉴 아이템 객체
   * @returns 메뉴 아이템 JSX
   */
  const renderMenuItem = (item: FooterMenuItem): JSX.Element => (
    <li key={item.label}>
      <Link 
        href={item.href} 
        className="hover:text-white transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:text-white"
      >
        <span>{item.label}</span>
        {item.badge && (
          <span 
            className={`text-xs text-white px-1.5 py-0.5 rounded-full ${item.badgeStyle || 'bg-gray-600'}`}
            aria-label={`${item.label} - ${item.badge}`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  )

  /**
   * 푸터 섹션 렌더링
   * 
   * @param section - 푸터 섹션 객체
   * @returns 푸터 섹션 JSX
   */
  const renderFooterSection = (section: FooterSection): JSX.Element => {
    const Icon = section.icon

    return (
      <div key={section.title}>
        <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
          <Icon className={`w-4 h-4 ${section.iconColor}`} aria-hidden="true" />
          {section.title}
        </h4>
        <ul className="space-y-3 text-gray-400 text-sm">
          {section.items.map(renderMenuItem)}
        </ul>
      </div>
    )
  }

  // ========================================================================
  // 메인 렌더링
  // ========================================================================

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white py-16">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" aria-hidden="true"></div>

      <div className="relative container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* ================================================================
              브랜드 섹션
              ================================================================ */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-white fill-white" aria-hidden="true" />
                </div>
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"
                  aria-hidden="true"
                ></div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PromptHub
                </h3>
                <p className="text-xs text-gray-400">AI 프롬프트 리뷰 플랫폼</p>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              더 나은 프롬프트로 AI와 소통하세요.
              <br />
              커뮤니티와 함께 성장하는 프롬프트 플랫폼입니다.
            </p>

            {/* 소셜 링크 */}
            <div className="flex space-x-4" role="list" aria-label="소셜 미디어 링크">
              {SOCIAL_LINKS.map(renderSocialLink)}
            </div>
          </div>

          {/* ================================================================
              푸터 메뉴 섹션들
              ================================================================ */}
          {FOOTER_SECTIONS.map(renderFooterSection)}
        </div>

        {/* ================================================================
            Chrome 확장프로그램 하이라이트
            ================================================================ */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Chrome className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Chrome 확장프로그램</h4>
                <p className="text-gray-400 text-sm">ChatGPT에서 바로 프롬프트 추천을 받아보세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Chrome 확장프로그램 설치하기"
              >
                설치하기
              </button>
              <Link href="/extension">
                <button 
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label="확장프로그램에 대해 자세히 알아보기"
                >
                  자세히 보기
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================
            하단 저작권 및 법적 링크
            ================================================================ */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              Made by @hu2chaso | PromptHub - Private Project {currentYear}
            </p>
            <nav className="flex gap-6 text-sm text-gray-400" aria-label="법적 링크">
              {BOTTOM_LINKS.map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
