/**
 * Post Detail 페이지
 *
 * 개별 게시글의 상세 정보를 표시하는 페이지
 */

'use client'

import { use, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoBackButton } from '@/components/common/go-back-button'
import { PostHeader, PostContentSections, PostActions, PostList } from '@/features/posts'
import type { PostDetail, PostCard } from '@/types/api'
import { useAuth } from '@/hooks/use-auth'
import { postsApi } from '@/lib/api/posts'
import { useToast } from '@/hooks/use-toast'
import { getPlatformName, getModelName, getCategoryName } from '@/lib/utils'

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, isLoading } = useAuth()
  const { toast } = useToast()

  // Next.js 15: params를 React.use()로 unwrap
  const { id } = use(params)

  // URL에서 from_page 파라미터 읽기
  const [initialPage, setInitialPage] = useState(1)

  useEffect(() => {
    // useSearchParams가 준비되지 않았을 경우를 대비해 window.location.search도 확인
    let fromPage = searchParams.get('from_page')
    if (!fromPage) {
      const urlParams = new URLSearchParams(window.location.search)
      fromPage = urlParams.get('from_page')
    }

    if (fromPage) {
      const page = parseInt(fromPage)
      if (!isNaN(page) && page > 0) {
        setInitialPage(page)
      }
    }
  }, [searchParams])

  // 디버깅용 로그
  useEffect(() => {
    console.log('인증 상태:', { isAuthenticated, user })
  }, [isAuthenticated, user])

  // 상태 관리
  const [postData, setPostData] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasViewIncremented, setHasViewIncremented] = useState(false)

  // 메타데이터 상태 (표시명 변환용)
  const [platformsData, setPlatformsData] = useState<any[]>([])
  const [modelsData, setModelsData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<any[]>([])

  // 좋아요/북마크 로컬 상태 관리
  const [localLikeState, setLocalLikeState] = useState<{ isLiked: boolean; count: number } | null>(
    null,
  )
  const [localBookmarkState, setLocalBookmarkState] = useState<{
    isBookmarked: boolean
    count: number
  } | null>(null)

  // initialPage가 변경될 때 currentPage 업데이트
  useEffect(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  // 메타데이터 로드
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [platformsRes, modelsRes, categoriesRes] = await Promise.all([
          postsApi.getPlatforms(),
          postsApi.getModels(),
          postsApi.getCategories(),
        ])

        setPlatformsData(platformsRes.data || [])
        setModelsData(modelsRes.data || [])
        setCategoriesData(categoriesRes.data || [])
      } catch (error) {
        console.error('메타데이터 로드 실패:', error)
        // 실패 시 기본 메타데이터 사용
        setPlatformsData([
          { id: 1, name: 'OpenAI' },
          { id: 2, name: 'Google' },
          { id: 3, name: 'Anthropic' },
          { id: 99, name: '기타' },
        ])
        setModelsData([
          { id: 1, name: 'o3', platform: 1, platform_name: 'OpenAI' },
          { id: 2, name: 'Gemini 2.5 Pro', platform: 2, platform_name: 'Google' },
          { id: 3, name: 'Claude 3.5 Sonnet', platform: 3, platform_name: 'Anthropic' },
          { id: 99, name: '기타', platform: 99, platform_name: '기타' },
        ])
        setCategoriesData([
          { id: 1, name: '창작' },
          { id: 2, name: '분석' },
          { id: 3, name: '코딩' },
          { id: 99, name: '기타' },
        ])
      }
    }

    loadMetadata()
  }, [])

  // 게시글 ID가 변경될 때 로컬 상태 초기화
  useEffect(() => {
    setLocalLikeState(null)
    setLocalBookmarkState(null)
    setHasViewIncremented(false)
  }, [id])

  // 게시글 상세 데이터 로드
  useEffect(() => {
    if (isLoading) return // 인증정보 로딩 중이면 대기
    if (hasViewIncremented) return // 이미 조회수를 증가시켰으면 재실행 방지

    const fetchPostDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await postsApi.getPost(Number(id))
        let postData = response.data
        if (postData.isAuthor === undefined && user) {
          postData = {
            ...postData,
            isAuthor: postData.author === user.username,
          }
        }

        // 로컬 상태가 있으면 우선 적용
        if (localLikeState) {
          postData = {
            ...postData,
            likes: localLikeState.count,
            isLiked: localLikeState.isLiked,
          }
        }
        if (localBookmarkState) {
          postData = {
            ...postData,
            bookmarks: localBookmarkState.count,
            isBookmarked: localBookmarkState.isBookmarked,
          }
        }

        setPostData(postData)
        setHasViewIncremented(true) // 조회수 증가 완료 플래그 설정
      } catch (err) {
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchPostDetail()
  }, [id, isLoading, hasViewIncremented])

  const handlePostClick = (postId: number) => {
    router.push(`/post/${postId}?from_page=${currentPage}`)
  }

  const handleEdit = () => {
    if (!postData) return
    const urlParams = new URLSearchParams(window.location.search)
    const fromParam = urlParams.get('from') || 'community'
    router.push(`/edit-post/${postData.id}?from=${fromParam}`)
  }

  const handleLike = async () => {
    if (!postData || !isAuthenticated) return

    try {
      const response = await postsApi.toggleLike(postData.id)

      // 백엔드에서 메시지가 있으면 토스트로 표시
      if ((response as any).message) {
        toast({
          title: '알림',
          description: (response as any).message,
        })
      } else {
        // 로컬 상태 업데이트
        const newLikeState = {
          isLiked: response.data.is_liked ?? false,
          count: response.data.like_count ?? 0,
        }
        setLocalLikeState(newLikeState)

        setPostData((prev: PostDetail | null) =>
          prev
            ? {
                ...prev,
                likes: response.data.like_count ?? prev.likes,
                isLiked: response.data.is_liked ?? prev.isLiked,
              }
            : null,
        )

        // 성공 토스트 메시지
        toast({
          title: response.data.is_liked ? '좋아요 완료' : '좋아요 취소',
          description: response.data.is_liked
            ? '게시글에 좋아요를 눌렀습니다.'
            : '좋아요를 취소했습니다.',
        })
      }
    } catch (err: any) {
      toast({
        title: '오류',
        description: '좋아요 처리에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleBookmark = async () => {
    if (!postData || !isAuthenticated) return

    try {
      const response = await postsApi.toggleBookmark(postData.id)

      // 백엔드에서 메시지가 있으면 토스트로 표시
      if ((response as any).message) {
        toast({
          title: '알림',
          description: (response as any).message,
        })
      } else {
        // 로컬 상태 업데이트
        const newBookmarkState = {
          isBookmarked: response.data.is_bookmarked ?? false,
          count: response.data.bookmark_count ?? 0,
        }
        setLocalBookmarkState(newBookmarkState)

        setPostData((prev: PostDetail | null) =>
          prev
            ? {
                ...prev,
                bookmarks: response.data.bookmark_count ?? prev.bookmarks,
                isBookmarked: response.data.is_bookmarked ?? prev.isBookmarked,
              }
            : null,
        )

        // 성공 토스트 메시지
        toast({
          title: response.data.is_bookmarked ? '북마크 완료' : '북마크 취소',
          description: response.data.is_bookmarked
            ? '게시글을 북마크했습니다.'
            : '북마크를 취소했습니다.',
        })
      }
    } catch (err: any) {
      toast({
        title: '오류',
        description: '북마크 처리에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = () => {
    // 삭제 로직 구현
  }

  const handleViewMore = () => {
    router.push('/community')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // URL 업데이트 (브라우저 히스토리에 추가하지 않음)
    const url = new URL(window.location.href)
    url.searchParams.set('from_page', page.toString())
    window.history.replaceState({}, '', url.toString())
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !postData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">오류가 발생했습니다</h2>
          <p className="mb-4 text-gray-600">{error || '게시글을 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/community')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            커뮤니티로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-2 py-2 pb-4 sm:px-4 sm:py-4">
        <div className="mx-auto max-w-7xl">
          <div className="px-2 py-2">
            {/* 목록으로 가기 버튼 */}
            <div className="flex justify-start pb-2">
              <GoBackButton />
            </div>

            {/* 메인 포스트 카드 */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* 상단 그라데이션 바 */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              <div className="p-6">
                {/* 헤더 섹션 */}
                <PostHeader
                  title={postData.title}
                  author={postData.author}
                  authorInitial={postData.authorInitial}
                  avatarSrc={postData.avatarSrc || undefined}
                  authorAvatarColor1={(postData as any).authorAvatarColor1}
                  authorAvatarColor2={(postData as any).authorAvatarColor2}
                  satisfaction={Number(postData.satisfaction)}
                  createdAt={postData.createdAt}
                  views={postData.views}
                  platform_id={postData.platformId}
                  model_id={postData.modelId || 0}
                  model_etc={postData.modelEtc}
                  model_detail={(postData as any).modelDetail || (postData as any).model_detail}
                  category_id={postData.categoryId}
                  category_etc={postData.categoryEtc}
                  platformsData={platformsData}
                  modelsData={modelsData}
                  categoriesData={categoriesData}
                />

                {/* 내용 섹션들 */}
                <PostContentSections
                  prompt={postData.prompt}
                  aiResponse={postData.aiResponse || ''}
                  additionalOpinion={postData.additionalOpinion || ''}
                  tags={postData.tags}
                />

                {/* 액션 버튼들 */}
                <PostActions
                  likes={postData.likes}
                  bookmarks={postData.bookmarks}
                  isLiked={postData.isLiked}
                  isBookmarked={postData.isBookmarked}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAuthor={postData.isAuthor || (user ? postData.author === user.username : false)}
                  isAuthenticated={isAuthenticated}
                  post={postData}
                />
              </div>
            </div>

            {/* 다른 리뷰들 섹션 */}
            <div className="pt-4">
              <div className="p-2">
                <h3 className="mb-1 text-lg font-bold text-gray-900">다른 리뷰들</h3>
                <p className="text-sm text-gray-500">더 많은 프롬프트 리뷰를 확인해보세요</p>
              </div>

              <PostList
                useApi={true}
                currentPostId={parseInt(id)}
                onPostClick={handlePostClick}
                onViewMore={handleViewMore}
                pagination={true}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                searchParams={{}}
                platformsData={platformsData}
                modelsData={modelsData}
                categoriesData={categoriesData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
