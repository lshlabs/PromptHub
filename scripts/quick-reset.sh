#!/bin/bash

# PromptHub 빠른 초기화 스크립트
# 포트 정리 → 데이터베이스 초기화 → 초기 데이터 로드 → 서버 시작

echo "⚡ PromptHub 빠른 초기화를 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 자동 확인 옵션
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
            echo "실행 과정:"
            echo "  1️⃣ 포트 정리"
            echo "  2️⃣ 데이터베이스 초기화"
            echo "  3️⃣ 초기 데이터 로드"
            echo "  4️⃣ 개발 서버 시작"
            echo ""
            echo "예시:"
            echo "  $0              # 대화형 실행"
            echo "  $0 --force      # 강제 실행"
            echo "  $0 --auto       # 자동 확인"
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "도움말을 보려면: $0 --help"
            exit 1
            ;;
    esac
done

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

echo "📋 실행 과정:"
echo "   1️⃣ 포트 정리"
echo "   2️⃣ 데이터베이스 초기화"
echo "   3️⃣ 초기 데이터 로드"
echo "   4️⃣ 개발 서버 시작"
echo ""

# 사용자 확인 (자동 확인이 아닌 경우에만)
if [ "$AUTO_CONFIRM" != "true" ]; then
    read -p "빠른 초기화를 진행하시겠습니까? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 빠른 초기화가 취소되었습니다."
        exit 1
    fi
else
    echo "✅ 자동 확인 모드: 빠른 초기화를 진행합니다."
fi

echo ""

# 1단계: 포트 정리
echo "📋 1단계: 포트 정리"
./scripts/clean-ports.sh
echo ""

# 2단계: 데이터베이스 초기화
echo "📋 2단계: 데이터베이스 초기화"
if [ "$AUTO_CONFIRM" = "true" ]; then
    ./scripts/reset-db.sh --force
else
    ./scripts/reset-db.sh
fi
echo ""

# 3단계: 초기 데이터 로드
echo "📋 3단계: 초기 데이터 로드"
./scripts/load-initial-data.sh
echo ""

# 4단계: 개발 서버 시작
echo "📋 4단계: 개발 서버 시작"
echo "   🚀 백엔드와 프론트엔드 서버를 시작합니다..."
./scripts/start-dev.sh &
echo ""

# 서버 시작 대기
echo "⏳ 서버 시작을 기다리는 중..."
sleep 10

# 서버 상태 확인
echo "📋 서버 상태 확인:"
echo "   🔍 Django 서버 (8000): $(curl -s http://localhost:8000/admin/ >/dev/null && echo "✅ 실행 중" || echo "❌ 연결 실패")"
echo "   🔍 Next.js 서버 (3000): $(curl -s http://localhost:3000 >/dev/null && echo "✅ 실행 중" || echo "❌ 연결 실패")"

echo ""
echo "🎉 PromptHub 빠른 초기화가 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 접속 정보:"
echo "   🌐 프론트엔드: http://localhost:3000"
echo "   🔧 백엔드 API: http://localhost:8000"
echo "   👨‍💼 관리자 페이지: http://localhost:8000/admin/"
echo "   📧 관리자 이메일: admin@prompthub.com"
echo "   🔑 관리자 비밀번호: admin123!"
echo ""
echo "💡 도움말:"
echo "   🛑 서버 중지: Ctrl+C"
echo "   🔄 포트 정리: ./scripts/clean-ports.sh"
echo "   🗑️  DB 초기화: ./scripts/reset-db.sh" 