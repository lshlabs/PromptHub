'use client'

import { useState, useEffect, useMemo } from 'react'
import { PostCard } from '@/components/common/post-card'
import { Pagination } from '@/components/common/pagination'
import { EmptyState } from '@/components/common/empty-state'
import { postsApi } from '@/lib/api/posts'
import type { PostCard as ApiPostCard } from '@/types/api'
import type { SortOption } from '@/components/common/sort-selector'

type PostListVariant = 'default' | 'bookmark' | 'trending' | 'user-posts'

interface PostListProps {
  posts?: ApiPostCard[]
  currentPostId?: number
  onPostClick?: (postId: number) => void
  onRemoveBookmark?: (id: number) => void
  onViewMore?: () => void
  variant?: PostListVariant
  onBrowsePrompts?: () => void
  pagination?: boolean
  itemsPerPage?: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  className?: string
  useApi?: boolean
  searchParams?: {
    search?: string
    categories?: string
    platforms?: string
    models?: string
  }
  sortBy?: SortOption
  // 메타데이터 props 추가
  platformsData?: any[]
  modelsData?: any[]
  categoriesData?: any[]
}

export function PostList({
  posts: externalPosts,
  currentPostId,
  onPostClick,
  onRemoveBookmark,
  onViewMore,
  variant = 'default',
  onBrowsePrompts,
  pagination = false,
  itemsPerPage = 10,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
  className = '',
  useApi = false,
  searchParams,
  sortBy = 'latest',
  // 메타데이터 props 추가
  platformsData: externalPlatformsData,
  modelsData: externalModelsData,
  categoriesData: externalCategoriesData,
}: PostListProps) {
  const [apiPosts, setApiPosts] = useState<ApiPostCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiPagination, setApiPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  })

  const [platformsData, setPlatformsData] = useState<any[]>(externalPlatformsData || [])
  const [modelsData, setModelsData] = useState<any[]>(externalModelsData || [])
  const [categoriesData, setCategoriesData] = useState<any[]>(externalCategoriesData || [])

  const [internalCurrentPage, setInternalCurrentPage] = useState(1)

  useEffect(() => {
    // 외부에서 메타데이터가 전달되지 않았을 때만 API 호출
    if (!externalPlatformsData || !externalModelsData || !externalCategoriesData) {
      const loadMetadata = async () => {
        try {
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
        }
      }

      loadMetadata()
    }
  }, [externalPlatformsData, externalModelsData, externalCategoriesData])

  useEffect(() => {
    if (!useApi) return

    const loadPosts = async () => {
      try {
        setLoading(true)
        setError('')

        const page = externalCurrentPage || internalCurrentPage
        const response = await postsApi.getPosts({
          page,
          page_size: itemsPerPage,
          search: searchParams?.search,
          ...(searchParams?.categories ? { categories: searchParams.categories } : ({} as any)),
          models: searchParams?.models,
          sort_by: sortBy,
        })

        setApiPosts(response.data.results)
        setApiPagination(response.data.pagination)
      } catch (err) {
        console.error('게시글 로드 실패:', err)
        setError('게시글을 불러오는데 실패했습니다.')
        setApiPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [useApi, externalCurrentPage, internalCurrentPage, itemsPerPage, searchParams, sortBy])

  const rawPosts = useApi ? apiPosts : externalPosts || []

  const processedPosts = useMemo(() => {
    if (useApi) return rawPosts

    let filtered = [...rawPosts]

    if (searchParams?.search) {
      const query = searchParams.search.toLowerCase()
      filtered = filtered.filter(
        post =>
          post.title.toLowerCase().includes(query) || post.author.toLowerCase().includes(query),
      )
    }

    if (searchParams?.categories) {
      const categoryIds = searchParams.categories.split(',')
      filtered = filtered.filter(post => categoryIds.includes(post.categoryId.toString()))
    }

    if (searchParams?.platforms) {
      const platformIds = searchParams.platforms.split(',')
      filtered = filtered.filter(post => platformIds.includes(post.platformId.toString()))
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'popular':
          return b.likes - a.likes
        case 'satisfaction':
          return Number(b.satisfaction) - Number(a.satisfaction)
        case 'views':
          return b.views - a.views
        default:
          return 0
      }
    })

    return filtered
  }, [rawPosts, searchParams, sortBy, useApi])

  const posts = processedPosts

  const isExternalPagination =
    (externalCurrentPage !== undefined &&
      externalTotalPages !== undefined &&
      externalOnPageChange !== undefined) ||
    useApi

  const currentPage = isExternalPagination
    ? externalCurrentPage || (useApi ? apiPagination.current_page : 1)
    : internalCurrentPage

  const totalPages = isExternalPagination
    ? useApi
      ? apiPagination.total_pages
      : externalTotalPages || 1
    : Math.ceil(posts.length / itemsPerPage)

  const startIndex = ((currentPage || 1) - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPosts = useApi ? posts : pagination ? posts.slice(startIndex, endIndex) : posts

  const handlePageChange = (page: number) => {
    if (useApi && externalOnPageChange) {
      externalOnPageChange(page)
    } else if (isExternalPagination && externalOnPageChange) {
      externalOnPageChange(page)
    } else {
      setInternalCurrentPage(page)
    }
  }

  if (posts.length === 0) {
    const emptyStateType = variant === 'default' ? 'posts' : variant

    return (
      <EmptyState
        type={emptyStateType}
        onAction={variant === 'bookmark' ? onBrowsePrompts : undefined}
        className={className}
      />
    )
  }

  if (useApi && loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-gray-500">게시글을 불러오는 중...</div>
      </div>
    )
  }

  if (useApi && error) {
    return <div className={`rounded-lg bg-red-50 p-4 text-red-700 ${className}`}>{error}</div>
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {currentPosts.map(post => (
        <PostCard
          key={post.id}
          data={post}
          variant={variant === 'bookmark' ? 'bookmark' : 'normal'}
          currentPostId={currentPostId}
          onClick={() => onPostClick?.(post.id)}
          onRemoveBookmark={onRemoveBookmark}
          platformsData={platformsData}
          modelsData={modelsData}
          categoriesData={categoriesData}
        />
      ))}
      {pagination && totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage || 1}
            totalPages={totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
