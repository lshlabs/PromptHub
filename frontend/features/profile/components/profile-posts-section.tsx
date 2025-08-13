'use client'

import { PostList } from '@/features/posts'
import type { PostCard } from '@/types/api'

interface ProfilePostsSectionProps {
  posts: PostCard[]
  onPostClick: (postId: number) => void
}

export function ProfilePostsSection({ posts, onPostClick }: ProfilePostsSectionProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-gray-900">내 리뷰</h2>
      <PostList
        posts={posts}
        onPostClick={onPostClick}
        variant="user-posts"
        pagination={true}
        itemsPerPage={5}
      />
    </div>
  )
}
