"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Star,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Brain,
  Target,
} from "lucide-react"

const promptPosts = [
  {
    id: 1,
    title: "완벽한 마케팅 카피 생성 프롬프트",
    author: "PromptMaster",
    authorLevel: "Expert",
    timeAgo: "2시간 전",
    model: "GPT-4",
    category: "마케팅",
    prompt:
      "당신은 20년 경력의 마케팅 전문가입니다. [제품명], [타겟 고객], [핵심 기능]을 바탕으로 감정적 어필과 논리적 근거를 균형있게 담은 50자 이내의 마케팅 카피를 작성해주세요. 반드시 CTA(Call to Action)를 포함하고, A/B 테스트용 2가지 버전을 제공해주세요.",
    response:
      "🎯 버전 A: '바쁜 직장인을 위한 10분 완성 건강식! 영양사 추천 레시피로 오늘부터 시작하세요 →'\n🎯 버전 B: '매일 10분으로 건강 챙기기! 전문가 인증 간편식으로 새로운 나를 만나보세요 ✨'",
    ratings: {
      accuracy: 4.8,
      usefulness: 4.9,
      creativity: 4.7,
    },
    votes: { up: 234, down: 12 },
    comments: 45,
    tags: ["마케팅", "카피라이팅", "A/B테스트", "CTA"],
    isBookmarked: false,
    difficulty: "중급",
  },
  {
    id: 2,
    title: "코드 리뷰 자동화 프롬프트 (React 전용)",
    author: "DevGuru",
    authorLevel: "Pro",
    timeAgo: "5시간 전",
    model: "Claude-3.5",
    category: "개발",
    prompt:
      "당신은 시니어 React 개발자입니다. 다음 코드를 리뷰하고 1) 성능 최적화 2) 접근성 3) 보안 4) 코드 품질 관점에서 분석해주세요. 각 항목별로 점수(1-10)와 구체적인 개선 제안을 제공하고, 우선순위가 높은 이슈 3가지를 선별해주세요.",
    response:
      "## 코드 리뷰 결과\n\n**성능 최적화: 7/10**\n- useMemo 누락으로 불필요한 재계산 발생\n- 컴포넌트 분리로 리렌더링 최적화 필요\n\n**접근성: 6/10**\n- aria-label 누락\n- 키보드 네비게이션 미지원\n\n**보안: 9/10**\n- XSS 방지 처리 완료\n- 입력값 검증 양호",
    ratings: {
      accuracy: 4.9,
      usefulness: 4.8,
      creativity: 4.5,
    },
    votes: { up: 189, down: 8 },
    comments: 32,
    tags: ["React", "코드리뷰", "성능최적화", "접근성"],
    isBookmarked: true,
    difficulty: "고급",
  },
  {
    id: 3,
    title: "창의적 스토리텔링 프롬프트",
    author: "StoryWeaver",
    authorLevel: "Creative",
    timeAgo: "1일 전",
    model: "GPT-4",
    category: "창작",
    prompt:
      "당신은 베스트셀러 작가입니다. [장르], [주인공 설정], [갈등 상황]을 바탕으로 독자의 감정을 자극하는 2000자 분량의 단편 소설을 작성해주세요. 반전 요소를 포함하고, 마지막 문장은 여운이 남도록 작성해주세요.",
    response:
      "어둠이 내린 카페에서 그녀는 마지막 손님을 기다리고 있었다. 매일 같은 시간, 같은 자리에 앉아 아무것도 주문하지 않는 그 남자를...\n\n[중략]\n\n그제서야 깨달았다. 그가 기다리던 것은 커피가 아니라, 용기였다는 것을.",
    ratings: {
      accuracy: 4.6,
      usefulness: 4.4,
      creativity: 4.9,
    },
    votes: { up: 156, down: 15 },
    comments: 28,
    tags: ["스토리텔링", "창작", "소설", "감정"],
    isBookmarked: false,
    difficulty: "초급",
  },
]

const categories = ["전체", "마케팅", "개발", "창작", "분석", "교육", "기타"]
const models = ["전체", "GPT-4", "GPT-3.5", "Claude-3.5", "Gemini", "기타"]
const sortOptions = ["인기순", "최신순", "평점순", "댓글순"]

export function PromptCommunity() {
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [selectedModel, setSelectedModel] = useState("전체")
  const [sortBy, setSortBy] = useState("인기순")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급":
        return "bg-green-100 text-green-800"
      case "중급":
        return "bg-yellow-100 text-yellow-800"
      case "고급":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthorLevelIcon = (level: string) => {
    switch (level) {
      case "Expert":
        return <Award className="w-4 h-4 text-yellow-500" />
      case "Pro":
        return <Star className="w-4 h-4 text-blue-500" />
      case "Creative":
        return <Zap className="w-4 h-4 text-purple-500" />
      default:
        return <Target className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">프롬프트 커뮤니티</h2>
        </div>
        <p className="text-lg text-gray-600">전문가들의 검증된 프롬프트를 발견하고 학습하세요</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="프롬프트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            필터 {showFilters ? "숨기기" : "보기"}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs px-3 py-1 h-8"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Model Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => (
                    <Button
                      key={model}
                      variant={selectedModel === model ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedModel(model)}
                      className="text-xs px-3 py-1 h-8"
                    >
                      {model}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Button
                      key={option}
                      variant={sortBy === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(option)}
                      className="text-xs px-3 py-1 h-8"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
        {promptPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer break-words">
                        {post.title}
                      </h3>
                      <Badge className={`${getDifficultyColor(post.difficulty)} flex-shrink-0 w-fit`}>
                        {post.difficulty}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {getAuthorLevelIcon(post.authorLevel)}
                        <span className="font-medium truncate">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{post.timeAgo}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {post.model}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-start">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span className="font-medium">
                          {((post.ratings.accuracy + post.ratings.usefulness + post.ratings.creativity) / 3).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Prompt */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">프롬프트</h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">{post.prompt}</p>
              </div>

              {/* Response Preview */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">응답 예시</h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                  {post.response.length > 150 ? `${post.response.substring(0, 150)}...` : post.response}
                </p>
                {post.response.length > 150 && (
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs sm:text-sm mt-1">
                    더 보기
                  </Button>
                )}
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">{post.ratings.accuracy}</div>
                  <div className="text-xs text-gray-600">정확도</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">{post.ratings.usefulness}</div>
                  <div className="text-xs text-gray-600">유용성</div>
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">{post.ratings.creativity}</div>
                  <div className="text-xs text-gray-600">창의성</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 sm:gap-2 max-w-full">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs truncate max-w-[120px]">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-gray-600 hover:text-green-600 px-2 py-1 h-8"
                    >
                      <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{post.votes.up}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-gray-600 hover:text-red-600 px-2 py-1 h-8"
                    >
                      <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{post.votes.down}</span>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600 px-2 py-1 h-8"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{post.comments}</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-8">
                    프롬프트 복사
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-8">
                    북마크
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-8">
        <Button variant="outline" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />더 많은 프롬프트 보기
        </Button>
      </div>
    </div>
  )
}
