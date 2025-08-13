/**
 * Mock Posts API for development
 * 백엔드 구현 전까지 사용하는 모의 포스트 생성 API
 */

import type { PostWrite } from '@/lib/api'
import type { Platform, Model, Category } from '@/types/api'
import { samplePlatform, platformModels, sampleCategory } from '@/sampledata/SampleSelector'

// 임시 ID 생성기
let nextId = 100

export async function mockCreatePost(postData: PostWrite): Promise<{
  status: string
  data: any
}> {
  // 인위적 지연
  await new Promise(resolve => setTimeout(resolve, 500))

  // 유효성 검사
  if (!postData.title || !postData.prompt || !(postData as any).ai_response) {
    throw new Error('필수 필드가 누락되었습니다.')
  }

  if (!postData.platform || !postData.category) {
    throw new Error('플랫폼과 카테고리는 필수입니다.')
  }

  if (!postData.satisfaction || postData.satisfaction < 1 || postData.satisfaction > 5) {
    throw new Error('만족도는 1-5 사이의 값이어야 합니다.')
  }

  // 임시 응답 데이터 생성
  const newPost = {
    id: nextId++,
    title: postData.title,
    author: 'Admin', // 개발 중에는 Admin으로 고정
    authorInitial: 'A',
    avatarSrc: '/placeholder-user.jpg',
    createdAt: new Date().toISOString(),
    views: 0,
    satisfaction: postData.satisfaction,
    platform: typeof postData.platform === 'number' ? '알 수 없음' : postData.platform,
    model: postData.model_etc || '알 수 없음',
    model_etc: postData.model_etc,
    category: typeof postData.category === 'number' ? '알 수 없음' : postData.category,
    category_etc: postData.category_etc,
    tags: postData.tags || [],
    likes: 0,
    isLiked: false,
    bookmarks: 0,
    isBookmarked: false,
    prompt: postData.prompt,
    aiResponse: (postData as any).ai_response,
    additionalOpinion: (postData as any).additional_opinion,
    isAuthor: true,
  }

  console.log('Mock API: 포스트 생성 완료', newPost)

  return {
    status: 'success',
    data: newPost,
  }
}

// 플랫폼 목록 조회 Mock
export async function mockGetPlatforms(): Promise<{
  status: string
  data: Platform[]
}> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const platforms: Platform[] = samplePlatform.map((name, index) => ({
    id: index + 1,
    name,
  }))

  return {
    status: 'success',
    data: platforms,
  }
}

// 모델 목록 조회 Mock
export async function mockGetModels(platformId?: number): Promise<{
  status: string
  data: Model[]
}> {
  await new Promise(resolve => setTimeout(resolve, 100))

  let models: Model[] = []

  if (platformId) {
    const platform = samplePlatform[platformId - 1]
    if (platform && platformModels[platform]) {
      models = platformModels[platform].map((name, index) => ({
        id: index + 1,
        name,
        platform: platformId,
        platform_name: platform,
      }))
    }
  } else {
    // 모든 모델 반환
    let id = 1
    Object.entries(platformModels).forEach(([platformName, modelList]) => {
      const platformId = samplePlatform.indexOf(platformName) + 1
      modelList.forEach(modelName => {
        models.push({
          id: id++,
          name: modelName,
          platform: platformId,
          platform_name: platformName,
        })
      })
    })
  }

  return {
    status: 'success',
    data: models,
  }
}

// 카테고리 목록 조회 Mock
export async function mockGetCategories(): Promise<{
  status: string
  data: Category[]
}> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const categories: Category[] = sampleCategory.map((name, index) => ({
    id: index + 1,
    name,
  }))

  return {
    status: 'success',
    data: categories,
  }
}
