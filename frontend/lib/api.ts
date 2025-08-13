// ===========================================
// API 클라이언트 - Django 백엔드와의 통신을 위한 함수들
// ===========================================

import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios'
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
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserPostListParams,
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
  // Core 관련 타입들
  SearchParams,
  SortOption,
  FilterOptions,
  // 상수들
  API_ENDPOINTS,
} from '@/types/api'
// 새 모듈 import (호환 레이어용)
import { authApi as newAuthApi } from '@/lib/api/auth'
import { postsApi as newPostsApi } from '@/lib/api/posts'
import { coreApi as newCoreApi } from '@/lib/api/core'
import { metadataApi as newMetadataApi } from '@/lib/api/metadata'
import { userDataApi as newUserDataApi } from '@/lib/api/userData'
import { statsApi as newStatsApi } from '@/lib/api/stats'

// 기존 import 경로 호환을 위한 named export 유지
export { authApi } from '@/lib/api/auth'
export { postsApi } from '@/lib/api/posts'
export { coreApi } from '@/lib/api/core'
export { metadataApi } from '@/lib/api/metadata'
export { userDataApi } from '@/lib/api/userData'
export { statsApi } from '@/lib/api/stats'
// 모듈 분리 준비 중: 기존 파일은 호환성을 위해 유지

// ===========================================
// Axios 인스턴스 설정
// ===========================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use(
    config => {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Token ${token}`
      }
      return config
    },
    error => Promise.reject(error),
  )

  return client
}

const apiClient = createApiClient()

// ===========================================
// 토큰 관리 함수들
// ===========================================

const TOKEN_KEYS = {
  ACCESS: 'prompthub_access_token',
  REFRESH: 'prompthub_refresh_token',
} as const

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEYS.ACCESS)
}

export const getRefreshToken = (): string | null => {
  // Django Token Authentication은 refresh token이 없음
  return null
}

export const setTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.ACCESS, tokens.access)
  // Django Token Authentication은 refresh token 저장 불필요
}

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEYS.ACCESS, token)
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEYS.ACCESS)
  // Django Token Authentication은 refresh token 제거 불필요
}

export const isAuthenticated = (): boolean => {
  return !!getAccessToken()
}

// ===========================================
// 에러 처리 함수들
// ===========================================

// 에러 객체 표준화
const createApiError = (error: AxiosError): ApiRequestError => {
  if (!error.response) {
    return {
      message: '네트워크 연결을 확인해주세요.',
      code: error.code,
      isNetworkError: true,
    } as any
  }

  const { status, data } = error.response
  let message = '알 수 없는 오류가 발생했습니다.'

  if (typeof data === 'object' && data !== null) {
    if ('detail' in (data as any)) {
      message = String((data as any).detail)
    } else if ('message' in (data as any)) {
      message = String((data as any).message)
    } else if ('error' in (data as any)) {
      message = String((data as any).error)
    } else if (
      'non_field_errors' in (data as any) &&
      Array.isArray((data as any).non_field_errors)
    ) {
      message = (data as any).non_field_errors.join(' ')
    }
  }

  return {
    status: status as number,
    message,
    detail: typeof data === 'object' ? JSON.stringify(data) : String(data),
    errors: data as ValidationError,
    timestamp: new Date().toISOString(),
  }
}

// ===========================================
// 공통 API 함수들
// ===========================================

const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, { params })
  return response.data
}

const post = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data)
  return response.data
}

const put = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data)
  return response.data
}

const patch = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.patch(url, data)
  return response.data
}

const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url)
  return response.data
}

// 파일 업로드용 함수
const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// ===========================================
// Users 앱 API 함수들
// ===========================================

const legacy_authApi = {
  // 회원가입
  register: async (data: UserRegistrationRequest): Promise<UserRegistrationResponse> => {
    const response = await post<UserRegistrationResponse>(API_ENDPOINTS.auth.register, data)

    // 회원가입 성공 시 토큰 저장 (Django Token Authentication)
    if (response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEYS.ACCESS, response.token)
      }
    }

    return response
  },

  // 로그인
  login: async (data: UserLoginRequest): Promise<UserLoginResponse> => {
    const response = await post<UserLoginResponse>(API_ENDPOINTS.auth.login, data)

    // 로그인 성공 시 토큰 저장 (Django Token Authentication)
    if (response.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEYS.ACCESS, response.token)
      }
    }

    return response
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    try {
      await post(API_ENDPOINTS.auth.logout)
    } finally {
      // 로그아웃 성공/실패와 관계없이 토큰 제거
      clearTokens()
    }
  },

  // Django Token Authentication은 토큰 갱신이 없음
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    throw new Error('Django Token Authentication은 토큰 갱신을 지원하지 않습니다.')
  },

  // 사용자 프로필 조회
  getProfile: async (): Promise<UserProfileResponse> => {
    return get<UserProfileResponse>(API_ENDPOINTS.auth.profile)
  },

  // 사용자 프로필 수정
  updateProfile: async (data: UserProfileUpdateRequest): Promise<UserData> => {
    // 서버는 PUT을 허용하므로 PUT으로 통일 (파일 포함 시 multipart PUT)
    if (data.profile_image instanceof File) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as File | string)
        }
      })
      const response = await apiClient.put<UserData>(API_ENDPOINTS.auth.profile, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    return put<UserData>(API_ENDPOINTS.auth.profile, data)
  },

  // 비밀번호 변경
  changePassword: async (data: PasswordChangeRequest): Promise<void> => {
    return post(API_ENDPOINTS.auth.passwordChange, data)
  },

  // 사용자 정보 조회 (간단한 정보)
  getUserInfo: async (): Promise<UserData> => {
    return get<UserData>(API_ENDPOINTS.auth.userInfo)
  },
}

// ===========================================
// Posts 앱 API 함수들
// ===========================================

const legacy_postsApi = {
  // 게시글 목록 조회 (페이지네이션)
  getPosts: async (
    params?: PostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.list,
      params,
    )
  },

  // 게시글 상세 조회
  getPost: async (id: number): Promise<ApiResponse<PostDetail>> => {
    return get<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.detail(id))
  },

  // 게시글 생성
  createPost: async (data: PostCreateRequest): Promise<ApiResponse<PostDetail>> => {
    return post<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.create, data)
  },

  // 게시글 수정용 데이터 조회
  getPostForEdit: async (id: number): Promise<ApiResponse<PostEditData>> => {
    return get<ApiResponse<PostEditData>>(API_ENDPOINTS.posts.detail(id))
  },

  // 게시글 수정
  updatePost: async (id: number, data: PostUpdateRequest): Promise<ApiResponse<PostDetail>> => {
    return put<ApiResponse<PostDetail>>(API_ENDPOINTS.posts.update(id), data)
  },

  // 게시글 좋아요/좋아요 취소
  toggleLike: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.like(id))
  },

  // 게시글 북마크/북마크 취소
  toggleBookmark: async (id: number): Promise<ApiResponse<PostInteractionResponse>> => {
    return post<ApiResponse<PostInteractionResponse>>(API_ENDPOINTS.posts.bookmark(id))
  },

  // 플랫폼 목록 조회
  getPlatforms: async (): Promise<ApiResponse<Platform[]>> => {
    return get<ApiResponse<Platform[]>>(API_ENDPOINTS.posts.platforms)
  },

  // 모델 목록 조회
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    return get<ApiResponse<Model[]>>(API_ENDPOINTS.posts.models)
  },

  // 특정 플랫폼의 모델 목록 조회 (기본 모델 포함)
  getPlatformModels: async (platformId: number): Promise<ApiResponse<PlatformModelsResponse>> => {
    return get<ApiResponse<PlatformModelsResponse>>(API_ENDPOINTS.posts.platformModels(platformId))
  },

  // 카테고리 목록 조회
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return get<ApiResponse<Category[]>>(API_ENDPOINTS.posts.categories)
  },

  // 태그 목록 조회 (사용 빈도 포함)
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    return get<ApiResponse<Tag[]>>(API_ENDPOINTS.posts.tags)
  },
}

// ===========================================
// Core 앱 API 함수들
// ===========================================

const legacy_coreApi = {
  // 통합 검색
  search: async (params: SearchParams): Promise<PaginatedResponse<PostCard>> => {
    return get<PaginatedResponse<PostCard>>(API_ENDPOINTS.core.search, params)
  },

  // 정렬 옵션 조회
  getSortOptions: async (): Promise<SortOption[]> => {
    return get<SortOption[]>(API_ENDPOINTS.core.sortOptions)
  },

  // 필터 옵션 조회
  getFilterOptions: async (): Promise<FilterOptions> => {
    return get<FilterOptions>(API_ENDPOINTS.core.filterOptions)
  },
}

// ===========================================
// 메타데이터 API (여러 앱의 데이터를 한 번에)
// ===========================================

const legacy_metadataApi = {
  // 게시글 작성에 필요한 모든 메타데이터 조회
  getPostMetadata: async () => {
    const [platforms, categories, models, tags] = await Promise.all([
      newPostsApi.getPlatforms(),
      newPostsApi.getCategories(),
      newPostsApi.getModels(),
      newPostsApi.getTags(),
    ])

    return {
      platforms,
      categories,
      models,
      tags,
    }
  },

  // 검색/필터링에 필요한 모든 옵션 조회
  getSearchMetadata: async () => {
    const [sortOptions, filterOptions] = await Promise.all([
      newCoreApi.getSortOptions(),
      newCoreApi.getFilterOptions(),
    ])

    return {
      sortOptions,
      filterOptions,
    }
  },
}

// ===========================================
// 사용자별 데이터 API
// ===========================================

const legacy_userDataApi = {
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
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.liked,
      params,
    )
  },

  getBookmarkedPosts: async (
    params?: UserPostListParams,
  ): Promise<{ status: 'success'; data: PaginatedResponse<PostCard> }> => {
    return get<{ status: 'success'; data: PaginatedResponse<PostCard> }>(
      API_ENDPOINTS.posts.bookmarked,
      params,
    )
  },
}

// ===========================================
// 통계 API
// ===========================================

const legacy_statsApi = {
  // 대시보드 통계
  getDashboardStats: async () => {
    return get<
      ApiResponse<{
        total_posts: number
        total_users: number
        total_views: number
        total_likes: number
        total_bookmarks: number
        recent_posts: PostCard[]
        popular_tags: Tag[]
        platform_distribution: Array<{ platform: string; count: number }>
      }>
    >(API_ENDPOINTS.stats.dashboard)
  },

  // 사용자별 통계
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
// 내보내기할 기본 API 객체
// ===========================================

const api = {
  auth: newAuthApi,
  posts: newPostsApi,
  core: newCoreApi,
  metadata: newMetadataApi,
  userData: newUserDataApi,
  stats: newStatsApi,

  // 토큰 관리 함수들도 포함
  tokens: {
    get: getAccessToken,
    getRefresh: getRefreshToken,
    set: setTokens,
    clear: clearTokens,
    isAuthenticated,
  },
}

export default api

// ===========================================
// 타입들 re-export (다른 컴포넌트에서 사용할 수 있도록)
// ===========================================

export type {
  // 공통 타입들
  ApiResponse,
  PaginatedResponse,
  ApiRequestError,
  AuthTokens,
  // Users 관련 타입들
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserData,
  UserProfileResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  TokenRefreshRequest,
  TokenRefreshResponse,
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
  // Core 관련 타입들
  SearchParams,
  SortOption,
  FilterOptions,
}

// 호환성을 위한 타입 alias
export type PostWrite = PostCreateRequest

// ===========================================
// 모든 API 객체와 함수들은 이미 위에서 개별적으로 export됨
// ===========================================

// ===========================================
// 타입 가드 및 유틸리티 함수들
// ===========================================

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = createApiError(error)
    return apiError.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다.'
}

export const isApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return response && typeof response === 'object'
}

export const isPaginatedResponse = <T>(response: any): response is PaginatedResponse<T> => {
  return (
    response &&
    typeof response === 'object' &&
    'results' in response &&
    Array.isArray(response.results) &&
    'count' in response &&
    typeof response.count === 'number'
  )
}

// ===========================================
// React Query 키 생성 함수들 (선택사항)
// ===========================================

export const queryKeys = {
  // Users
  userProfile: ['user', 'profile'] as const,
  userInfo: ['user', 'info'] as const,

  // Posts
  posts: (params?: PostListParams) => ['posts', params] as const,
  post: (id: number) => ['posts', id] as const,
  postEdit: (id: number) => ['posts', id, 'edit'] as const,

  // Metadata
  platforms: ['metadata', 'platforms'] as const,
  models: ['metadata', 'models'] as const,
  platformModels: (platformId: number) => ['metadata', 'platforms', platformId, 'models'] as const,
  categories: ['metadata', 'categories'] as const,
  tags: ['metadata', 'tags'] as const,

  // Search
  search: (params: SearchParams) => ['search', params] as const,
  sortOptions: ['search', 'sortOptions'] as const,
  filterOptions: ['search', 'filterOptions'] as const,

  // User Data (백엔드에 해당 엔드포인트 없음)
  // userPosts: (params?: PostListParams) => ['user', 'posts', params] as const,
  // likedPosts: (params?: PostListParams) => ['user', 'liked', params] as const,
  // bookmarkedPosts: (params?: PostListParams) => ['user', 'bookmarked', params] as const,

  // Stats (백엔드에 해당 엔드포인트 없음)
  // dashboardStats: ['stats', 'dashboard'] as const,
  // userStats: ['stats', 'user'] as const,
}
