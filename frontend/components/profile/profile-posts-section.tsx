'use client'

import { PostList } from '@/components/posts'
import type { PostCard } from '@/types/api'

interface ProfilePostsSectionProps {
  posts: PostCard[]
  onPostClick: (postId: number) => void
  onRemoveBookmark?: (bookmarkId: number) => void
  isLoading?: boolean
  variant?: 'default' | 'bookmark' | 'trending' | 'user-posts'
  title?: string
  contained?: boolean
  platformsData?: any[]
  modelsData?: any[]
  categoriesData?: any[]
}

export function ProfilePostsSection({
  posts,
  onPostClick,
  onRemoveBookmark,
  isLoading = false,
  variant = 'user-posts',
  title = '내 리뷰',
  contained = false,
  platformsData,
  modelsData,
  categoriesData,
}: ProfilePostsSectionProps) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    contained ? (
      <>{children}</>
    ) : (
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">{children}</div>
    )

  return (
    <Wrapper>
      {title ? <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2> : null}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ) : (
        <PostList
          posts={posts}
          onPostClick={onPostClick}
          onRemoveBookmark={onRemoveBookmark}
          variant={variant}
          pagination={true}
          itemsPerPage={5}
          platformsData={platformsData}
          modelsData={modelsData}
          categoriesData={categoriesData}
        />
      )}
    </Wrapper>
  )
}
