#!/bin/bash

# PromptHub 데이터베이스 완전 초기화 스크립트
# 주의: 모든 데이터가 삭제됩니다!

echo "🗑️  PromptHub 데이터베이스 초기화를 시작합니다..."
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

echo "⚠️  경고: 이 작업은 모든 데이터베이스 데이터를 삭제합니다!"
echo "   - 사용자 계정"
echo "   - 프롬프트 데이터"
echo "   - 모든 업로드된 파일"
echo ""

# 사용자 확인
read -p "정말로 데이터베이스를 초기화하시겠습니까? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 데이터베이스 초기화가 취소되었습니다."
    exit 1
fi

echo ""
echo "🔄 데이터베이스 초기화 중..."

# 1. 기존 데이터베이스 파일 삭제
echo "📋 1단계: 기존 데이터베이스 파일 삭제"
if [ -f "backend/db.sqlite3" ]; then
    rm backend/db.sqlite3
    echo "   ✅ db.sqlite3 삭제 완료"
else
    echo "   ℹ️  db.sqlite3 파일이 존재하지 않습니다"
fi

# 2. 마이그레이션 파일 삭제 (0001_initial.py 제외)
echo "📋 2단계: 마이그레이션 파일 정리"
find backend/apps/*/migrations/ -name "*.py" -not -name "__init__.py" -not -name "0001_initial.py" -delete 2>/dev/null || true
echo "   ✅ 마이그레이션 파일 정리 완료"

# 3. 캐시 파일 삭제
echo "📋 3단계: 캐시 파일 삭제"
find backend/ -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/ -name "*.pyc" -delete 2>/dev/null || true
echo "   ✅ 캐시 파일 삭제 완료"

# 4. 새로운 마이그레이션 생성
echo "📋 4단계: 새로운 마이그레이션 생성"
cd backend
source venv/bin/activate
python manage.py makemigrations
echo "   ✅ 마이그레이션 생성 완료"

# 5. 마이그레이션 실행
echo "📋 5단계: 마이그레이션 실행"
python manage.py migrate
echo "   ✅ 마이그레이션 실행 완료"

# 6. 관리자 계정 생성
echo "📋 6단계: 관리자 계정 생성"
python manage.py setup_dev --create-admin
echo "   ✅ 관리자 계정 생성 완료"

cd ..

echo ""
echo "🎉 데이터베이스 초기화가 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 새로운 관리자 계정 정보:"
echo "   🌐 관리자 페이지: http://localhost:8000/admin/"
echo "   📧 이메일: admin@prompthub.com"
echo "   🔑 비밀번호: admin123!"
echo ""
echo "🚀 이제 개발 서버를 시작할 수 있습니다: ./scripts/start-dev.sh" 