#!/bin/bash

# 🔐 Django 관리자 계정 생성 스크립트

echo "👤 Django 관리자 계정을 생성합니다..."

cd backend
source venv/bin/activate

echo "📝 관리자 정보를 입력해주세요:"
python manage.py createsuperuser

echo "✅ 관리자 계정 생성이 완료되었습니다!"
echo "🌐 http://localhost:8000/admin/ 에서 로그인하세요"
