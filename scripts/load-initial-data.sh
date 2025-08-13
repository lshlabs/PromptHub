#!/bin/bash

# PromptHub 초기 데이터 로드 스크립트
# 프론트엔드 샘플 데이터를 기반으로 메타데이터를 생성합니다.

echo "🔄 PromptHub 초기 데이터 로드를 시작합니다..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 가상환경 활성화
echo "📋 1단계: 가상환경 활성화"
source backend/venv/bin/activate
echo "   ✅ 가상환경 활성화 완료"

# Django 프로젝트 디렉토리로 이동
cd backend

# 초기 데이터 로드
echo "📋 2단계: 초기 데이터 로드"
echo "   📱 AI 플랫폼 데이터 생성 중..."
echo "   🤖 AI 모델 데이터 생성 중..."
echo "   📂 카테고리 데이터 생성 중..."
echo "   🏷️ 태그 데이터 생성 중..."

python manage.py load_initial_data

echo "📋 3단계: 데이터 확인"
echo "   📊 생성된 데이터 확인 중..."

# 간단한 데이터 확인
echo "   📱 플랫폼 수: $(python manage.py shell -c "from apps.posts.models import Platform; print(Platform.objects.count())")"
echo "   🤖 모델 수: $(python manage.py shell -c "from apps.posts.models import Model; print(Model.objects.count())")"
echo "   📂 카테고리 수: $(python manage.py shell -c "from apps.posts.models import Category; print(Category.objects.count())")"
echo "   🏷️ 태그 수: $(python manage.py shell -c "from apps.posts.models import Tag; print(Tag.objects.count())")"

echo ""
echo "🎉 초기 데이터 로드가 완료되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 도움말:"
echo "   🔍 Django 관리자 페이지: http://localhost:8000/admin/"
echo "   🚀 개발 서버 시작: ./scripts/start-dev.sh"
echo "   🔄 데이터 재생성: ./scripts/load-initial-data.sh --force" 