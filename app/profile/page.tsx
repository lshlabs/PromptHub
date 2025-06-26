"use client"

import { useState } from "react"
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
} from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    trending: true,
  })

  // Mock user data
  const [userProfile, setUserProfile] = useState({
    name: "김철수",
    email: "kimcs@example.com",
    username: "promptmaster",
    bio: "AI 프롬프트 엔지니어링에 관심이 많은 개발자입니다. 효율적인 프롬프트 작성을 통해 더 나은 AI 결과를 얻는 것이 목표입니다.",
    joinDate: "2024년 3월",
    location: "서울, 대한민국",
    website: "https://github.com/promptmaster",
  })

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

  const handleSave = () => {
    setIsEditing(false)
    // 실제 저장 로직 구현
    console.log("Profile saved:", userProfile)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt={userProfile.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {userProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userProfile.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">@{userProfile.username}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>{userProfile.joinDate}에 가입</span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{userProfile.bio}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Globe className="w-4 h-4" />
                    <span>{userProfile.location}</span>
                  </div>

                  {userProfile.website && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <span>🔗</span>
                      <a
                        href={userProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {userProfile.website}
                      </a>
                    </div>
                  )}
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
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-2" />
                          편집
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input
                          id="name"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">사용자명</Label>
                        <Input
                          id="username"
                          value={userProfile.username}
                          onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">소개</Label>
                      <textarea
                        id="bio"
                        className="w-full p-3 border border-gray-300 rounded-md resize-none h-24 disabled:bg-gray-50 disabled:text-gray-500"
                        value={userProfile.bio}
                        onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                        disabled={!isEditing}
                        placeholder="자신을 소개해주세요..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">위치</Label>
                        <Input
                          id="location"
                          value={userProfile.location}
                          onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">웹사이트</Label>
                        <Input
                          id="website"
                          value={userProfile.website}
                          onChange={(e) => setUserProfile({ ...userProfile, website: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
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

              {/* Settings Tab */}
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

                <Card>
                  <CardHeader>
                    <CardTitle>테마 설정</CardTitle>
                    <CardDescription>원하는 테마를 선택하세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>다크 모드</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">어두운 테마 사용</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                        <Moon className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
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
    </div>
  )
}
