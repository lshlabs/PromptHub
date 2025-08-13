#!/bin/bash

# PromptHub 데이터베이스 완전 초기화 스크립트
# 주의: 모든 데이터가 삭제됩니다!

# 자동 확인 옵션 (환경변수 또는 명령행 인수)
AUTO_CONFIRM=${AUTO_CONFIRM:-false}
FORCE=${FORCE:-false}

# 명령행 인수 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE=true
            AUTO_CONFIRM=true
            shift
            ;;
        --auto|-a)
            AUTO_CONFIRM=true
            shift
            ;;
        --help|-h)
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  -f, --force     강제 실행 (확인 없이)"
            echo "  -a, --auto      자동 확인"
            echo "  -h, --help      도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0              # 대화형 실행"
            echo "  $0 --force      # 강제 실행"
            echo "  $0 --auto       # 자동 확인"
            echo "  AUTO_CONFIRM=true $0  # 환경변수로 자동 확인"
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "도움말을 보려면: $0 --help"
            exit 1
            ;;
    esac
done

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

# 사용자 확인 (자동 확인이 아닌 경우에만)
if [ "$AUTO_CONFIRM" != "true" ]; then
    read -p "정말로 데이터베이스를 초기화하시겠습니까? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 데이터베이스 초기화가 취소되었습니다."
        exit 1
    fi
else
    echo "✅ 자동 확인 모드: 데이터베이스 초기화를 진행합니다."
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