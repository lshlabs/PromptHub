import type {
  TrendingResponse,
  CategoryRankings,
  TrendingModelInfoResponse,
  TrendingModelPostsResponse,
  SearchParams,
} from '@/types/api'
import { API_ENDPOINTS } from '@/types/api'
import { get, post } from '@/lib/api/client'

export const trendingApi = {
  /**
   * 트렌딩 카테고리 랭킹 데이터 가져오기
   */
  getCategoryRankings: async (): Promise<{
    status: 'success' | 'error'
    data: CategoryRankings
    from_cache?: boolean
  }> => {
    return get<TrendingResponse>(API_ENDPOINTS.core.trending.categoryRankings)
  },

  /**
   * 트렌딩 캐시 새로고침 (관리자용)
   */
  refreshCache: async (): Promise<{ status: 'success' | 'error'; message: string }> => {
    return post<{ status: 'success' | 'error'; message: string }>(
      API_ENDPOINTS.core.trending.refreshCache,
      {},
    )
  },

  /**
   * 특정 트렌딩 모델의 상세 정보 가져오기
   */
  getTrendingModelInfo: async (modelName: string): Promise<TrendingModelInfoResponse> => {
    const url = `${API_ENDPOINTS.core.trending.modelInfo}${encodeURIComponent(modelName)}/info/`
    return get<TrendingModelInfoResponse>(url)
  },

  /**
   * 특정 트렌딩 모델과 관련된 게시글 목록 가져오기
   */
  getTrendingModelPosts: async (
    modelName: string,
    params?: Partial<SearchParams>,
  ): Promise<TrendingModelPostsResponse> => {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params?.sort) searchParams.append('sort', params.sort)

    const baseUrl = `${API_ENDPOINTS.core.trending.modelPosts}${encodeURIComponent(modelName)}/posts/`
    const url = `${baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

    return get<TrendingModelPostsResponse>(url)
  },
}

export type {
  TrendingResponse,
  CategoryRankings,
  TrendingModelInfoResponse,
  TrendingModelPostsResponse,
}
