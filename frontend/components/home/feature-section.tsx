/**
 * FeatureSection 컴포넌트
 *
 * 홈페이지의 주요 기능 소개 섹션을 표시합니다.
 */

'use client'

import { Search, Shield, TrendingUp, Users, Star, Zap } from 'lucide-react'

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}

interface FeatureSectionProps {
  className?: string
}

export function FeatureSection({ className = '' }: FeatureSectionProps) {
  const features: Feature[] = [
    {
      icon: Search,
      title: '신뢰할 수 있는 리뷰',
      description: '실제 사용자들의 경험을 바탕으로 한 진정성 있는 프롬프트 리뷰를 제공합니다.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: '검증된 정보',
      description: '모든 리뷰는 커뮤니티 가이드라인을 통해 검증되어 신뢰할 수 있습니다.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: TrendingUp,
      title: '트렌딩 분석',
      description: '실시간으로 인기 있는 프롬프트와 트렌드를 파악할 수 있습니다.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      title: '활발한 커뮤니티',
      description: '다양한 사용자들과 프롬프트 경험을 공유하고 토론할 수 있습니다.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Star,
      title: '평점 시스템',
      description: '체계적인 평점 시스템으로 프롬프트의 품질을 객관적으로 평가합니다.',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Zap,
      title: '빠른 검색',
      description: '플랫폼, 카테고리, 평점별로 원하는 프롬프트를 빠르게 찾을 수 있습니다.',
      color: 'from-red-500 to-red-600',
    },
  ]

  return (
    <section className={`bg-white py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            왜 PromptHub를 선택해야 할까요?
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            AI 프롬프트의 진실된 리뷰를 통해 더 나은 AI 경험을 만들어보세요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div
                className={`h-12 w-12 bg-gradient-to-r ${feature.color} mb-4 flex items-center justify-center rounded-xl`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
