#!/bin/bash

# PromptHub 프로젝트 초기 설정 스크립트

echo "🚀 PromptHub 프로젝트 초기 설정을 시작합니다..."

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 백엔드 Python 가상환경 확인 및 생성
if [ ! -d "backend/venv" ]; then
    echo "📦 Python 가상환경을 생성합니다..."
    cd backend
    python3 -m venv venv
    echo "✅ Python 가상환경이 생성되었습니다."
    cd ..
else
    echo "✅ Python 가상환경이 이미 존재합니다."
fi

# 가상환경 활성화 확인
if [ -f "backend/venv/bin/activate" ]; then
    echo "📦 백엔드 의존성을 설치합니다..."
    cd backend
    source venv/bin/activate
    pip install -r requirements/development.txt
    cd ..
    echo "✅ 백엔드 의존성이 설치되었습니다."
else
    echo "❌ 가상환경 활성화에 실패했습니다."
    exit 1
fi

# 프론트엔드 의존성 설치
echo "📦 프론트엔드 의존성을 설치합니다..."
cd frontend
npm install
cd ..
echo "✅ 프론트엔드 의존성이 설치되었습니다."

# 환경 변수 파일 생성
echo "🔧 환경 변수 파일을 설정합니다..."
if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env.local
        echo "✅ frontend/.env.local 파일이 생성되었습니다."
    fi
fi

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ backend/.env 파일이 생성되었습니다."
    fi
fi

# Django 마이그레이션
echo "🔄 Django 마이그레이션을 실행합니다..."
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
cd ..
echo "✅ Django 마이그레이션이 완료되었습니다."

echo ""
echo "🎉 설정이 완료되었습니다!"
echo "🎯 개발 서버를 시작하려면 다음 명령어를 실행하세요:"
echo "   npm run dev"
echo ""
echo "📝 추가 설정이 필요한 경우:"
echo "   - backend/.env 파일에서 환경 변수 수정"
echo "   - frontend/.env.local 파일에서 환경 변수 수정"
echo "   - Django 관리자 계정: npm run createsuperuser" 