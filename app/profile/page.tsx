"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    trending: true,
  })

  // 실제 유저 정보
  const { user, updateProfile } = useAuth()

  // 편집 가능한 필드들
  const [editableUsername, setEditableUsername] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // 사용자명 중복 체크 관련 상태
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">(
    "idle",
  )
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 컴포넌트 마운트 시 사용자 정보로 초기화
  useEffect(() => {
    if (user) {
      setEditableUsername(user.username)
      setLocation(user.profile?.location || "")
      setWebsite(user.profile?.website || "")
    }
  }, [user])

  // location이 비어있을 때만 ipapi로 위치 정보 fetch
  useEffect(() => {
    if (!location) {
      const fetchLocation = async () => {
        try {
          setIsLoadingLocation(true)
          const response = await fetch("https://ipapi.co/json/")
          const data = await response.json()
          if (data.city && data.country_name) {
            setLocation(`${data.city}, ${data.country_name}`)
          } else {
            setLocation("위치 정보를 가져올 수 없습니다")
          }
        } catch (error) {
          setLocation("위치 정보를 가져올 수 없습니다")
        } finally {
          setIsLoadingLocation(false)
        }
      }
      fetchLocation()
    }
  }, [location])

  // 사용자명 검증 및 중복 체크 함수
  const checkUsernameAvailability = async (newUsername: string) => {
    // 입력값을 상태에 반영
    setEditableUsername(newUsername);

    // 0. 현재 사용자명과 같으면 검증하지 않음
    if (newUsername === user?.username) {
      setUsernameCheckStatus("idle");
      return;
    }

    // 1. 중복 체크 시작 (로딩 상태)
    setUsernameCheckStatus("checking");
    setIsCheckingUsername(true);

    // 2. 길이 및 빈 값 검증
    if (!newUsername || newUsername.length < 3 || newUsername.length > 12) {
      setUsernameCheckStatus("idle"); // 메시지: "3~12자 이내로 입력하세요" 등
      setIsCheckingUsername(false);
      return;
    }

    // 3. 금지된 사용자명 검증
    const forbiddenUsernames = ["admin", "test", "user", "demo", "sample"];
    if (forbiddenUsernames.includes(newUsername.toLowerCase())) {
      setUsernameCheckStatus("taken"); // 메시지: "사용할 수 없는 이름입니다"
      setIsCheckingUsername(false);
      return;
    }

    // 4. 특수문자/공백 검증 (영문, 숫자, 언더스코어만 허용)
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameCheckStatus("taken"); // 메시지: "특수문자, 공백 불가"
      setIsCheckingUsername(false);
      return;
    }

    // 5. 백엔드 중복 체크
    try {
      // 실제 API 요청 (경로가 백엔드와 일치해야 함)
      const res = await fetch(`http://localhost:8000/api/auth/check-username/?username=${encodeURIComponent(newUsername)}`);
      if (!res.ok) {
        setUsernameCheckStatus("error"); // 네트워크/서버 에러
        setIsCheckingUsername(false);
        return;
      }
      const data = await res.json();
      setUsernameCheckStatus(data.available ? "available" : "taken");
    } catch (e) {
      setUsernameCheckStatus("error"); // 네트워크 예외
    } finally {
      setIsCheckingUsername(false); // 로딩 해제
    }
  }

  // 사용자명 상태에 따른 스타일링, 아이콘, 메시지를 한 번에 처리
  const getUsernameStatusConfig = () => {
    const baseInputClass = "pr-10"
    
    // 편집 모드가 아닌 경우
    if (!isEditing) {
      return {
        inputClassName: `${baseInputClass} bg-gray-50`,
        icon: null,
        message: null
      }
    }

    // 사용자명이 변경되지 않은 경우 (현재 사용자명과 동일)
    if (editableUsername === user?.username) {
      return {
        inputClassName: baseInputClass,
        icon: null,
        message: null
      }
    }

    // 입력값이 없는 경우
    if (!editableUsername) {
      return {
        inputClassName: baseInputClass,
        icon: null,
        message: null
      }
    }

    // 길이 검증 (3자 미만 또는 12자 초과)
    if (editableUsername.length < 3) {
      return {
        inputClassName: `${baseInputClass} border-gray-300`,
        icon: <XCircle className="w-4 h-4 text-gray-400" />,
        message: <p className="text-xs text-gray-500">사용자명은 3자 이상이어야 합니다</p>
      }
    }

    if (editableUsername.length > 12) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">사용자명은 12자 이하로 입력하세요</p>
      }
    }

    // 특수문자/공백 검증 (영문, 숫자, 언더스코어만 허용)
    if (!/^[a-zA-Z0-9_]+$/.test(editableUsername)) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">영문, 숫자, 언더스코어(_)만 사용 가능합니다</p>
      }
    }

    // 금지된 사용자명 검증
    const forbiddenUsernames = ["admin", "test", "user", "demo", "sample"]
    if (forbiddenUsernames.includes(editableUsername.toLowerCase())) {
      return {
        inputClassName: `${baseInputClass} border-red-500 focus:border-red-500 focus:ring-red-500`,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: <p className="text-xs text-red-600">사용할 수 없는 사용자명입니다</p>
      }
    }

    // 백엔드 검증 상태별 처리
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
        // 기본 상태 (검증 통과, 아직 서버 체크 안함)
        return {
          inputClassName: `${baseInputClass} border-gray-300`,
          icon: null,
          message: null
        }
    }
  }

  // 저장 가능 여부 확인
  const canSave = () => {
    if (isSaving || isCheckingUsername) return false;

    // username이 변경된 경우
    if (editableUsername !== user?.username) {
      return usernameCheckStatus === "available" && editableUsername.length >= 3;
    }

    // website, location 등 다른 필드가 변경된 경우
    if (
      website !== (user.profile?.website || "") ||
      location !== (user.profile?.location || "")
    ) {
      return true;
    }

    // 아무것도 변경되지 않은 경우
    return false;
  }

  if (!user) {
    return <div>로딩 중...</div>
  }

  // 가입일 변환
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : ""

  const stats = {
    totalReviews: 47,
    avgRating: 4.6,
    totalLikes: 312,
    followers: 89,
    following: 156,
    bookmarks: 23,
  }

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

  const handleSave = async () => {
    if (!canSave()) return

    setIsSaving(true)

    try {
      // 실제 API 호출로 사용자 정보 업데이트
      await updateProfile({
        username: editableUsername,
        profile: {
          location,
          website,
        },
      })

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

  const handleCancel = () => {
    // 편집 취소 시 원래 값으로 되돌리기
    setEditableUsername(user.username)
    setUsernameCheckStatus("idle")
    setIsEditing(false)
  }

  const { inputClassName, icon, message } = getUsernameStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">내 프로필</h1>
          <p className="text-gray-600 dark:text-gray-400">프로필 정보를 관리하고 설정을 변경하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* 아바타 섹션 */}
                  <div className="relative group mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" alt={user.username} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        {user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
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

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">프로필</TabsTrigger>
                <TabsTrigger value="achievements">업적</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
                <TabsTrigger value="privacy">개인정보</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
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

              {/* 나머지 탭들은 동일하므로 생략... */}
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

              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>개인정보 보호</CardTitle>
                    <CardDescription>개인정보 및 계정 보안 설정</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">비밀번호 변경</h3>
                        <Button variant="outline">
                          <Shield className="w-4 h-4 mr-2" />
                          비밀번호 변경
                        </Button>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">계정 삭제</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                        </p>
                        <Button variant="destructive">계정 삭제</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
