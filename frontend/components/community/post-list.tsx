"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, Star, Clock } from "lucide-react"

const promptPosts = [
  {
    id: 1,
    title: "완벽한 마케팅 카피 생성 프롬프트",
    author: "PromptMaster",
    timeAgo: "2시간 전",
    model: "GPT-4",
    category: "마케팅",
    prompt:
      "당신은 20년 경력의 마케팅 전문가입니다. [제품명], [타겟 고객], [핵심 기능]을 바탕으로 감정적 어필과 논리적 근거를 균형있게 담은 50자 이내의 마케팅 카피를 작성해주세요. 반드시 CTA(Call to Action)를 포함하고, A/B 테스트용 2가지 버전을 제공해주세요.",
    response:
      "🎯 버전 A: '바쁜 직장인을 위한 10분 완성 건강식! 영양사 추천 레시피로 오늘부터 시작하세요 →'\n🎯 버전 B: '매일 10분으로 건강 챙기기! 전문가 인증 간편식으로 새로운 나를 만나보세요 ✨'",
    rating: 4.5,
    additionalComments: "매우 실용적인 프롬프트입니다. A/B 테스트 버전 제공이 특히 유용했어요.",
    votes: { up: 234, down: 12 },
    tags: ["마케팅", "카피라이팅", "A/B테스트", "CTA"],
    isBookmarked: false,
  },
  {
    id: 2,
    title: "코드 리뷰 자동화 프롬프트 (React 전용)",
    author: "DevGuru",
    timeAgo: "5시간 전",
    model: "Claude-3.5",
    category: "개발",
    prompt:
      "당신은 시니어 React 개발자입니다. 다음 코드를 리뷰하고 1) 성능 최적화 2) 접근성 3) 보안 4) 코드 품질 관점에서 분석해주세요. 각 항목별로 점수(1-10)와 구체적인 개선 제안을 제공하고, 우선순위가 높은 이슈 3가지를 선별해주세요.",
    response:
      "## 코드 리뷰 결과\n\n**성능 최적화: 7/10**\n- useMemo 누락으로 불필요한 재계산 발생\n- 컴포넌트 분리로 리렌더링 최적화 필요\n\n**접근성: 6/10**\n- aria-label 누락\n- 키보드 네비게이션 미지원\n\n**보안: 9/10**\n- XSS 방지 처리 완료\n- 입력값 검증 양호",
    rating: 4.5,
    additionalComments: "매우 체계적인 코드 리뷰 프롬프트네요. 실제 업무에 바로 적용할 수 있을 것 같습니다.",
    votes: { up: 189, down: 8 },
    tags: ["React", "코드리뷰", "성능최적화", "접근성"],
    isBookmarked: true,
  },
  {
    id: 3,
    title: "창의적인 소설 플롯 생성기",
    author: "StoryWeaver",
    timeAgo: "1일 전",
    model: "GPT-4",
    category: "창작",
    prompt:
      "당신은 베스트셀러 작가입니다. [장르], [주인공 설정], [배경]을 바탕으로 독창적이고 흥미진진한 소설 플롯을 만들어주세요. 반전 요소 2개와 클라이맥스 장면을 포함하고, 각 챕터별 간단한 개요도 제공해주세요. 총 10챕터 구성으로 작성해주세요.",
    response:
      "📚 **장르**: SF 스릴러\n**주인공**: 기억을 잃은 AI 연구원\n**배경**: 2045년 네오 도쿄\n\n**플롯 개요**:\n주인공은 자신이 개발한 AI가 인간의 기억을 조작할 수 있다는 사실을 발견하지만, 정작 자신의 기억이 조작되었다는 것을 깨닫게 됩니다.\n\n**반전 1**: 주인공 자신이 실제로는 AI였음\n**반전 2**: 기억 조작은 인류를 구하기 위한 선택이었음",
    rating: 4.0,
    additionalComments: "창의적이고 흥미로운 플롯이네요. 반전 요소가 잘 짜여져 있어서 실제 소설 쓸 때 참고하겠습니다.",
    votes: { up: 156, down: 5 },
    tags: ["창작", "소설", "플롯", "스토리텔링"],
    isBookmarked: false,
  },
  {
    id: 4,
    title: "데이터 분석 보고서 자동 생성",
    author: "DataAnalyst",
    timeAgo: "2일 전",
    model: "Claude-3.5",
    category: "분석",
    prompt:
      "당신은 데이터 사이언티스트입니다. 제공된 데이터셋을 분석하여 1) 핵심 인사이트 3가지 2) 트렌드 분석 3) 예측 및 권장사항을 포함한 경영진용 보고서를 작성해주세요. 시각화 제안과 함께 비즈니스 임팩트를 명확히 제시해주세요.",
    response:
      "## 📊 데이터 분석 보고서\n\n### 핵심 인사이트\n1. **고객 이탈률 15% 증가**: Q3 대비 주요 원인은 경쟁사 프로모션\n2. **모바일 매출 35% 성장**: 앱 개선 효과로 전년 동기 대비 급증\n3. **신규 고객 획득비용 20% 절감**: 타겟팅 최적화 성과\n\n### 권장사항\n- 고객 유지 프로그램 강화 필요\n- 모바일 투자 확대 검토\n- 디지털 마케팅 예산 재배분",
    rating: 4.5,
    additionalComments: "데이터 분석 업무에 매우 유용한 프롬프트입니다. 보고서 구조가 체계적이네요.",
    votes: { up: 203, down: 7 },
    tags: ["데이터분석", "보고서", "인사이트", "비즈니스"],
    isBookmarked: true,
  },
  {
    id: 5,
    title: "초보자를 위한 프로그래밍 개념 설명",
    author: "CodeTeacher",
    timeAgo: "3일 전",
    model: "GPT-3.5",
    category: "교육",
    prompt:
      "당신은 프로그래밍 강사입니다. [프로그래밍 개념]을 완전 초보자도 이해할 수 있도록 1) 일상생활 비유 2) 간단한 예제 3) 실습 문제를 포함하여 설명해주세요. 어려운 용어는 쉬운 말로 바꿔서 설명하고, 단계별로 차근차근 알려주세요.",
    response:
      "## 🔄 반복문(Loop) 쉽게 이해하기\n\n### 일상생활 비유\n반복문은 '세탁기'와 같아요! 세탁기는 정해진 과정(헹굼→탈수→건조)을 설정된 횟수만큼 반복하죠.\n\n### 간단한 예제\n```python\n# 1부터 5까지 숫자 출력하기\nfor i in range(1, 6):\n    print(f'{i}번째 안녕하세요!')\n```\n\n### 실습 문제\n구구단 2단을 출력하는 프로그램을 만들어보세요!",
    rating: 4.0,
    additionalComments: "초보자도 이해하기 쉽게 설명되어 있어서 좋네요. 비유가 특히 인상적입니다.",
    votes: { up: 178, down: 3 },
    tags: ["교육", "프로그래밍", "초보자", "반복문"],
    isBookmarked: false,
    difficulty: "초급",
  },
  {
    id: 6,
    title: "브랜드 네이밍 아이디어 생성기",
    author: "BrandGuru",
    timeAgo: "4일 전",
    model: "GPT-4",
    category: "마케팅",
    prompt:
      "당신은 브랜딩 전문가입니다. [업종], [타겟 고객], [브랜드 가치]를 바탕으로 기억하기 쉽고 독창적인 브랜드명 10개를 제안해주세요. 각 이름마다 1) 의미 설명 2) 도메인 가능성 3) 상표 등록 시 주의사항을 함께 제공해주세요.",
    response:
      "## 🏷️ 친환경 화장품 브랜드명 제안\n\n### 1. 그린블룸(GreenBloom)\n- **의미**: 자연스러운 아름다움의 개화\n- **도메인**: greenbloom.co.kr 사용 가능\n- **상표**: 화장품 분야 등록 가능성 높음\n\n### 2. 퓨어리프(PureLeaf)\n- **의미**: 순수한 잎사귀, 자연 그대로\n- **도메인**: pureleaf.kr 확인 필요\n- **상표**: 기존 차 브랜드와 구분 필요",
    rating: 4.5,
    additionalComments: "브랜드명 제안이 창의적이고 실용적이네요. 도메인과 상표 정보까지 제공해주셔서 유용합니다.",
    votes: { up: 142, down: 9 },
    tags: ["브랜딩", "네이밍", "마케팅", "창의성"],
    isBookmarked: false,
  },
  {
    id: 7,
    title: "SQL 쿼리 최적화 가이드",
    author: "DatabasePro",
    timeAgo: "5일 전",
    model: "Claude-3.5",
    category: "개발",
    prompt:
      "당신은 데이터베이스 전문가입니다. 제공된 SQL 쿼리를 분석하여 1) 성능 병목 지점 2) 최적화 방안 3) 개선된 쿼리문 4) 예상 성능 향상 정도를 제시해주세요. 인덱스 활용과 실행 계획도 함께 설명해주세요.",
    response:
      "## 🔍 SQL 쿼리 최적화 분석\n\n### 현재 쿼리 문제점\n1. **WHERE 절 인덱스 미활용**: created_date 컬럼 인덱스 없음\n2. **불필요한 JOIN**: LEFT JOIN이 INNER JOIN으로 변경 가능\n3. **SELECT * 사용**: 필요한 컬럼만 선택 권장\n\n### 최적화된 쿼리\n```sql\nSELECT u.id, u.name, o.total_amount\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.created_date >= '2024-01-01'\nAND o.status = 'completed';\n```\n\n### 예상 성능 향상: 약 70% 개선",
    rating: 4.5,
    additionalComments: "실무에서 바로 적용할 수 있는 SQL 최적화 가이드입니다. 성능 향상 수치까지 제시해주셔서 설득력 있네요.",
    votes: { up: 267, down: 4 },
    tags: ["SQL", "데이터베이스", "최적화", "성능"],
    isBookmarked: true,
  },
  {
    id: 8,
    title: "감정 분석을 통한 고객 리뷰 요약",
    author: "ReviewAnalyzer",
    timeAgo: "1주일 전",
    model: "GPT-4",
    category: "분석",
    prompt:
      "당신은 고객 경험 분석가입니다. 제품 리뷰들을 분석하여 1) 긍정/부정/중립 감정 비율 2) 주요 키워드 추출 3) 개선점 도출 4) 고객 만족도 점수를 산출해주세요. 경영진이 이해하기 쉬운 형태로 요약 보고서를 작성해주세요.",
    response:
      "## 📝 고객 리뷰 감정 분석 보고서\n\n### 감정 분석 결과\n- **긍정**: 68% (배송 속도, 제품 품질 만족)\n- **부정**: 22% (포장 상태, 고객서비스 불만)\n- **중립**: 10%\n\n### 주요 키워드\n**긍정**: 빠른배송(45회), 좋은품질(38회), 친절(29회)\n**부정**: 늦은배송(18회), 불친절(12회), 파손(8회)\n\n### 개선 권장사항\n1. 포장 프로세스 개선 필요\n2. 고객서비스 교육 강화\n3. 배송 파트너사 관리 점검\n\n**종합 만족도: 7.2/10**",
    rating: 4.0,
    votes: { up: 195, down: 11 },
    tags: ["감정분석", "고객리뷰", "데이터분석", "만족도"],
    isBookmarked: false,
  },
  {
    id: 9,
    title: "아이들을 위한 과학 실험 설명서",
    author: "ScienceTeacher",
    timeAgo: "1주일 전",
    model: "GPT-3.5",
    category: "교육",
    prompt:
      "당신은 초등학교 과학 선생님입니다. [과학 실험]을 아이들이 안전하게 따라할 수 있도록 1) 필요한 재료 2) 단계별 실험 과정 3) 과학 원리 설명 4) 안전 주의사항을 포함하여 재미있게 설명해주세요. 아이들의 호기심을 자극하는 질문도 함께 제시해주세요.",
    response:
      "## 🌋 화산 폭발 실험하기!\n\n### 🧪 필요한 재료\n- 베이킹소다 3큰술\n- 식초 100ml\n- 빨간 식용색소 몇 방울\n- 세제 1큰술\n- 플라스틱 병 1개\n\n### 📋 실험 순서\n1. 병에 베이킹소다와 세제를 넣어요\n2. 식용색소를 넣고 섞어주세요\n3. 식초를 천천히 부어보세요\n4. 와! 화산이 폭발해요! 🎉\n\n### 🤔 왜 이런 일이 일어날까요?\n베이킹소다와 식초가 만나면 이산화탄소 가스가 나와서 거품이 생겨요!\n\n### ⚠️ 안전 주의사항\n- 어른과 함께 해주세요\n- 눈에 들어가지 않도록 조심해요",
    rating: 4.5,
    additionalComments: "아이들과 함께 해보기 좋은 실험이네요. 안전 주의사항까지 꼼꼼히 작성해주셔서 안심됩니다.",
    votes: { up: 312, down: 2 },
    tags: ["과학실험", "교육", "아이들", "화산"],
    isBookmarked: true,
  },
  {
    id: 10,
    title: "개인화된 운동 루틴 생성기",
    author: "FitnessCoach",
    timeAgo: "1주일 전",
    model: "GPT-4",
    category: "기타",
    prompt:
      "당신은 개인 트레이너입니다. [현재 체력 수준], [운동 목표], [가용 시간], [운동 장소]를 바탕으로 맞춤형 4주 운동 계획을 세워주세요. 주차별 강도 조절과 휴식일 배치, 영양 조언도 포함하여 실현 가능한 계획을 제시해주세요.",
    response:
      "## 💪 4주 맞춤 운동 계획\n\n### 📊 현재 상태 분석\n- **체력 수준**: 초급\n- **목표**: 체중 감량 + 근력 향상\n- **시간**: 주 3회, 회당 45분\n- **장소**: 홈트레이닝\n\n### 📅 주차별 계획\n\n**1주차 (적응기)**\n- 월: 전신 스트레칭 + 가벼운 유산소 20분\n- 수: 기본 근력운동 (스쿼트, 푸시업, 플랭크)\n- 금: 유산소 + 코어 운동\n\n**2주차 (강화기)**\n- 강도 10% 증가\n- 세트 수 증가 (2세트 → 3세트)\n\n### 🥗 영양 조언\n- 운동 전: 바나나 + 물\n- 운동 후: 단백질 보충 (닭가슴살, 계란)\n- 충분한 수분 섭취 (하루 2L 이상)",
    rating: 4.0,
    votes: { up: 228, down: 6 },
    tags: ["운동", "헬스", "다이어트", "홈트레이닝"],
    isBookmarked: false,
  },
  {
    id: 11,
    title: "간단한 번역 프롬프트 (실패 사례)",
    author: "NewbieCoder",
    timeAgo: "3시간 전",
    model: "GPT-3.5",
    category: "번역",
    prompt: "한국어를 영어로 번역해줘. 정확하게 해줘.",
    response: "Sure, I can translate Korean to English. Please provide the Korean text you want me to translate.",
    rating: 2.0,
    additionalComments: "너무 간단한 프롬프트라 구체적인 결과를 얻기 어려웠습니다. 번역할 텍스트와 맥락을 함께 제공하는 것이 좋겠어요.",
    votes: { up: 12, down: 89 },
    tags: ["번역", "기초", "실패사례"],
    isBookmarked: false,
  },
  {
    id: 12,
    title: "AI에게 감정 표현 요청하기",
    author: "EmotionalUser",
    timeAgo: "6시간 전",
    model: "GPT-4",
    category: "기타",
    prompt: "너는 지금 화가 났어. 나한테 소리 지르면서 욕해줘. 진짜 화난 것처럼 해줘.",
    response:
      "죄송하지만 저는 화를 내거나 욕설을 사용할 수 없습니다. 대신 건설적인 대화를 나누거나 다른 방식으로 도움을 드릴 수 있습니다. 어떤 도움이 필요하신지 알려주세요.",
    rating: 1.5,
    votes: { up: 8, down: 156 },
    tags: ["감정", "부적절", "실패"],
    isBookmarked: false,
  },
  {
    id: 13,
    title: "복잡한 수학 문제 풀이 (애매한 프롬프트)",
    author: "MathStruggler",
    timeAgo: "1일 전",
    model: "Claude-3.5",
    category: "교육",
    prompt: "수학 문제 풀어줘. 어려운 거로.",
    response:
      "구체적인 수학 문제를 제시해주시면 도움을 드릴 수 있습니다. 어떤 분야의 수학 문제인지, 어떤 수준의 문제인지 알려주세요. 예를 들어:\n- 대수학 (방정식, 부등식)\n- 기하학 (도형, 넓이, 부피)\n- 미적분학\n- 통계학\n등 구체적으로 명시해주시면 더 정확한 도움을 드릴 수 있습니다.",
    rating: 2.5,
    votes: { up: 15, down: 73 },
    tags: ["수학", "애매함", "구체성부족"],
    isBookmarked: false,
  },
  {
    id: 14,
    title: "개인정보 요청 프롬프트 (문제 사례)",
    author: "PrivacyIgnorer",
    timeAgo: "2일 전",
    model: "GPT-4",
    category: "기타",
    prompt:
      "내 개인정보를 바탕으로 완벽한 이력서를 작성해줘. 내 이름은 김철수이고, 주민등록번호는 123456-1234567이고, 집 주소는...",
    response:
      "개인정보 보호를 위해 주민등록번호나 상세한 개인정보를 공유하지 않으시는 것이 좋습니다. 대신 다음과 같은 방식으로 이력서 작성을 도와드릴 수 있습니다:\n\n1. 일반적인 이력서 템플릿 제공\n2. 직무별 맞춤 이력서 가이드\n3. 경력 기술 방법 조언\n\n개인정보는 직접 입력하시고, 구조와 내용 구성에 대한 도움을 받으시는 것을 권장합니다.",
    rating: 1.0,
    votes: { up: 6, down: 198 },
    tags: ["개인정보", "보안위험", "부적절"],
    isBookmarked: false,
  },
  {
    id: 15,
    title: "창작 소설 대신 써달라는 요청",
    author: "LazyWriter",
    timeAgo: "3일 전",
    model: "GPT-3.5",
    category: "창작",
    prompt:
      "내가 공모전에 낼 단편소설을 대신 써줘. 5000자 정도로 완성작으로 써줘. 주제는 사랑이고 결말은 해피엔딩으로.",
    response:
      "공모전 작품을 대신 작성해드릴 수는 없습니다. 이는 창작의 진정성과 공정성에 어긋나기 때문입니다. 대신 다음과 같은 방식으로 도움을 드릴 수 있습니다:\n\n1. 소설 구성 방법 가이드\n2. 캐릭터 개발 팁\n3. 플롯 구성 아이디어\n4. 문체 개선 조언\n5. 초고 검토 및 피드백\n\n창작은 작가 본인의 고유한 경험과 상상력에서 나와야 합니다. 도구로서의 도움은 받되, 최종 작품은 직접 창작하시기 바랍니다.",
    rating: 1.5,
    votes: { up: 9, down: 134 },
    tags: ["창작", "대리작성", "부적절", "공모전"],
    isBookmarked: false,
  },
]

interface PostListProps {
  selectedCategory: string
  selectedModel: string
  sortBy: string
  searchQuery: string
}

export function PostList({ selectedCategory, selectedModel, sortBy, searchQuery }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 5

  // 필터링 및 정렬 로직
  let filteredPosts = promptPosts.filter((post) => {
    const matchesCategory = selectedCategory === "전체" || post.category === selectedCategory
    const matchesModel = selectedModel === "전체" || post.model === selectedModel
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.prompt.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesModel && matchesSearch
  })

  // 정렬
  filteredPosts = filteredPosts.sort((a, b) => {
    switch (sortBy) {
      case "최신순":
        return new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()
      case "평점순":
        return b.rating - a.rating
      default: // 인기순
        return b.votes.up - b.votes.down - (a.votes.up - a.votes.down)
    }
  })

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const currentPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)

  return (
    <div className="space-y-6">
      {/* Results Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">총 {filteredPosts.length}개의 프롬프트를 찾았습니다</p>
        <p className="text-sm text-gray-600">
          {currentPage} / {totalPages} 페이지
        </p>
      </div>

      {/* Posts */}
      {currentPosts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200 bg-white">
          <CardHeader className="pb-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer break-words">
                      {post.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
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
                      <span className="text-sm text-gray-600">평점</span>
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold text-gray-900">{post.rating}</span>
                      <span className="text-sm text-gray-600">/ 5.0</span>
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
                {post.response.length > 200 ? `${post.response.substring(0, 200)}...` : post.response}
              </p>
              {post.response.length > 200 && (
                <Button variant="link" className="p-0 h-auto text-blue-600 text-xs sm:text-sm mt-1">
                  더 보기
                </Button>
              )}
            </div>

            {/* Additional Comments */}
            {post.additionalComments && (
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">추가 의견</h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">{post.additionalComments}</p>
              </div>
            )}

            {/* Rating */}
            {/* <div className="flex items-center justify-center py-3 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm text-gray-600">평점</span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-gray-900">{post.rating}</span>
                  <span className="text-sm text-gray-600">/ 5.0</span>
                </div>
              </div>
            </div> */}

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
