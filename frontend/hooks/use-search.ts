/**
 * useSearch 훅
 *
 * 백엔드 core 앱의 통합 검색 API를 사용하는 훅입니다.
 * 기존 프론트엔드 필터 로직에 맞춰 수정되었습니다.
 */

import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/api/core'
import type { SearchParams, FilterOptions } from '@/types/api'

interface UseSearchOptions {
  initialPage?: number
  initialPageSize?: number
  initialSort?: string
  debounceMs?: number
}

interface UseSearchReturn {
  // 데이터
  posts: any[]
  loading: boolean
  error: string | null

  // 페이지네이션
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean

  // 검색 상태
  searchQuery: string
  searchType: string

  // 기존 프론트엔드 필터 상태
  selectedCategories: string[]
  selectedPlatforms: string[]
  selectedModels: string[]

  // 정렬 상태
  sortBy: string
  sortOptions: Record<string, string>

  // 필터 옵션
  filterOptions: FilterOptions | null

  // 액션 함수들
  setSearchQuery: (query: string) => void
  setSearchType: (type: string) => void
  setSortBy: (sort: string) => void
  setSelectedCategories: (categories: string[]) => void
  setSelectedPlatforms: (platforms: string[]) => void
  setSelectedModels: (models: string[]) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  refresh: () => void
  clearFilters: () => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialPage = 1,
    initialPageSize = 12,
    initialSort = 'latest',
    debounceMs = 300,
  } = options

  // 상태 관리
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')

  // 기존 프론트엔드 필터 상태 (ID 기반)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) // 카테고리 ID 배열
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]) // 플랫폼 ID 배열
  const [selectedModels, setSelectedModels] = useState<string[]>([]) // 모델 ID 배열

  // 정렬 상태
  const [sortBy, setSortBy] = useState(initialSort)
  const [sortOptions, setSortOptions] = useState<Record<string, string>>({})

  // 필터 옵션
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setSearchQuery(query)
          setCurrentPage(1) // 검색 시 첫 페이지로 이동
        }, debounceMs)
      }
    })(),
    [debounceMs],
  )

  // 검색 실행 함수
  const executeSearch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const searchParams: any = {
        q: searchQuery,
        sort: sortBy as any,
        page: currentPage,
        page_size: pageSize,
        // 기존 프론트엔드 필터 파라미터
        categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : undefined,
        models: selectedModels.length > 0 ? selectedModels.join(',') : undefined,
      }

      const response = await coreApi.search(searchParams)
      setPosts(response.results)
      setTotalPages(response.pagination.total_pages)
      setTotalCount(response.pagination.total_count)
      setHasNext(response.pagination.has_next)
      setHasPrevious(response.pagination.has_previous)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [
    searchQuery,
    searchType,
    sortBy,
    currentPage,
    pageSize,
    selectedCategories,
    selectedPlatforms,
    selectedModels,
  ])

  // 정렬 옵션 로드
  const loadSortOptions = useCallback(async () => {
    try {
      const options = await coreApi.getSortOptions()
      // 기존 구조에 맞게 key-value 맵으로 변환이 필요하면 여기서 변환
      const map: Record<string, string> = {}
      options.forEach(o => (map[o.value] = o.label))
      setSortOptions(map)
    } catch (err) {
      console.error('정렬 옵션 로드 실패:', err)
    }
  }, [])

  // 필터 옵션 로드
  const loadFilterOptions = useCallback(async () => {
    try {
      const options: FilterOptions = await coreApi.getFilterOptions()
      setFilterOptions(options)
    } catch (err) {
      console.error('필터 옵션 로드 실패:', err)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    loadSortOptions()
    loadFilterOptions()
  }, [loadSortOptions, loadFilterOptions])

  // 검색 실행
  useEffect(() => {
    executeSearch()
  }, [executeSearch])

  // 액션 함수들
  const handleSetSearchQuery = useCallback(
    (query: string) => {
      debouncedSearch(query)
    },
    [debouncedSearch],
  )

  const handleSetSearchType = useCallback((type: string) => {
    setSearchType(type)
    setCurrentPage(1)
  }, [])

  const handleSetSortBy = useCallback((sort: string) => {
    setSortBy(sort)
    setCurrentPage(1)
  }, [])

  const handleSetSelectedCategories = useCallback((categories: string[]) => {
    setSelectedCategories(categories)
    setCurrentPage(1)
  }, [])

  const handleSetSelectedPlatforms = useCallback((platforms: string[]) => {
    setSelectedPlatforms(platforms)
    setCurrentPage(1)
  }, [])

  const handleSetSelectedModels = useCallback((models: string[]) => {
    setSelectedModels(models)
    setCurrentPage(1)
  }, [])

  const handleSetPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const handleRefresh = useCallback(() => {
    executeSearch()
  }, [executeSearch])

  const handleClearFilters = useCallback(() => {
    setSelectedCategories([])
    setSelectedPlatforms([])
    setSelectedModels([])
    setSearchQuery('')
    setSearchType('all')
    setSortBy('latest')
    setCurrentPage(1)
  }, [])

  return {
    // 데이터
    posts,
    loading,
    error,

    // 페이지네이션
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,

    // 검색 상태
    searchQuery,
    searchType,

    // 기존 프론트엔드 필터 상태
    selectedCategories,
    selectedPlatforms,
    selectedModels,

    // 정렬 상태
    sortBy,
    sortOptions,

    // 필터 옵션
    filterOptions,

    // 액션 함수들
    setSearchQuery: handleSetSearchQuery,
    setSearchType: handleSetSearchType,
    setSortBy: handleSetSortBy,
    setSelectedCategories: handleSetSelectedCategories,
    setSelectedPlatforms: handleSetSelectedPlatforms,
    setSelectedModels: handleSetSelectedModels,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refresh: handleRefresh,
    clearFilters: handleClearFilters,
  }
}
