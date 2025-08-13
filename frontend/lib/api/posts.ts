import type {
  ApiResponse,
  PaginatedResponse,
  Platform,
  Model,
  Category,
  Tag,
  PostCard,
  PostDetail,
  PostCreateRequest,
  PostUpdateRequest,
  PostEditData,
  PostInteractionResponse,
  PostListParams,
  PlatformModelsResponse,
  ModelSuggestResponse,
} from '@/types/api'
import { API_ENDPOINTS } from '@/types/api'
import { get, post, put, del } from '@/lib/api/client'

export const postsApi = {
  /**
   * 게시글 목록 조회 (페이지네이션/검색/정렬)
   * @returns PaginatedResponse<PostCard>
   */
  getPosts: async (
    params?: PostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.list,
      params,
    )
  },

  /** 게시글 상세 조회 */
  getPost: async (id: number): Promise<ApiResponse<PostDetail>> => {
    return get<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.detail(id))
  },

  /** 게시글 생성 */
  createPost: async (data: PostCreateRequest): Promise<ApiResponse<PostDetail>> => {
    return post<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.create, data)
  },

  /** 게시글 수정용 데이터 조회 */
  getPostForEdit: async (id: number): Promise<ApiResponse<PostEditData>> => {
    return get<ApiResponse<PostEditData>>(API_ENDPOINTS.posts.detail(id))
  },

  /** 게시글 업데이트 */
  updatePost: async (id: number, data: PostUpdateRequest): Promise<ApiResponse<PostDetail>> => {
    return put<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.update(id), data)
  },

  /** 게시글 삭제 */
  deletePost: async (id: number): Promise<{ status: 'success' | 'error'; message?: string }> => {
    return del<{ status: 'success' | 'error'; message?: string }>(API_ENDPOINTS.posts.delete(id))
  },

  /** 좋아요 토글 */
  toggleLike: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.like(id))
  },

  /** 북마크 토글 */
  toggleBookmark: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.bookmark(id))
  },

  /** 플랫폼 목록 */
  getPlatforms: async (): Promise<ApiResponse<Platform[]>> => {
    return get<ApiResponse<Platform[]>>(API_ENDPOINTS.posts.platforms)
  },

  /** 모델 목록 */
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    return get<ApiResponse<Model[]>>(API_ENDPOINTS.posts.models)
  },

  /** 특정 플랫폼의 모델 목록 */
  getPlatformModels: async (platformId: number): Promise<ApiResponse<PlatformModelsResponse>> => {
    return get<ApiResponse<PlatformModelsResponse>>(API_ENDPOINTS.posts.platformModels(platformId))
  },

  /** 카테고리 목록 */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return get<ApiResponse<Category[]>>(API_ENDPOINTS.posts.categories)
  },

  /** 태그 목록 */
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    return get<ApiResponse<Tag[]>>(API_ENDPOINTS.posts.tags)
  },

  // 모델 자동완성
  getModelSuggestions: async (params: {
    query: string
    platform_id?: number
    limit?: number
  }): Promise<ModelSuggestResponse> => {
    const searchParams = new URLSearchParams()
    searchParams.append('query', params.query)
    if (params.platform_id) searchParams.append('platform_id', params.platform_id.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const url = `${API_ENDPOINTS.posts.modelsSuggest}?${searchParams.toString()}`
    return get<ModelSuggestResponse>(url)
  },
}

export type { PostCreateRequest, PostUpdateRequest, PostEditData, PostListParams }
