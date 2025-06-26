#!/bin/bash

# 🚀 PromptHub 빠른 시작 스크립트
# 설정 완료 후 개발 서버들을 빠르게 실행

echo "🚀 PromptHub 개발 서버 시작..."

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 백엔드 서버 시작 함수
start_backend() {
    echo -e "${BLUE}🐍 Django 백엔드 서버 시작 중...${NC}"
    cd backend
    source venv/bin/activate
    python manage.py runserver &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Django 서버가 http://localhost:8000 에서 실행 중 (PID: $BACKEND_PID)${NC}"
    cd ..
}

# 프론트엔드 서버 시작 함수
start_frontend() {
    echo -e "${BLUE}⚛️  Next.js 프론트엔드 서버 시작 중...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Next.js 서버가 http://localhost:3000 에서 실행 중 (PID: $FRONTEND_PID)${NC}"
}

# 서버 종료 함수
cleanup() {
    echo -e "\n${YELLOW}🛑 서버들을 종료하는 중...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Django 서버 종료됨${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Next.js 서버 종료됨${NC}"
    fi
    exit 0
}

# Ctrl+C 시 정리 함수 실행
trap cleanup SIGINT

# 서버들 시작
start_backend
sleep 3
start_frontend

echo -e "\n${GREEN}🎉 모든 서버가 실행되었습니다!${NC}"
echo -e "${BLUE}📱 접속 주소:${NC}"
echo "   - 프론트엔드: http://localhost:3000"
echo "   - 백엔드 관리자: http://localhost:8000/admin/"
echo "   - API 문서: http://localhost:8000/api/docs/"
echo ""
echo -e "${YELLOW}💡 서버를 종료하려면 Ctrl+C를 누르세요${NC}"

# 서버들이 실행되는 동안 대기
wait
