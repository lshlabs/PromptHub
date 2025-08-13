#!/bin/bash

# PromptHub Docker 환경 설정 스크립트
# 개발 완료 후 Docker 도입 시 사용

echo "🐳 PromptHub Docker 환경 설정을 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo "📋 Docker 도입 단계:"
echo "   1️⃣ 기존 환경 백업"
echo "   2️⃣ Docker 파일 생성"
echo "   3️⃣ 환경 변수 설정"
echo "   4️⃣ Docker 이미지 빌드"
echo "   5️⃣ 서비스 실행 테스트"
echo ""

# 1단계: 기존 환경 백업
echo "📋 1단계: 기존 환경 설정 백업"
if [ ! -d "backup" ]; then
    mkdir backup
fi
cp -r scripts backup/scripts_backup_$(date +%Y%m%d_%H%M%S)
echo "   ✅ 기존 스크립트 백업 완료"

# 2단계: Docker 파일 생성 안내
echo "📋 2단계: Docker 파일 생성이 필요합니다"
echo "   📄 생성할 파일들:"
echo "      - Dockerfile (backend)"
echo "      - Dockerfile (frontend)"  
echo "      - docker-compose.yml"
echo "      - docker-compose.dev.yml"
echo "      - .dockerignore"
echo ""

# 3단계: 환경 변수 점검
echo "📋 3단계: 환경 변수 확인"
if [ -f "backend/.env.example" ] && [ -f "frontend/.env.example" ]; then
    echo "   ✅ 환경 변수 예시 파일 존재"
    echo "   💡 Docker 환경용 환경 변수 추가 필요:"
    echo "      - DATABASE_URL (PostgreSQL)"
    echo "      - REDIS_URL"
    echo "      - ALLOWED_HOSTS (Docker 서비스명 포함)"
else
    echo "   ❌ 환경 변수 파일이 없습니다."
    echo "   먼저 기본 설정을 완료해주세요: ./scripts/setup.sh"
    exit 1
fi

echo ""
echo "🎯 다음 단계:"
echo "   1. Docker Desktop 설치 확인"
echo "   2. Dockerfile 작성"
echo "   3. docker-compose.yml 작성"
echo "   4. Docker 환경 테스트"
echo ""
echo "💡 기존 개발 환경은 그대로 유지됩니다!"
echo "   기존 방식: ./scripts/start-dev.sh"
echo "   Docker 방식: docker-compose up (설정 완료 후)" 