import { Code, ImageIcon, Brain, Clock, DollarSign, Zap } from 'lucide-react'
import { samplePostDetails } from './SamplePostDetail'
import { type PostCard } from '@/types/api'

// 모델명 매핑 함수 - 하드코딩 방식 (주니어 개발자 친화적)
const mapDetailedModelToSimple = (detailedModel: string): string => {
  // 모든 모델명 매핑을 명시적으로 정의
  const modelMappings: Record<string, string> = {
    // Google
    'Gemini 2.5 Pro Preview 06-05': 'Gemini 2.5 Pro',
    'Gemini 2.5 Pro': 'Gemini 2.5 Pro',
    'Gemini 2.5 Flash': 'Gemini 2.5 Flash',
    'Gemini 2.5 Flash-Lite': 'Gemini 2.5 Flash-Lite',
    'Gemini 2.0 Flash': 'Gemini 2.0 Flash',
    'Gemini 1.5 Pro': 'Gemini 1.5 Pro',
    'Gemini 1.5 Flash': 'Gemini 1.5 Flash',

    // OpenAI
    o3: 'o3',
    'o4-mini': 'o4-mini',
    o1: 'o1',
    'GPT-4.5': 'GPT-4.5',
    'GPT-4.1': 'GPT-4.1',

    // Anthropic
    'Claude 4 Opus': 'Claude 4 Opus',
    'Claude 4 Sonnet': 'Claude 4 Sonnet',
    'Claude 3.7 Sonnet': 'Claude 3.7 Sonnet',
    'Claude 3.5 Sonnet': 'Claude 3.5 Sonnet',
    'Claude 3 Opus': 'Claude 3 Opus',

    // xAI
    'Grok-4': 'Grok-4',
    'Grok-3': 'Grok-3',
    'Grok-3 Mini': 'Grok-3 Mini',
    'Grok-2': 'Grok-2',
    'Grok-2 Mini': 'Grok-2 Mini',

    // Meta
    'Llama 4 Scout': 'Llama 4 Scout',
    'Llama 4 Maverick': 'Llama 4 Maverick',
    'Llama 3.3': 'Llama 3.3',
    'Llama 3.2': 'Llama 3.2',
    'Llama 3.1': 'Llama 3.1',

    // Mistral
    'Magistral Medium': 'Magistral Medium',
    'Magistral Small': 'Magistral Small',
    'Mistral Small 3.1': 'Mistral Small 3.1',
    'Mistral Small 3': 'Mistral Small 3',
    'Codestral-22B': 'Codestral-22B',

    // Perplexity (다른 플랫폼 모델 제공)
    Sonar: 'Sonar',
    'R1 1776': 'R1 1776',
    'Claude 4 Sonnet (Perplexity)': 'Claude 4 Sonnet',
    'GPT-4.1 (Perplexity)': 'GPT-4.1',
    'Gemini 2.5 Pro (Perplexity)': 'Gemini 2.5 Pro',

    // DeepSeek
    'DeepSeek R-1': 'DeepSeek-R1-0528',
    'DeepSeek-R1-0528': 'DeepSeek-R1-0528',
  }

  // 매핑된 값이 있으면 반환, 없으면 원본 반환
  return modelMappings[detailedModel] || detailedModel
}

// 디버깅용 함수 - 매핑 확인 (주니어 개발자 친화적)
export const debugModelMapping = (detailedModel: string): void => {
  console.log('=== 모델 매핑 디버깅 ===')
  console.log('원본 모델명:', detailedModel)

  const result = mapDetailedModelToSimple(detailedModel)

  if (result === detailedModel) {
    console.log('매핑 없음 - 원본 그대로 사용')
  } else {
    console.log('매핑 결과:', result)
  }

  console.log('========================')
}

// 모델명 매칭 함수 - 두 모델명이 같은 모델인지 확인
export const isSameModel = (model1: string, model2: string): boolean => {
  const simple1 = mapDetailedModelToSimple(model1)
  const simple2 = mapDetailedModelToSimple(model2)
  return simple1 === simple2
}

// 모델명 표시 함수 - 사용자 친화적인 모델명 반환
export const getDisplayModelName = (detailedModel: string): string => {
  const simpleModel = mapDetailedModelToSimple(detailedModel)

  // 상세 모델명이 간단한 모델명과 다르면 둘 다 표시
  if (detailedModel !== simpleModel) {
    return `${simpleModel} (${detailedModel})`
  }

  return simpleModel
}

// 실제 LLM 랭킹 데이터 (llm-stats.com 기준)
export const categoryRankings = {
  코딩: {
    title: '코딩 최고 모델',
    subtitle: 'Aider Polyglot 벤치마크 기준',
    icon: Code,
    data: [
      { rank: 1, name: 'GPT-5', score: 88.0, provider: 'OpenAI' },
      { rank: 2, name: 'Gemini 2.5 Pro Preview 06-05', score: 82.2, provider: 'Google' },
      { rank: 3, name: 'o3', score: 81.3, provider: 'OpenAI' },
    ],
  },
  멀티모달: {
    title: '멀티모달 최고 모델',
    subtitle: 'MMMU 벤치마크 기준',
    icon: ImageIcon,
    data: [
      { rank: 1, name: 'GPT-5', score: 84.2, provider: 'OpenAI' },
      { rank: 2, name: 'o3', score: 82.9, provider: 'OpenAI' },
      { rank: 3, name: 'Gemini 2.5 Pro Preview 06-05', score: 82.0, provider: 'Google' },
    ],
  },
  지식: {
    title: '지식 추론 최고 모델',
    subtitle: 'GPQA 벤치마크 기준',
    icon: Brain,
    data: [
      { rank: 1, name: 'Grok-4 Heavy', score: 88.4, provider: 'xAI' },
      { rank: 2, name: 'Grok-4', score: 87.5, provider: 'xAI' },
      { rank: 3, name: 'Gemini 2.5 Pro Preview 06-05', score: 86.4, provider: 'Google' },
    ],
  },
  컨텍스트: {
    title: '최대 컨텍스트 모델',
    subtitle: '최대 입력 토큰 수',
    icon: Clock,
    data: [
      { rank: 1, name: 'Llama 4 Scout', score: '10.0M tokens', provider: 'Meta' },
      { rank: 2, name: 'Gemini 1.5 Pro', score: '2.1M tokens', provider: 'Google' },
      { rank: 3, name: 'Gemini 1.5 Flash', score: '1.0M tokens', provider: 'Google' },
    ],
  },
  저렴한API: {
    title: '가장 저렴한 API',
    subtitle: 'Llama 4 Maverick 입력 비용 기준',
    icon: DollarSign,
    data: [
      { rank: 1, name: 'DeepInfra', score: '$0.17 / 1M tokens', provider: 'DeepInfra' },
      { rank: 2, name: 'Novita', score: '$0.17 / 1M tokens', provider: 'Novita' },
      { rank: 3, name: 'Lambda', score: '$0.18 / 1M tokens', provider: 'Lambda' },
    ],
  },
  빠른API: {
    title: '가장 빠른 API',
    subtitle: 'Llama 4 Maverick 처리량 기준',
    icon: Zap,
    data: [
      { rank: 1, name: 'Sambanova', score: '639 tokens/s', provider: 'Sambanova' },
      { rank: 2, name: 'Groq', score: '307 tokens/s', provider: 'Groq' },
      { rank: 3, name: 'Together', score: '98 tokens/s', provider: 'Together' },
    ],
  },
}

// 실제 프로젝트 데이터를 PostCard 형식으로 변환
export const trendingItems = samplePostDetails.map(item => ({
  id: item.id,
  title: item.title,
  satisfaction: item.satisfaction,
  author: item.author,
  authorInitial: item.authorInitial,
  avatarSrc: item.avatarSrc,
  createdAt: item.createdAt,
  relativeTime: item.createdAt, // 임시로 createdAt 사용
  views: item.views,
  likes: item.likes,
  isLiked: item.isLiked,
  bookmarks: 0, // 기본값
  isBookmarked: false, // 기본값
  platformId: 1, // 기본값
  modelId: undefined, // 기본값
  modelEtc: item.model_etc || item.model, // model_etc가 있으면 사용, 없으면 model 사용
  categoryId: 1, // 기본값
  categoryEtc: item.category_etc || '',
  tags: [], // 기본값
})) as PostCard[]
