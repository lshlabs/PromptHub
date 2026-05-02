# PromptHub

AI 프롬프트와 모델 사용 경험을 공유하고, 검색/정렬/트렌딩으로 좋은 프롬프트를 찾아볼 수 있는 커뮤니티 플랫폼입니다.

이 저장소는 **Next.js 프론트엔드 + Django REST API 백엔드로 구현한 원본 프로젝트**입니다. 이후 백엔드 프레임워크를 **Spring Boot로 재설계/마이그레이션**했고, 현재 운영 배포는 Spring Boot 버전만 사용합니다.

## Current Production

현재 배포 및 운영 기준 저장소:

- Spring Boot version: https://github.com/lshlabs/PromptHub-Springboot
- Frontend: `https://prompthub-sb-frontend.onrender.com`
- Backend API: `https://prompthub-sb-backend.onrender.com`
- Health Check: `https://prompthub-sb-backend.onrender.com/api/core/health`

이 저장소의 Django 백엔드는 프로젝트 초기 구현 및 Spring Boot 마이그레이션 전 API 설계의 기준으로 남아 있습니다.

## Migration Context

PromptHub는 초기에는 Django REST Framework 기반으로 구현했습니다. 이후 인증, API 계층, 데이터 접근 구조를 더 명확히 분리하고 운영 배포 구성을 재정비하기 위해 백엔드를 Spring Boot 기반으로 재설계했습니다.

Spring Boot 마이그레이션의 목표는 기존 사용자 흐름과 API 계약을 최대한 유지하면서, 백엔드 구조를 Spring Security, JWT, Spring Data JPA 중심으로 다시 구성하는 것이었습니다. 따라서 현재 서비스 배포는 Django 버전이 아니라 Spring Boot 버전을 기준으로 합니다.

## Features

- 회원가입, 로그인, Google OAuth 로그인
- 프롬프트 게시글 작성, 조회, 수정, 삭제
- 좋아요, 북마크, 내 게시글, 좋아요한 게시글, 북마크한 게시글
- 게시글 검색, 정렬, 필터
- 트렌딩 모델/카테고리 랭킹
- 사용자 프로필, 계정 설정, 프로필 이미지 업로드
- 모델/플랫폼/카테고리/태그 기반 프롬프트 메타데이터 관리

## Tech Stack

### Current Deployed Version

- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS
- Backend: Spring Boot 3.5, Spring Security, Spring Data JPA
- Auth: NextAuth, Google OAuth, JWT
- Infra: Render, Supabase, Cloudinary

### This Repository

- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS
- Backend: Django 5.2, Django REST Framework
- Auth: Django Token Auth, NextAuth, Google OAuth
- Infra/Dev: Docker Compose, SQLite for local development, Render-compatible settings

## Project Structure

```text
.
├── backend/                 # Django REST API implementation
│   ├── config/              # Django settings, URL routing, WSGI/ASGI
│   ├── core/                # health, search, sorting, filtering, trending APIs
│   ├── posts/               # prompt posts, categories, tags, models, platforms
│   ├── stats/               # statistics APIs
│   ├── users/               # auth, profile, account settings APIs
│   ├── manage.py
│   └── requirements.txt
├── frontend/                # Next.js App Router frontend
│   ├── app/                 # route pages and layouts
│   ├── components/          # domain components and shared UI primitives
│   ├── hooks/               # reusable frontend hooks
│   ├── lib/                 # API client, auth helpers, utilities
│   └── types/               # shared TypeScript types
├── docs/                    # operation and project reference docs
├── scripts/                 # local development scripts
├── docker-compose.yml       # local frontend/backend compose setup
├── docker-compose.override.yml
├── package.json             # root workspace scripts
└── README.md
```

## Local Development

이 저장소를 로컬에서 실행하면 Django 백엔드와 Next.js 프론트엔드를 기준으로 동작합니다. 운영 배포본과 동일한 Spring Boot 백엔드를 실행하려면 `PromptHub-Springboot` 저장소를 사용하세요.

### Prerequisites

- Python 3.10+
- Node.js 20+
- npm
- Docker, Docker Compose optional

### Backend

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt

cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
npm install
cd frontend
npm run dev
```

### Open

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Admin: `http://localhost:8000/admin/`
- Health: `http://localhost:8000/api/core/health/`

## Docker Development

루트 `.env` 파일에 필요한 값을 넣은 뒤 실행합니다.

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=replace-with-random-secret
NEXTAUTH_URL=http://localhost:3000
```

```bash
docker compose up --build
```

정지:

```bash
docker compose down --remove-orphans
```

Docker 실행 후 접속 주소:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Health: `http://localhost:8000/api/core/health/`

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_INTERNAL_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Django Backend

- `DJANGO_SETTINGS_MODULE`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Useful Commands

```bash
# frontend + backend concurrently
./scripts/start-dev.sh

# frontend
cd frontend && npm run typecheck
cd frontend && npm run build

# backend
cd backend && python manage.py test
cd backend && ./venv/bin/pytest
```

## Notes

- 이 저장소의 Django 백엔드 배포 정보는 현재 운영 기준이 아닙니다.
- 실제 운영 배포는 Spring Boot 재설계 버전만 사용합니다.
- Render/Supabase Free 플랜 특성상 초기 응답이 느릴 수 있습니다.
