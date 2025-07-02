/**
 * 내 리뷰 페이지 컴포넌트
 * 
 * 사용자의 프롬프트 리뷰를 관리하는 개인 대시보드 페이지입니다.
 * 
 * 주요 기능:
 * - 로그인 상태 확인 및 인증 요구
 * - 사용자 리뷰 목록 표시
 * - 활동 통계 표시
 * - 새 리뷰 작성 기능
 * - 반응형 디자인 및 접근성 최적화
 * 
 * @returns JSX.Element 내 리뷰 페이지 컴포넌트
 */

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Metadata } from "next"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Star, TrendingUp, Eye, ThumbsUp, ThumbsDown, Lock, Plus } from "lucide-react"
import { CreateReviewDialog } from "@/components/community/create-post-dialog"
import AuthForm from "@/components/auth/auth-form"

// ========== 타입 정의 ==========

/**
 * 리뷰 정보 인터페이스
 */
interface Review {
  /** 리뷰 ID */
  id: number
  /** 리뷰 제목 */
  title: string
  /** AI 모델 */
  model: string
  /** 평점 */
  rating: number
  /** 작성일 */
  date: string
  /** 상태 (published | draft) */
  status: "published" | "draft"
  /** 조회수 */
  views: number
  /** 추천 정보 */
  recommendations: {
    up: number
    down: number
  }
}

/**
 * 통계 정보 인터페이스
 */
interface Statistics {
  /** 총 리뷰 수 */
  totalReviews: number
  /** 총 조회수 */
  totalViews: number
  /** 평균 평점 */
  avgRating: number
  /** 총 추천 수 */
  totalRecommendations: number
}

/**
 * 내 리뷰 페이지 컴포넌트 인터페이스
 */
interface MyReviewsPageProps {}

// ========== 메인 컴포넌트 ==========

/**
 * 내 리뷰 페이지 메인 컴포넌트
 * 
 * 사용자 인증 상태에 따라 로그인 폼 또는 리뷰 관리 대시보드를 표시합니다.
 * 로그인된 사용자에게는 리뷰 목록과 통계를 제공합니다.
 * 
 * @param props 컴포넌트 props
 * @returns 렌더링된 내 리뷰 페이지
 */
export default function MyReviewsPage({}: MyReviewsPageProps): JSX.Element {
  // ========== 상태 관리 ==========
  
  /**
   * 사용자 로그인 상태
   */
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  
  /**
   * 페이지 로딩 상태
   */
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // ========== 생명주기 관리 ==========
  
  /**
   * 컴포넌트 마운트 시 인증 상태 확인
   */
  useEffect(() => {
    const checkAuthStatus = (): void => {
      try {
        const token = localStorage.getItem("authToken")
        setIsLoggedIn(!!token)
      } catch (error) {
        console.error("인증 상태 확인 오류:", error)
        setIsLoggedIn(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // ========== 이벤트 핸들러 ==========
  
  /**
   * 로그인 성공 핸들러
   * AuthForm 컴포넌트에서 호출됨
   */
  const handleLoginSuccess = useCallback((): void => {
    setIsLoggedIn(true)
  }, [])

  /**
   * 새 리뷰 작성 다이얼로그 표시 상태
   */
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState<boolean>(false)

  /**
   * 새 리뷰 작성 버튼 클릭 핸들러
   */
  const handleCreateReview = useCallback((): void => {
    setIsCreateReviewOpen(true)
  }, [])

  /**
   * 새 리뷰 작성 다이얼로그 닫기 핸들러
   */
  const handleCreateReviewClose = useCallback((open: boolean): void => {
    setIsCreateReviewOpen(open)
  }, [])

  /**
   * 리뷰 편집 버튼 클릭 핸들러
   * 
   * @param reviewId 편집할 리뷰 ID
   */
  const handleEditReview = useCallback((reviewId: number): void => {
    // TODO: 리뷰 편집 페이지로 네비게이션
    console.log(`리뷰 ${reviewId} 편집`)
  }, [])

  /**
   * 리뷰 보기 버튼 클릭 핸들러
   * 
   * @param reviewId 보기할 리뷰 ID
   */
  const handleViewReview = useCallback((reviewId: number): void => {
    // TODO: 리뷰 상세 페이지로 네비게이션
    console.log(`리뷰 ${reviewId} 보기`)
  }, [])

  // ========== 정적 데이터 ==========
  
  /**
   * 모의 리뷰 데이터
   * 실제 환경에서는 API로부터 받아옴
   */
  const mockReviews = useMemo<Review[]>(() => [
    {
      id: 1,
      title: "ChatGPT 코딩 도우미 프롬프트",
      model: "GPT-4",
      rating: 4.5,
      date: "2024-06-20",
      status: "published",
      views: 234,
      recommendations: { up: 18, down: 2 },
    },
    {
      id: 2,
      title: "창의적 글쓰기 프롬프트",
      model: "Claude-3",
      rating: 4.8,
      date: "2024-06-18",
      status: "draft",
      views: 0,
      recommendations: { up: 0, down: 0 },
    },
    {
      id: 3,
      title: "데이터 분석 프롬프트",
      model: "GPT-4",
      rating: 4.2,
      date: "2024-06-15",
      status: "published",
      views: 156,
      recommendations: { up: 12, down: 1 },
    },
  ], [])

  /**
   * 통계 데이터 계산
   * 메모이제이션을 통한 성능 최적화
   */
  const statistics = useMemo<Statistics>(() => ({
    totalReviews: mockReviews.length,
    totalViews: mockReviews.reduce((sum, review) => sum + review.views, 0),
    avgRating: mockReviews.length > 0 
      ? Number((mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length).toFixed(1))
      : 0,
    totalRecommendations: mockReviews.reduce((sum, review) => sum + review.recommendations.up, 0),
  }), [mockReviews])

  // ========== 조건부 렌더링 - 로딩 상태 ==========
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // ========== 조건부 렌더링 - 로그인 필요 ==========
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
          role="main"
          aria-label="로그인 필요 페이지"
        >
          <div className="text-center">
            {/* 로그인 필요 섹션 */}
            <section className="max-w-md mx-auto" aria-labelledby="login-required-title">
              {/* 아이콘 및 제목 */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-white" aria-hidden="true" />
              </div>

              <h1 
                id="login-required-title"
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-wrap-balance"
              >
                로그인이 필요합니다
              </h1>
              <p className="text-gray-600 mb-8 text-wrap-pretty">
                내 리뷰 기능을 사용하려면 먼저 로그인해주세요.
                <br />
                로그인 후 나만의 프롬프트 리뷰를 관리할 수 있습니다.
              </p>

              {/* 로그인 폼 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
              </div>
            </section>

            {/* 기능 미리보기 */}
            <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6" aria-label="기능 미리보기">
              <Card className="text-center p-6 bg-white shadow-sm border hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">리뷰 관리</h3>
                <p className="text-sm text-gray-600 text-wrap-pretty">
                  나의 프롬프트 리뷰를 작성하고 관리하세요
                </p>
              </Card>

              <Card className="text-center p-6 bg-white shadow-sm border hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">성과 추적</h3>
                <p className="text-sm text-gray-600 text-wrap-pretty">
                  리뷰 조회수와 추천 수를 확인하세요
                </p>
              </Card>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // ========== 메인 렌더링 - 로그인된 사용자 ==========
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-label="내 리뷰 대시보드"
      >
        {/* 페이지 헤더 */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-wrap-balance">
                  내 리뷰
                </h1>
                <p className="text-gray-600 text-wrap-pretty">
                  나의 프롬프트 리뷰 기록을 관리하세요
                </p>
              </div>
            </div>
          </div>

          {/* 통계 카드들 */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="활동 통계">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.totalReviews}</p>
                    <p className="text-sm text-gray-600">총 리뷰</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.totalViews}</p>
                    <p className="text-sm text-gray-600">총 조회수</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.avgRating}</p>
                    <p className="text-sm text-gray-600">평균 평점</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.totalRecommendations}</p>
                    <p className="text-sm text-gray-600">총 추천</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </header>

        {/* 리뷰 목록 */}
        <section className="space-y-4" aria-label="나의 프롬프트 리뷰">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              나의 프롬프트 리뷰
            </h2>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleCreateReview}
              aria-label="새 프롬프트 리뷰 작성하기"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              새 리뷰 작성
            </Button>
          </div>

          {/* 리뷰 카드들 */}
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <Card 
                key={review.id} 
                className="hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-2 text-wrap-balance">
                        {review.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          {review.date}
                        </span>
                        <Badge variant="outline">{review.model}</Badge>
                        <Badge 
                          variant={review.status === "published" ? "default" : "secondary"}
                          className={review.status === "published" ? "bg-green-100 text-green-800" : ""}
                        >
                          {review.status === "published" ? "게시됨" : "임시저장"}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                      <span className="font-medium">{review.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* 통계 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        {review.views} 조회
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                          {review.recommendations.up}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="w-4 h-4" aria-hidden="true" />
                          {review.recommendations.down}
                        </span>
                      </div>
                    </div>
                    
                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditReview(review.id)}
                        className="transition-colors duration-200"
                        aria-label={`리뷰 ${review.title} 편집`}
                      >
                        편집
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewReview(review.id)}
                        className="transition-colors duration-200"
                        aria-label={`리뷰 ${review.title} 보기`}
                      >
                        보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 업데이트 예고 */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            더 많은 기능이 곧 추가됩니다!
          </div>
        </footer>

        {/* 새 리뷰 작성 다이얼로그 */}
        <CreateReviewDialog 
          open={isCreateReviewOpen} 
          onOpenChange={handleCreateReviewClose}
        />
      </main>

      <Footer />
    </div>
  )
}
