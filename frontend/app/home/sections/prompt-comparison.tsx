"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowRight, Zap, Target, AlertTriangle } from "lucide-react"

/**
 * 프롬프트 비교 데이터 타입 정의
 */
interface PromptComparisonData {
  bad: {
    title: string
    prompt: string
    issues: string[]
    response: string
    tokens: number
    satisfaction: number
    accuracy: number
  }
  good: {
    title: string
    prompt: string
    benefits: string[]
    response: string
    tokens: number
    satisfaction: number
    accuracy: number
  }
}

/**
 * 프롬프트 비교 데이터
 */
const COMPARISON_DATA: PromptComparisonData = {
  bad: {
    title: "일반적인 프롬프트",
    prompt: "파이썬 코드 써줘",
    issues: ["목적 불명확", "요구사항 부족", "맥락 정보 없음"],
    response: "어떤 파이썬 코드를 원하시나요? 더 구체적으로 말씀해주세요.",
    tokens: 45,
    satisfaction: 2.1,
    accuracy: 15,
  },
  good: {
    title: "최적화된 프롬프트",
    prompt:
      "웹 스크래핑을 위한 파이썬 코드를 작성해주세요. BeautifulSoup을 사용하여 뉴스 사이트에서 제목과 링크를 추출하고, CSV 파일로 저장하는 기능을 포함해주세요. 에러 처리와 주석도 상세히 작성해주세요.",
    benefits: ["명확한 목적", "구체적 요구사항", "기술 스택 명시", "결과물 형태 지정"],
    response: `import requests
from bs4 import BeautifulSoup
import csv
import time

def scrape_news(url, output_file):
    """
    뉴스 사이트에서 제목과 링크를 스크래핑하여 CSV로 저장
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0...'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        articles = soup.find_all('article')
        
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['제목', '링크'])
            
            for article in articles:
                title = article.find('h2').get_text(strip=True)
                link = article.find('a')['href']
                writer.writerow([title, link])
                
    except Exception as e:
        print(f'오류 발생: {e}')`,
    tokens: 156,
    satisfaction: 4.8,
    accuracy: 94,
  },
}

/**
 * 개선 효과 계산 함수
 */
const calculateImprovement = (good: number, bad: number): number => {
  return Math.round(((good - bad) / bad) * 100)
}

/**
 * 프롬프트 품질 비교 섹션 컴포넌트
 * 
 * 기능:
 * - 좋은 프롬프트 vs 나쁜 프롬프트 비교
 * - 시각적 메트릭 표시
 * - 개선 효과 통계
 * - 반응형 디자인 지원
 * - 접근성 고려
 */
export function PromptComparison() {
  // 상태 관리 (추후 확장 가능)
  const [selectedTab, setSelectedTab] = useState<"bad" | "good">("bad")

  return (
    <section 
      className="w-full max-w-7xl mx-auto p-4 sm:p-6"
      aria-labelledby="comparison-section-title"
    >
      {/* 섹션 헤더 */}
      <header className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target 
            className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 hidden sm:block" 
            aria-hidden="true"
          />
          <h2 
            id="comparison-section-title"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-wrap-balance"
          >
            프롬프트 품질이 결과를&nbsp;결정합니다
          </h2>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed text-wrap-pretty">
          같은 질문이라도 어떻게 물어보느냐에&nbsp;따라{" "}
          <span className="block sm:inline">완전히 다른 답변을 받을 수&nbsp;있습니다</span>
        </p>
      </header>

      {/* 비교 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* 나쁜 예시 */}
        <Card 
          className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow duration-200"
          role="article"
          aria-labelledby="bad-example-title"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
              <CardTitle 
                id="bad-example-title"
                className="text-red-800 text-lg sm:text-xl"
              >
                {COMPARISON_DATA.bad.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 프롬프트 */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-red-200">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">프롬프트</h4>
              <p className="text-sm sm:text-base text-gray-700 break-words">
                {COMPARISON_DATA.bad.prompt}
              </p>
            </div>

            {/* 문제점 */}
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                문제점
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {COMPARISON_DATA.bad.issues.map((issue, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>

            {/* AI 응답 */}
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">AI 응답</h4>
              <p className="text-xs sm:text-sm text-gray-600 italic break-words">
                {COMPARISON_DATA.bad.response}
              </p>
            </div>

            {/* 메트릭 */}
            <div 
              className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-red-200"
              role="group"
              aria-label="나쁜 프롬프트 성능 지표"
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">
                  {COMPARISON_DATA.bad.tokens}
                </div>
                <div className="text-xs text-gray-600">토큰 사용</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">
                  {COMPARISON_DATA.bad.satisfaction}
                </div>
                <div className="text-xs text-gray-600">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">
                  {COMPARISON_DATA.bad.accuracy}%
                </div>
                <div className="text-xs text-gray-600">정확도</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 좋은 예시 */}
        <Card 
          className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow duration-200"
          role="article"
          aria-labelledby="good-example-title"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
              <CardTitle 
                id="good-example-title"
                className="text-green-800 text-lg sm:text-xl"
              >
                {COMPARISON_DATA.good.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 프롬프트 */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">프롬프트</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">
                {COMPARISON_DATA.good.prompt}
              </p>
            </div>

            {/* 개선점 */}
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                개선점
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {COMPARISON_DATA.good.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>

            {/* AI 응답 */}
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">AI 응답</h4>
              <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto break-words">
                {COMPARISON_DATA.good.response.length > 200
                  ? `${COMPARISON_DATA.good.response.substring(0, 200)}...`
                  : COMPARISON_DATA.good.response}
              </pre>
              {COMPARISON_DATA.good.response.length > 200 && (
                <Button variant="link" className="p-0 h-auto text-green-600 text-xs mt-2">
                  전체 코드 보기
                </Button>
              )}
            </div>

            {/* 메트릭 */}
            <div 
              className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-green-200"
              role="group"
              aria-label="좋은 프롬프트 성능 지표"
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {COMPARISON_DATA.good.tokens}
                </div>
                <div className="text-xs text-gray-600">토큰 사용</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {COMPARISON_DATA.good.satisfaction}
                </div>
                <div className="text-xs text-gray-600">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {COMPARISON_DATA.good.accuracy}%
                </div>
                <div className="text-xs text-gray-600">정확도</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 개선 효과 요약 */}
      <div 
        className="text-center p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        role="region"
        aria-labelledby="impact-summary-title"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" aria-hidden="true" />
          <h3 
            id="impact-summary-title"
            className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900"
          >
            프롬프트 최적화로 얻는 효과
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
              {calculateImprovement(COMPARISON_DATA.good.tokens, COMPARISON_DATA.bad.tokens)}%
            </div>
            <div className="text-sm text-gray-600">토큰 효율성 증가</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
              {calculateImprovement(COMPARISON_DATA.good.satisfaction, COMPARISON_DATA.bad.satisfaction)}%
            </div>
            <div className="text-sm text-gray-600">만족도 향상</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
              {calculateImprovement(COMPARISON_DATA.good.accuracy, COMPARISON_DATA.bad.accuracy)}%
            </div>
            <div className="text-sm text-gray-600">정확도 개선</div>
          </div>
        </div>
      </div>
    </section>
  )
}
