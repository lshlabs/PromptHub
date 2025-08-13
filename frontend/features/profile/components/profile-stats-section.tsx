/**
 * ProfileStatsSection 컴포넌트
 *
 * 프로필 페이지의 통계 섹션을 표시합니다.
 * 리뷰수, 좋아요, 북마크, 조회수를 카드 형태로 보여줍니다.
 */

'use client'

import { FileText, Heart, Bookmark, Eye } from 'lucide-react'

// TODO(데이터 연동): 상위 페이지(`app/profile/page.tsx`)에서
// `statsApi.getUserStats()` 응답(data)을 아래 필드로 매핑해 전달하세요.
// - postCount      ← data.posts_count
// - likeCount      ← data.total_likes
// - bookmarkCount  ← data.total_bookmarks
// - viewCount      ← data.total_views
// 참고: 실제 호출 및 상태 관리는 상위 페이지에서 수행 중입니다.

interface ProfileStats {
  postCount: number
  likeCount: number
  bookmarkCount: number
  viewCount: number
}

interface ProfileStatsSectionProps {
  stats: ProfileStats
}

export function ProfileStatsSection({ stats }: ProfileStatsSectionProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR')
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-gray-900">통계</h2>
      <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h1 className="text-blue-700">{formatNumber(stats.postCount)}</h1>
          </div>
          <p className="text-xs text-blue-600 sm:text-sm">작성 리뷰수</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-red-600" />
            <h1 className="text-red-700">{formatNumber(stats.likeCount)}</h1>
          </div>
          <p className="text-xs text-red-600 sm:text-sm">좋아요 수</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Bookmark className="h-4 w-4 text-green-600" />
            <h1 className="text-green-700">{formatNumber(stats.bookmarkCount)}</h1>
          </div>
          <p className="text-xs text-green-600 sm:text-sm">북마크 수</p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Eye className="h-4 w-4 text-purple-600" />
            <h1 className="text-purple-700">{formatNumber(stats.viewCount)}</h1>
          </div>
          <p className="text-xs text-purple-600 sm:text-sm">조회수</p>
        </div>
      </div>
    </div>
  )
}
