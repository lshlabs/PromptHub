#!/bin/bash

# Django DB 초기화 스크립트 (SQLite 기준)
# 사용 전: 중요한 데이터가 있다면 반드시 백업하세요!

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../backend" && pwd)"
DB_FILE="$PROJECT_ROOT/db.sqlite3"
MIGRATIONS_DIRS=(
  "$PROJECT_ROOT/apps/accounts/migrations"
  # 필요시 다른 앱의 migrations도 추가
)

cd "$PROJECT_ROOT"

echo "DB 파일 경로: $DB_FILE"

echo "[1/5] 기존 DB 파일 삭제..."
if [ -f "$DB_FILE" ]; then
  rm "$DB_FILE"
  echo "DB 파일 삭제 완료: $DB_FILE"
else
  echo "DB 파일이 존재하지 않습니다."
fi

echo "[2/5] 마이그레이션 기록 삭제..."
for dir in "${MIGRATIONS_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    touch "$dir/__init__.py"
  fi
  find "$dir" -type f -name "[0-9]*_*.py" ! -name "__init__.py" -delete
done

echo "[3/5] 마이그레이션 재생성..."
source ../backend/venv/bin/activate
python manage.py makemigrations

echo "[4/5] 마이그레이션 적용..."
python manage.py migrate

echo "[5/5] (선택) 슈퍼유저를 생성하려면 create_superuser.sh를 실행하세요."
echo "초기화 완료!" 