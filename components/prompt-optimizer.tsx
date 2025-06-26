"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Target,
  RefreshCw,
  Copy,
} from "lucide-react"

const samplePrompts = ["블로그 글 써줘", "파이썬 코드 만들어줘", "마케팅 전략 알려줘", "영어 번역해줘"]

const optimizationSuggestions = {
  "블로그 글 써줘": {
    issues: ["주제 불명확", "타겟 독자 미지정", "글 형식 불분명", "분량 미지정"],
    improved:
      "IT 업계 종사자를 대상으로 한 '2024년 AI 트렌드' 블로그 글을 작성해주세요. 구성: 1) 서론 2) 주요 트렌드 3가지 3) 실무 적�� 방안 4) 결론. 분량: 1500자 내외, 톤앤매너: 전문적이면서 이해하기 쉽게",
    response:
      "# 2024년 AI 트렌드: IT 전문가가 알아야 할 핵심 변화\n\n## 서론\n2024년 AI 기술은 단순한 도구를 넘어 비즈니스 혁신의 핵심 동력으로 자리잡고 있습니다...\n\n## 주요 트렌드\n### 1. 생성형 AI의 기업 도입 가속화\n### 2. 멀티모달 AI의 실용화\n### 3. AI 거버넌스 체계 구축\n\n## 실무 적용 방안\n...",
    accuracy: 92,
  },
  "파이썬 코드 만들어줘": {
    issues: ["기능 불명확", "요구사항 부족", "사용 환경 미지정", "예외처리 고려 없음"],
    improved:
      "웹 스크래핑을 위한 파이썬 코드를 작성해주세요. 요구사항: 1) requests, BeautifulSoup 사용 2) 뉴스 사이트에서 제목과 링크 추출 3) CSV 파일로 저장 4) 예외처리 포함 5) 주석 상세히 작성",
    response:
      "```python\nimport requests\nfrom bs4 import BeautifulSoup\nimport csv\nimport time\n\ndef scrape_news(url, output_file):\n    \"\"\"\n    뉴스 사이트에서 제목과 링크를 스크래핑하여 CSV로 저장\n    \"\"\"\n    try:\n        headers = {'User-Agent': 'Mozilla/5.0...'}\n        response = requests.get(url, headers=headers)\n        response.raise_for_status()\n        \n        soup = BeautifulSoup(response.content, 'html.parser')\n        articles = soup.find_all('article')\n        \n        with open(output_file, 'w', newline='', encoding='utf-8') as file:\n            writer = csv.writer(file)\n            writer.writerow(['제목', '링크'])\n            \n            for article in articles:\n                title = article.find('h2').get_text(strip=True)\n                link = article.find('a')['href']\n                writer.writerow([title, link])\n                \n    except Exception as e:\n        print(f'오류 발생: {e}')\n```",
    accuracy: 95,
  },
  "마케팅 전략 알려줘": {
    issues: ["업종 불명확", "예산 미지정", "타겟 고객 불분명", "목표 설정 없음"],
    improved:
      "스타트업 B2B SaaS 제품(월 구독료 50만원)의 마케팅 전략을 수립해주세요. 타겟: 중소기업 IT 담당자, 예산: 월 500만원, 목표: 3개월 내 MQL 100개 확보. 채널별 전략과 KPI 포함하여 제시해주세요.",
    response:
      "# B2B SaaS 마케팅 전략\n\n## 타겟 페르소나\n- 중소기업 IT 담당자 (30-45세)\n- 업무 효율화 솔루션 관심\n- 예산 결정권 보유\n\n## 채널별 전략\n### 1. 콘텐츠 마케팅 (예산 40%)\n- IT 업계 블로그 운영\n- 백서/가이드 제작\n- 웨비나 개최\n\n### 2. 디지털 광고 (예산 35%)\n- Google Ads (검색광고)\n- LinkedIn 타겟팅\n- 리타겟팅 캠페인\n\n### 3. 파트너십 (예산 25%)\n- IT 커뮤니티 협력\n- 인플루언서 마케팅\n\n## KPI\n- MQL: 월 33개 (3개월 100개)\n- CAC: 150만원 이하\n- 전환율: 5% 이상",
    accuracy: 88,
  },
  "영어 번역해줘": {
    issues: ["원문 미제공", "번역 방향 불명확", "용도 미지정", "톤앤매너 불분명"],
    improved:
      "다음 한국어 비즈니스 이메일을 영어로 번역해주세요. 용도: 해외 클라이언트 대상 공식 이메일, 톤앤매너: 정중하고 전문적, 추가 요청: 문화적 차이를 고려한 표현 사용\n\n[원문]\n안녕하세요. 저희 회사의 새로운 제품에 대해 소개드리고 싶어 연락드렸습니다...",
    response:
      "Dear [Client Name],\n\nI hope this email finds you well. I am reaching out to introduce our company's innovative new product that I believe would be of great interest to your organization.\n\n[Professional translation continues with appropriate business terminology and cultural considerations]\n\nWe would be delighted to schedule a brief call at your convenience to discuss how this solution could benefit your business operations.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]",
    accuracy: 94,
  },
}

export function PromptOptimizer() {
  const [userPrompt, setUserPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!userPrompt.trim()) return

    setIsAnalyzing(true)
    setShowResults(false)

    // 시뮬레이션을 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 가장 유사한 샘플 찾기 또는 기본 분석 제공
    const analysis = optimizationSuggestions[userPrompt as keyof typeof optimizationSuggestions] || {
      issues: ["구체성 부족", "맥락 정보 부족", "원하는 결과 형식 불분명"],
      improved: `${userPrompt}에 대해 더 구체적으로 작성해보세요. 목적, 대상, 형식, 제약조건을 명확히 지정하면 더 나은 결과를 얻을 수 있습니다.`,
      response: "개선된 프롬프트를 사용하면 더 정확하고 유용한 답변을 받을 수 있습니다.",
      accuracy: 75,
    }

    setCurrentAnalysis(analysis)
    setIsAnalyzing(false)
    setShowResults(true)
  }

  const handleSamplePrompt = (prompt: string) => {
    setUserPrompt(prompt)
    setShowResults(false)
  }

  const handleReset = () => {
    setUserPrompt("")
    setShowResults(false)
    setCurrentAnalysis(null)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-8 h-8 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-900">프롬프트 최적화 체험</h2>
        </div>
        <p className="text-lg text-gray-600">직접 프롬프트를 입력하고 AI가 제안하는 개선안을 확인해보세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              프롬프트 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Prompts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">샘플 프롬프트</label>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSamplePrompt(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">당신의 프롬프트를 입력하세요</label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="예: 블로그 글 써줘"
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!userPrompt.trim() || isAnalyzing}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    프롬프트 분석하기
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showResults ? (
              <div className="text-center py-12 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>프롬프트를 입력하고 분석 버튼을 눌러보세요</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Issues */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    발견된 문제점
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis?.issues.map((issue: string, index: number) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Accuracy Score */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">현재 프롬프트 점수</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          currentAnalysis?.accuracy >= 80
                            ? "bg-green-500"
                            : currentAnalysis?.accuracy >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${currentAnalysis?.accuracy}%` }}
                      />
                    </div>
                    <span className="font-semibold text-lg">{currentAnalysis?.accuracy}점</span>
                  </div>
                </div>

                {/* Improved Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      개선된 프롬프트
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(currentAnalysis?.improved)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      복사
                    </Button>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-800 leading-relaxed">{currentAnalysis?.improved}</p>
                  </div>
                </div>

                {/* Expected Response */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">예상 응답 결과</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {currentAnalysis?.response}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleCopy(currentAnalysis?.improved)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    개선된 프롬프트 사용하기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          프롬프트 최적화 핵심 원칙
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="font-medium mb-2 text-purple-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              명확한 목적
            </div>
            <p className="text-gray-600">무엇을 원하는지 구체적으로 명시</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="font-medium mb-2 text-purple-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              상세한 조건
            </div>
            <p className="text-gray-600">형식, 길이, 톤앤매너 등 세부 요구사항</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="font-medium mb-2 text-purple-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              맥락 제공
            </div>
            <p className="text-gray-600">배경 정보와 사용 목적 설명</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="font-medium mb-2 text-purple-800 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              예시 활용
            </div>
            <p className="text-gray-600">원하는 결과의 샘플 제공</p>
          </div>
        </div>
      </div>
    </div>
  )
}
