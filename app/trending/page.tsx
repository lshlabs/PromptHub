"use client"

import { useState } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Star, Eye, FlameIcon as Fire, Award, Zap, ThumbsUp, ThumbsDown } from "lucide-react"

export default function TrendingPage() {
  // State for recommendations
  const [recommendations, setRecommendations] = useState<Record<number, "up" | "down" | null>>({})

  const handleRecommendation = (promptId: number, type: "up" | "down") => {
    setRecommendations((prev) => ({
      ...prev,
      [promptId]: prev[promptId] === type ? null : type,
    }))
  }

  // Mock trending data
  const trendingPrompts = [
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
  ]

  const categories = [
    { name: "개발", count: 156, icon: "💻" },
    { name: "마케팅", count: 89, icon: "📈" },
    { name: "교육", count: 67, icon: "📚" },
    { name: "분석", count: 45, icon: "📊" },
    { name: "창작", count: 78, icon: "✨" },
    { name: "비즈니스", count: 92, icon: "💼" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">트렌딩</h1>
              <p className="text-gray-600">지금 가장 인기 있는 프롬프트를 확인하세요</p>
            </div>
            <Badge className="bg-red-500 text-white animate-pulse">
              <Fire className="w-3 h-3 mr-1" />
              HOT
            </Badge>
          </div>

          {/* Trending Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Fire className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">127</p>
                    <p className="text-sm text-gray-600">이번 주 인기 프롬프트</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">4.8</p>
                    <p className="text-sm text-gray-600">평균 평점</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">+18%</p>
                    <p className="text-sm text-gray-600">이번 주 성장률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trending Content */}
        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="prompts">인기 프롬프트</TabsTrigger>
            <TabsTrigger value="categories">카테고리별</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">이번 주 인기 프롬프트</h2>
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

            {trendingPrompts.map((prompt, index) => (
              <Card
                key={prompt.id}
                className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{prompt.title}</CardTitle>
                        <CardDescription className="mb-2">{prompt.description}</CardDescription>
                        <div className="flex items-center gap-3 text-sm">
                          <span>by {prompt.author}</span>
                          <Badge variant="outline">{prompt.model}</Badge>
                          <Badge variant="secondary">{prompt.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <TrendingUp className="w-4 h-4" />
                          {prompt.change}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        {prompt.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {prompt.views.toLocaleString()} 조회
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-4 h-4" />
                          {prompt.recommendations.up}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="w-4 h-4" />
                          {prompt.recommendations.down}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant={recommendations[prompt.id] === "up" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRecommendation(prompt.id, "up")}
                          className={`${
                            recommendations[prompt.id] === "up"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "hover:bg-green-50 hover:border-green-300"
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={recommendations[prompt.id] === "down" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRecommendation(prompt.id, "down")}
                          className={`${
                            recommendations[prompt.id] === "down"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "hover:bg-red-50 hover:border-red-300"
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        프롬프트 보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">인기 카테고리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{category.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <p className="text-gray-600">{category.count}개의 프롬프트</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
            <Fire className="w-4 h-4" />
            실시간 트렌딩 업데이트 기능이 곧 추가됩니다!
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
