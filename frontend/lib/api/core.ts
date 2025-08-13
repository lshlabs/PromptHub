import type {
  PaginatedResponse,
  PostCard,
  SearchParams,
  SortOption,
  FilterOptions,
} from '@/types/api'
import { API_ENDPOINTS } from '@/types/api'
import { get } from '@/lib/api/client'

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
