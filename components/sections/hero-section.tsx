"use client"

import { forwardRef, useRef, useState, useEffect } from "react"
import { useInView } from "framer-motion"
import { TypeAnimation } from "react-type-animation"
import { Search, TrendingUp, Star, Clock, ChevronDown } from "lucide-react"

interface HeroSectionProps {
  className?: string
}

// 주간 트렌딩 프롬프트 데이터
const weeklyTrendingPrompts = [
  { id: 1, title: "AI 코딩 어시스턴트 프롬프트", category: "개발", trend: "+15%" },
  { id: 2, title: "창의적 글쓰기 프롬프트", category: "창작", trend: "+12%" },
  { id: 3, title: "브랜드 네이밍 아이디어 생성기", category: "마케팅", trend: "+8%" },
  { id: 4, title: "SQL 쿼리 최적화 가이드", category: "개발", trend: "+22%" },
  { id: 5, title: "감정 분석을 통한 고객 리뷰 요약", category: "분석", trend: "+18%" },
  { id: 6, title: "아이들을 위한 과학 실험 설명서", category: "교육", trend: "+10%" },
  { id: 7, title: "개인화된 운동 루틴 생성기", category: "건강", trend: "+7%" },
  { id: 8, title: "마케팅 카피 작성 프롬프트", category: "마케팅", trend: "+14%" },
  { id: 9, title: "데이터 분석 보고서 생성기", category: "분석", trend: "+9%" },
  { id: 10, title: "언어 학습 대화 시뮬레이터", category: "교육", trend: "+11%" },
  { id: 11, title: "이메일 자동 응답 생성기", category: "비즈니스", trend: "+6%" },
  { id: 12, title: "소셜미디어 콘텐츠 기획", category: "마케팅", trend: "+13%" },
  { id: 13, title: "프레젠테이션 슬라이드 구성", category: "비즈니스", trend: "+5%" },
  { id: 14, title: "고객 서비스 챗봇 응답", category: "서비스", trend: "+9%" },
  { id: 15, title: "기술 문서 작성 가이드", category: "개발", trend: "+11%" },
]

const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(({ className }, ref) => {
  const heroSearchRef = useRef(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const heroSearchInView = useInView(heroSearchRef, { once: true })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [filteredPrompts, setFilteredPrompts] = useState(weeklyTrendingPrompts)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  // 스크롤 인디케이터 표시 여부 확인 및 스크롤 감지
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current
        const isScrollable = scrollHeight > clientHeight
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10 // 10px 여유

        // 스크롤이 시작되면 hasScrolled를 true로 설정
        if (scrollTop > 0) {
          setHasScrolled(true)
        }

        // 스크롤 인디케이터는 스크롤 가능하고, 맨 아래가 아니며, 아직 스크롤하지 않았을 때만 표시
        setShowScrollIndicator(isScrollable && !isAtBottom && !hasScrolled)
      }
    }

    if (isInputFocused && scrollContainerRef.current) {
      checkScrollable()
      const scrollContainer = scrollContainerRef.current
      scrollContainer.addEventListener("scroll", checkScrollable)

      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollable)
      }
    }
  }, [isInputFocused, filteredPrompts, hasScrolled])

  // 검색 포커스가 해제되면 hasScrolled 상태 리셋
  useEffect(() => {
    if (!isInputFocused) {
      setHasScrolled(false)
    }
  }, [isInputFocused])

  // 검색어에 따른 프롬프트 필터링
  useEffect(() => {
    if (searchValue.trim() === "") {
      setFilteredPrompts(weeklyTrendingPrompts)
    } else {
      const filtered = weeklyTrendingPrompts.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          prompt.category.toLowerCase().includes(searchValue.toLowerCase()),
      )
      setFilteredPrompts(filtered)
    }
  }, [searchValue])

  const handlePromptClick = (promptTitle: string) => {
    setSearchValue(promptTitle)
    setIsInputFocused(false)
  }

  const handleSearchFocus = () => {
    setIsInputFocused(true)
  }

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsInputFocused(false)
    }, 200)
  }

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pt-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="text-center">
          {/* 히어로 텍스트 - 검색 포커스 시 숨김 애니메이션 */}
          <div
            className={`transition-all duration-700 ease-out ${
              isInputFocused
                ? "opacity-0 -translate-y-12 scale-95 pointer-events-none"
                : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            <h1 className="font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
              {/* 모바일 (xs) */}
              <span className="block sm:hidden text-3xl">
                당신의 토큰을 절약하는
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  확실한 방법
                </span>
              </span>

              {/* 태블릿 (sm-md) */}
              <span className="hidden sm:block lg:hidden text-4xl">
                당신의 토큰을 절약하는
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  확실한 방법
                </span>
              </span>

              {/* 데스크톱 (lg+) */}
              <span className="hidden lg:block text-6xl">
                당신의 토큰을 절약하는{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  확실한 방법
                </span>
              </span>
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              {/* 모바일 */}
              <span className="block sm:hidden text-base">
                더 적은 질문, 더 좋은 답변을 위한
                <br />
                LLM 프롬프트 추천 플랫폼
              </span>

              {/* 태블릿 이상 */}
              <span className="hidden sm:block text-lg md:text-xl">
                더 적은 질문, 더 좋은 답변을 위한 LLM 프롬프트 추천 플랫폼
              </span>
            </p>
          </div>

          {/* Search Bar - 위치 이동 애니메이션 (크기 유지) */}
          <div
            ref={heroSearchRef}
            className={`transition-all duration-700 ease-out ${
              isInputFocused
                ? "fixed top-[30vh] left-0 right-0 w-full max-w-3xl mx-auto px-4 z-50"
                : `max-w-2xl mx-auto ${heroSearchInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`
            }`}
          >
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />

                <input
                  type="text"
                  className={`w-full pl-12 sm:pl-14 pr-20 sm:pr-24 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-full focus:outline-none transition-all duration-700 ease-out text-gray-900 dark:text-gray-100 ${
                    isInputFocused
                      ? "border-blue-500 dark:border-blue-400 shadow-2xl bg-white dark:bg-gray-800 ring-4 ring-blue-500/20 dark:ring-blue-400/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl"
                  }`}
                  placeholder=" "
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />

                {!(isInputFocused || searchValue) && (
                  <div className="absolute inset-y-0 left-12 sm:left-14 flex items-center pointer-events-none">
                    <TypeAnimation
                      sequence={[
                        "프롬프트를 검색해보세요...",
                        1500,
                        "AI 코딩 어시스턴트 프롬프트",
                        1000,
                        "창의적 글쓰기 프롬프트",
                        1000,
                        "브랜드 네이밍 아이디어 생성기",
                        1000,
                        "어떤 프롬프트를 찾고 계신가요?",
                        1500,
                        "SQL 쿼리 최적화 가이드",
                        1000,
                        "감정 분석을 통한 고객 리뷰 요약",
                        1000,
                        "아이들을 위한 과학 실험 설명서",
                        1000,
                        "원하는 프롬프트를 입력해주세요",
                        1500,
                        "개인화된 운동 루틴 생성기",
                        1000,
                        "마케팅 카피 작성 프롬프트",
                        1000,
                        "데이터 분석 보고서 생성기",
                        1000,
                      ]}
                      wrapper="span"
                      speed={50}
                      repeat={Number.POSITIVE_INFINITY}
                      className="text-gray-400 text-sm sm:text-base"
                    />
                  </div>
                )}

                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 text-sm sm:text-base">
                  검색
                </button>
              </div>

              {/* 트렌딩 프롬프트 드롭다운 - 스크롤바 숨김 */}
              {isInputFocused && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 max-h-[60vh] overflow-hidden"
                >
                  {/* 헤더 */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-750 dark:to-gray-700 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {searchValue ? `"${searchValue}" 관련 프롬프트` : "이번 주 트렌딩 프롬프트"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          총 {filteredPrompts.length}개의 프롬프트
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 프롬프트 목록 - 스크롤바 완전히 숨김 */}
                  <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto scrollbar-hide relative"
                    style={{ maxHeight: "calc(60vh - 120px)" }}
                  >
                    {filteredPrompts.length > 0 ? (
                      <div className="p-3 space-y-1">
                        {filteredPrompts.map((prompt, index) => (
                          <button
                            key={prompt.id}
                            onClick={() => handlePromptClick(prompt.title)}
                            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                            style={{
                              animationDelay: `${index * 30}ms`,
                              animation: `fadeInUp 0.4s ease-out forwards`,
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                                  {prompt.title}
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                    {prompt.category}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>{prompt.trend}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  클릭하여 선택
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Search className="w-8 h-8 opacity-50" />
                        </div>
                        <h4 className="text-sm font-medium mb-2">검색 결과가 없습니다</h4>
                        <p className="text-xs">다른 키워드로 검색해보세요</p>
                      </div>
                    )}

                    {/* 스크롤 인디케이터 화살표 - 스크롤 시 사라짐 */}
                    {showScrollIndicator && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
                        <div className="bg-gradient-to-t from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent w-full h-12 flex items-end justify-center pb-2">
                          <div className="scroll-indicator">
                            <ChevronDown className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-4px);
          }
          60% {
            transform: translateY(-2px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .scroll-indicator {
          animation: bounce 2s infinite, pulse 2s infinite;
        }
      `}</style>
    </div>
  )
})

HeroSection.displayName = "HeroSection"

export default HeroSection
