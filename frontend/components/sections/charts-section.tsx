"use client"

import { forwardRef, useRef, useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { UserGrowthChart } from "@/components/charts/user-growth-chart"
import { PriceSatisfactionChart } from "@/components/charts/price-satisfaction-chart"
import { AccuracyHallucinationChart } from "@/components/charts/accuracy-hallucination-chart"

interface ChartsSectionProps {
  className?: string
}

const ChartsSection = forwardRef<HTMLDivElement, ChartsSectionProps>(({ className }, ref) => {
  const [currentChart, setCurrentChart] = useState(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true)
  }, [])

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
        console.warn("Scroll error:", error)
      }
    },
    [isClient],
  )

  const scrollToPrevious = useCallback(() => {
    if (currentChart > 0) {
      scrollToChart(currentChart - 1)
    }
  }, [currentChart, scrollToChart])

  const scrollToNext = useCallback(() => {
    if (currentChart < 2) {
      scrollToChart(currentChart + 1)
    }
  }, [currentChart, scrollToChart])

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
        currentIndex = 2
      }

      setCurrentChart(currentIndex)
      setShowLeftArrow(currentIndex > 0)
      setShowRightArrow(currentIndex < 2)
    } catch (error) {
      console.warn("Handle scroll error:", error)
    }
  }, [isClient])

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
    <div ref={ref} className="h-screen flex items-center bg-white overflow-visible">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h2 className="font-bold text-gray-900">
              {/* 모바일 */}
              <span className="block sm:hidden text-2xl">
                LLM 시대,
                <br />
                프롬프트가 성능을 결정합니다
              </span>

              {/* 태블릿 */}
              <span className="hidden sm:block md:hidden text-3xl">LLM 시대, 프롬프트가 성능을 결정합니다</span>

              {/* 데스크톱 */}
              <span className="hidden md:block text-4xl">LLM 시대, 프롬프트가 성능을 결정합니다</span>
            </h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {/* 모바일 */}
            <span className="block sm:hidden text-sm">
              늘어나는 사용률과 함께 요금 부담, 정확도 이슈도 커지고 있습니다.
              <br />
              이제는 더 나은 프롬프트가 필요합니다.
            </span>

            {/* 태블릿 이상 */}
            <span className="hidden sm:block text-base sm:text-lg">
              늘어나는 사용률과 함께 요금 부담, 정확도 이슈도 커지고 있습니다. 이제는 더 나은 프롬프트가 필요합니다.
            </span>
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="max-w-4xl mx-auto relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
              aria-label="이전 차트"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
              aria-label="다음 차트"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-0"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {/* Chart 1 */}
            <div className="flex-none w-full snap-center px-4 py-4">
              <Card className="border-0 shadow-lg max-w-lg mx-auto overflow-visible">
                <CardContent className="p-6 overflow-visible">
                  <h3 className="text-xl font-semibold mb-4 text-center">사용자 증가 추이</h3>
                  <div className="min-h-[250px] overflow-visible relative">
                    <UserGrowthChart />
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center">연도별 LLM 서비스 가입자수 증가 현황</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart 2 */}
            <div className="flex-none w-full snap-center px-4 py-4">
              <Card className="border-0 shadow-lg max-w-lg mx-auto overflow-visible">
                <CardContent className="p-6 overflow-visible">
                  <h3 className="text-xl font-semibold mb-4 text-center">가격 만족도 조사</h3>
                  <div className="min-h-[250px] overflow-visible relative">
                    <PriceSatisfactionChart />
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center">사용자들의 LLM 서비스 가격 만족도 설문 결과</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart 3 */}
            <div className="flex-none w-full snap-center px-4 py-4">
              <Card className="border-0 shadow-lg max-w-lg mx-auto overflow-visible">
                <CardContent className="p-6 overflow-visible">
                  <h3 className="text-xl font-semibold mb-4 text-center">AI 모델 정확도 비교</h3>
                  <div className="min-h-[250px] overflow-visible relative">
                    <AccuracyHallucinationChart />
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    최신 AI 모델들의 정확도와 할루시네이션 비율 비교
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => scrollToChart(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentChart === index ? "bg-blue-600 scale-110" : "bg-gray-300 hover:bg-gray-400 hover:scale-105"
                }`}
                aria-label={`${index + 1}번째 차트로 이동`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

ChartsSection.displayName = "ChartsSection"

export default ChartsSection
