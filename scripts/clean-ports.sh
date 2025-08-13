#!/bin/bash

# PromptHub 포트 정리 스크립트
# 사용 중인 포트를 정리하여 충돌을 방지합니다.

echo "🧹 PromptHub 포트 정리를 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Django 서버 프로세스 종료
echo "📋 1단계: Django 서버 프로세스 종료"
DJANGO_PIDS=$(ps aux | grep "manage.py runserver" | grep -v grep | awk '{print $2}')
if [ -n "$DJANGO_PIDS" ]; then
    echo "   🔍 Django 서버 프로세스 발견: $DJANGO_PIDS"
    echo "$DJANGO_PIDS" | xargs kill -9
    echo "   ✅ Django 서버 프로세스 종료 완료"
else
    echo "   ℹ️  실행 중인 Django 서버가 없습니다"
fi

# Next.js 서버 프로세스 종료
echo "📋 2단계: Next.js 서버 프로세스 종료"
NEXTJS_PIDS=$(ps aux | grep "next" | grep -v grep | awk '{print $2}')
if [ -n "$NEXTJS_PIDS" ]; then
    echo "   🔍 Next.js 서버 프로세스 발견: $NEXTJS_PIDS"
    echo "$NEXTJS_PIDS" | xargs kill -9
    echo "   ✅ Next.js 서버 프로세스 종료 완료"
else
    echo "   ℹ️  실행 중인 Next.js 서버가 없습니다"
fi

# Node.js 프로세스 종료 (포트 3000, 3001 사용)
echo "📋 3단계: Node.js 프로세스 종료"
NODE_PIDS=$(lsof -ti:3000,3001,8000,8001 2>/dev/null)
if [ -n "$NODE_PIDS" ]; then
    echo "   🔍 Node.js 프로세스 발견: $NODE_PIDS"
    echo "$NODE_PIDS" | xargs kill -9
    echo "   ✅ Node.js 프로세스 종료 완료"
else
    echo "   ℹ️  포트 3000, 3001, 8000, 8001을 사용하는 프로세스가 없습니다"
fi

# 포트 사용 상태 확인
echo "📋 4단계: 포트 사용 상태 확인"
echo "   🔍 포트 3000: $(lsof -i:3000 2>/dev/null | wc -l | tr -d ' ') 프로세스"
echo "   🔍 포트 3001: $(lsof -i:3001 2>/dev/null | wc -l | tr -d ' ') 프로세스"
echo "   🔍 포트 8000: $(lsof -i:8000 2>/dev/null | wc -l | tr -d ' ') 프로세스"
echo "   🔍 포트 8001: $(lsof -i:8001 2>/dev/null | wc -l | tr -d ' ') 프로세스"

echo ""
echo "🎉 포트 정리가 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 도움말:"
echo "   🚀 개발 서버 시작: ./scripts/start-dev.sh"
echo "   🔄 포트 정리 후 서버 시작: ./scripts/clean-ports.sh && ./scripts/start-dev.sh" 