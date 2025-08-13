/**
 * 샘플 데이터 타입 정의
 *
 * 백엔드 API 연동 전까지 사용할 샘플 데이터의 타입을 정의합니다.
 * 실제 API 연동 시에는 이 타입들을 백엔드 응답 타입으로 교체합니다.
 */

// postcard 기본 버전 (사용처: /community, /profile 페이지)
export interface PostCard {
  id: number
  title: string
  satisfaction: number
  author: string
  authorInitial: string
  avatarSrc?: string | { color1: string; color2: string; username: string }
  createdAt: string // ISO 날짜 형식 (예: '2024-12-15T10:30:00Z')
  views: number
  likes: number
  isliked: boolean
  platform: string
  model: string
  model_etc?: string
  category: string
  category_etc?: string
}

// postcard - '북마크 해제기능' 추가 버전 (사용처: /bookmarks 페이지)
export interface PostCard_bookmark {
  id: number
  title: string
  author: string
  authorInitial: string
  avatarSrc: string | null
  createdAt: string
  relativeTime: string // 백엔드에서 계산된 상대적 시간
  views: number
  satisfaction: number

  // ID 기반 필드들 (백엔드 응답과 일치)
  platformId: number
  modelId: number | null
  modelEtc: string
  categoryId: number
  categoryEtc: string

  // 상호작용 필드들
  tags: string[]
  likes: number
  isLiked: boolean
  bookmarks: number
  isBookmarked: boolean
}

// post 상세 페이지 버전 (사용처: /post/[id] 페이지)
export interface PostDetail {
  id: number // 게시글 고유 번호
  title: string // 게시글 제목
  author: string // 게시글 작성자
  authorInitial: string // 작성자 아이콘 내 이니셜
  avatarSrc?: string // 프로필 이미지가 있는 유저만 표시
  createdAt: string // ISO 날짜 형식 (예: '2024-12-15T10:30:00Z')
  views: number // 게시글 조회수
  satisfaction: number // 게시글 만족도
  platform: string // 게시글 플랫폼 (예: 'OpenAI', 'Google', ... , '기타')
  platform_id?: number // 플랫폼 ID
  model: string // 게시글 모델 (표시용 이름, 예: 'GPT-4o', 'claude 5 beta')
  model_name?: string // 실제 모델명 (edit용, 예: 'GPT-4o', '기타')
  model_id?: number // 모델 ID
  model_etc?: string // 게시글 모델 기타 선택 시 직접 입력한 값
  category: string // 게시글 카테고리 (예: 'AI', 'AI 모델', ... , '기타')
  category_id?: number // 카테고리 ID
  category_etc?: string // 게시글 카테고리 기타 선택 시 직접 입력한 값
  tags: string[] // 게시글 태그
  likes: number // 게시글 좋아요 수
  isLiked: boolean // 게시글 좋아요 여부
  bookmarks: number // 게시글 북마크 수
  isBookmarked: boolean // 게시글 북마크 여부
  prompt: string // 게시글 프롬프트 내용
  aiResponse: string // 게시글 ai응답 내용
  additionalOpinion?: string // 추가 의견이 있을때만 내용 표시
  isAuthor?: boolean // 게시글 작성자 여부
}

// post 편집 페이지 버전 (사용처: /edit-post 페이지)
export interface PostEdit {
  id: number
  title: string
  satisfaction: number
  platform: string
  model: string
  model_etc?: string
  category: string
  category_etc?: string
  tags: string[]
  prompt: string
  aiResponse: string
  additionalOpinion: string
}

// post 작성 다이얼로그 버전 (사용처: /community/create-post-dialog 컴포넌트)
export interface PostWrite {
  title: string
  satisfaction: number
  platform: string
  model: string
  model_etc?: string
  category: string
  category_etc?: string
  tags: string[]
  prompt: string
  aiResponse: string
  additionalOpinion: string
}

// 통계 데이터 타입 (사용처: /community, /profile 페이지)
export interface Stats {
  // 커뮤니티 통계 + 북마크 통계
  activeUsers: number
  sharedPrompts: number
  averageSatisfaction: number
  totalBookmarks: number
  totalViews: number
  weeklyAdded: number
}

// 유저 데이터 타입 (사용처: /profile 페이지)
export interface UserData {
  id: number
  username: string
  email: string
  password?: string
  passwordConfirm?: string
  avatar: string | null
  avatarSrc?: string
  avatar_url: string | null
  avatar_color1: string
  avatar_color2: string
  createdAt: string
  created_at: string
  date_joined: string
  posts?: PostCard[]
  bookmarks?: PostCard_bookmark[]
  views?: number
}
