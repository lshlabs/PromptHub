#!/bin/bash

# PromptHub 개발 서버 원클릭 시작 스크립트
# 백엔드 (Django) + 프론트엔드 (Next.js) 동시 실행

echo "🚀 PromptHub 개발 서버를 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    echo "   현재 위치: $(pwd)"
    echo "   올바른 실행: cd /path/to/prompthub && ./scripts/start-dev.sh"
    exit 1
fi

# 가상환경 확인
if [ ! -d "backend/venv" ]; then
    echo "❌ Python 가상환경이 없습니다."
    echo "   먼저 초기 설정을 진행해주세요: ./scripts/setup.sh"
    exit 1
fi

# Node.js 모듈 확인
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Node.js 모듈이 설치되지 않았습니다."
    echo "   먼저 초기 설정을 진행해주세요: ./scripts/setup.sh"
    exit 1
fi

# 서버 중복 실행 방지 및 포트 정리
echo "🔍 서버 상태 확인 중..."
DJANGO_RUNNING=false
NEXTJS_RUNNING=false

if curl -s http://localhost:8000/admin/ >/dev/null 2>&1; then
    DJANGO_RUNNING=true
fi

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    NEXTJS_RUNNING=true
fi

if [ "$DJANGO_RUNNING" = true ] || [ "$NEXTJS_RUNNING" = true ]; then
    echo "⚠️  서버가 실행 중입니다. 포트를 정리합니다..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # clean-ports.sh 실행
    ./scripts/clean-ports.sh
    
    echo ""
    echo "🔄 포트 정리 완료. 서버를 시작합니다..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo "📋 서버 시작 전 확인사항:"
echo "   ✅ Python 가상환경: backend/venv"
echo "   ✅ Node.js 모듈: frontend/node_modules"
echo "   ✅ 서버 중복 실행: 확인됨"
echo ""

echo "🔄 백엔드와 프론트엔드를 동시에 시작합니다..."
echo "   🐍 백엔드 (Django): http://localhost:8000"
echo "   ⚛️  프론트엔드 (Next.js): http://localhost:3000"
echo ""
echo "💡 서버를 중지하려면 Ctrl+C를 누르세요"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 백엔드와 프론트엔드 동시 실행
npm run dev 