/**
 * CommunityHeader 컴포넌트
 *
 * 커뮤니티 페이지의 헤더 섹션을 표시합니다.
 * 통계 카드들과 커뮤니티 소개 정보를 포함합니다.
 */

'use client'

import { Users, FileText, Star, MessageSquare, Clock } from 'lucide-react'

interface CommunityStats {
  activeUsers: number
  sharedPrompts: number
  averageSatisfaction: number
  weeklyAdded: number
}

interface CommunityHeaderProps {
  stats: CommunityStats
}

export function CommunityHeader({ stats }: CommunityHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 sm:h-10 sm:w-10">
            <MessageSquare className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <h1 className="text-gray-900">프롬프트 커뮤니티</h1>
        </div>
        <p className="mb-6 text-gray-600">
          전문가들의 검증된 프롬프트를 발견하고, <br className="block sm:hidden" />
          당신의 경험을 공유하세요
        </p>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h1 className="text-blue-700">{stats.activeUsers}</h1>
            </div>
            <p className="text-xs text-blue-600 sm:text-sm">이용자 수</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <div className="mb-2 flex items-center justify-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <h1 className="text-green-700">{stats.sharedPrompts}</h1>
            </div>
            <p className="text-xs text-green-600 sm:text-sm">공유된 프롬프트</p>
          </div>
          <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <h1 className="text-yellow-700">{stats.averageSatisfaction}</h1>
            </div>
            <p className="text-xs text-yellow-600 sm:text-sm">평균 만족도</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <h1 className="text-purple-700">{stats.weeklyAdded}</h1>
            </div>
            <p className="text-xs text-purple-600 sm:text-sm">이번 주 추가</p>
          </div>
        </div>
      </div>
    </div>
  )
}
