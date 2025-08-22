import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Platform,
  Model,
  Category,
  PostCard,
  PostDetail,
  PostCardData,
  PostCardFrontend,
  PostCard_bookmark,
  ApiRequestError,
  ValidationError,
  UserData,
} from '@/types/api'

// ===========================================
// CSS 클래스 유틸리티
// ===========================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===========================================
// ID 기반 표시명 처리 유틸리티 함수들 (통합 타입 지원)
// ===========================================

export function getPlatformName(platformId: number, platforms: Platform[]): string {
  const platform = platforms.find(p => p.id === platformId)
  return platform?.name || '알 수 없음'
}

// PostCardData에서 플랫폼 이름 가져오기 (타입별 처리)
export function getPlatformNameFromPostCard(data: PostCardData, platforms: Platform[]): string {
  if (isFrontendPostCard(data)) {
    return data.platform
  }
  if (isBackendPostCard(data) || isBookmarkPostCard(data)) {
    return getPlatformName(data.platformId, platforms)
  }
  return '알 수 없음'
}

export function getModelName(
  modelId: number | null | undefined,
  modelEtc: string | null | undefined,
  models: Model[],
): string {
  // model_etc가 있으면 우선 사용
  if (modelEtc && modelEtc.trim()) {
    return modelEtc
  }

  // modelId가 null이거나 0이면 '기타' 반환
  if (!modelId || modelId === 0) {
    return '기타'
  }

  // modelId로 모델 찾기
  const model = models.find(m => m.id === modelId)
  return model?.name || '기타'
}

// PostCardData에서 모델 이름 가져오기 (타입별 처리)
export function getModelNameFromPostCard(data: PostCardData, models: Model[]): string {
  if (isFrontendPostCard(data)) {
    return data.model_etc || data.model
  }
  if (isBackendPostCard(data) || isBookmarkPostCard(data)) {
    return getModelName(data.modelId, data.modelEtc, models)
  }
  return '기타'
}

export function getCategoryName(
  categoryId: number,
  categoryEtc: string | null | undefined,
  categories: Category[],
): string {
  if (categoryEtc && categoryEtc.trim()) {
    return categoryEtc
  }
  const category = categories.find(c => c.id === categoryId)
  return category?.name || '기타'
}

// PostCardData에서 카테고리 이름 가져오기 (타입별 처리)
export function getCategoryNameFromPostCard(data: PostCardData, categories: Category[]): string {
  if (isFrontendPostCard(data)) {
    return data.category_etc || data.category
  }
  if (isBackendPostCard(data) || isBookmarkPostCard(data)) {
    return getCategoryName(data.categoryId, data.categoryEtc, categories)
  }
  return '기타'
}

// 플랫폼별 모델 목록 필터링
export function getModelsByPlatform(platformId: number, models: Model[]): Model[] {
  return models.filter(m => m.platform === platformId)
}

// ===========================================
// 데이터 변환 유틸리티 함수들
// ===========================================

// PostCard 데이터에 표시명 추가 (통합 타입 지원)
export function enrichPostCard(
  post: PostCardData,
  platforms: Platform[],
  models: Model[],
  categories: Category[],
): PostCardData & {
  platformName: string
  modelName: string
  categoryName: string
} {
  if (isBackendPostCard(post)) {
    // 백엔드 PostCard 타입
    return {
      ...post,
      platformName: getPlatformName(post.platformId, platforms),
      modelName: getModelName(post.modelId, post.modelEtc, models),
      categoryName: getCategoryName(post.categoryId, post.categoryEtc, categories),
    }
  } else if (isFrontendPostCard(post)) {
    // 프론트엔드 PostCardFrontend 타입
    return {
      ...post,
      platformName: post.platform,
      modelName: post.model_etc || post.model,
      categoryName: post.category_etc || post.category,
    }
  } else if (isBookmarkPostCard(post)) {
    // PostCard_bookmark 타입
    return {
      ...post,
      platformName: getPlatformName(post.platformId, platforms),
      modelName: getModelName(post.modelId, post.modelEtc, models),
      categoryName: getCategoryName(post.categoryId, post.categoryEtc, categories),
    }
  }

  // 기본적으로 PostCard로 처리
  const postCard = post as PostCard
  return {
    ...postCard,
    platformName: getPlatformName(postCard.platformId, platforms),
    modelName: getModelName(postCard.modelId, postCard.modelEtc, models),
    categoryName: getCategoryName(postCard.categoryId, postCard.categoryEtc, categories),
  }
}

// PostDetail 데이터에 표시명 추가
export function enrichPostDetail(
  post: PostDetail,
  platforms: Platform[],
  models: Model[],
  categories: Category[],
): PostDetail & {
  platformName: string
  modelName: string
  categoryName: string
} {
  return {
    ...post,
    platformName: getPlatformName(post.platformId, platforms),
    modelName: getModelName(post.modelId, post.modelEtc, models),
    categoryName: getCategoryName(post.categoryId, post.categoryEtc, categories),
  }
}

// 여러 게시글에 표시명 일괄 추가 (통합 타입 지원)
export function enrichPostCards(
  posts: PostCardData[],
  platforms: Platform[],
  models: Model[],
  categories: Category[],
): Array<PostCardData & { platformName: string; modelName: string; categoryName: string }> {
  return posts.map(post => enrichPostCard(post, platforms, models, categories))
}

// ===========================================
// 날짜/시간 처리 유틸리티 함수들
// ===========================================

// 상대적 시간 표시 (예: "3시간 전", "2일 전")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}일 전`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}년 전`
}

// 절대적 날짜 표시 (예: "2024년 1월 15일")
export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 날짜와 시간 표시 (예: "2024년 1월 15일 오후 3:30")
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ===========================================
// 텍스트 처리 유틸리티 함수들
// ===========================================

// 텍스트 길이 제한
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

// HTML 태그 제거
export function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }
  // 서버 사이드에서는 간단한 정규식으로 처리
  return html.replace(/<[^>]*>/g, '')
}

// 첫 문자를 대문자로 변환
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 태그 관련 함수들은 백엔드에서 배열 형태로 제공되므로 제거됨

// ===========================================
// 숫자/통계 처리 유틸리티 함수들
// ===========================================

// 숫자를 한국어 단위로 포맷 (예: 1234 → "1.2천")
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString()
  }

  if (num < 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + '천'
  }

  if (num < 100000000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + '만'
  }

  return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '억'
}

// 만족도를 별점으로 변환
export function formatSatisfactionStars(satisfaction: number): string {
  const fullStars = Math.floor(satisfaction)
  const hasHalfStar = satisfaction % 1 !== 0
  const emptyStars = 5 - Math.ceil(satisfaction)

  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}

// 만족도를 퍼센트로 변환
export function formatSatisfactionPercent(satisfaction: number): string {
  return `${Math.round((satisfaction / 5) * 100)}%`
}

// ===========================================
// 에러 처리 유틸리티 함수들
// ===========================================

// API 에러에서 사용자 친화적 메시지 추출
export function getErrorMessage(error: ApiRequestError | Error | unknown): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다.'
  }

  // ApiRequestError 타입인 경우
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    return error.message
  }

  // 문자열인 경우
  if (typeof error === 'string') {
    return error
  }

  return '알 수 없는 오류가 발생했습니다.'
}

// ValidationError에서 필드별 에러 메시지 추출
export function getFieldErrors(error: ValidationError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  if (error.errors) {
    Object.entries(error.errors).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[field] = messages[0]
      }
    })
  }

  if (error.non_field_errors && error.non_field_errors.length > 0) {
    fieldErrors.general = error.non_field_errors[0]
  }

  return fieldErrors
}

// ===========================================
// URL/라우팅 유틸리티 함수들
// ===========================================

// 쿼리 파라미터를 URL에 추가
export function buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

// 현재 URL에서 쿼리 파라미터 추출
export function getUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {}
  }

  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(window.location.search)

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}

// ===========================================
// 폼 유틸리티 함수들
// ===========================================

// 만족도 옵션 생성 (0.5 단위)
export function getSatisfactionOptions(): Array<{ value: number; label: string }> {
  const options = []
  for (let i = 0.5; i <= 5; i += 0.5) {
    options.push({
      value: i,
      label: `${i}점 (${formatSatisfactionStars(i)})`,
    })
  }
  return options
}

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 이미지 파일 여부 확인
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// ===========================================
// 사용자 관련 유틸리티 함수들
// ===========================================

// 사용자 이니셜 생성
export function getUserInitial(user: UserData): string {
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'U'
}

// 사용자 표시명 생성
export function getUserDisplayName(user: UserData): string {
  return user.username || user.email || '사용자'
}

// 아바타 색상 조합 생성
export function generateAvatarGradient(color1: string, color2: string): string {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
}

// ===========================================
// 검색/필터링 유틸리티 함수들
// ===========================================

// 검색 쿼리 하이라이트
export function highlightSearchQuery(text: string, query: string): string {
  if (!query || !text) {
    return text
  }

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

// 필터 조건을 사람이 읽기 쉬운 형태로 변환
export function formatFilterConditions(
  filters: Record<string, any>,
  platforms: Platform[],
  categories: Category[],
): string[] {
  const conditions: string[] = []

  if (filters.platform) {
    const platformName = getPlatformName(filters.platform, platforms)
    conditions.push(`플랫폼: ${platformName}`)
  }

  if (filters.category) {
    const categoryName = getCategoryName(filters.category, null, categories)
    conditions.push(`카테고리: ${categoryName}`)
  }

  if (filters.satisfaction_min || filters.satisfaction_max) {
    const min = filters.satisfaction_min || 0.5
    const max = filters.satisfaction_max || 5.0
    conditions.push(`만족도: ${min}점 ~ ${max}점`)
  }

  if (filters.tags) {
    conditions.push(`태그: ${filters.tags}`)
  }

  return conditions
}

// ===========================================
// 로컬 스토리지 유틸리티 함수들
// ===========================================

// 안전한 로컬 스토리지 읽기
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// 안전한 로컬 스토리지 쓰기
export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('localStorage 저장 실패:', error)
  }
}

// 로컬 스토리지에서 제거
export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('localStorage 제거 실패:', error)
  }
}

// ===========================================
// PostCard 타입 가드 함수들 (기존 컴포넌트 호환성)
// ===========================================

// 타입 가드 함수들 re-export
export const isBackendPostCard = (data: PostCardData): data is PostCard => {
  return 'platformId' in data && 'modelId' in data && 'isLiked' in data
}

export const isFrontendPostCard = (data: PostCardData): data is PostCardFrontend => {
  return 'platform' in data && 'model' in data && 'isliked' in data
}

export const isBookmarkPostCard = (data: PostCardData): data is PostCard_bookmark => {
  return 'isBookmarked' in data && 'relativeTime' in data && 'bookmarks' in data
}

// ===========================================
// PostCard 데이터 노말라이제이션 함수들
// ===========================================

// PostCardData를 PostCard 형태로 노말라이즈
export function normalizePostCard(data: PostCardData): PostCard {
  if (isBackendPostCard(data)) {
    return data
  }

  if (isFrontendPostCard(data)) {
    // PostCardFrontend를 PostCard로 변환
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      authorInitial: data.authorInitial,
      avatarSrc: typeof data.avatarSrc === 'string' ? data.avatarSrc : undefined,
      createdAt: data.createdAt,
      relativeTime: formatRelativeTime(data.createdAt),
      views: data.views,
      platformId: 1, // 기본값, 또는 platform 문자열에서 ID로 변환 필요
      modelId: 1, // 기본값, 또는 model 문자열에서 ID로 변환 필요
      categoryId: 1, // 기본값, 또는 category 문자열에서 ID로 변환 필요
      modelEtc: data.model_etc,
      categoryEtc: data.category_etc,
      likes: data.likes,
      isLiked: data.isliked,
      bookmarks: 0, // PostCardFrontend에는 bookmarks 정보가 없음
      isBookmarked: false, // PostCardFrontend에는 bookmark 정보가 없음
      satisfaction: data.satisfaction,
      tags: [], // PostCardFrontend에는 tags 정보가 없음
    }
  }

  if (isBookmarkPostCard(data)) {
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      authorInitial: data.authorInitial,
      avatarSrc: data.avatarSrc || undefined,
      createdAt: data.createdAt,
      relativeTime: data.relativeTime,
      views: data.views,
      platformId: data.platformId,
      modelId: data.modelId || undefined,
      categoryId: data.categoryId,
      modelEtc: data.modelEtc,
      categoryEtc: data.categoryEtc,
      likes: data.likes,
      isLiked: data.isLiked,
      bookmarks: data.bookmarks,
      isBookmarked: data.isBookmarked,
      satisfaction: data.satisfaction,
      tags: data.tags,
    }
  }

  // 기본적으로 PostCard로 간주
  return data as PostCard
}

// PostCardData 배열을 PostCard 배열로 노말라이즈
export function normalizePostCards(data: PostCardData[]): PostCard[] {
  return data.map(normalizePostCard)
}

// PostCardData에서 공통 속성 추출
export function getPostCardCommonData(data: PostCardData) {
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    authorInitial: data.authorInitial,
    createdAt: data.createdAt,
    views: data.views,
    likes: data.likes,
  }
}

// 좋아요 상태 가져오기 (타입별 처리)
export function getIsLiked(data: PostCardData): boolean {
  if (isFrontendPostCard(data)) {
    return data.isliked // 프론트엔드 타입은 isliked
  }
  return (data as PostCard | PostCard_bookmark).isLiked // 나머지는 isLiked
}

// 만족도 가져오기
export function getSatisfaction(data: PostCardData): number | undefined {
  if ('satisfaction' in data) {
    const satisfaction = data.satisfaction

    // 문자열인 경우 숫자로 변환
    if (typeof satisfaction === 'string') {
      const parsed = parseFloat(satisfaction)
      return isNaN(parsed) ? undefined : parsed
    }

    // 숫자인 경우 그대로 반환
    if (typeof satisfaction === 'number') {
      return satisfaction
    }
  }
  return undefined
}

// 만족도를 안전하게 포맷팅 (소수점 1자리)
export function formatSatisfaction(data: PostCardData): string {
  // 직접 satisfaction 속성에 접근
  const satisfaction = (data as any).satisfaction

  // 문자열인 경우 숫자로 변환
  let satisfactionNumber: number | undefined

  if (typeof satisfaction === 'string') {
    satisfactionNumber = parseFloat(satisfaction)
  } else if (typeof satisfaction === 'number') {
    satisfactionNumber = satisfaction
  }

  // 숫자인지 확인하고 안전하게 처리
  if (typeof satisfactionNumber === 'number' && !isNaN(satisfactionNumber)) {
    return satisfactionNumber.toFixed(1)
  }

  // satisfaction이 없거나 숫자가 아닌 경우 기본값 반환
  return '0.0'
}
