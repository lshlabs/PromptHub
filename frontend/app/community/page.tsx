/**
 * 커뮤니티 페이지 컴포넌트
 * 
 * 프롬프트 리뷰 및 토론을 위한 커뮤니티 공간을 제공하는 페이지입니다.
 * 
 * 주요 기능:
 * - 프롬프트 리뷰 목록 표시
 * - 카테고리 및 모델별 필터링
 * - 검색 및 정렬 기능
 * - 새 리뷰 작성 기능
 * - 반응형 디자인 및 접근성 최적화
 * 
 * @returns JSX.Element 커뮤니티 페이지 컴포넌트
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { Metadata } from "next"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { CommunityHeader } from "@/components/community/community-header"
import { CommunityFilters } from "@/components/community/community-filters"
import { PostList } from "@/components/community/post-list"
import { CreateReviewDialog } from "@/components/community/create-post-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// ========== 타입 정의 ==========

/**
 * 커뮤니티 페이지 컴포넌트 인터페이스
 */
interface CommunityPageProps {}

/**
 * 필터 상태 인터페이스
 */
interface FilterState {
  /** 선택된 카테고리 */
  selectedCategory: string
  /** 선택된 AI 모델 */
  selectedModel: string
  /** 정렬 방식 */
  sortBy: string
  /** 검색 쿼리 */
  searchQuery: string
  /** 필터 표시 여부 */
  showFilters: boolean
}

// ========== 메인 컴포넌트 ==========

/**
 * 커뮤니티 페이지 메인 컴포넌트
 * 
 * 프롬프트 리뷰 커뮤니티의 메인 페이지를 제공합니다.
 * 필터링, 검색, 정렬 기능과 함께 새 리뷰 작성 기능을 포함합니다.
 * 
 * @param props 컴포넌트 props
 * @returns 렌더링된 커뮤니티 페이지
 */
export default function CommunityPage({}: CommunityPageProps): JSX.Element {
  // ========== 상태 관리 ==========
  
  /**
   * 필터 관련 상태들을 하나의 객체로 관리
   * 성능 최적화를 위한 상태 구조화
   */
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategory: "전체",
    selectedModel: "전체",
    sortBy: "인기순",
    searchQuery: "",
    showFilters: false,
  })

  /**
   * 새 리뷰 작성 다이얼로그 표시 상태
   */
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false)

  // ========== 메모이제이션된 값들 ==========
  
  /**
   * 필터 상태 변경 핸들러들을 메모이제이션
   * 불필요한 리렌더링 방지
   */
  const filterHandlers = useMemo(() => ({
    setSelectedCategory: (category: string) => 
      setFilterState(prev => ({ ...prev, selectedCategory: category })),
    setSelectedModel: (model: string) => 
      setFilterState(prev => ({ ...prev, selectedModel: model })),
    setSortBy: (sort: string) => 
      setFilterState(prev => ({ ...prev, sortBy: sort })),
    setSearchQuery: (query: string) => 
      setFilterState(prev => ({ ...prev, searchQuery: query })),
    setShowFilters: (show: boolean) => 
      setFilterState(prev => ({ ...prev, showFilters: show })),
  }), [])

  // ========== 이벤트 핸들러 ==========
  
  /**
   * 새 리뷰 작성 버튼 클릭 핸들러
   * useCallback을 사용하여 메모이제이션
   */
  const handleCreatePostClick = useCallback((): void => {
    setIsCreatePostOpen(true)
  }, [])

  /**
   * 새 리뷰 작성 다이얼로그 닫기 핸들러
   * useCallback을 사용하여 메모이제이션
   */
  const handleCreatePostClose = useCallback((open: boolean): void => {
    setIsCreatePostOpen(open)
  }, [])

  // ========== 렌더링 ==========
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-label="커뮤니티 페이지"
      >
        {/* 페이지 헤더 */}
        <header className="mb-8">
          <CommunityHeader />
        </header>

        {/* 필터 및 작성 버튼 컨테이너 */}
        <section className="mb-8 space-y-6" aria-label="커뮤니티 필터 및 작성">
          {/* 데스크톱 레이아웃 */}
          <div className="hidden lg:flex lg:items-start lg:gap-6">
            {/* 필터 영역 */}
            <div className="flex-1">
              <CommunityFilters
                selectedCategory={filterState.selectedCategory}
                setSelectedCategory={filterHandlers.setSelectedCategory}
                selectedModel={filterState.selectedModel}
                setSelectedModel={filterHandlers.setSelectedModel}
                sortBy={filterState.sortBy}
                setSortBy={filterHandlers.setSortBy}
                searchQuery={filterState.searchQuery}
                setSearchQuery={filterHandlers.setSearchQuery}
                showFilters={filterState.showFilters}
                setShowFilters={filterHandlers.setShowFilters}
              />
            </div>
            
            {/* 새 리뷰 작성 버튼 */}
            <div className="flex-shrink-0 pt-1">
              <Button
                onClick={handleCreatePostClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="새 프롬프트 리뷰 작성하기"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                새 리뷰 작성
              </Button>
            </div>
          </div>

          {/* 모바일 레이아웃 */}
          <div className="lg:hidden space-y-4">
            {/* 필터 컴포넌트 */}
            <CommunityFilters
              selectedCategory={filterState.selectedCategory}
              setSelectedCategory={filterHandlers.setSelectedCategory}
              selectedModel={filterState.selectedModel}
              setSelectedModel={filterHandlers.setSelectedModel}
              sortBy={filterState.sortBy}
              setSortBy={filterHandlers.setSortBy}
              searchQuery={filterState.searchQuery}
              setSearchQuery={filterHandlers.setSearchQuery}
              showFilters={filterState.showFilters}
              setShowFilters={filterHandlers.setShowFilters}
            />
            
            {/* 새 리뷰 작성 버튼 */}
            <div className="flex justify-center">
              <Button
                onClick={handleCreatePostClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="새 프롬프트 리뷰 작성하기"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                새 리뷰 작성
              </Button>
            </div>
          </div>
        </section>

        {/* 리뷰 목록 섹션 */}
        <section aria-label="프롬프트 리뷰 목록">
          <PostList
            selectedCategory={filterState.selectedCategory}
            selectedModel={filterState.selectedModel}
            sortBy={filterState.sortBy}
            searchQuery={filterState.searchQuery}
          />
        </section>

        {/* 새 리뷰 작성 다이얼로그 */}
        <CreateReviewDialog 
          open={isCreatePostOpen} 
          onOpenChange={handleCreatePostClose}
        />
      </main>

      <Footer />
    </div>
  )
}
