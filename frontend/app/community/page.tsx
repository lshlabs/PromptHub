/**
 * Community 페이지
 *
 * 커뮤니티 페이지 - 사용자들이 프롬프트 리뷰를 공유하고 소통하는 공간
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CommunityHeader, CommunityAction } from '@/components/community'
import { PostList } from '@/components/posts'
import { SearchBar } from '@/components/common/search-bar'
import type { SortOption } from '@/components/common/sort-selector'
import { CreatePostDialog } from '@/components/common/create-post-dialog'
import { postsApi } from '@/lib/api/posts'
import { statsApi } from '@/lib/api/stats'
import type { Platform, Category } from '@/types/api'
import { useMetadataUtils } from '@/lib/metadata-utils'

// 백엔드 API에서 받아올 통계 데이터 타입
interface CommunityStats {
  activeUsers: number
  sharedPrompts: number
  averageSatisfaction: number
  totalBookmarks: number
  totalViews: number
  weeklyAdded: number
}

export default function CommunityPage() {
  const router = useRouter()
  const actionSectionRef = useRef<HTMLDivElement>(null)
  const { setMetadata } = useMetadataUtils()

  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPlatforms] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 필터 데이터 상태
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // 통계 데이터 상태
  const [stats, setStats] = useState<CommunityStats>({
    activeUsers: 0,
    sharedPrompts: 0,
    averageSatisfaction: 0,
    totalBookmarks: 0,
    totalViews: 0,
    weeklyAdded: 0,
  })

  // 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await statsApi.getDashboardStats()
        const data = response.data
        setStats({
          activeUsers: (data.active_users as number | undefined) ?? data.total_users,
          sharedPrompts: data.total_posts,
          averageSatisfaction: (data.avg_satisfaction as number | undefined) ?? 0,
          totalBookmarks: data.total_bookmarks,
          totalViews: data.total_views,
          weeklyAdded: (data.weekly_added_posts as number | undefined) ?? 0,
        })
      } catch (err) {
        console.error('통계 데이터 로드 실패:', err)
      }
    }

    loadStats()
  }, [])

  // 검색 매개변수 객체
  const getSearchParams = () => ({
    search: searchQuery || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
    models: selectedModels.length > 0 ? selectedModels.join(',') : undefined,
  })

  const handlePostClick = (postId: number) => {
    router.push(`/post/${postId}?from=community&from_page=${currentPage}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // 검색 시 1페이지로 리셋
    console.log('검색:', query)
  }

  const handleCreatePost = () => {
    setShowCreateDialog(true)
  }

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1) // PostList 새로고침 트리거
  }

  // 액션 섹션으로 부드럽게 스크롤하는 함수
  const scrollToActionSection = () => {
    setTimeout(() => {
      if (actionSectionRef.current) {
        const element = actionSectionRef.current
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 90 // 헤더 높이 고려하여 90px 위로

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    console.log('페이지 변경:', page)
    scrollToActionSection()
  }

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    setCurrentPage(1) // 정렬 변경 시 1페이지로 리셋
    console.log('정렬 변경:', value)
    scrollToActionSection()
  }

  // 필터 데이터 로드
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoadingFilters(true)
        const [platformsResponse, categoriesResponse, modelsResponse] = await Promise.all([
          postsApi.getPlatforms(),
          postsApi.getCategories(),
          postsApi.getModels(),
        ])
        setPlatforms(platformsResponse.data)
        setCategories(categoriesResponse.data)
        setModels(modelsResponse.data)

        // 메타데이터 유틸리티에 설정
        setMetadata(platformsResponse.data, modelsResponse.data, categoriesResponse.data)
      } catch (error) {
        console.error('필터 데이터 로드 실패:', error)
      } finally {
        setLoadingFilters(false)
      }
    }

    loadFilterData()
  }, [])

  const handleFilterChange = (filters: {
    categories: string[]
    platforms: string[]
    models: string[]
  }) => {
    // 즉시 필터 적용
    setSelectedCategories(filters.categories)
    // selectedPlatforms는 더 이상 업데이트하지 않음 (모델 선택의 관문 역할만)
    setSelectedModels(filters.models)
    setCurrentPage(1) // 필터 변경 시 1페이지로 리셋
    console.log('필터 변경:', filters)
    scrollToActionSection()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* 헤더 섹션 */}
          <CommunityHeader stats={stats} />

          {/* 액션 섹션 (필터, 정렬, 게시글 작성) */}
          <div ref={actionSectionRef}>
            <CommunityAction
              onCreatePost={handleCreatePost}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              selectedCategories={selectedCategories}
              selectedPlatforms={selectedPlatforms}
              selectedModels={selectedModels}
              onFilterChange={handleFilterChange}
              platforms={platforms}
              categories={categories}
              models={models}
              loadingFilters={loadingFilters}
            />
          </div>

          {/* 게시글 목록 */}
          <PostList
            useApi={true}
            searchParams={getSearchParams()}
            sortBy={sortBy}
            onPostClick={handlePostClick}
            pagination={true}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            itemsPerPage={10}
            key={refreshTrigger} // 새 게시글 작성 시 목록 새로고침
          />

          {/* 검색창 */}
          <SearchBar onSearch={handleSearch} placeholder="프롬프트 리뷰 검색..." />
        </div>
      </div>

      {/* 게시글 작성 다이얼로그 */}
      <CreatePostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
