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
import { get, post, put } from '@/lib/api/client'

export const postsApi = {
  getPosts: async (
    params?: PostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.list,
      params,
    )
  },

  getPost: async (id: number): Promise<ApiResponse<PostDetail>> => {
    return get<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.detail(id))
  },

  createPost: async (data: PostCreateRequest): Promise<ApiResponse<PostDetail>> => {
    return post<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.create, data)
  },

  getPostForEdit: async (id: number): Promise<ApiResponse<PostEditData>> => {
    return get<ApiResponse<PostEditData>>(API_ENDPOINTS.posts.detail(id))
  },

  updatePost: async (id: number, data: PostUpdateRequest): Promise<ApiResponse<PostDetail>> => {
    return put<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.update(id), data)
  },

  toggleLike: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.like(id))
  },

  toggleBookmark: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.bookmark(id))
  },

  getPlatforms: async (): Promise<ApiResponse<Platform[]>> => {
    return get<ApiResponse<Platform[]>>(API_ENDPOINTS.posts.platforms)
  },

  getModels: async (): Promise<ApiResponse<Model[]>> => {
    return get<ApiResponse<Model[]>>(API_ENDPOINTS.posts.models)
  },

  getPlatformModels: async (platformId: number): Promise<ApiResponse<PlatformModelsResponse>> => {
    return get<ApiResponse<PlatformModelsResponse>>(API_ENDPOINTS.posts.platformModels(platformId))
  },

  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return get<ApiResponse<Category[]>>(API_ENDPOINTS.posts.categories)
  },

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
