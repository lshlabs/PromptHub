/**
 * 컴포넌트 관련 타입 정의
 *
 * React 컴포넌트에서 사용되는 타입들을 정의합니다.
 */

// 카드 바리에이션 타입
export type CardVariant = 'normal' | 'current' | 'bookmark' | 'popular'

// PostCard 컴포넌트 Props
export interface PostCardProps {
  data: import('./api').PostCard
  variant?: CardVariant
  currentPostId?: number
  onClick?: () => void
  onRemoveBookmark?: (id: number) => void
}

// 검색 관련 Props
export interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

// 정렬 관련 Props
export interface SortSelectorProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

// 페이지네이션 Props
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

// 로딩 스피너 Props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 빈 상태 Props
export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

// 커스텀 버튼 Props
export interface CustomButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

// 아바타 Props
export interface AvatarWithColorsProps {
  username: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 별점 Props
export interface StarRatingProps {
  rating: number
  maxRating?: number
  readonly?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

// 배지 Props
export interface CustomBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  children: React.ReactNode
  className?: string
}

// 다이얼로그 Props
export interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

// 폼 관련 Props
export interface AuthFormProps {
  type: 'login' | 'register'
  onSubmit: (data: any) => void
  loading?: boolean
  error?: string
}

// 프로필 관련 Props
export interface ProfileHeaderProps {
  user: import('./api').UserData
  isOwnProfile?: boolean
  onEdit?: () => void
}

// 설정 관련 Props
export interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}
