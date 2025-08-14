# Python 3.11을 기반으로 하는 공식 이미지 사용
FROM python:3.11-slim

# Python 출력 버퍼링 비활성화 및 .pyc 파일 생성 방지
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치 (PostgreSQL 클라이언트 포함)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Django 프로젝트 파일 복사
COPY . .

# 정적 파일 수집 (production용)
RUN python manage.py collectstatic --noinput --settings=config.settings_prod

# 포트 노출
EXPOSE 8000

# 환경변수 설정
ENV DJANGO_SETTINGS_MODULE=config.settings_prod

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Gunicorn을 사용하여 애플리케이션 실행
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]