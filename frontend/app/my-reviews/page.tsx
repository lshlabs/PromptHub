"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Star, TrendingUp, Eye, ThumbsUp, ThumbsDown, Lock, Plus } from "lucide-react"
import AuthForm from "@/components/auth/auth-form"

export default function MyReviewsPage() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 컴포넌트 마운트 시 인증 상태 확인
    const token = localStorage.getItem("authToken")
    setIsLoggedIn(!!token)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  // Mock data for demonstration
  const mockReviews = [
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
  ]

  // 로딩 중일 때 표시할 컴포넌트 추가
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

  // If not logged in, show login requirement
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Login Required Section */}
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
              <p className="text-gray-600 mb-8">
                내 리뷰 기능을 사용하려면 먼저 로그인해주세요.
                <br />
                로그인 후 나만의 프롬프트 리뷰를 관리할 수 있습니다.
              </p>

              {/* Login Form */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <AuthForm defaultTab="login" onSuccess={handleLoginSuccess} />
              </div>

              {/* Features Preview */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">리뷰 관리</h3>
                  <p className="text-sm text-gray-600">나의 프롬프트 리뷰를 작성하고 관리하세요</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">성과 추적</h3>
                  <p className="text-sm text-gray-600">리뷰 조회수와 추천 수를 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // If logged in, show the actual reviews page
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">내 리뷰</h1>
              <p className="text-gray-600">나의 프롬프트 리뷰 기록을 관리하세요</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-600">총 리뷰</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">390</p>
                    <p className="text-sm text-gray-600">총 조회수</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">4.5</p>
                    <p className="text-sm text-gray-600">평균 평점</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">30</p>
                    <p className="text-sm text-gray-600">총 추천</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">나의 프롬프트 리뷰</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />새 리뷰 작성
            </Button>
          </div>

          {mockReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{review.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {review.date}
                      </span>
                      <Badge variant="outline">{review.model}</Badge>
                      <Badge variant={review.status === "published" ? "default" : "secondary"}>
                        {review.status === "published" ? "게시됨" : "임시저장"}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{review.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {review.views} 조회
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-green-600">
                        <ThumbsUp className="w-4 h-4" />
                        {review.recommendations.up}
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <ThumbsDown className="w-4 h-4" />
                        {review.recommendations.down}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      편집
                    </Button>
                    <Button variant="outline" size="sm">
                      보기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" />더 많은 기능이 곧 추가됩니다!
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
