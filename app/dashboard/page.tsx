/**
 * 대시보드 페이지
 */
"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, TrendingUp, Users, Star } from "lucide-react"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthContext()
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalViews: 0,
    followers: 0,
  })

  useEffect(() => {
    if (isAuthenticated) {
      // 실제 API에서 통계 데이터를 가져오는 로직
      setStats({
        totalReviews: 12,
        avgRating: 4.5,
        totalViews: 1234,
        followers: 56,
      })
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <Button asChild>
            <a href="/login">로그인하기</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          안녕하세요, {user?.first_name || user?.username}님! 👋
        </h1>
        <p className="text-gray-600">오늘도 멋진 프롬프트를 만들어보세요.</p>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 리뷰</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">+180 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">팔로워</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followers}</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>새 리뷰 작성</CardTitle>
            <CardDescription>새로운 프롬프트 리뷰를 작성하고 커뮤니티와 공유하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">리뷰 작성하기</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>트렌딩 프롬프트</CardTitle>
            <CardDescription>지금 가장 인기 있는 프롬프트들을 확인해보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              트렌딩 보기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
