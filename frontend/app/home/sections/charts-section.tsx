"use client"

import { forwardRef, useRef, useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { UserGrowthChart } from "@/components/charts/user-growth-chart"
import { PriceSatisfactionChart } from "@/components/charts/price-satisfaction-chart"
import { AccuracyHallucinationChart } from "@/components/charts/accuracy-hallucination-chart"

/**
 * ChartsSection 컴포넌트의 Props 인터페이스
 */
interface ChartsSectionProps {
  className?: string
}

/**
 * 차트 데이터 타입 정의
 */
interface ChartData {
  id: number
  title: string
  component: React.ComponentType
  description: string
}

/**
 * 차트 데이터 배열
 */
const CHART_DATA: ChartData[] = [
  {
    id: 0,
    title: "사용자 증가 추이",
    component: UserGrowthChart,
    description: "연도별 LLM 서비스 가입자수 증가 현황"
  },
  {
    id: 1,
    title: "가격 만족도 조사",
    component: PriceSatisfactionChart,
    description: "사용자들의 LLM 서비스 가격 만족도 설문 결과"
  },
  {
    id: 2,
    title: "AI 모델 정확도 비교",
    component: AccuracyHallucinationChart,
    description: "최신 AI 모델들의 정확도와 할루시네이션 비율 비교"
  }
]

/**
 * LLM 시대의 프롬프트 중요성을 보여주는 차트 섹션 컴포넌트
 * 
 * 기능:
 * - 수평 스크롤 가능한 차트 컨테이너
 * - 좌우 네비게이션 화살표
 * - 스크롤 인디케이터 점
 * - 반응형 디자인 지원
 * - 접근성 고려 (aria-label, 키보드 네비게이션)
 */
const ChartsSection = forwardRef<HTMLDivElement, ChartsSectionProps>(({ className }, ref) => {
  // 상태 관리
  const [currentChart, setCurrentChart] = useState<number>(0)
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false)
  const [showRightArrow, setShowRightArrow] = useState<boolean>(true)
  const [isClient, setIsClient] = useState<boolean>(false)
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  /**
   * 특정 차트로 스크롤하는 함수
   * @param index - 이동할 차트의 인덱스
   */
  const scrollToChart = useCallback(
    (index: number) => {
      if (!isClient || !scrollContainerRef.current) return

      try {
        const container = scrollContainerRef.current
        const containerWidth = container.clientWidth
        const scrollLeft = containerWidth * index
        
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        })
      } catch (error) {
        console.warn("차트 스크롤 오류:", error)
      }
    },
    [isClient],
  )

  /**
   * 이전 차트로 이동
   */
  const scrollToPrevious = useCallback(() => {
    if (currentChart > 0) {
      scrollToChart(currentChart - 1)
    }
  }, [currentChart, scrollToChart])

  /**
   * 다음 차트로 이동
   */
  const scrollToNext = useCallback(() => {
    if (currentChart < CHART_DATA.length - 1) {
      scrollToChart(currentChart + 1)
    }
  }, [currentChart, scrollToChart])

  /**
   * 스크롤 이벤트 핸들러
   * 현재 차트 인덱스와 화살표 표시 상태를 업데이트
   */
  const handleScroll = useCallback(() => {
    if (!isClient || !scrollContainerRef.current) return

    try {
      const container = scrollContainerRef.current
      const scrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth
      const maxScrollLeft = container.scrollWidth - containerWidth

      let currentIndex = Math.round(scrollLeft / containerWidth)

      // 스크롤 위치에 따른 정확한 인덱스 계산
      if (scrollLeft <= 10) {
        currentIndex = 0
      } else if (scrollLeft >= maxScrollLeft - 10) {
        currentIndex = CHART_DATA.length - 1
      }

      setCurrentChart(currentIndex)
      setShowLeftArrow(currentIndex > 0)
      setShowRightArrow(currentIndex < CHART_DATA.length - 1)
    } catch (error) {
      console.warn("스크롤 핸들링 오류:", error)
    }
  }, [isClient])

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    if (!isClient) return

    const container = scrollContainerRef.current
    if (!container) return

    // 초기 상태 설정을 위한 지연
    const timeoutId = setTimeout(() => {
      handleScroll()
    }, 100)

    container.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [isClient, handleScroll])

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      scrollToPrevious()
    } else if (event.key === "ArrowRight") {
      scrollToNext()
    }
  }, [scrollToPrevious, scrollToNext])

  // 클라이언트 사이드가 준비되지 않았으면 로딩 상태 표시
  if (!isClient) {
    return (
      <div ref={ref} className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">차트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <section 
      ref={ref} 
      className={`h-screen flex items-center bg-white overflow-visible ${className || ""}`}
      aria-labelledby="charts-section-title"
    >
      <div className="w-full">
        {/* 섹션 헤더 */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp 
              className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 hidden sm:block" 
              aria-hidden="true"
            />
            <h2 
              id="charts-section-title"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-wrap-balance"
            >
              LLM&nbsp;시대, 프롬프트가 성능을&nbsp;결정합니다
            </h2>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed text-wrap-pretty">
            늘어나는 사용률과 함께 요금&nbsp;부담, 정확도&nbsp;이슈도 커지고&nbsp;있습니다.{" "}
            <span className="block sm:inline">이제는 더&nbsp;나은 프롬프트가&nbsp;필요합니다.</span>
          </p>
        </header>

        {/* 차트 컨테이너 */}
        <div 
          className="max-w-4xl mx-auto relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="차트 네비게이션"
        >
          {/* 좌측 네비게이션 화살표 */}
          {showLeftArrow && (
            <button
              onClick={scrollToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="이전 차트"
              type="button"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}

          {/* 우측 네비게이션 화살표 */}
          {showRightArrow && (
            <button
              onClick={scrollToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="다음 차트"
              type="button"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}

          {/* 스크롤 가능한 차트 컨테이너 */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-0"
            style={{ scrollSnapType: "x mandatory" }}
            role="tabpanel"
            aria-live="polite"
          >
            {CHART_DATA.map((chart) => {
              const ChartComponent = chart.component
              return (
                <div 
                  key={chart.id} 
                  className="flex-none w-full snap-center px-4 py-4"
                >
                  <Card className="border-0 shadow-lg max-w-lg mx-auto overflow-visible">
                    <CardContent className="p-6 overflow-visible">
                      <h3 className="text-xl font-semibold mb-4 text-center">
                        {chart.title}
                      </h3>
                      <div className="min-h-[250px] overflow-visible relative">
                        <ChartComponent />
                      </div>
                      <p className="text-sm text-gray-600 mt-4 text-center">
                        {chart.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>

          {/* 스크롤 인디케이터 */}
          <nav 
            className="flex justify-center mt-6 space-x-2"
            aria-label="차트 인디케이터"
          >
            {CHART_DATA.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToChart(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  currentChart === index 
                    ? "bg-blue-600 scale-110" 
                    : "bg-gray-300 hover:bg-gray-400 hover:scale-105"
                }`}
                aria-label={`${index + 1}번째 차트로 이동`}
                aria-current={currentChart === index ? "true" : "false"}
                type="button"
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
})

ChartsSection.displayName = "ChartsSection"

export default ChartsSection
