'use client'

import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ProfileInfoCard, ProfileStatsSection, ProfilePostsSection } from '@/components/profile'
import { ProfileCompleteness } from '@/components/profile/profile-completeness'
import { authApi, userDataApi, statsApi, postsApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
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

  // 프로필 완성도 상태
  const [profileCompleteness, setProfileCompleteness] = useState<{
    percentage: number
    completed_fields: number
    total_fields: number
    missing_fields: string[]
  } | null>(null)

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

  // 메타데이터 상태 (PostList에서 중복 API 요청 방지)
  const [platformsData, setPlatformsData] = useState<any[]>([])
  const [modelsData, setModelsData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<any[]>([])

  // (간소화) 백엔드→프론트 데이터 변환은 각 API에서 이미 일관화되어 있어 별도 변환 함수 생략

  // 통계 데이터 계산 (백엔드 데이터 우선 사용)
  const getStats = () => ({
    postCount: backendStats.postsCount,
    likeCount: backendStats.totalLikes,
    bookmarkCount: backendStats.totalBookmarks,
    viewCount: backendStats.totalViews,
  })

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

  // 프로필 완성도 계산 함수
  const calculateProfileCompleteness = (userData: ProfileUserData) => {
    const requiredFields = ['username', 'bio', 'location', 'githubHandle']
    let completedFields = 0

    for (const field of requiredFields) {
      const value = userData[field as keyof ProfileUserData]
      if (value && String(value).trim()) {
        completedFields++
      }
    }

    const percentage = (completedFields / requiredFields.length) * 100
    const missingFields = requiredFields.filter(field => {
      const value = userData[field as keyof ProfileUserData]
      return !value || !String(value).trim()
    })

    return {
      percentage: Math.round(percentage),
      completed_fields: completedFields,
      total_fields: requiredFields.length,
      missing_fields: missingFields,
    }
  }

  // 프로필 데이터 로드 (중복 API 호출 개선)
  const loadProfileData = async () => {
    // 중복 실행 방지
    if (isLoadingDataRef.current) {
      console.log('⚠️ 이미 데이터 로딩 중 - 중복 실행 방지')
      return
    }

    try {
      isLoadingDataRef.current = true
      setIsLoading(true)

      // 인증 상태 확인
      if (!isAuthenticated) {
        console.log('⚠️ 인증되지 않은 사용자 - 프로필 페이지 접근 불가')
        router.push('/')
        return
      }

      // Promise.all을 사용하여 4개 API를 병렬로 호출 (성능 개선)
      // 사용자 게시글은 프로필 로드 후 별도 호출
      const [profileRes, platformsRes, modelsRes, categoriesRes] = await Promise.all([
        authApi.getProfile(),
        postsApi.getPlatforms(),
        postsApi.getModels(),
        postsApi.getCategories(),
      ])

      // 사용자 게시글은 프로필 로드 후 별도 호출
      let myPostsRes = null
      if (profileRes?.username) {
        try {
          myPostsRes = await userDataApi.getUserPosts({
            page: 1,
            page_size: 50,
            author: profileRes.username,
          })
        } catch (postsError) {
          console.warn('⚠️ 사용자 게시글 로드 실패 (무시하고 계속):', postsError)
        }
      }

      // 통계 API는 별도로 호출 (인증 오류 시 무시)
      let statsRes = null
      try {
        statsRes = await statsApi.getUserStats()
      } catch (statsError) {
        console.warn('⚠️ 사용자 통계 로드 실패 (무시하고 계속):', statsError)
      }

      if (!profileRes) {
        throw new Error('사용자 데이터를 찾을 수 없습니다.')
      }

      // 사용자 프로필 데이터 변환
      const transformedData = transformBackendData(profileRes)
      setUserData(transformedData)

      // 프로필 완성도 정보 추출
      if (profileRes.profile_completeness) {
        setProfileCompleteness(profileRes.profile_completeness)
      }

      // 사용자 게시글 (API 결과 사용)
      if (myPostsRes?.data?.results && Array.isArray(myPostsRes.data.results)) {
        setUserPosts(myPostsRes.data.results)
      }

      // 사용자 통계 (API 결과 사용, 실패 시 기본값)
      if (statsRes?.data) {
        const s = statsRes.data
        setBackendStats({
          postsCount: s.posts_count || 0,
          totalLikes: s.total_likes || 0,
          totalViews: s.total_views || 0,
          totalBookmarks: s.total_bookmarks || 0,
        })
      } else {
        // 통계 API 실패 시 기본값 설정
        setBackendStats({
          postsCount: 0,
          totalLikes: 0,
          totalViews: 0,
          totalBookmarks: 0,
        })
      }

      // 메타데이터 저장 (PostList에서 중복 API 요청 방지)
      if (platformsRes?.data) setPlatformsData(platformsRes.data)
      if (modelsRes?.data) setModelsData(modelsRes.data)
      if (categoriesRes?.data) setCategoriesData(categoriesRes.data)
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
    if (user && !authLoading && isAuthenticated) {
      loadProfileData()
    } else if (!authLoading && !isAuthenticated) {
      // 인증되지 않은 사용자는 홈으로 리다이렉트
      console.log('⚠️ 인증되지 않은 사용자 - 홈으로 리다이렉트')
      router.push('/')
    }
  }, [user, authLoading, isAuthenticated])

  // 탭 전환 시 좋아요/북마크 Lazy-load (무한 루프 방지)
  const [likedLoaded, setLikedLoaded] = useState(false)
  const [bookmarkedLoaded, setBookmarkedLoaded] = useState(false)

  useEffect(() => {
    const loadLiked = async () => {
      if (likedLoaded) return // 이미 로드된 경우 스킵

      try {
        setLikedLoading(true)
        const res = await userDataApi.getLikedPosts({ page: 1, page_size: 50 })
        if (res?.data?.results) {
          setLikedPosts(res.data.results)
        } else {
          setLikedPosts([])
        }
        setLikedLoaded(true) // 로드 완료 표시
      } catch (e) {
        console.warn('좋아요한 게시글 로드 실패', e)
        setLikedPosts([])
        setLikedLoaded(true) // 에러 발생해도 로드 완료로 표시
      } finally {
        setLikedLoading(false)
      }
    }
    const loadBookmarked = async () => {
      if (bookmarkedLoaded) return // 이미 로드된 경우 스킵

      try {
        setBookmarkedLoading(true)
        const res = await userDataApi.getBookmarkedPosts({ page: 1, page_size: 50 })
        if (res?.data?.results) {
          setBookmarkedPosts(res.data.results)
        } else {
          setBookmarkedPosts([])
        }
        setBookmarkedLoaded(true) // 로드 완료 표시
      } catch (e) {
        console.warn('북마크한 게시글 로드 실패', e)
        setBookmarkedPosts([])
        setBookmarkedLoaded(true) // 에러 발생해도 로드 완료로 표시
      } finally {
        setBookmarkedLoading(false)
      }
    }

    // 탭 전환 시에만 로드 (이미 로드된 경우 스킵)
    if (activeTab === 'liked' && !likedLoaded && !likedLoading) {
      loadLiked()
    }
    if (activeTab === 'bookmarked' && !bookmarkedLoaded && !bookmarkedLoading) {
      loadBookmarked()
    }
  }, [activeTab, likedLoaded, bookmarkedLoaded, likedLoading, bookmarkedLoading])

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

      // 프로필 완성도 재계산 및 업데이트
      const updatedCompleteness = calculateProfileCompleteness(transformedData)
      setProfileCompleteness(updatedCompleteness)

      toast({
        title: '성공',
        description: '프로필이 성공적으로 업데이트되었습니다.',
      })

      // 전역 상태 업데이트하여 Header 등 모든 컴포넌트 새로고침
      await refreshUser()
    } catch (error) {
      const errorMessage = getErrorMessage(error)
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

  const handleRemoveBookmark = async (bookmarkId: number) => {
    try {
      await postsApi.toggleBookmark(bookmarkId)
      // 북마크 목록에서 제거
      setBookmarkedPosts(prev => prev.filter(bookmark => bookmark.id !== bookmarkId))
      toast({
        title: '북마크 해제 완료',
        description: '북마크에서 제거되었습니다.',
      })
    } catch (err) {
      console.error('북마크 제거 실패:', err)
      toast({
        title: '북마크 해제 실패',
        description: '북마크 제거에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleAccountSettingsClick = () => {
    router.push('/profile/settings')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-1">
          {/* 프로필 완성도 표시 */}
          {profileCompleteness && <ProfileCompleteness completeness={profileCompleteness} />}

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
          <ProfileStatsSection stats={getStats()} isLoading={isLoading} title={''} contained />
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
                    onRemoveBookmark={activeTab === 'bookmarked' ? handleRemoveBookmark : undefined}
                    isLoading={loadingForTab}
                    variant={variantForTab}
                    title={''}
                    contained
                    platformsData={platformsData}
                    modelsData={modelsData}
                    categoriesData={categoriesData}
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
