#!/bin/bash

# 🚀 PromptHub 백엔드 마이그레이션 스크립트
# 백엔드 코드 수정 후 마이그레이션을 빠르게 적용

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🐍 Django 백엔드 마이그레이션 시작...${NC}"

cd backend || { echo "backend 폴더가 존재하지 않습니다."; exit 1; }

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  가상환경(venv)이 없습니다. 먼저 python -m venv venv로 생성하세요.${NC}"
    exit 1
fi

source venv/bin/activate

# makemigrations
python manage.py makemigrations
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  makemigrations 실패!${NC}"
    deactivate
    exit 1
fi

# migrate
python manage.py migrate
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  migrate 실패!${NC}"
    deactivate
    exit 1
fi

deactivate
cd ..

echo -e "${GREEN}✅ 마이그레이션이 성공적으로 적용되었습니다!${NC}" 