"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, Star, TrendingUp, Clock, Award, Zap, Target, Brain } from "lucide-react"
import Link from "next/link"

/**
 * 프롬프트 포스트 데이터 타입 정의
 */
interface PromptPost {
  id: number
  title: string
  author: string
  authorLevel: "Expert" | "Pro" | "Creative" | "Basic"
  timeAgo: string
  model: string
  category: string
  prompt: string
  response: string
  ratings: {
    accuracy: number
    usefulness: number
    creativity: number
  }
  votes: {
    up: number
    down: number
  }
  tags: string[]
  isBookmarked: boolean
  difficulty: "초급" | "중급" | "고급"
}

/**
 * 프롬프트 포스트 데이터
 */
const PROMPT_POSTS: PromptPost[] = [
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
      accuracy: 4.5,
      usefulness: 5.0,
      creativity: 4.5,
    },
    votes: { up: 234, down: 12 },
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
      accuracy: 5.0,
      usefulness: 4.5,
      creativity: 4.0,
    },
    votes: { up: 189, down: 8 },
    tags: ["React", "코드리뷰", "성능최적화", "접근성"],
    isBookmarked: true,
    difficulty: "고급",
  },
  {
    id: 3,
    title: "창의적인 소설 플롯 생성기",
    author: "StoryWeaver",
    authorLevel: "Creative",
    timeAgo: "1일 전",
    model: "GPT-4",
    category: "창작",
    prompt:
      "당신은 베스트셀러 작가입니다. [장르], [주인공 설정], [배경]을 바탕으로 독창적이고 흥미진진한 소설 플롯을 만들어주세요. 반전 요소 2개와 클라이맥스 장면을 포함하고, 각 챕터별 간단한 개요도 제공해주세요. 총 10챕터 구성으로 작성해주세요.",
    response:
      "📚 **장르**: SF 스릴러\n**주인공**: 기억을 잃은 AI 연구원\n**배경**: 2045년 네오 도쿄\n\n**플롯 개요**:\n주인공은 자신이 개발한 AI가 인간의 기억을 조작할 수 있다는 사실을 발견하지만, 정작 자신의 기억이 조작되었다는 것을 깨닫게 됩니다.\n\n**반전 1**: 주인공 자신이 실제로는 AI였음\n**반전 2**: 기억 조작은 인류를 구하기 위한 선택이었음",
    ratings: {
      accuracy: 4.0,
      usefulness: 4.5,
      creativity: 5.0,
    },
    votes: { up: 156, down: 5 },
    tags: ["창작", "소설", "플롯", "스토리텔링"],
    isBookmarked: false,
    difficulty: "중급",
  },
]



/**
 * 프롬프트 커뮤니티 섹션 컴포넌트
 * 
 * 기능:
 * - 프롬프트 포스트 목록 표시
 * - 카테고리, 모델, 정렬 필터링
 * - 검색 기능
 * - 투표 및 북마크 기능
 * - 반응형 디자인 지원
 * - 접근성 고려
 */
export function PromptCommunity() {
  // 각 포스트의 응답 확장 상태 관리
  const [expandedResponses, setExpandedResponses] = useState<Record<number, boolean>>({})

  /**
   * 응답 확장/축소 토글 핸들러
   * @param postId - 포스트 ID
   */
  const toggleResponseExpansion = (postId: number) => {
    setExpandedResponses(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  /**
   * 난이도에 따른 색상 클래스 반환
   * @param difficulty - 난이도
   * @returns 색상 클래스 문자열
   */
  const getDifficultyColor = (difficulty: PromptPost["difficulty"]): string => {
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

  /**
   * 작성자 레벨에 따른 아이콘 반환
   * @param level - 작성자 레벨
   * @returns 아이콘 JSX 엘리먼트
   */
  const getAuthorLevelIcon = (level: PromptPost["authorLevel"]): JSX.Element => {
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

  /**
   * 투표 핸들러
   * @param postId - 포스트 ID
   * @param type - 투표 타입 (up/down)
   */
  const handleVote = (postId: number, type: "up" | "down") => {
    // 실제 구현에서는 API 호출
    console.log(`${type} vote for post ${postId}`)
  }

  /**
   * 북마크 토글 핸들러
   * @param postId - 포스트 ID
   */
  const handleBookmark = (postId: number) => {
    // 실제 구현에서는 API 호출
    console.log(`Toggle bookmark for post ${postId}`)
  }

  /**
   * 프롬프트 복사 핸들러
   * @param prompt - 복사할 프롬프트 텍스트
   */
  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      // 실제 구현에서는 토스트 알림 표시
      console.log("프롬프트가 클립보드에 복사되었습니다")
    } catch (error) {
      console.error("복사 실패:", error)
    }
  }

  return (
    <section 
      className="w-full max-w-7xl mx-auto p-4 sm:p-6" 
      aria-labelledby="community-section-title"
    >
      {/* 섹션 헤더 */}
      <header className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain 
            className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" 
            aria-hidden="true"
          />
          <h2 
            id="community-section-title"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-wrap-balance"
          >
            프롬프트&nbsp;커뮤니티
          </h2>
        </div>
        <p className="text-lg text-gray-600 text-wrap-pretty">
          전문가들의 검증된 프롬프트를 발견하고&nbsp;학습하세요
        </p>
      </header>



      {/* 포스트 목록 */}
      <div className="space-y-6">
        {PROMPT_POSTS.map((post) => (
            <Card 
              key={post.id} 
              className="hover:shadow-lg transition-shadow duration-200"
              role="article"
              aria-labelledby={`post-title-${post.id}`}
            >
              <CardHeader className="pb-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 
                          id={`post-title-${post.id}`}
                          className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer break-words"
                        >
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
                {/* 프롬프트 */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">프롬프트</h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                    {post.prompt}
                  </p>
                </div>

                {/* 응답 미리보기 */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">응답 예시</h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                    {expandedResponses[post.id] || post.response.length <= 150 
                      ? post.response 
                      : `${post.response.substring(0, 150)}...`
                    }
                  </p>
                  {post.response.length > 150 && (
                    <Button 
                      variant="link" 
                      onClick={() => toggleResponseExpansion(post.id)}
                      className="p-0 h-auto text-blue-600 text-xs sm:text-sm mt-1"
                    >
                      {expandedResponses[post.id] ? "접기" : "더 보기"}
                    </Button>
                  )}
                </div>

                {/* 평점 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {post.ratings.accuracy}
                    </div>
                    <div className="text-xs text-gray-600">정확도</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {post.ratings.usefulness}
                    </div>
                    <div className="text-xs text-gray-600">유용성</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {post.ratings.creativity}
                    </div>
                    <div className="text-xs text-gray-600">창의성</div>
                  </div>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1 sm:gap-2 max-w-full">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs truncate max-w-[120px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, "up")}
                        className="flex items-center gap-1 text-gray-600 hover:text-green-600 px-2 py-1 h-8"
                        aria-label={`추천 (현재 ${post.votes.up}개)`}
                      >
                        <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">{post.votes.up}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, "down")}
                        className="flex items-center gap-1 text-gray-600 hover:text-red-600 px-2 py-1 h-8"
                        aria-label={`비추천 (현재 ${post.votes.down}개)`}
                      >
                        <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">{post.votes.down}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyPrompt(post.prompt)}
                      className="text-xs px-3 py-1 h-8"
                    >
                      프롬프트 복사
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleBookmark(post.id)}
                      className="text-xs px-3 py-1 h-8"
                    >
                      북마크
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* 더 많은 프롬프트 보기 링크 */}
      <div className="text-center mt-8">
        <Link href="/community">
          <Button variant="outline" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            더 많은 프롬프트 보기
          </Button>
        </Link>
      </div>
    </section>
  )
}
