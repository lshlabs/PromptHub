#!/bin/bash

# PromptHub 개발 환경 시작 스크립트

echo "🚀 PromptHub 개발 환경을 시작합니다..."

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 백엔드와 프론트엔드 동시 실행
echo "🔄 백엔드와 프론트엔드를 동시에 시작합니다..."
npm run dev 