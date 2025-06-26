"use client"

import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chrome, Download, Star, Shield, Zap, Users, CheckCircle, Play } from "lucide-react"

export default function ExtensionPage() {
  const features = [
    {
      icon: Zap,
      title: "실시간 프롬프트 추천",
      description: "ChatGPT 사용 중 상황에 맞는 최적의 프롬프트를 자동으로 추천합니다.",
    },
    {
      icon: Star,
      title: "커뮤니티 검증 프롬프트",
      description: "PromptHub 커뮤니티에서 검증된 고품질 프롬프트만 제공합니다.",
    },
    {
      icon: Shield,
      title: "개인정보 보호",
      description: "모든 데이터는 로컬에서 처리되며, 개인정보는 수집하지 않습니다.",
    },
    {
      icon: Users,
      title: "사용자 맞춤형",
      description: "사용 패턴을 학습하여 개인화된 프롬프트를 추천합니다.",
    },
  ]

  const installSteps = [
    {
      step: 1,
      title: "Chrome 웹스토어 방문",
      description: "아래 버튼을 클릭하여 Chrome 웹스토어로 이동합니다.",
    },
    {
      step: 2,
      title: "확장프로그램 설치",
      description: "'Chrome에 추가' 버튼을 클릭하여 확장프로그램을 설치합니다.",
    },
    {
      step: 3,
      title: "권한 허용",
      description: "ChatGPT 사이트 접근 권한을 허용합니다.",
    },
    {
      step: 4,
      title: "설치 완료",
      description: "ChatGPT에서 바로 프롬프트 추천을 받아보세요!",
    },
  ]

  const stats = [
    { label: "활성 사용자", value: "12,000+", icon: Users },
    { label: "평균 평점", value: "4.8/5", icon: Star },
    { label: "프롬프트 DB", value: "5,000+", icon: Zap },
    { label: "다운로드", value: "25,000+", icon: Download },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Chrome className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">PromptHub Extension</h1>
              <p className="text-xl text-gray-600">ChatGPT를 위한 스마트 프롬프트 도우미</p>
            </div>
            <Badge className="bg-green-500 text-white animate-pulse">NEW</Badge>
          </div>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            ChatGPT 사용 중 실시간으로 최적의 프롬프트를 추천받고, 더 나은 AI 대화 경험을 만들어보세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              <Chrome className="w-5 h-5 mr-2" />
              Chrome에 추가하기
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3">
              <Play className="w-5 h-5 mr-2" />
              데모 영상 보기
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="text-center">
                <CardContent className="p-4">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="features" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">주요 기능</TabsTrigger>
            <TabsTrigger value="install">설치 가이드</TabsTrigger>
            <TabsTrigger value="demo">사용법</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">강력한 기능들</h2>
              <p className="text-gray-600">PromptHub Extension이 제공하는 핵심 기능들을 확인해보세요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="install" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">간단한 설치 과정</h2>
              <p className="text-gray-600">몇 번의 클릭만으로 PromptHub Extension을 설치할 수 있습니다</p>
            </div>

            <div className="space-y-6">
              {installSteps.map((step, index) => (
                <Card key={step.step} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Chrome className="w-5 h-5 mr-2" />
                지금 설치하기
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">사용법 데모</h2>
              <p className="text-gray-600">PromptHub Extension을 실제로 사용하는 방법을 확인해보세요</p>
            </div>

            {/* Demo Placeholder */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">데모 영상</h3>
                <p className="text-gray-600 mb-6">
                  실제 ChatGPT에서 PromptHub Extension이 어떻게 작동하는지 확인해보세요.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-4 h-4 mr-2" />
                  데모 영상 재생
                </Button>
              </CardContent>
            </Card>

            {/* Usage Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    사용 팁
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• ChatGPT 대화창에서 자동으로 프롬프트가 추천됩니다</li>
                    <li>• 추천된 프롬프트를 클릭하면 바로 적용됩니다</li>
                    <li>• 설정에서 추천 빈도를 조절할 수 있습니다</li>
                    <li>• 즐겨찾기 기능으로 자주 쓰는 프롬프트를 저장하세요</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    개인정보 보호
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 대화 내용은 서버로 전송되지 않습니다</li>
                    <li>• 모든 처리는 브라우저에서 로컬로 진행됩니다</li>
                    <li>• 개인 식별 정보는 수집하지 않습니다</li>
                    <li>• 언제든지 확장프로그램을 제거할 수 있습니다</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요!</h2>
          <p className="text-blue-100 mb-6">PromptHub Extension으로 더 스마트한 AI 대화를 경험해보세요.</p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <Chrome className="w-5 h-5 mr-2" />
            무료로 설치하기
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
