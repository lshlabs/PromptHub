"use client"

import React, { useRef, useCallback, useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import Header from "@/components/layout/header"
import HeroSection from "./sections/hero-section"
import ChartsSection from "./sections/charts-section"
import { PromptComparison } from "./sections/prompt-comparison"
import { PromptOptimizer } from "./sections/prompt-optimizer"
import { PromptCommunity } from "./sections/prompt-community"
import Footer from "@/components/layout/footer"

/**
 * 섹션 참조 타입 정의
 */
interface SectionRefs {
  heroRef: React.RefObject<HTMLDivElement>
  chartsSectionRef: React.RefObject<HTMLDivElement>
  promptComparisonRef: React.RefObject<HTMLDivElement>
  optimizerRef: React.RefObject<HTMLDivElement>
  communityRef: React.RefObject<HTMLDivElement>
}

/**
 * 스크롤 옵션 상수
 */
const SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: "smooth",
  block: "start",
} as const

/**
 * 헤더 높이 상수 (px)
 */
const HEADER_HEIGHT = 80

/**
 * PromptHub 메인 홈페이지 컴포넌트
 * 
 * 기능:
 * - 5개 주요 섹션으로 구성된 원페이지 레이아웃
 * - 스크롤 스냅 기능으로 부드러운 섹션 전환
 * - 섹션 간 네비게이션 지원
 * - 반응형 디자인
 * - 접근성 고려
 * 
 * 섹션 구성:
 * 1. Hero Section - 메인 랜딩 및 검색
 * 2. Charts Section - LLM 트렌드 데이터 시각화
 * 3. Prompt Comparison - 좋은 프롬프트 vs 나쁜 프롬프트 비교
 * 4. Prompt Optimizer - 프롬프트 최적화 체험
 * 5. Community Section - 프롬프트 커뮤니티
 */
export default function HomePage() {
  // 섹션 참조 객체들
  const sectionRefs: SectionRefs = {
    heroRef: useRef<HTMLDivElement>(null),
    chartsSectionRef: useRef<HTMLDivElement>(null),
    promptComparisonRef: useRef<HTMLDivElement>(null),
    optimizerRef: useRef<HTMLDivElement>(null),
    communityRef: useRef<HTMLDivElement>(null),
  }

  // 메인 컨테이너 참조 (스크롤 컨테이너)
  const mainRef = useRef<HTMLElement>(null)

  // Top 버튼 상태
  const [showTopButton, setShowTopButton] = useState<boolean>(false)
  
  // 검색 포커스 상태 (스크롤 제어용)
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)

  /**
   * 헤더 높이를 고려한 정밀한 스크롤 함수
   * @param element - 스크롤할 대상 요소
   */
  const scrollToElementWithOffset = useCallback((element: HTMLElement) => {
    const elementPosition = element.offsetTop - HEADER_HEIGHT
    
    window.scrollTo({
      top: Math.max(0, elementPosition),
      behavior: 'smooth'
    })
  }, [])

  /**
   * 프롬프트 최적화 섹션으로 스크롤하는 함수
   * Hero Section에서 호출됨
   */
  const scrollToOptimizer = useCallback(() => {
    const element = sectionRefs.optimizerRef.current
    if (element) {
      scrollToElementWithOffset(element)
    }
  }, [scrollToElementWithOffset, sectionRefs.optimizerRef])



  /**
   * 페이지 최상단으로 스크롤하는 함수
   */
  const scrollToTop = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [])

  /**
   * 검색 포커스 상태 변경 핸들러
   * @param isFocused - 포커스 상태
   */
  const handleSearchFocusChange = useCallback((isFocused: boolean) => {
    setIsSearchFocused(isFocused)
  }, [])

  /**
   * 스크롤 위치에 따른 Top 버튼 표시
   */
  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return

      const scrollContainer = mainRef.current
      const scrollTop = scrollContainer.scrollTop

      // 300px 이상 스크롤하면 Top 버튼 표시
      setShowTopButton(scrollTop > 300)
    }

    const scrollContainer = mainRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      handleScroll() // 초기 상태 설정

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  /**
   * 검색 포커스 시 백그라운드 스크롤 방지
   */
  useEffect(() => {
    if (!mainRef.current) return

    const scrollContainer = mainRef.current
    
    if (isSearchFocused) {
      // 스크롤 방지
      scrollContainer.style.overflow = 'hidden'
    } else {
      // 스크롤 복원
      scrollContainer.style.overflow = 'auto'
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      if (scrollContainer) {
        scrollContainer.style.overflow = 'auto'
      }
    }
  }, [isSearchFocused])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 고정 헤더 */}
      <Header />

      {/* 메인 콘텐츠 - 스크롤 스냅 적용 */}
      <main 
        ref={mainRef}
        className="pt-16 snap-y snap-mandatory overflow-y-auto h-screen"
        role="main"
        aria-label="PromptHub 메인 콘텐츠"
      >
        {/* 히어로 섹션 */}
        <section 
          ref={sectionRefs.heroRef} 
          className="min-h-screen snap-start flex items-center justify-center"
          aria-labelledby="hero-section-title"
        >
          <div className="w-full">
            <HeroSection onSearchFocusChange={handleSearchFocusChange} />
          </div>
        </section>

        {/* 차트 섹션 */}
        <section 
          ref={sectionRefs.chartsSectionRef} 
          className="min-h-screen snap-start"
          aria-labelledby="charts-section-title"
        >
          <ChartsSection />
        </section>

        {/* 프롬프트 비교 섹션 */}
        <section 
          ref={sectionRefs.promptComparisonRef} 
          className="min-h-screen snap-start flex items-center bg-gray-50 py-16"
          aria-labelledby="comparison-section-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptComparison />
          </div>
        </section>

        {/* 프롬프트 최적화 섹션 */}
        <section 
          ref={sectionRefs.optimizerRef} 
          className="min-h-screen snap-start flex items-center bg-white py-16"
          aria-labelledby="optimizer-section-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptOptimizer />
          </div>
        </section>

        {/* 커뮤니티 섹션 */}
        <section 
          ref={sectionRefs.communityRef} 
          className="min-h-screen snap-start flex items-center bg-gray-50 py-16"
          aria-labelledby="community-section-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <PromptCommunity />
          </div>
        </section>

        {/* 푸터 섹션 */}
        <section 
          className="snap-start bg-gray-900"
          aria-label="사이트 푸터"
        >
          <Footer />
        </section>
      </main>

      {/* Top 버튼 */}
      <button
        onClick={scrollToTop}
        className={`fixed right-6 bottom-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          showTopButton 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="페이지 최상단으로 이동"
        title="맨 위로"
      >
        <ChevronUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
} 