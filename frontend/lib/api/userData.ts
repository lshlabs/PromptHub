import type { PaginatedResponse, PostCard, UserPostListParams } from '@/types/api'
import { API_ENDPOINTS } from '@/types/api'
import { get } from '@/lib/api/client'

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

export type { UserPostListParams }
