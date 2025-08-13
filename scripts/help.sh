#!/bin/bash

# PromptHub 스크립트 도움말

echo "📚 PromptHub 스크립트 도움말"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 개발 서버 관련"
echo "   ./scripts/start-dev.sh          # 백엔드 + 프론트엔드 동시 실행"
echo "   ./scripts/dev.sh                # 간단한 개발 서버 실행"
echo "   ./scripts/check-servers.sh      # 서버 상태 확인"
echo ""

echo "🗄️  데이터베이스 관련"
echo "   ./scripts/migrate.sh            # 마이그레이션 실행"
echo "   ./scripts/reset-db.sh           # 데이터베이스 초기화 (대화형)"
echo "   ./scripts/reset-db.sh --force   # 데이터베이스 강제 초기화"
echo "   ./scripts/auto-reset-db.sh      # 자동 데이터베이스 초기화"
echo ""

echo "📊 데이터 관련"
echo "   ./scripts/load-initial-data.sh  # 초기 데이터 로드"
echo ""

echo "🧹 시스템 정리"
echo "   ./scripts/clean-ports.sh        # 포트 충돌 해결"
echo "   ./scripts/quick-reset.sh        # 전체 시스템 초기화"
echo "   ./scripts/quick-reset.sh --force # 강제 전체 초기화"
echo ""

echo "⚙️  설정 관련"
echo "   ./scripts/setup.sh              # 초기 환경 설정"
echo ""

echo "🔧 유틸리티"
echo "   ./scripts/help.sh               # 이 도움말 표시"
echo ""

echo "📋 자주 사용하는 명령어 조합"
echo "   # 서버 상태 확인"
echo "   ./scripts/check-servers.sh"
echo ""
echo "   # 포트 충돌 해결 후 서버 시작"
echo "   ./scripts/clean-ports.sh && ./scripts/start-dev.sh"
echo ""
echo "   # 전체 시스템 초기화 (강제)"
echo "   ./scripts/quick-reset.sh --force"
echo ""
echo "   # 데이터베이스만 초기화 (강제)"
echo "   ./scripts/reset-db.sh --force && ./scripts/load-initial-data.sh"
echo ""

echo "💡 팁"
echo "   • 대화형 스크립트가 멈출 때: --force 또는 --auto 옵션 사용"
echo "   • 포트 충돌 시: ./scripts/clean-ports.sh 실행"
echo "   • 서버 상태 확인: ./scripts/check-servers.sh 실행"
echo "   • 완전 초기화 시: ./scripts/quick-reset.sh --force 사용"
echo "   • 서버가 이미 실행 중이면 중복 실행 방지됨"
echo ""

echo "🌐 접속 정보"
echo "   프론트엔드: http://localhost:3000"
echo "   백엔드 API: http://localhost:8000"
echo "   관리자 페이지: http://localhost:8000/admin/"
echo "   관리자 계정: admin@prompthub.com / admin123!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 