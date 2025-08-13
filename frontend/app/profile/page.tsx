'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ProfileInfoCard, ProfileStatsSection, ProfilePostsSection } from '@/features/profile'
import { authApi } from '@/lib/api/auth'
import { userDataApi } from '@/lib/api/userData'
import { statsApi } from '@/lib/api/stats'
import { handleApiError, getAccessToken } from '@/lib/api/client'
import type { UserData as BackendUserData } from '@/types/api'
import { useAuthContext } from '@/features/auth'
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
import type { PostCard } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { refreshUser } = useAuthContext()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // 중복 실행 방지 플래그 (useRef 사용)
  const isLoadingDataRef = useRef(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

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
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [backendStats, setBackendStats] = useState({
    postsCount: 0,
    totalLikes: 0,
    totalViews: 0,
    totalBookmarks: 0,
  })

  // 백엔드 게시글 데이터를 PostCard 형식으로 변환
  const transformBackendPostData = (backendPost: BackendPostData): PostCard => {
    return {
      id: backendPost.id,
      title: backendPost.title,
      author: backendPost.author,
      authorInitial: backendPost.authorInitial,
      avatarSrc: backendPost.avatarSrc || undefined,
      createdAt: backendPost.createdAt,
      relativeTime: backendPost.relativeTime,
      views: backendPost.views,
      platformId: backendPost.platformId,
      modelId: backendPost.modelId,
      categoryId: backendPost.categoryId,
      modelEtc: backendPost.modelEtc,
      categoryEtc: backendPost.categoryEtc,
      satisfaction: backendPost.satisfaction || undefined,
      tags: backendPost.tags,
      likes: backendPost.likes,
      isLiked: backendPost.isLiked,
      bookmarks: backendPost.bookmarks,
      isBookmarked: backendPost.isBookmarked,
    }
  }

  // 통계 데이터 계산 (백엔드 데이터 우선 사용)
  const stats = {
    postCount: backendStats.postsCount,
    likeCount: backendStats.totalLikes,
    bookmarkCount: backendStats.totalBookmarks,
    viewCount: backendStats.totalViews,
  }

  // 백엔드 데이터를 프론트엔드 형식으로 변환
  const transformBackendData = (backendData: any): ProfileUserData => {
    console.log('🔍 transformBackendData 입력:', backendData)

    // 백엔드 응답이 {user: {...}} 형태인 경우 user 객체 추출
    const userData = backendData.user || backendData

    console.log('🔍 추출된 userData:', userData)

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
      console.log('🔍 loadProfileData 시작')
      isLoadingDataRef.current = true
      setIsLoading(true)

      console.log('✅ 프로필/통계/목록 데이터 로드 시작')
      const [profileRes, statsRes, myPostsRes] = await Promise.all([
        authApi.getProfile(),
        statsApi.getUserStats(),
        userDataApi.getUserPosts({ page: 1, page_size: 50 }),
      ])
      console.log('🔍 프로필 API 응답:', profileRes)
      console.log('🔍 사용자 통계 응답:', statsRes)
      console.log('🔍 사용자 게시글 응답:', myPostsRes)

      if (!profileRes) {
        throw new Error('사용자 데이터를 찾을 수 없습니다.')
      }

      // 사용자 프로필 데이터 변환
      const transformedData = transformBackendData(profileRes)
      setUserData(transformedData)
      console.log('✅ 사용자 데이터 변환 완료:', transformedData)

      // 사용자 게시글 (API 결과 사용)
      if (myPostsRes?.data?.results && Array.isArray(myPostsRes.data.results)) {
        setUserPosts(myPostsRes.data.results)
        console.log('✅ 사용자 게시글 데이터 설정 완료:', myPostsRes.data.results.length, '개')
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
        console.log('✅ 사용자 통계 데이터 설정 완료')
      }
    } catch (error) {
      console.error('❌ 프로필 로드 실패:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
      isLoadingDataRef.current = false
    }
  }

  // 사용자 정보가 있을 때 프로필 데이터 로드
  useEffect(() => {
    if (user && !authLoading) {
      console.log('✅ 사용자 정보가 있음 - 프로필 데이터 로드')
      loadProfileData()
    }
  }, [user, authLoading])

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
        {/* Left Column: Profile Info & Edit Form */}
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

        {/* Right Column: Statistics & Written Posts */}
        <div className="space-y-8 lg:col-span-2">
          <ProfileStatsSection stats={stats} />
          <ProfilePostsSection posts={userPosts} onPostClick={handlePostClick} />
        </div>
      </div>
    </div>
  )
}
