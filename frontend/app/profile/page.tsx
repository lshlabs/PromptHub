'use client'

import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ProfileInfoCard, ProfileStatsSection, ProfilePostsSection } from '@/components/profile'
import { authApi } from '@/lib/api/auth'
import { userDataApi } from '@/lib/api/userData'
import { statsApi } from '@/lib/api/stats'
import { handleApiError } from '@/lib/api/client'
import { useAuthContext } from '@/components/layout/auth-provider'
import { useAuth } from '@/hooks/use-auth'

// 프론트엔드 사용자 데이터 타입
interface ProfileUserData {
  username: string
  bio: string
  location: string
  githubHandle: string
  profileImage: string | null
  avatarColor1: string
  avatarColor2: string
}

// 백엔드 게시글 데이터 타입
interface BackendPostData {
  id: number
  title: string
  satisfaction: number | null
  author: string
  authorInitial: string
  avatarSrc: string | null
  createdAt: string
  relativeTime: string
  views: number
  platformId: number
  modelId?: number
  categoryId: number
  modelEtc?: string
  categoryEtc?: string
  likes: number
  isLiked: boolean
  bookmarks: number
  isBookmarked: boolean
  tags: string[]
}

// PostCard 타입 import
import type { PostCard } from '@/types/api'

export default function ProfilePage() {
  const router = useRouter()
  const { refreshUser } = useAuthContext()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // 중복 실행 방지 플래그 (useRef 사용)
  const isLoadingDataRef = useRef(false)

  // 사용자 데이터 상태
  const [userData, setUserData] = useState<ProfileUserData>({
    username: '사용자',
    bio: '',
    location: '',
    githubHandle: '',
    profileImage: null,
    avatarColor1: '#6B73FF',
    avatarColor2: '#9EE5FF',
  })

  // 게시글 데이터 상태
  const [userPosts, setUserPosts] = useState<PostCard[]>([])
  const [likedPosts, setLikedPosts] = useState<PostCard[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PostCard[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [likedLoading, setLikedLoading] = useState(false)
  const [bookmarkedLoading, setBookmarkedLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'liked' | 'bookmarked'>('my')
  const [backendStats, setBackendStats] = useState({
    postsCount: 0,
    totalLikes: 0,
    totalViews: 0,
    totalBookmarks: 0,
  })

  // (간소화) 백엔드→프론트 데이터 변환은 각 API에서 이미 일관화되어 있어 별도 변환 함수 생략

  // 통계 데이터 계산 (백엔드 데이터 우선 사용)
  const stats = {
    postCount: backendStats.postsCount,
    likeCount: backendStats.totalLikes,
    bookmarkCount: backendStats.totalBookmarks,
    viewCount: backendStats.totalViews,
  }

  // 백엔드 데이터를 프론트엔드 형식으로 변환
  const transformBackendData = (backendData: any): ProfileUserData => {
    const userData = backendData.user || backendData
    return {
      username: userData.username || '사용자',
      bio: userData.bio || '',
      location: userData.location || '',
      githubHandle: userData.github_handle || '',
      profileImage: userData.profile_image || null,
      avatarColor1: userData.avatar_color1 || '#6B73FF',
      avatarColor2: userData.avatar_color2 || '#9EE5FF',
    }
  }

  // 프로필 데이터 로드
  const loadProfileData = async () => {
    // 중복 실행 방지
    if (isLoadingDataRef.current) {
      console.log('⚠️ 이미 데이터 로딩 중 - 중복 실행 방지')
      return
    }

    try {
      isLoadingDataRef.current = true
      setIsLoading(true)
      const [profileRes, statsRes, myPostsRes] = await Promise.all([
        authApi.getProfile(),
        statsApi.getUserStats(),
        userDataApi.getUserPosts({ page: 1, page_size: 50 }),
      ])

      if (!profileRes) {
        throw new Error('사용자 데이터를 찾을 수 없습니다.')
      }

      // 사용자 프로필 데이터 변환
      const transformedData = transformBackendData(profileRes)
      setUserData(transformedData)

      // 사용자 게시글 (API 결과 사용)
      if (myPostsRes?.data?.results && Array.isArray(myPostsRes.data.results)) {
        setUserPosts(myPostsRes.data.results)
      }

      // 사용자 통계 (API 결과 사용)
      if (statsRes?.data) {
        const s = statsRes.data
        setBackendStats({
          postsCount: s.posts_count || 0,
          totalLikes: s.total_likes || 0,
          totalViews: s.total_views || 0,
          totalBookmarks: s.total_bookmarks || 0,
        })
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
      isLoadingDataRef.current = false
    }
  }

  // 사용자 정보가 있을 때 프로필 데이터 로드
  useEffect(() => {
    if (user && !authLoading) {
      loadProfileData()
    }
  }, [user, authLoading])

  // 탭 전환 시 좋아요/북마크 Lazy-load
  useEffect(() => {
    const loadLiked = async () => {
      try {
        setLikedLoading(true)
        const res = await userDataApi.getLikedPosts({ page: 1, page_size: 50 })
        if (res?.data?.results) setLikedPosts(res.data.results)
      } catch (e) {
        console.warn('좋아요한 게시글 로드 실패', e)
        setLikedPosts([])
      } finally {
        setLikedLoading(false)
      }
    }
    const loadBookmarked = async () => {
      try {
        setBookmarkedLoading(true)
        const res = await userDataApi.getBookmarkedPosts({ page: 1, page_size: 50 })
        if (res?.data?.results) setBookmarkedPosts(res.data.results)
      } catch (e) {
        console.warn('북마크한 게시글 로드 실패', e)
        setBookmarkedPosts([])
      } finally {
        setBookmarkedLoading(false)
      }
    }

    if (activeTab === 'liked' && likedPosts.length === 0 && !likedLoading) {
      loadLiked()
    }
    if (activeTab === 'bookmarked' && bookmarkedPosts.length === 0 && !bookmarkedLoading) {
      loadBookmarked()
    }
  }, [activeTab, likedPosts.length, bookmarkedPosts.length, likedLoading, bookmarkedLoading])

  // 이벤트 핸들러들
  const handleSave = async (newUserData: ProfileUserData) => {
    try {
      setIsSaving(true)

      // 백엔드로 전송할 데이터 준비
      const updateData: any = {}
      if (newUserData.username !== userData.username) updateData.username = newUserData.username
      if (newUserData.bio !== userData.bio) updateData.bio = newUserData.bio
      if (newUserData.location !== userData.location) updateData.location = newUserData.location
      if (newUserData.githubHandle !== userData.githubHandle)
        updateData.github_handle = newUserData.githubHandle

      // 프로필 이미지 업로드는 추후 파일 업로드 구현 시 처리

      const response = await authApi.updateProfile(updateData)
      const updatedBackendData = response
      if (!updatedBackendData) {
        throw new Error('업데이트된 사용자 데이터를 찾을 수 없습니다.')
      }
      const transformedData = transformBackendData(updatedBackendData)

      setUserData(transformedData)
      setIsEditing(false)
      toast({
        title: '성공',
        description: '프로필이 성공적으로 업데이트되었습니다.',
      })

      // 전역 상태 업데이트하여 Header 등 모든 컴포넌트 새로고침
      await refreshUser()
    } catch (error) {
      const errorMessage = handleApiError(error)
      console.warn(`[프로필 저장 실패] ${errorMessage}`)
      toast({
        title: '오류',
        description: `프로필 저장에 실패했습니다: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handlePostClick = (postId: number) => {
    router.push(`/post/${postId}?from=profile`)
  }

  const handleAccountSettingsClick = () => {
    router.push('/profile/settings')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-1">
          <ProfileInfoCard
            userData={userData}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onAccountSettings={handleAccountSettingsClick}
            isLoading={isLoading || isSaving}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:col-span-2">
          <ProfileStatsSection stats={stats} isLoading={isLoading} title={''} contained />
          <Card className="overflow-hidden border border-gray-100 bg-white">
            <CardHeader className="pb-2">
              <Tabs
                value={activeTab}
                onValueChange={v => setActiveTab(v as 'my' | 'liked' | 'bookmarked')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="my">내 리뷰</TabsTrigger>
                  <TabsTrigger value="liked">좋아요</TabsTrigger>
                  <TabsTrigger value="bookmarked">북마크</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-2">
              {(() => {
                const postsForTab =
                  activeTab === 'my'
                    ? userPosts
                    : activeTab === 'liked'
                      ? likedPosts
                      : bookmarkedPosts
                const loadingForTab =
                  activeTab === 'my'
                    ? isLoading
                    : activeTab === 'liked'
                      ? likedLoading
                      : bookmarkedLoading
                const variantForTab: 'default' | 'bookmark' | 'trending' | 'user-posts' =
                  activeTab === 'bookmarked'
                    ? 'bookmark'
                    : activeTab === 'my'
                      ? 'user-posts'
                      : 'default'
                return (
                  <ProfilePostsSection
                    posts={postsForTab}
                    onPostClick={handlePostClick}
                    isLoading={loadingForTab}
                    variant={variantForTab}
                    title={''}
                    contained
                  />
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
