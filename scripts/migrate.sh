#!/bin/bash

# PromptHub 데이터베이스 마이그레이션 스크립트
# 모델 변경사항을 데이터베이스에 적용

echo "🔄 PromptHub 데이터베이스 마이그레이션을 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 가상환경 확인
if [ ! -d "backend/venv" ]; then
    echo "❌ Python 가상환경이 없습니다."
    echo "   먼저 초기 설정을 진행해주세요: ./scripts/setup.sh"
    exit 1
fi

echo "📋 마이그레이션 과정:"
echo "   1️⃣ 모델 변경사항 검사"
echo "   2️⃣ 새로운 마이그레이션 파일 생성"
echo "   3️⃣ 데이터베이스에 변경사항 적용"
echo ""

cd backend
source venv/bin/activate

# 1단계: 마이그레이션 파일 생성
echo "📋 1단계: 새로운 마이그레이션 파일 생성 중..."
python manage.py makemigrations

# 생성된 마이그레이션이 있는지 확인
if [ $? -eq 0 ]; then
    echo "   ✅ 마이그레이션 파일 생성 완료"
else
    echo "   ❌ 마이그레이션 파일 생성 실패"
    exit 1
fi

echo ""

# 2단계: 마이그레이션 상태 확인
echo "📋 2단계: 현재 마이그레이션 상태 확인"
python manage.py showmigrations
echo ""

# 3단계: 마이그레이션 실행
echo "📋 3단계: 데이터베이스에 마이그레이션 적용 중..."
python manage.py migrate

if [ $? -eq 0 ]; then
    echo "   ✅ 마이그레이션 적용 완료"
else
    echo "   ❌ 마이그레이션 적용 실패"
    exit 1
fi

echo ""

# 4단계: 최종 확인
echo "📋 4단계: 마이그레이션 결과 확인"
python manage.py showmigrations
echo ""

cd ..

echo "🎉 데이터베이스 마이그레이션이 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 도움말:"
echo "   🔍 Django 관리자 페이지: http://localhost:8000/admin/"
echo "   🚀 개발 서버 시작: ./scripts/start-dev.sh"
echo "   🗑️  데이터베이스 초기화: ./scripts/reset-db.sh" 