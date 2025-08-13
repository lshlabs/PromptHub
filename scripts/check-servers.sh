#!/bin/bash

# PromptHub 서버 상태 확인 스크립트
# 서버가 이미 실행 중인지 확인하고 중복 실행을 방지합니다.

echo "🔍 PromptHub 서버 상태 확인 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 포트 사용 상태 확인
DJANGO_PORT=8000
NEXTJS_PORT=3000

# Django 서버 확인
DJANGO_RUNNING=false
if curl -s http://localhost:$DJANGO_PORT/admin/ >/dev/null 2>&1; then
    DJANGO_RUNNING=true
    echo "✅ Django 서버 (포트 $DJANGO_PORT) 실행 중"
else
    echo "❌ Django 서버 (포트 $DJANGO_PORT) 실행 중이 아님"
fi

# Next.js 서버 확인
NEXTJS_RUNNING=false
if curl -s http://localhost:$NEXTJS_PORT >/dev/null 2>&1; then
    NEXTJS_RUNNING=true
    echo "✅ Next.js 서버 (포트 $NEXTJS_PORT) 실행 중"
else
    echo "❌ Next.js 서버 (포트 $NEXTJS_PORT) 실행 중이 아님"
fi

echo ""

# 프로세스 정보 표시
echo "📋 실행 중인 프로세스 정보:"
DJANGO_PIDS=$(ps aux | grep "manage.py runserver" | grep -v grep | awk '{print $2}')
if [ -n "$DJANGO_PIDS" ]; then
    echo "   Django 프로세스: $DJANGO_PIDS"
else
    echo "   Django 프로세스: 없음"
fi

NEXTJS_PIDS=$(ps aux | grep "next" | grep -v grep | awk '{print $2}')
if [ -n "$NEXTJS_PIDS" ]; then
    echo "   Next.js 프로세스: $NEXTJS_PIDS"
else
    echo "   Next.js 프로세스: 없음"
fi

echo ""

# 접속 정보 표시
echo "🌐 접속 정보:"
if [ "$DJANGO_RUNNING" = true ]; then
    echo "   🔧 백엔드 API: http://localhost:$DJANGO_PORT"
    echo "   👨‍💼 관리자 페이지: http://localhost:$DJANGO_PORT/admin/"
else
    echo "   🔧 백엔드 API: ❌ 서버 중지됨"
fi

if [ "$NEXTJS_RUNNING" = true ]; then
    echo "   🌐 프론트엔드: http://localhost:$NEXTJS_PORT"
else
    echo "   🌐 프론트엔드: ❌ 서버 중지됨"
fi

echo ""

# 상태 요약
if [ "$DJANGO_RUNNING" = true ] && [ "$NEXTJS_RUNNING" = true ]; then
    echo "🎉 모든 서버가 정상적으로 실행 중입니다!"
    echo "💡 서버를 중지하려면: Ctrl+C 또는 ./scripts/clean-ports.sh"
    exit 0
elif [ "$DJANGO_RUNNING" = true ]; then
    echo "⚠️  Django 서버만 실행 중입니다."
    echo "💡 Next.js 서버를 시작하려면: ./scripts/start-dev.sh"
    exit 1
elif [ "$NEXTJS_RUNNING" = true ]; then
    echo "⚠️  Next.js 서버만 실행 중입니다."
    echo "💡 Django 서버를 시작하려면: ./scripts/start-dev.sh"
    exit 1
else
    echo "❌ 모든 서버가 중지되었습니다."
    echo "💡 서버를 시작하려면: ./scripts/start-dev.sh"
    exit 2
fi 