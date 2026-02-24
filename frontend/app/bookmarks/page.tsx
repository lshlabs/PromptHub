'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { BookmarkHeader } from '@/components/bookmark/bookmark-header'
import { PostList } from '@/components/posts'
import { SearchBar } from '@/components/common/search-bar'
import AuthForm from '@/components/auth/auth-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { postsApi, userDataApi } from '@/lib/api'
import { useAuthContext } from '@/components/layout/auth-provider'
import { useDelayedLoading } from '@/hooks/use-delayed-loading'
import type { PostCard, Platform, Model, Category } from '@/types/api'

export default function MyBookmarksPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [bookmarks, setBookmarks] = useState<PostCard[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [platformsData, setPlatformsData] = useState<Platform[]>([])
  const [modelsData, setModelsData] = useState<Model[]>([])
  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [metadataLoading, setMetadataLoading] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [hasLoadedBookmarksOnce, setHasLoadedBookmarksOnce] = useState(false)
  const showPageLoading = useDelayedLoading(metadataLoading || loading, {
    delayMs: 180,
    minVisibleMs: 320,
  })

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
    // 인증 상태가 아직 초기화 중이면 대기 (초기 false로 인한 오탐 방지)
    if (authLoading) return

    const loadBookmarks = async () => {
      // 로그인 체크
      if (!isAuthenticated) {
        setError('')
        setBookmarks([])
        setHasLoadedBookmarksOnce(true)
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
        setHasLoadedBookmarksOnce(true)
      }
    }

    loadBookmarks()
  }, [currentPage, searchQuery, metadataLoading, isAuthenticated, authLoading])

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
          {!authLoading && error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
          {!authLoading && !isAuthenticated ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                <Bookmark className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                북마크를 보려면 로그인이 필요해요
              </h3>
              <p className="mx-auto mb-6 max-w-md text-sm text-gray-600">
                마음에 드는 리뷰를 저장하고 나중에 다시 보려면 먼저 로그인하거나 회원가입을 진행해주세요.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">
                      로그인 / 회원가입
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md p-0 [&>button]:hidden">
                    <DialogTitle className="sr-only">로그인 또는 회원가입</DialogTitle>
                    <DialogDescription className="sr-only">
                      북마크 기능을 사용하려면 로그인 또는 회원가입이 필요합니다.
                    </DialogDescription>
                    <AuthForm defaultTab="login" onSuccess={() => setIsAuthDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={() => router.push('/community')}
                  className="border-gray-300 bg-white text-gray-800 hover:bg-gray-50">
                  커뮤니티 둘러보기
                </Button>
              </div>
            </div>
          ) : null}
          {/* 메타데이터 또는 북마크 데이터 로딩 표시 */}
          {isAuthenticated && (metadataLoading || authLoading || loading) ? (
            !hasLoadedBookmarksOnce || !showPageLoading ? (
              <div className="space-y-3" aria-hidden="true">
                <div className="h-24 animate-pulse rounded-xl border bg-gray-100/70" />
                <div className="h-24 animate-pulse rounded-xl border bg-gray-100/70" />
                <div className="h-24 animate-pulse rounded-xl border bg-gray-100/70" />
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">데이터를 불러오는 중...</div>
              </div>
            )
          ) : isAuthenticated ? (
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
          ) : null}

          {/* 검색창 */}
          {isAuthenticated ? (
            <SearchBar onSearch={handleSearch} placeholder="북마크에서 검색..." />
          ) : null}
        </div>
      </div>
    </div>
  )
}
