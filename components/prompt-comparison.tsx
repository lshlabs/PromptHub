"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const promptExamples = [
  {
    id: 1,
    title: "마케팅 카피 작성",
    before: {
      prompt: "스마트폰 광고 문구 써줘",
      response: "최신 스마트폰! 좋은 성능과 카메라로 일상을 더 편리하게 만들어보세요. 지금 구매하면 할인 혜택까지!",
      issues: ["모호한 요청", "구체적 정보 부족", "차별화 포인트 없음"],
      accuracy: 60,
      hallucination: true,
    },
    after: {
      prompt:
        "20-30대 직장인을 타겟으로 한 프리미엄 스마트폰 광고 카피를 작성해주세요. 제품 특징: 108MP 카메라, 5000mAh 배터리, 5G 지원. 톤앤매너: 전문적이면서 친근함. 길이: 50자 이내",
      response:
        "📸 108MP로 담는 일상의 순간들\n⚡ 하루 종일 지속되는 5000mAh 파워\n🚀 5G로 더 빠른 업무 처리\n당신의 성공을 함께하는 프리미엄 파트너",
      issues: [],
      accuracy: 95,
      hallucination: false,
    },
  },
  {
    id: 2,
    title: "데이터 분석 요청",
    before: {
      prompt: "매출 데이터 분석해줘",
      response: "매출이 증가했습니다. 작년 대비 20% 상승했고, 주요 원인은 신제품 출시와 마케팅 효과로 보입니다.",
      issues: ["데이터 없이 추측", "근거 부족", "할루시네이션 발생"],
      accuracy: 30,
      hallucination: true,
    },
    after: {
      prompt:
        "첨부된 2024년 분기별 매출 데이터를 분석해주세요. 분석 항목: 1) 전년 동기 대비 증감률, 2) 분기별 트렌드, 3) 주요 증감 요인 추정, 4) 향후 전망. 결과는 표와 그래프로 시각화하여 제시해주세요.",
      response:
        "[데이터 기반 분석]\n• Q1-Q4 매출 추이 분석 완료\n• 전년 대비 12% 증가 (실제 데이터 기준)\n• 계절성 패턴 및 주요 변동 요인 식별\n• 시각화 차트 3개 생성",
      issues: [],
      accuracy: 92,
      hallucination: false,
    },
  },
  {
    id: 3,
    title: "코드 리뷰 요청",
    before: {
      prompt: "이 코드 좀 봐줘",
      response: "코드가 괜찮아 보입니다. 몇 가지 개선점이 있을 수 있지만 전반적으로 잘 작성되었습니다.",
      issues: ["코드 미제공", "구체적 피드백 없음", "실질적 도움 부족"],
      accuracy: 25,
      hallucination: true,
    },
    after: {
      prompt:
        "다음 React 컴포넌트 코드를 리뷰해주세요. 검토 항목: 1) 성능 최적화, 2) 접근성, 3) 코드 가독성, 4) 보안 이슈. 개선 제안과 함께 수정된 코드도 제공해주세요. [코드 첨부]",
      response:
        "✅ 성능: useMemo, useCallback 최적화 필요\n♿ 접근성: aria-label 추가 권장\n📖 가독성: 컴포넌트 분리 제안\n🔒 보안: XSS 방지 처리 완료\n\n[개선된 코드 제공]",
      issues: [],
      accuracy: 88,
      hallucination: false,
    },
  },
]

export function PromptComparison() {
  const [selectedExample, setSelectedExample] = useState(0)
  const [showAfter, setShowAfter] = useState(false)

  const currentExample = promptExamples[selectedExample]
  const currentData = showAfter ? currentExample.after : currentExample.before

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">프롬프트 개선 예시</h2>
        </div>
        <p className="text-gray-600">좋은 프롬프트가 얼마나 더 나은 답을 유도하는지 확인해보세요</p>
      </div>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {promptExamples.map((example, index) => (
          <Button
            key={example.id}
            variant={selectedExample === index ? "default" : "outline"}
            onClick={() => {
              setSelectedExample(index)
              setShowAfter(false) // 새로운 예시 선택 시 Before 상태로 리셋
            }}
            className="text-sm"
          >
            {example.title}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`font-medium ${!showAfter ? "text-red-600" : "text-gray-400"}`}>Before</span>
        <Switch
          checked={showAfter}
          onCheckedChange={setShowAfter}
          className="data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600 data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600 scale-125"
        />
        <span className={`font-medium ${showAfter ? "text-green-600" : "text-gray-400"}`}>After</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className={`transition-colors duration-300 ${showAfter ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {showAfter ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {showAfter ? "개선된 프롬프트" : "기존 프롬프트"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{currentData.prompt}</p>
            </div>

            {currentData.issues.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  문제점
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentData.issues.map((issue, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {currentData.issues.length === 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">문제점 없음</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`transition-colors duration-300 ${showAfter ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {showAfter ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              LLM 응답 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{currentData.response}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">정확도</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        currentData.accuracy >= 80
                          ? "bg-green-500"
                          : currentData.accuracy >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${currentData.accuracy}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{currentData.accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">할루시네이션</span>
                <Badge variant={currentData.hallucination ? "destructive" : "secondary"}>
                  {currentData.hallucination ? "발생" : "없음"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!showAfter && (
        <div className="hidden lg:flex justify-center mt-6">
          <Button
            onClick={() => setShowAfter(true)}
            className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white"
          >
            개선 결과 보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          프롬프트 개선 팁
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <h4 className="font-medium mb-2 text-blue-800">구체적으로 작성하세요</h4>
            <p>목적, 대상, 형식, 길이 등을 명확히 지정</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <h4 className="font-medium mb-2 text-blue-800">맥락을 제공하세요</h4>
            <p>배경 정보와 제약 조건을 함께 제시</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <h4 className="font-medium mb-2 text-blue-800">예시를 활용하세요</h4>
            <p>원하는 결과의 샘플이나 형식 제공</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <h4 className="font-medium mb-2 text-blue-800">단계별로 요청하세요</h4>
            <p>복잡한 작업은 여러 단계로 나누어 진행</p>
          </div>
        </div>
      </div>
    </div>
  )
}
