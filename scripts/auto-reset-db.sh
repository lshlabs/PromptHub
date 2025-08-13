#!/bin/bash

# PromptHub 자동 데이터베이스 초기화 스크립트
# 대화형 확인 없이 자동으로 실행됩니다.

echo "🤖 PromptHub 자동 데이터베이스 초기화를 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 환경변수 설정으로 자동 확인 활성화
export AUTO_CONFIRM=true
export FORCE=true

# 기존 스크립트 호출
./scripts/reset-db.sh --force

echo ""
echo "🎉 자동 데이터베이스 초기화가 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 