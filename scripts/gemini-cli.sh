#!/bin/bash

# PromptHub Gemini CLI 통합 스크립트
# Cursor IDE에서 Gemini AI 기능을 활용하기 위한 도구

echo "🤖 PromptHub Gemini CLI 도구"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# Gemini CLI 설치 확인
if ! command -v gemini &> /dev/null; then
    echo "📦 Gemini CLI가 설치되지 않았습니다."
    echo "   설치 중..."
    npm install -g @google/generative-ai
    echo "✅ Gemini CLI 설치 완료"
fi

# API 키 확인
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  GOOGLE_API_KEY 환경변수가 설정되지 않았습니다."
    echo "   다음 명령어로 설정해주세요:"
    echo "   export GOOGLE_API_KEY='your-api-key-here'"
    echo ""
    echo "   또는 .env 파일에 추가:"
    echo "   echo 'GOOGLE_API_KEY=your-api-key-here' >> .env"
    exit 1
fi

echo "✅ Gemini CLI 준비 완료"
echo ""

# 사용법 안내
echo "💡 사용법:"
echo "   gemini '질문이나 요청사항'"
echo ""
echo "🔧 유용한 명령어 예시:"
echo "   gemini '이 코드를 리뷰해줘'"
echo "   gemini 'Django 모델을 최적화해줘'"
echo "   gemini 'React 컴포넌트를 개선해줘'"
echo "   gemini chat  # 대화 모드 시작"
echo ""

# 대화형 모드 시작
echo "🚀 Gemini CLI를 시작합니다..."
echo "   종료하려면 'exit' 또는 Ctrl+C를 누르세요"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 대화형 모드로 Gemini CLI 실행
gemini chat 