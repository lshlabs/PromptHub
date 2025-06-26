"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowRight, Zap, Target, AlertTriangle } from "lucide-react"

const comparisonData = {
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

export function PromptComparison() {
  const [selectedTab, setSelectedTab] = useState<"bad" | "good">("bad")

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h2 className="font-bold text-gray-900">
            {/* 모바일 */}
            <span className="block sm:hidden text-2xl">
              프롬프트 품질이
              <br />
              결과를 결정합니다
            </span>

            {/* 태블릿 */}
            <span className="hidden sm:block md:hidden text-3xl">프롬프트 품질이 결과를 결정합니다</span>

            {/* 데스크톱 */}
            <span className="hidden md:block text-4xl">프롬프트 품질이 결과를 결정합니다</span>
          </h2>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {/* 모바일 */}
          <span className="block sm:hidden text-sm">
            같은 질문이라도 어떻게 물어보느냐에 따라
            <br />
            완전히 다른 답변을 받을 수 있습니다
          </span>

          {/* 태블릿 이상 */}
          <span className="hidden sm:block text-base sm:text-lg">
            같은 질문이라도 어떻게 물어보느냐에 따라 완전히 다른 답변을 받을 수 있습니다
          </span>
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* Bad Example */}
        <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <CardTitle className="text-red-800 text-lg sm:text-xl">{comparisonData.bad.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">프롬프트</h4>
              <p className="text-gray-700 text-sm sm:text-base break-words">{comparisonData.bad.prompt}</p>
            </div>

            {/* Issues */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                문제점
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {comparisonData.bad.issues.map((issue, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Response */}
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">AI 응답</h4>
              <p className="text-gray-600 text-xs sm:text-sm italic break-words">{comparisonData.bad.response}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-red-200">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">{comparisonData.bad.tokens}</div>
                <div className="text-xs text-gray-600">토큰 사용</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">{comparisonData.bad.satisfaction}</div>
                <div className="text-xs text-gray-600">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-red-600">{comparisonData.bad.accuracy}%</div>
                <div className="text-xs text-gray-600">정확도</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Good Example */}
        <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <CardTitle className="text-green-800 text-lg sm:text-xl">{comparisonData.good.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">프롬프트</h4>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">
                {comparisonData.good.prompt}
              </p>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                개선점
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {comparisonData.good.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Response */}
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">AI 응답</h4>
              <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto break-words">
                {comparisonData.good.response.length > 200
                  ? `${comparisonData.good.response.substring(0, 200)}...`
                  : comparisonData.good.response}
              </pre>
              {comparisonData.good.response.length > 200 && (
                <Button variant="link" className="p-0 h-auto text-green-600 text-xs mt-2">
                  전체 코드 보기
                </Button>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-green-200">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">{comparisonData.good.tokens}</div>
                <div className="text-xs text-gray-600">토큰 사용</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">{comparisonData.good.satisfaction}</div>
                <div className="text-xs text-gray-600">만족도</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">{comparisonData.good.accuracy}%</div>
                <div className="text-xs text-gray-600">정확도</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <div className="text-center p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <h3 className="font-semibold text-gray-900">
            {/* 모바일 */}
            <span className="block sm:hidden text-lg">프롬프트 최적화 효과</span>

            {/* 태블릿 이상 */}
            <span className="hidden sm:block text-xl sm:text-2xl">프롬프트 최적화로 얻는 효과</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">247%</div>
            <div className="text-sm text-gray-600">토큰 효율성 증가</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">129%</div>
            <div className="text-sm text-gray-600">만족도 향상</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">526%</div>
            <div className="text-sm text-gray-600">정확도 개선</div>
          </div>
        </div>

        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3">
          <span className="text-sm sm:text-base">프롬프트 최적화 체험하기</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
