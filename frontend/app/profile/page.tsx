"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Calendar,
  Star,
  BookOpen,
  TrendingUp,
  Shield,
  Moon,
  Sun,
  Globe,
  Save,
  Edit3,
  Award,
  Target,
  Zap,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  Upload,
  Trash2,
  Edit,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

/**
 * 사용자 프로필 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 기본 정보 조회 및 수정
 * - 아바타 이미지 업로드/삭제
 * - 사용자명 중복 체크 및 실시간 검증
 * - 위치 정보 자동 감지
 * - 활동 통계 및 업적 표시
 * - 알림 설정 관리
 */
export default function ProfilePage() {
  // ========== 기본 상태 관리 ==========
  const [isEditing, setIsEditing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    trending: true,
  })

  // ========== 인증 및 사용자 정보 ==========
  const { user, updateProfile, refreshUser } = useAuth()

  // ========== 편집 가능한 필드 상태 ==========
  const [editableUsername, setEditableUsername] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // ========== 사용자명 검증 상태 ==========
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">(
    "idle",
  )
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ========== 아바타 업로드 관련 상태 ==========
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ========== 비밀번호 변경 관련 상태 ==========
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  })

  // ========== 계정 삭제 관련 상태 ==========
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // ========== 컴포넌트 생명주기 및 부수 효과 ==========
  
  /**
   * 사용자 정보가 로드되면 편집 필드들을 초기화
   */
  useEffect(() => {
    if (user) {
      setEditableUsername(user.username)
      setLocation(user.profile?.location || "")
      setWebsite(user.profile?.website || "")
    }
  }, [user])

  /**
   * 위치 정보 로딩 상태 관리
   * 백엔드에서 제공하는 위치 정보만 사용 (IP 추적은 백엔드에서 처리)
   */
  useEffect(() => {
    // 위치 정보 로딩 완료
    setIsLoadingLocation(false)
  }, [location])

  /**
   * 사용자명 실시간 검증 및 중복 체크
   * 
   * 다음 단계로 검증을 수행합니다:
   * 1. 현재 사용자명과 동일한지 확인
   * 2. 길이 제한 검사 (3-12자)
   * 3. 금지된 사용자명 검사
   * 4. 허용된 문자 검사 (영문, 숫자, 언더스코어)
   * 5. 백엔드 API를 통한 중복 검사
   * 
   * @param newUsername 검증할 새로운 사용자명
   */
  const checkUsernameAvailability = async (newUsername: string) => {
    // 입력값 상태 업데이트
    setEditableUsername(newUsername)

    // 현재 사용자명과 동일한 경우 검증 생략
    if (newUsername === user?.username) {
      setUsernameCheckStatus("idle")
      return
    }

    // 검증 시작 - 로딩 상태 표시
    setUsernameCheckStatus("checking")
    setIsCheckingUsername(true)

    // 길이 및 빈 값 검증
    if (!newUsername || newUsername.length < 3 || newUsername.length > 12) {
      setUsernameCheckStatus("idle")
      setIsCheckingUsername(false)
      return
    }

    // 금지된 사용자명 목록 검사
    const forbiddenUsernames = ["admin", "test", "user", "demo", "sample"]
    if (forbiddenUsernames.includes(newUsername.toLowerCase())) {
      setUsernameCheckStatus("taken")
      setIsCheckingUsername(false)
      return
    }

    // 허용된 문자 검사 (영문, 숫자, 언더스코어만)
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameCheckStatus("taken")
      setIsCheckingUsername(false)
      return
    }

    // 백엔드 API를 통한 중복 검사
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      const response = await fetch(
        `${apiUrl}/auth/check-username/?username=${encodeURIComponent(newUsername)}`
      )
      
      if (!response.ok) {
        setUsernameCheckStatus("error")
        setIsCheckingUsername(false)
        return
      }
      
      const data = await response.json()
      setUsernameCheckStatus(data.available ? "available" : "taken")
      
    } catch (error) {
      console.error("사용자명 중복 검사 오류:", error)
      setUsernameCheckStatus("error")
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // ========== 아바타 업로드/삭제 핸들러 ==========
  
  /**
   * 파일 선택 다이얼로그 열기
   */
  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * 파일 검증 함수
   * @param file 업로드할 파일
   * @returns 검증 통과 여부
   */
  const validateFile = (file: File): boolean => {
    // 파일 크기 검사 (5MB 제한)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 5MB 이하여야 합니다.",
        variant: "destructive",
      })
      return false
    }

    // 파일 타입 검사 (이미지만 허용)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "JPG, PNG, GIF, WebP 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  /**
   * 아바타 이미지 업로드 처리
   * @param event 파일 입력 이벤트
   */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 검증
    if (!validateFile(file)) {
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setIsUploadingAvatar(true)

    try {
      // FormData 생성
      const formData = new FormData()
      formData.append('avatar', file)

      // API 요청
      const token = localStorage.getItem('authToken')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      
      const response = await fetch(`${apiUrl}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      const data = await response.json()
      
      // 최신 사용자 정보 다시 불러오기
      await refreshUser()

      toast({
        title: "프로필 이미지 업로드 완료",
        description: "새로운 프로필 이미지가 성공적으로 업로드되었습니다.",
      })

    } catch (error) {
      console.error("아바타 업로드 오류:", error)
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * 아바타 이미지 삭제 처리
   */
  const handleAvatarDelete = async () => {
    if (!user?.profile?.has_custom_avatar) return

    setIsDeletingAvatar(true)

    try {
      const token = localStorage.getItem('authToken')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      
      const response = await fetch(`${apiUrl}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: null
        }),
      })

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      // 프로필 정보 업데이트
      await refreshUser()

      toast({
        title: "프로필 이미지 삭제 완료",
        description: "프로필 이미지가 삭제되었습니다. 기본 아바타가 표시됩니다.",
      })

    } catch (error) {
      console.error("아바타 삭제 오류:", error)
      toast({
        title: "삭제 실패",
        description: "이미지 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  // ========== 사용자명 검증 및 UI 로직 ==========

  /**
   * 사용자명 검증 상태에 따른 UI 구성요소 반환
   * 
   * 입력 필드의 스타일, 아이콘, 메시지를 검증 상태에 따라 동적으로 생성합니다.
   * 
   * @returns UI 구성요소 객체 {inputClassName, icon, message}
   */
  const getUsernameStatusConfig = () => {
    const baseInputClass = "pr-10"
    
    // 편집 모드가 아닌 경우 - 읽기 전용 스타일
    if (!isEditing) {
      return {
        inputClassName: `${baseInputClass} bg-gray-50`,
        icon: null,
        message: null
      }
    }

    // 사용자명이 변경되지 않은 경우 - 기본 스타일
    if (editableUsername === user?.username) {
      return {
        inputClassName: baseInputClass,
        icon: null,
        message: null
      }
    }

    // 입력값이 없는 경우 - 기본 스타일
    if (!editableUsername) {
      return {
        inputClassName: baseInputClass,
        icon: null,
        message: null
      }
    }

    // 길이 검증 - 3자 미만
    if (editableUsername.length < 3) {
      return {
        inputClassName: `${baseInputClass} border-gray-300`,
        icon: <XCircle className="w-4 h-4 text-gray-400" />,
        message: <p className="text-xs text-gray-500">사용자명은 3자 이상이어야 합니다</p>
      }
    }

    // 길이 검증 - 12자 초과
    if (editableUsername.length > 12) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">사용자명은 12자 이하로 입력하세요</p>
      }
    }

    // 허용되지 않은 문자 사용
    if (!/^[a-zA-Z0-9_]+$/.test(editableUsername)) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">영문, 숫자, 언더스코어(_)만 사용 가능합니다</p>
      }
    }

    // 금지된 사용자명 사용
    const forbiddenUsernames = ["admin", "test", "user", "demo", "sample"]
    if (forbiddenUsernames.includes(editableUsername.toLowerCase())) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">사용할 수 없는 사용자명입니다</p>
      }
    }

    // 백엔드 검증 상태별 UI 처리
    switch (usernameCheckStatus) {
      case "checking":
        return {
          inputClassName: `${baseInputClass} border-blue-300`,
          icon: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
          message: <p className="text-xs text-blue-600">사용자명 확인 중...</p>
        }
      
      case "available":
        return {
          inputClassName: `${baseInputClass} border-green-500 focus:border-green-500 focus:ring-green-500`,
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          message: <p className="text-xs text-green-600">사용 가능한 사용자명입니다</p>
        }
      
      case "taken":
        return {
          inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          message: <p className="text-xs text-red-600">이미 사용 중인 사용자명입니다</p>
        }
      
      case "error":
        return {
          inputClassName: `${baseInputClass} border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500`,
          icon: <XCircle className="w-4 h-4 text-yellow-500" />,
          message: <p className="text-xs text-yellow-600">서버 연결에 문제가 있습니다. 다시 시도해주세요</p>
        }
      
      case "idle":
      default:
        return {
          inputClassName: `${baseInputClass} border-gray-300`,
          icon: null,
          message: null
        }
    }
  }

  /**
   * 저장 버튼 활성화 여부 검사
   * 
   * 다음 조건들을 확인합니다:
   * - 현재 저장 중이거나 사용자명 검증 중이 아님
   * - 사용자명이 변경되었고 사용 가능함
   * - 다른 필드(위치, 웹사이트)가 변경됨
   * 
   * @returns 저장 가능 여부
   */
  const canSave = () => {
    // 진행 중인 작업이 있으면 저장 불가
    if (isSaving || isCheckingUsername) return false

    // 사용자명이 변경된 경우
    if (editableUsername !== user?.username) {
      return usernameCheckStatus === "available" && editableUsername.length >= 3
    }

    // 프로필 정보가 변경된 경우
    if (
      website !== (user.profile?.website || "") ||
      location !== (user.profile?.location || "")
    ) {
      return true
    }

    // 변경사항이 없으면 저장 불가
    return false
  }

  // ========== 데이터 처리 및 저장 로직 ==========

  /**
   * 프로필 정보 저장 처리
   * 
   * 변경된 사용자 정보를 백엔드 API로 전송하고 상태를 업데이트합니다.
   * 성공/실패에 따라 적절한 토스트 메시지를 표시합니다.
   */
  const handleSave = async () => {
    if (!canSave()) return

    setIsSaving(true)

    try {
      // API를 통한 프로필 업데이트
      await updateProfile({
        username: editableUsername,
        profile: {
          location,
          website,
        },
      })

      // 편집 모드 종료 및 상태 초기화
      setIsEditing(false)
      setUsernameCheckStatus("idle")

      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      console.error("프로필 저장 실패:", error)
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * 편집 취소 처리
   * 
   * 모든 편집 필드를 원래 값으로 되돌리고 편집 모드를 종료합니다.
   */
  const handleCancel = () => {
    if (!user) return
    
    setEditableUsername(user.username)
    setLocation(user.profile?.location || "")
    setWebsite(user.profile?.website || "")
    setUsernameCheckStatus("idle")
    setIsEditing(false)
  }

  // ========== 비밀번호 변경 핸들러 ==========

  /**
   * 비밀번호 변경 처리
   */
  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.newPasswordConfirm) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.newPasswordConfirm) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const token = localStorage.getItem('authToken')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      
      const response = await fetch(`${apiUrl}/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirm: passwordData.newPasswordConfirm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '비밀번호 변경 실패')
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      })

      // 다이얼로그 닫기 및 폼 초기화
      setIsPasswordDialogOpen(false)
      setPasswordData({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })

      // 사용자 정보 다시 불러오기 (변경일 업데이트)
      await refreshUser()

    } catch (error) {
      console.error("비밀번호 변경 오류:", error)
      toast({
        title: "변경 실패",
        description: error instanceof Error ? error.message : "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ========== 계정 삭제 핸들러 ==========

  /**
   * 계정 삭제 처리
   */
  const handleAccountDelete = async () => {
    if (!deleteConfirmation) {
      toast({
        title: "입력 오류",
        description: "확인 텍스트를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (deleteConfirmation.toUpperCase() !== 'DELETE' && deleteConfirmation !== '삭제') {
      toast({
        title: "확인 오류",
        description: "'DELETE' 또는 '삭제'를 정확히 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsDeletingAccount(true)

    try {
      const token = localStorage.getItem('authToken')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      
      const response = await fetch(`${apiUrl}/auth/delete-account/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '계정 삭제 실패')
      }

      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다. 그동안 이용해주셔서 감사했습니다.",
      })

      // 완전한 로그아웃 처리
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      window.location.href = "/"

    } catch (error) {
      console.error("계정 삭제 오류:", error)
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "계정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // ========== 렌더링 조건 확인 ==========
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // ========== 정적 데이터 준비 ==========
  
  // 가입일 포맷팅
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : ""

  // 활동 통계 데이터 (추후 API로 대체 예정)
  const stats = {
    totalReviews: 47,
    avgRating: 4.6,
    totalLikes: 312,
    followers: 89,
    following: 156,
    bookmarks: 23,
  }

  // 업적 목록 데이터 (추후 API로 대체 예정)
  const achievements = [
    { id: 1, title: "첫 리뷰 작성", description: "첫 번째 프롬프트 리뷰를 작성했습니다", icon: BookOpen, earned: true },
    { id: 2, title: "인기 리뷰어", description: "리뷰가 100개 이상의 좋아요를 받았습니다", icon: Star, earned: true },
    {
      id: 3,
      title: "활발한 참여자",
      description: "한 달에 10개 이상의 리뷰를 작성했습니다",
      icon: TrendingUp,
      earned: true,
    },
    { id: 4, title: "전문가", description: "50개 이상의 고품질 리뷰를 작성했습니다", icon: Award, earned: false },
    {
      id: 5,
      title: "멘토",
      description: "다른 사용자들에게 도움이 되는 리뷰를 작성했습니다",
      icon: Target,
      earned: false,
    },
    { id: 6, title: "혁신가", description: "창의적인 프롬프트 아이디어를 제안했습니다", icon: Zap, earned: false },
  ]

  // 사용자명 검증 상태에 따른 UI 구성요소
  const { inputClassName, icon, message } = getUsernameStatusConfig()

  // ========== 메인 컴포넌트 렌더링 ==========
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">내 프로필</h1>
          <p className="text-gray-600 dark:text-gray-400">프로필 정보를 관리하고 설정을 변경하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측 사이드바 - 프로필 개요 및 통계 */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* 아바타 섹션 - 업로드/삭제 기능 포함 */}
                  <div className="relative group mb-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24 transition-all duration-300 group-hover:ring-4 group-hover:ring-blue-500/20">
                        {user.profile?.avatar_url && (
                          <AvatarImage 
                            src={user.profile.avatar_url} 
                            alt={user.username} 
                            className="object-cover transition-all duration-300 group-hover:brightness-75"
                          />
                        )}
                        <AvatarFallback 
                          className={`text-2xl text-white bg-gradient-to-br transition-all duration-300 group-hover:brightness-90 ${user.profile?.avatar_color_class || "from-blue-600 to-purple-600"}`}
                        >
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* 호버 시 표시되는 편집 오버레이 */}
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/90 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm rounded-full h-8 w-8 p-0"
                              disabled={true}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" sideOffset={8}>
                            <DropdownMenuItem disabled>
                              <Upload className="w-4 h-4 mr-2" />
                              이미지 업로드 (준비중)
                            </DropdownMenuItem>
                            {user.profile?.has_custom_avatar && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  disabled
                                  className="text-gray-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  이미지 삭제 (준비중)
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* 숨겨진 파일 입력 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="프로필 이미지 업로드"
                    />
                  </div>

                  {/* 사이드바에는 저장된 사용자명만 표시 */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user.username}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">{user.email}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{joinDate}에 가입</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    {isLoadingLocation ? (
                      <span className="animate-pulse">위치 확인 중...</span>
                    ) : (
                      <span>{location}</span>
                    )}
                  </div>

                  {/* 웹사이트는 항상 표시하되, 없을 때는 힌트 텍스트 표시 */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Globe className="w-4 h-4" />
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-[200px] text-blue-600 dark:text-blue-400"
                      >
                        {website}
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">지정된 웹사이트가 없습니다</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">활동 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalReviews}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">총 리뷰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgRating}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">평균 평점</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalLikes}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">받은 좋아요</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.bookmarks}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">북마크</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측 메인 콘텐츠 - 탭 기반 프로필 관리 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">프로필</TabsTrigger>
                <TabsTrigger value="achievements">업적</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
                <TabsTrigger value="privacy">개인정보</TabsTrigger>
              </TabsList>

              {/* 프로필 편집 탭 */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>기본 정보</CardTitle>
                      <CardDescription>프로필의 기본 정보를 수정할 수 있습니다</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                            취소
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={!canSave()}>
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                저장 중...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                저장
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          편집
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">사용자명</Label>
                        <div className="relative">
                          <Input
                            id="username"
                            value={editableUsername}
                            onChange={(e) => checkUsernameAvailability(e.target.value)}
                            disabled={!isEditing}
                            className={inputClassName}
                            placeholder="사용자명을 입력하세요"
                          />
                          {isEditing && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {icon}
                            </div>
                          )}
                        </div>
                        {message}
                        {isEditing && !message && (
                          <p className="text-xs text-gray-500">사용자명은 다른 사용자들에게 표시되는 이름입니다</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input id="email" type="email" value={user.email} disabled={true} className="bg-gray-50" />
                      <p className="text-xs text-gray-500">이메일은 보안상의 이유로 수정할 수 없습니다</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">위치</Label>
                        <div className="relative">
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={!isEditing || isLoadingLocation}
                            placeholder="위치를 입력하세요"
                            className={isLoadingLocation ? "animate-pulse" : !isEditing ? "bg-gray-50" : ""}
                          />
                          {isLoadingLocation && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">웹사이트</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://example.com"
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 업적 표시 탭 */}
              <TabsContent value="achievements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>업적</CardTitle>
                    <CardDescription>PromptHub에서의 활동으로 얻은 업적들을 확인하세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {achievements.map((achievement) => {
                        const Icon = achievement.icon
                        return (
                          <div
                            key={achievement.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              achievement.earned
                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  achievement.earned
                                    ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-400"
                                    : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3
                                    className={`font-semibold ${
                                      achievement.earned
                                        ? "text-green-800 dark:text-green-200"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {achievement.title}
                                  </h3>
                                  {achievement.earned && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                                    >
                                      달성
                                    </Badge>
                                  )}
                                </div>
                                <p
                                  className={`text-sm ${
                                    achievement.earned
                                      ? "text-green-700 dark:text-green-300"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {achievement.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 알림 설정 탭 */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>알림 설정</CardTitle>
                    <CardDescription>받고 싶은 알림을 선택하세요</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>이메일 알림</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          새로운 리뷰와 댓글에 대한 이메일 알림
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>푸시 알림</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">브라우저 푸시 알림</p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>주간 요약</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">주간 활동 요약 이메일</p>
                      </div>
                      <Switch
                        checked={notifications.weekly}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>트렌딩 알림</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">인기 프롬프트 알림</p>
                      </div>
                      <Switch
                        checked={notifications.trending}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, trending: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 개인정보 보호 탭 */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>개인정보 보호</CardTitle>
                    <CardDescription>개인정보 및 계정 보안 설정</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">비밀번호 변경</h3>
                        </div>
                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Shield className="w-4 h-4 mr-2" />
                              비밀번호 변경
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>비밀번호 변경</DialogTitle>
                              <DialogDescription>
                                보안을 위해 현재 비밀번호를 확인한 후 새로운 비밀번호로 변경할 수 있습니다.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="current-password">현재 비밀번호</Label>
                                <Input
                                  id="current-password"
                                  type="password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  placeholder="현재 비밀번호를 입력하세요"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password">새 비밀번호</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
                                <Input
                                  id="new-password-confirm"
                                  type="password"
                                  value={passwordData.newPasswordConfirm}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPasswordConfirm: e.target.value })}
                                  placeholder="새 비밀번호를 다시 입력하세요"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsPasswordDialogOpen(false)}
                                disabled={isChangingPassword}
                              >
                                취소
                              </Button>
                              <Button 
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword}
                              >
                                {isChangingPassword ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    변경 중...
                                  </>
                                ) : (
                                  "비밀번호 변경"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">계정 삭제</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">계정 삭제</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>정말로 계정을 삭제하시겠습니까?</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="delete-confirmation">확인</Label>
                                <Input
                                  id="delete-confirmation"
                                  value={deleteConfirmation}
                                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                                  placeholder="'DELETE' 또는 '삭제'를 입력하세요"
                                />
                                <p className="text-xs text-gray-500">
                                  계정 삭제를 확인하려면 위 입력란에 "DELETE" 또는 "삭제"를 정확히 입력하세요.
                                </p>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                onClick={() => setDeleteConfirmation('')}
                                disabled={isDeletingAccount}
                              >
                                취소
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleAccountDelete}
                                disabled={isDeletingAccount}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeletingAccount ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    삭제 중...
                                  </>
                                ) : (
                                  "계정 삭제"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* 페이지 푸터 */}
      <Footer />
    </div>
  )
}
