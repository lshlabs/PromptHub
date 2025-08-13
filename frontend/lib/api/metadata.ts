import { postsApi } from '@/lib/api/posts'

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

  /** 검색/필터링에 필요한 메타데이터 일괄 로드 (동적 import) */
  getSearchMetadata: async () => {
    const core = await import('@/lib/api/core')
    const [sortOptions, filterOptions] = await Promise.all([
      core.coreApi.getSortOptions(),
      core.coreApi.getFilterOptions(),
    ])
    return { sortOptions, filterOptions }
  },
}
