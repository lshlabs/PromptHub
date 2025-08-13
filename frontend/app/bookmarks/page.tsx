'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkHeader } from '@/components/bookmark/bookmark-header'
import { PostList } from '@/components/posts'
import { SearchBar } from '@/components/common/search-bar'
import { postsApi } from '@/lib/api/posts'
import { userDataApi } from '@/lib/api/userData'
import { isAuthenticated } from '@/lib/api/client'
import type { PostCard, Platform, Model, Category } from '@/types/api'

export default function MyBookmarksPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [bookmarks, setBookmarks] = useState<PostCard[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [platformsData, setPlatformsData] = useState<Platform[]>([])
  const [modelsData, setModelsData] = useState<Model[]>([])
  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [metadataLoading, setMetadataLoading] = useState(true)

  // 메타데이터 로드 (북마크 데이터보다 먼저)
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setMetadataLoading(true)
        const [platformsResponse, modelsResponse, categoriesResponse] = await Promise.all([
          postsApi.getPlatforms(),
          postsApi.getModels(),
          postsApi.getCategories(),
        ])
        setPlatformsData(platformsResponse.data)
        setModelsData(modelsResponse.data)
        setCategoriesData(categoriesResponse.data)
      } catch (err) {
        console.error('메타데이터 로드 실패:', err)
      } finally {
        setMetadataLoading(false)
      }
    }

    loadMetadata()
  }, [])

  // 북마크 데이터 로드 (메타데이터 로드 후)
  useEffect(() => {
    // 메타데이터가 로드되지 않았으면 대기
    if (metadataLoading) return

    const loadBookmarks = async () => {
      // 로그인 체크
      if (!isAuthenticated()) {
        setError('로그인이 필요합니다.')
        setBookmarks([])
        return
      }

      try {
        setLoading(true)
        setError('')
        const response = await userDataApi.getBookmarkedPosts({
          page: currentPage,
          search: searchQuery || undefined,
          ordering: '-bookmarked_at',
        })
        setBookmarks(response.data.results)
      } catch (err) {
        console.error('북마크 로드 실패:', err)
        setError('북마크를 불러오는데 실패했습니다.')
        setBookmarks([])
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [currentPage, searchQuery, metadataLoading])

  const handleBookmarkClick = (bookmarkId: number) => {
    router.push(`/post/${bookmarkId}?from=bookmarks`)
  }

  const handleRemoveBookmark = async (bookmarkId: number) => {
    try {
      await postsApi.toggleBookmark(bookmarkId)
      // 북마크 목록에서 제거
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId))
    } catch (err) {
      console.error('북마크 제거 실패:', err)
      setError('북마크 제거에 실패했습니다.')
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // 검색 시 첫 페이지로 리셋
  }

  const handleBrowsePrompts = () => {
    router.push('/community')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* 헤더 섹션 */}
          <BookmarkHeader />

          {/* 북마크한 프롬프트 헤더 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">북마크한 프롬프트</h2>
          </div>

          {/* 북마크 목록 */}
          {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
          {/* 메타데이터 또는 북마크 데이터 로딩 표시 */}
          {metadataLoading || loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">데이터를 불러오는 중...</div>
            </div>
          ) : (
            <PostList
              posts={bookmarks}
              onPostClick={handleBookmarkClick}
              onRemoveBookmark={handleRemoveBookmark}
              variant="bookmark"
              onBrowsePrompts={handleBrowsePrompts}
              pagination={true}
              useApi={false}
              platformsData={platformsData}
              modelsData={modelsData}
              categoriesData={categoriesData}
            />
          )}

          {/* 검색창 */}
          <SearchBar onSearch={handleSearch} placeholder="북마크에서 검색..." />
        </div>
      </div>
    </div>
  )
}
