/**
 * Mock API for development with sample data
 * 백엔드 API 구현 전까지 샘플 데이터와 함께 사용하는 모의 API
 */

import { samplePostDetails } from '@/sampledata/SamplePostDetail'
import type { PostDetail } from '@/sampledata/datatype_sample'

// 로컬스토리지 키 상수
const STORAGE_KEYS = {
  LIKED_POSTS: 'prompthub_liked_posts',
  BOOKMARKED_POSTS: 'prompthub_bookmarked_posts',
  POST_VIEWS: 'prompthub_post_views',
} as const

// 로컬스토리지 헬퍼 함수들
const storage = {
  getLikedPosts(): Set<number> {
    if (typeof window === 'undefined') return new Set()
    const saved = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS)
    return new Set(saved ? JSON.parse(saved) : [])
  },

  setLikedPosts(postIds: Set<number>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify([...postIds]))
  },

  getBookmarkedPosts(): Set<number> {
    if (typeof window === 'undefined') return new Set()
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKED_POSTS)
    return new Set(saved ? JSON.parse(saved) : [])
  },

  setBookmarkedPosts(postIds: Set<number>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.BOOKMARKED_POSTS, JSON.stringify([...postIds]))
  },

  getPostViews(): Record<number, number> {
    if (typeof window === 'undefined') return {}
    const saved = localStorage.getItem(STORAGE_KEYS.POST_VIEWS)
    return saved ? JSON.parse(saved) : {}
  },

  setPostViews(views: Record<number, number>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.POST_VIEWS, JSON.stringify(views))
  },
}

// 게시글 상세 조회 (조회수 증가 포함)
export async function mockGetPost(id: number): Promise<{ status: string; data: PostDetail }> {
  // 인위적 지연 (실제 API 호출처럼)
  await new Promise(resolve => setTimeout(resolve, 100))

  const post = samplePostDetails.find(p => p.id === id)
  if (!post) {
    throw new Error(`게시글을 찾을 수 없습니다. ID: ${id}`)
  }

  // 조회수 증가 (중복 방지를 위해 세션스토리지 활용)
  const views = storage.getPostViews()
  const sessionKey = `viewed_${id}`
  const hasViewed = sessionStorage.getItem(sessionKey)

  if (!hasViewed) {
    views[id] = (views[id] || post.views) + 1
    storage.setPostViews(views)
    sessionStorage.setItem(sessionKey, 'true')
  }

  // 좋아요/북마크 상태 반영
  const likedPosts = storage.getLikedPosts()
  const bookmarkedPosts = storage.getBookmarkedPosts()

  const postWithState: PostDetail = {
    ...post,
    views: views[id] || post.views,
    isLiked: likedPosts.has(id),
    isBookmarked: bookmarkedPosts.has(id),
  }

  return {
    status: 'success',
    data: postWithState,
  }
}

// 좋아요 토글
export async function mockToggleLike(postId: number): Promise<{
  status: string
  data: {
    is_liked: boolean
    like_count: number
  }
}> {
  // 인위적 지연
  await new Promise(resolve => setTimeout(resolve, 200))

  const post = samplePostDetails.find(p => p.id === postId)
  if (!post) {
    throw new Error(`게시글을 찾을 수 없습니다. ID: ${postId}`)
  }

  const likedPosts = storage.getLikedPosts()
  const isCurrentlyLiked = likedPosts.has(postId)

  let newLikeCount = post.likes
  let newIsLiked = false

  if (isCurrentlyLiked) {
    // 좋아요 취소
    likedPosts.delete(postId)
    newLikeCount = Math.max(0, newLikeCount - 1)
    newIsLiked = false
  } else {
    // 좋아요 추가
    likedPosts.add(postId)
    newLikeCount = newLikeCount + 1
    newIsLiked = true
  }

  storage.setLikedPosts(likedPosts)

  // 원본 샘플 데이터도 업데이트 (메모리에서만)
  post.likes = newLikeCount
  post.isLiked = newIsLiked

  return {
    status: 'success',
    data: {
      is_liked: newIsLiked,
      like_count: newLikeCount,
    },
  }
}

// 북마크 토글
export async function mockToggleBookmark(postId: number): Promise<{
  status: string
  data: {
    is_bookmarked: boolean
    bookmark_count: number
  }
}> {
  // 인위적 지연
  await new Promise(resolve => setTimeout(resolve, 200))

  const post = samplePostDetails.find(p => p.id === postId)
  if (!post) {
    throw new Error(`게시글을 찾을 수 없습니다. ID: ${postId}`)
  }

  const bookmarkedPosts = storage.getBookmarkedPosts()
  const isCurrentlyBookmarked = bookmarkedPosts.has(postId)

  let newBookmarkCount = post.bookmarks
  let newIsBookmarked = false

  if (isCurrentlyBookmarked) {
    // 북마크 취소
    bookmarkedPosts.delete(postId)
    newBookmarkCount = Math.max(0, newBookmarkCount - 1)
    newIsBookmarked = false
  } else {
    // 북마크 추가
    bookmarkedPosts.add(postId)
    newBookmarkCount = newBookmarkCount + 1
    newIsBookmarked = true
  }

  storage.setBookmarkedPosts(bookmarkedPosts)

  // 원본 샘플 데이터도 업데이트 (메모리에서만)
  post.bookmarks = newBookmarkCount
  post.isBookmarked = newIsBookmarked

  return {
    status: 'success',
    data: {
      is_bookmarked: newIsBookmarked,
      bookmark_count: newBookmarkCount,
    },
  }
}

// 로컬스토리지 초기화 (개발용)
export function clearMockData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.LIKED_POSTS)
  localStorage.removeItem(STORAGE_KEYS.BOOKMARKED_POSTS)
  localStorage.removeItem(STORAGE_KEYS.POST_VIEWS)
}
