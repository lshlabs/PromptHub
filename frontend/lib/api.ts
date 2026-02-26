// ===========================================
// API 클라이언트 - Django 백엔드와의 통신을 위한 모든 함수들
// ===========================================

import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios'
import { logger } from '@/lib/logger'
import {
  // 공통 타입들
  ApiResponse,
  PaginatedResponse,
  ApiRequestError,
  ValidationError,
  AuthTokens,
  // Users 관련 타입들
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserData,
  UserProfileResponse,
  UserProfileEnvelope,
  UserProfileUpdateResponse,
  AvatarRegenerateResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  ChangePasswordResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserPostListParams,
  UserSettingsDTO,
  UserSessionDTO,
  // Posts 관련 타입들
  Platform,
  Model,
  Category,
  Tag,
  PostCard,
  PostCardData,
  PostCardFrontend,
  PostCard_bookmark,
  PostDetail,
  PostCreateRequest,
  PostUpdateRequest,
  PostEditData,
  PostInteractionRequest,
  PostInteractionResponse,
  PostListParams,
  PlatformModelsResponse,
  ModelSuggestResponse,
  // Core 관련 타입들
  SearchParams,
  SortOption,
  FilterOptions,
  // Trending 관련 타입들
  TrendingResponse,
  CategoryRankings,
  TrendingModelInfoResponse,
  TrendingModelPostsResponse,
  // 상수들
  API_ENDPOINTS,
  API_BASE_URL,
  HTTP_STATUS,
} from '@/types/api'

// ===========================================
// API 클라이언트 설정
// ===========================================

// 토큰 관리 함수들 (외부에서 사용 가능하도록 export)
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('prompthub_access_token')
}

const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('prompthub_access_token', token)
}

const removeAccessToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('prompthub_access_token')
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('prompthub_access_token')
  localStorage.removeItem('prompthub_session_key')
}

export const setTokens = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('prompthub_access_token', token)
}

// Axios 인스턴스 생성
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 요청 인터셉터
  client.interceptors.request.use(
    config => {
      const token = getAccessToken()
      logger.debug('🌐 API 요청 준비:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : 'none',
      })

      if (token) {
        config.headers.Authorization = `Token ${token}`
      }
      // 세션 키를 헤더로 전달해 서버가 현재 세션 식별 가능하도록 함
      if (typeof window !== 'undefined') {
        const sessionKey = localStorage.getItem('prompthub_session_key')
        if (sessionKey) {
          ;(config.headers as any)['X-Session-Key'] = sessionKey
        }
      }
      return config
    },
    error => Promise.reject(error),
  )

  // 응답 인터셉터
  client.interceptors.response.use(
    response => {
      logger.debug('✅ API 응답 성공:', {
        url: response.config.url,
        status: response.status,
        dataSize: JSON.stringify(response.data).length,
      })
      return response
    },
    error => {
      // 에러 정보를 더 명확하게 로깅
      const errorInfo = {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      }

      // 401 에러는 인증 관련이므로 경고 수준으로 로깅
      if (error.response?.status === 401) {
        logger.warn('🔐 인증 오류 (401):', errorInfo)
      } else {
        logger.error('❌ API 응답 실패:', errorInfo)
      }

      // 401 에러 시 토큰 제거
      if (error.response?.status === 401) {
        removeAccessToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      }

      return Promise.reject(createApiError(error))
    },
  )

  return client
}

// API 에러 생성 함수
const createApiError = (error: AxiosError): ApiRequestError => {
  const status = error.response?.status || 0
  const data = error.response?.data as any

  let message = '알 수 없는 오류가 발생했습니다.'
  let errors: unknown = null

  if (data) {
    if (typeof data === 'string') {
      message = data
    } else if (data.message) {
      message = data.message
    } else if (data.error) {
      message = data.error
    } else if (data.detail) {
      message = data.detail
    } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      message = data.non_field_errors.join(', ')
    } else if (typeof data === 'object') {
      // 필드별 에러가 있는 경우
      const fieldErrors = Object.entries(data)
        .filter(([_, value]) => Array.isArray(value) && value.length > 0)
        .map(([field, value]) => `${field}: ${(value as string[]).join(', ')}`)

      if (fieldErrors.length > 0) {
        message = fieldErrors.join('; ')
        errors = data
      }
    }
  } else if (error.message) {
    message = error.message
  }

  return {
    message,
    status,
    errors: data as ValidationError | undefined,
    timestamp: new Date().toISOString(),
  }
}

// API 클라이언트 인스턴스
export const apiClient = createApiClient()

// ===========================================
// HTTP 메서드 래퍼 함수들
// ===========================================

export const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, { params })
  return response.data
}

export const post = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data)
  return response.data
}

export const put = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data)
  return response.data
}

export const patch = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.patch(url, data)
  return response.data
}

export const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url)
  return response.data
}

// ===========================================
// 인증 관련 API
// ===========================================

export const authApi = {
  /** 회원가입 */
  register: async (data: UserRegistrationRequest): Promise<UserRegistrationResponse> => {
    const response = await post<UserRegistrationResponse>(API_ENDPOINTS.auth.register, data)
    if (response.token && typeof window !== 'undefined') {
      setAccessToken(response.token)
    }
    return response
  },

  /** 로그인 (세션 키 저장 포함) */
  login: async (data: UserLoginRequest): Promise<UserLoginResponse> => {
    const response = await post<any>(API_ENDPOINTS.auth.login, data)
    if (response.token && typeof window !== 'undefined') {
      setAccessToken(response.token)
      // 서버에서 세션 정보가 오면 세션 키 저장
      if (response.session?.key) {
        localStorage.setItem('prompthub_session_key', response.session.key)
      }
    }
    return response as UserLoginResponse
  },

  /** Google 로그인: id_token 제출 */
  loginWithGoogle: async (idToken: string): Promise<UserLoginResponse> => {
    const response = await post<any>(API_ENDPOINTS.auth.google, { id_token: idToken })
    if (response.token && typeof window !== 'undefined') {
      setAccessToken(response.token)
      if (response.session?.key) {
        localStorage.setItem('prompthub_session_key', response.session.key)
      }
    }
    return response as UserLoginResponse
  },

  /** 로그아웃 (토큰 제거) */
  logout: async (): Promise<void> => {
    try {
      await post(API_ENDPOINTS.auth.logout)
    } finally {
      removeAccessToken()
    }
  },

  /** TokenAuth 환경: 토큰 갱신 미지원 */
  refreshToken: async (_refreshToken: string): Promise<TokenRefreshResponse> => {
    throw new Error('Django Token Authentication은 토큰 갱신을 지원하지 않습니다.')
  },

  /** 사용자 프로필 조회 */
  getProfile: async (): Promise<UserProfileEnvelope> => {
    return (await apiClient.get<UserProfileEnvelope>(API_ENDPOINTS.auth.profile)).data
  },

  /** 사용자 프로필 업데이트 (파일이면 multipart PUT) */
  updateProfile: async (data: UserProfileUpdateRequest): Promise<UserProfileUpdateResponse> => {
    if (data.profile_image instanceof File) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as File | string)
        }
      })
      const response = await apiClient.put<UserProfileUpdateResponse>(
        API_ENDPOINTS.auth.profile,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return response.data
    }
    return put<UserProfileUpdateResponse>(API_ENDPOINTS.auth.profile, data)
  },

  /** 아바타(그라디언트) 재생성 / 옵션으로 username 재생성 */
  regenerateAvatar: async (
    regenerate_username = false,
  ): Promise<AvatarRegenerateResponse> => {
    return post<AvatarRegenerateResponse>(API_ENDPOINTS.auth.avatarRegenerate, {
      regenerate_username,
    })
  },

  /** 비밀번호 변경 (성공 시 신규 토큰 저장) */
  changePassword: async (data: PasswordChangeRequest): Promise<ChangePasswordResponse> => {
    const res = await post<ChangePasswordResponse>(API_ENDPOINTS.auth.passwordChange, data)
    if (res.token && typeof window !== 'undefined') {
      setAccessToken(res.token)
    }
    return res
  },

  /** 계정 삭제 (확인 문구 옵션) */
  deleteAccount: async (confirmation?: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.auth.profileDelete, {
      data: confirmation ? { confirmation } : undefined,
    })
    return response.data
  },

  /** 간단 사용자 정보 */
  getUserInfo: async (): Promise<UserData> => {
    return (await apiClient.get<UserData>(API_ENDPOINTS.auth.userInfo)).data
  },

  /** 사용자 설정 조회 */
  getSettings: async (): Promise<UserSettingsDTO> => {
    return (await apiClient.get<UserSettingsDTO>(API_ENDPOINTS.auth.settings)).data
  },

  /** 사용자 설정 업데이트 (Partial) */
  updateSettings: async (data: Partial<UserSettingsDTO>): Promise<UserSettingsDTO> => {
    return (await apiClient.patch<UserSettingsDTO>(API_ENDPOINTS.auth.settings, data)).data
  },

  /** 사용자 세션 목록 */
  getSessions: async (): Promise<UserSessionDTO[]> => {
    return (await apiClient.get<UserSessionDTO[]>(API_ENDPOINTS.auth.sessions)).data
  },

  /** 특정 세션 종료 */
  endSession: async (key: string): Promise<{ message: string }> => {
    return (
      await apiClient.delete<{ message: string }>(
        `${API_ENDPOINTS.auth.sessions}?key=${encodeURIComponent(key)}`,
      )
    ).data
  },

  /** 기타 모든 세션 종료 */
  endOtherSessions: async (): Promise<{ message: string; count: number }> => {
    return (
      await apiClient.delete<{ message: string; count: number }>(
        `${API_ENDPOINTS.auth.sessions}?all=true`,
      )
    ).data
  },
}

// ===========================================
// 게시글 관련 API
// ===========================================

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

// ===========================================
// 사용자 데이터 관련 API
// ===========================================

export const userDataApi = {
  getUserPosts: async (
    params?: UserPostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.my,
      params,
    )
  },

  getLikedPosts: async (
    params?: UserPostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    // 백엔드의 전용 liked-posts 엔드포인트 사용
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.liked,
      params,
    )
  },

  getBookmarkedPosts: async (
    params?: UserPostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    // 백엔드의 전용 bookmarked-posts 엔드포인트 사용
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.bookmarked,
      params,
    )
  },
}

// ===========================================
// 통계 관련 API
// ===========================================

export const statsApi = {
  /** 대시보드 통계 */
  getDashboardStats: async () => {
    return get<
      ApiResponse<{
        total_posts: number
        total_users: number
        total_views: number
        total_likes: number
        total_bookmarks: number
        avg_satisfaction?: number
        weekly_added_posts?: number
        active_users?: number
        recent_posts: PostCard[]
        popular_tags: Tag[]
        platform_distribution: Array<{ platform: string; count: number }>
      }>
    >(API_ENDPOINTS.stats.dashboard)
  },

  /** 사용자 통계 */
  getUserStats: async () => {
    return get<
      ApiResponse<{
        posts_count: number
        total_views: number
        total_likes: number
        total_bookmarks: number
        avg_satisfaction: number
        most_used_platform: string | null
        most_used_category: string | null
        recent_activity: {
          last_post_date: string | null
          last_like_date: string | null
          last_bookmark_date: string | null
        }
      }>
    >(API_ENDPOINTS.stats.user)
  },
}

// ===========================================
// 트렌딩 관련 API
// ===========================================

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

// ===========================================
// 코어 관련 API
// ===========================================

export const coreApi = {
  /** 통합 검색 */
  search: async (params: SearchParams): Promise<PaginatedResponse<PostCard>> => {
    return get<PaginatedResponse<PostCard>>(API_ENDPOINTS.core.search, params)
  },

  /** 정렬 옵션 목록 */
  getSortOptions: async (): Promise<SortOption[]> => {
    return get<SortOption[]>(API_ENDPOINTS.core.sortOptions)
  },

  /** 필터 옵션 */
  getFilterOptions: async (): Promise<FilterOptions> => {
    return get<FilterOptions>(API_ENDPOINTS.core.filterOptions)
  },
}

// ===========================================
// 메타데이터 관련 API
// ===========================================

export const metadataApi = {
  /** 게시글 작성에 필요한 메타데이터 일괄 로드 */
  getPostMetadata: async () => {
    const [platforms, categories, models, tags] = await Promise.all([
      postsApi.getPlatforms(),
      postsApi.getCategories(),
      postsApi.getModels(),
      postsApi.getTags(),
    ])

    return { platforms, categories, models, tags }
  },

  /** 검색/필터링에 필요한 메타데이터 일괄 로드 */
  getSearchMetadata: async () => {
    const [sortOptions, filterOptions] = await Promise.all([
      coreApi.getSortOptions(),
      coreApi.getFilterOptions(),
    ])
    return { sortOptions, filterOptions }
  },
}

// ===========================================
// 타입 내보내기
// ===========================================

export type {
  // 공통 타입들
  ApiResponse,
  PaginatedResponse,
  ApiRequestError,
  ValidationError,
  AuthTokens,
  // Users 관련 타입들
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserData,
  UserProfileResponse,
  UserProfileEnvelope,
  UserProfileUpdateResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  ChangePasswordResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserPostListParams,
  UserSettingsDTO,
  UserSessionDTO,
  // Posts 관련 타입들
  Platform,
  Model,
  Category,
  Tag,
  PostCard,
  PostCardData,
  PostCardFrontend,
  PostCard_bookmark,
  PostDetail,
  PostCreateRequest,
  PostUpdateRequest,
  PostEditData,
  PostInteractionRequest,
  PostInteractionResponse,
  PostListParams,
  PlatformModelsResponse,
  ModelSuggestResponse,
  // Core 관련 타입들
  SearchParams,
  SortOption,
  FilterOptions,
  // Trending 관련 타입들
  TrendingResponse,
  CategoryRankings,
  TrendingModelInfoResponse,
  TrendingModelPostsResponse,
}
