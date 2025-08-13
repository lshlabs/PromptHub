// 플랫폼 정보
export const samplePlatform = [
  'OpenAI',
  'Anthropic',
  'Google',
  'xAI',
  'Meta',
  'Mistral',
  'Perplexity',
  '기타',
]

// 모델 정보
// export const sampleModel = ['GPT-4.1', 'GPT-4.5', 'GPT-4o', 'o3', 'o1', '기타'];

// 플랫폼별 모델 목록
export const platformModels: Record<string, string[]> = {
  OpenAI: ['o3', 'o4-mini', 'o1', 'GPT-4.5', 'GPT-4.1', '기타'],
  Anthropic: [
    'Claude 4 Opus',
    'Claude 4 Sonnet',
    'Claude 3.7 Sonnet',
    'Claude 3.5 Sonnet',
    'Claude 3 Opus',
    '기타',
  ],
  Google: [
    'Gemini 2.5 Pro',
    'Gemini 2.5 Flash',
    'Gemini 2.5 Flash-Lite',
    'Gemini 2.0 Flash',
    'Gemini 1.5 Pro',
    '기타',
  ],
  xAI: ['Grok-4', 'Grok-3', 'Grok-3 Mini', 'Grok-2', 'Grok-2 Mini', '기타'],
  Meta: ['Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3', 'Llama 3.2', 'Llama 3.1', '기타'],
  Mistral: [
    'Magistral Medium',
    'Magistral Small',
    'Mistral Small 3.1',
    'Mistral Small 3',
    'Codestral-22B',
    '기타',
  ],
  Perplexity: [
    'Sonar',
    'R1 1776',
    'Claude 4 Sonnet (Perplexity)',
    'GPT-4.1 (Perplexity)',
    'Gemini 2.5 Pro (Perplexity)',
    '기타',
  ],
  기타: ['기타'],
}

// 카테고리 정보
export const sampleCategory = [
  '업무/문서',
  '개발/프로그래밍',
  '창작/글쓰기',
  '데이터/분석',
  '교육/학습',
  '번역',
  '요약',
  '기획/아이디어',
  '기타',
]

// 태그 정보
// export const sampleTag = [
//   '이미지',
//   '분석',
//   'AI',
//   '프로젝트',
//   '관리',
//   '코드',
//   '게임',
//   '디자인',
//   '기타',
// ]
