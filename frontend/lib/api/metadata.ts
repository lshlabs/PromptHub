import { postsApi } from '@/lib/api/posts'

export const metadataApi = {
  getPostMetadata: async () => {
    const [platforms, categories, models, tags] = await Promise.all([
      postsApi.getPlatforms(),
      postsApi.getCategories(),
      postsApi.getModels(),
      postsApi.getTags(),
    ])

    return { platforms, categories, models, tags }
  },

  getSearchMetadata: async () => {
    const core = await import('@/lib/api/core')
    const [sortOptions, filterOptions] = await Promise.all([
      core.coreApi.getSortOptions(),
      core.coreApi.getFilterOptions(),
    ])
    return { sortOptions, filterOptions }
  },
}
