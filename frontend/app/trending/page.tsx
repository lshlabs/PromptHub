/**
 * 트렌딩 페이지 컴포넌트
 * 
 * 인기 프롬프트와 트렌드 정보를 제공하는 페이지입니다.
 * 
 * 주요 기능:
 * - 인기 프롬프트 목록 표시
 * - 카테고리별 트렌드 표시
 * - 추천/비추천 기능
 * - 통계 정보 표시
 * - 반응형 디자인 및 접근성 최적화
 * 
 * @returns JSX.Element 트렌딩 페이지 컴포넌트
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { Metadata } from "next"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Star, Eye, FlameIcon as Fire, Award, Zap, ThumbsUp, ThumbsDown } from "lucide-react"

// ========== 타입 정의 ==========

/**
 * 트렌딩 프롬프트 정보 인터페이스
 */
interface TrendingPrompt {
  /** 프롬프트 ID */
  id: number
  /** 프롬프트 제목 */
  title: string
  /** 프롬프트 설명 */
  description: string
  /** AI 모델 */
  model: string
  /** 평점 */
  rating: number
  /** 조회수 */
  views: number
  /** 작성자 */
  author: string
  /** 카테고리 */
  category: string
  /** 트렌드 방향 */
  trend: string
  /** 변화율 */
  change: string
  /** 추천 정보 */
  recommendations: {
    up: number
    down: number
  }
}

/**
 * 카테고리 정보 인터페이스
 */
interface CategoryInfo {
  /** 카테고리 이름 */
  name: string
  /** 프롬프트 개수 */
  count: number
  /** 이모지 아이콘 */
  icon: string
}

/**
 * 추천 상태 타입
 */
type RecommendationType = "up" | "down" | null

/**
 * 트렌딩 페이지 컴포넌트 인터페이스
 */
interface TrendingPageProps {}

// ========== 메인 컴포넌트 ==========

/**
 * 트렌딩 페이지 메인 컴포넌트
 * 
 * 인기 프롬프트와 트렌드 정보를 종합적으로 제공하는 페이지입니다.
 * 사용자 추천 기능과 함께 카테고리별 분석을 포함합니다.
 * 
 * @param props 컴포넌트 props
 * @returns 렌더링된 트렌딩 페이지
 */
export default function TrendingPage({}: TrendingPageProps): JSX.Element {
  // ========== 상태 관리 ==========
  
  /**
   * 프롬프트별 추천 상태 관리
   * Record<프롬프트ID, 추천타입>
   */
  const [recommendations, setRecommendations] = useState<Record<number, RecommendationType>>({})

  // ========== 정적 데이터 ==========
  
  /**
   * 트렌딩 프롬프트 목록 데이터
   * 실제 환경에서는 API로부터 받아옴
   */
  const trendingPrompts = useMemo<TrendingPrompt[]>(() => [
    {
      id: 1,
      title: "AI 코딩 어시스턴트 프롬프트",
      description: "개발자를 위한 최적화된 코딩 도우미 프롬프트",
      model: "GPT-4",
      rating: 4.9,
      views: 2340,
      author: "DevMaster",
      category: "개발",
      trend: "up",
      change: "+15%",
      recommendations: { up: 89, down: 12 },
    },
    {
      id: 2,
      title: "창의적 마케팅 카피 생성기",
      description: "브랜드 마케팅을 위한 창의적인 카피 작성 프롬프트",
      model: "Claude-3",
      rating: 4.8,
      views: 1890,
      author: "MarketingPro",
      category: "마케팅",
      trend: "up",
      change: "+23%",
      recommendations: { up: 67, down: 8 },
    },
    {
      id: 3,
      title: "학습 도우미 프롬프트",
      description: "효과적인 학습을 위한 개인화된 튜터 프롬프트",
      model: "GPT-4",
      rating: 4.7,
      views: 1650,
      author: "EduHelper",
      category: "교육",
      trend: "up",
      change: "+8%",
      recommendations: { up: 45, down: 5 },
    },
    {
      id: 4,
      title: "데이터 분석 전문가",
      description: "복잡한 데이터를 쉽게 분석하고 인사이트 도출",
      model: "GPT-4",
      rating: 4.6,
      views: 1420,
      author: "DataScientist",
      category: "분석",
      trend: "up",
      change: "+12%",
      recommendations: { up: 38, down: 7 },
    },
  ], [])

  /**
   * 카테고리 목록 데이터
   * 실제 환경에서는 API로부터 받아옴
   */
  const categories = useMemo<CategoryInfo[]>(() => [
    { name: "개발", count: 156, icon: "💻" },
    { name: "마케팅", count: 89, icon: "📈" },
    { name: "교육", count: 67, icon: "📚" },
    { name: "분석", count: 45, icon: "📊" },
    { name: "창작", count: 78, icon: "✨" },
    { name: "비즈니스", count: 92, icon: "💼" },
  ], [])

  // ========== 이벤트 핸들러 ==========
  
  /**
   * 프롬프트 추천/비추천 처리 핸들러
   * 
   * @param promptId 프롬프트 ID
   * @param type 추천 타입 ('up' | 'down')
   */
  const handleRecommendation = useCallback((promptId: number, type: "up" | "down"): void => {
    setRecommendations((prev) => ({
      ...prev,
      [promptId]: prev[promptId] === type ? null : type,
    }))
  }, [])

  /**
   * 프롬프트 상세 보기 핸들러
   * 
   * @param promptId 프롬프트 ID
   */
  const handleViewPrompt = useCallback((promptId: number): void => {
    // TODO: 프롬프트 상세 페이지로 네비게이션
    console.log(`프롬프트 ${promptId} 상세 보기`)
  }, [])

  /**
   * 카테고리 클릭 핸들러
   * 
   * @param categoryName 카테고리 이름
   */
  const handleCategoryClick = useCallback((categoryName: string): void => {
    // TODO: 카테고리별 프롬프트 목록 페이지로 네비게이션
    console.log(`${categoryName} 카테고리 보기`)
  }, [])

  // ========== 렌더링 ==========
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-label="트렌딩 페이지"
      >
        {/* 페이지 헤더 */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-wrap-balance">
                  트렌딩
                </h1>
                <p className="text-gray-600 text-wrap-pretty">
                  지금 가장 인기 있는 프롬프트를 확인하세요
                </p>
              </div>
            </div>
          </div>

          {/* 트렌딩 통계 */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" aria-label="트렌딩 통계">
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Fire className="w-5 h-5 text-orange-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">127</p>
                    <p className="text-sm text-gray-600">이번 주 인기 프롬프트</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">4.8</p>
                    <p className="text-sm text-gray-600">평균 평점</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">+18%</p>
                    <p className="text-sm text-gray-600">이번 주 성장률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </header>

        {/* 트렌딩 콘텐츠 */}
        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="prompts">인기 프롬프트</TabsTrigger>
            <TabsTrigger value="categories">카테고리별</TabsTrigger>
          </TabsList>

          {/* 인기 프롬프트 탭 */}
          <TabsContent value="prompts" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                이번 주 인기 프롬프트
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  일간
                </Button>
                <Button variant="outline" size="sm" className="bg-orange-50 border-orange-200">
                  주간
                </Button>
                <Button variant="outline" size="sm">
                  월간
                </Button>
              </div>
            </div>

            {/* 프롬프트 목록 */}
            <div className="space-y-4">
              {trendingPrompts.map((prompt, index) => (
                <Card
                  key={prompt.id}
                  className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* 순위 표시 */}
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold text-sm flex-shrink-0">
                          #{index + 1}
                        </div>
                        
                        {/* 프롬프트 정보 */}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg mb-1 text-wrap-balance">
                            {prompt.title}
                          </CardTitle>
                          <CardDescription className="mb-2 text-wrap-pretty">
                            {prompt.description}
                          </CardDescription>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span>by {prompt.author}</span>
                            <Badge variant="outline">{prompt.model}</Badge>
                            <Badge variant="secondary">{prompt.category}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* 트렌드 표시 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                            <TrendingUp className="w-4 h-4" aria-hidden="true" />
                            {prompt.change}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* 통계 정보 */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                          {prompt.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" aria-hidden="true" />
                          {prompt.views.toLocaleString()} 조회
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-green-600">
                            <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                            {prompt.recommendations.up}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                            {prompt.recommendations.down}
                          </span>
                        </div>
                      </div>
                      
                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-2">
                        {/* 추천/비추천 버튼 */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant={recommendations[prompt.id] === "up" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRecommendation(prompt.id, "up")}
                            className={`transition-colors duration-200 ${
                              recommendations[prompt.id] === "up"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "hover:bg-green-50 hover:border-green-300"
                            }`}
                            aria-label={`프롬프트 ${prompt.title} 추천`}
                          >
                            <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant={recommendations[prompt.id] === "down" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRecommendation(prompt.id, "down")}
                            className={`transition-colors duration-200 ${
                              recommendations[prompt.id] === "down"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "hover:bg-red-50 hover:border-red-300"
                            }`}
                            aria-label={`프롬프트 ${prompt.title} 비추천`}
                          >
                            <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                        
                        {/* 상세 보기 버튼 */}
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                          onClick={() => handleViewPrompt(prompt.id)}
                          aria-label={`프롬프트 ${prompt.title} 상세 보기`}
                        >
                          프롬프트 보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 카테고리별 탭 */}
          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">인기 카테고리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card 
                  key={category.name} 
                  className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleCategoryClick(category.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCategoryClick(category.name)
                    }
                  }}
                  aria-label={`${category.name} 카테고리 보기`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl" aria-hidden="true">{category.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-gray-600">{category.count}개의 프롬프트</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 업데이트 예고 */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
            <Fire className="w-4 h-4" aria-hidden="true" />
            실시간 트렌딩 업데이트 기능이 곧 추가됩니다!
          </div>
        </footer>
      </main>

      <Footer />
    </div>
  )
}
