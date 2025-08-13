/**
 * HeroSection 컴포넌트
 *
 * 홈페이지의 메인 히어로 섹션을 표시합니다.
 */

'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, FileText } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted?: () => void
  onLearnMore?: () => void
}

export function HeroSection({ onGetStarted, onLearnMore }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto text-center">
          {/* 메인 제목 */}
          {/* 한 줄 버전 (lg 이상) */}
          <h1 className="mb-6 hidden text-4xl font-bold leading-tight text-gray-900 md:text-6xl lg:block">
            AI 프롬프트의{' '}
            <span
              className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              style={{ fontSize: 'inherit' }}>
              진실된 리뷰
            </span>
            를 만나보세요
          </h1>

          {/* 두 줄 버전 (lg 미만) */}
          <h1 className="mb-6 block text-4xl font-bold leading-tight text-gray-900 md:text-6xl lg:hidden">
            AI 프롬프트의
            <br />
            <span
              className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              style={{ fontSize: 'inherit' }}>
              진실된 리뷰
            </span>
            를 만나보세요
          </h1>

          {/* 서브 타이틀 */}
          {/* 한 줄 버전 (lg 이상) */}
          <p className="mb-8 hidden text-xl text-gray-600 lg:block">
            실제 사용자들의 경험을 바탕으로 한 신뢰할 수 있는 프롬프트 리뷰 플랫폼
          </p>

          {/* 두 줄 버전 (lg 미만) */}
          <p className="mb-8 block text-gray-600 lg:hidden">
            실제 사용자들의 경험을 바탕으로 한
            <br />
            신뢰할 수 있는 프롬프트 리뷰 플랫폼
          </p>

          {/* 통계 카드들 */}
          <div className="mb-10 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">4.8/5</span>
              <span>평균 평점</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">1,234+</span>
              <span>활성 사용자</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="font-semibold">5,678+</span>
              <span>검증된 리뷰</span>
            </div>
          </div>

          {/* CTA 버튼들 */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={onGetStarted}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl">
              시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={onLearnMore}
              className="rounded-xl border-2 border-gray-300 px-8 py-3 text-lg font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50">
              더 알아보기
            </Button>
          </div>
        </div>
      </div>

      {/* 배경 장식 요소들 */}
      <div className="absolute left-10 top-10 h-20 w-20 animate-pulse rounded-full bg-blue-200 opacity-20"></div>
      <div className="absolute right-20 top-20 h-16 w-16 animate-pulse rounded-full bg-purple-200 opacity-20 delay-1000"></div>
      <div className="delay-2000 absolute bottom-20 left-20 h-12 w-12 animate-pulse rounded-full bg-pink-200 opacity-20"></div>
    </section>
  )
}
