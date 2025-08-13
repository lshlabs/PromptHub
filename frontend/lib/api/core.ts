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
  search: async (params: SearchParams): Promise<PaginatedResponse<PostCard>> => {
    return get<PaginatedResponse<PostCard>>(API_ENDPOINTS.core.search, params)
  },

  getSortOptions: async (): Promise<SortOption[]> => {
    return get<SortOption[]>(API_ENDPOINTS.core.sortOptions)
  },

  getFilterOptions: async (): Promise<FilterOptions> => {
    return get<FilterOptions>(API_ENDPOINTS.core.filterOptions)
  },
}
