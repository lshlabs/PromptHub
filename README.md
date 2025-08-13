## PromptHub — Django REST API + Next.js Frontend

현대적인 풀스택 웹 애플리케이션 템플릿입니다. Django REST Framework로 안정적인 API를 제공하고, Next.js(14+)와 Tailwind CSS, shadcn/ui로 모던한 프론트엔드를 구성합니다. 개발 편의를 위해 스크립트를 통해 환경 설정과 서버 실행을 원클릭으로 처리할 수 있습니다.

## 주요 기능

- **백엔드(Django/DRF)**: 인증, 시리얼라이저, 커스텀 페이지네이션, OpenAPI 문서 자동화
- **프론트엔드(Next.js)**: App Router 기반, TypeScript, Tailwind CSS, shadcn/ui, 다크모드 지원
- **개발 스크립트**: 초기 설정, 서버 실행, 마이그레이션, DB 초기화, 포트포워딩 관리
- **테스트/품질 관리**: Django/Node 테스트 명령, 코드 포맷/린트 스크립트 제공
- **Docker 지원**: `docker-compose`로 로컬 통합 실행 및 배포 준비

## 아키텍처 개요

```
.
├── backend/                     # Django 프로젝트
│   ├── config/                  # 설정/URL/WSGI/ASGI
│   ├── apps/
│   │   ├── accounts/           # 사용자/인증 관련
│   │   └── core/               # 공통 유틸(예: 페이지네이션)
│   ├── requirements/           # requirements 분리 (base/dev/prod)
│   ├── static/ media/ logs/    # 정적/미디어/로그
│   └── manage.py
├── frontend/                    # Next.js 앱 (App Router)
│   ├── app/                    
│   ├── components/             # UI/섹션/폼 등 컴포넌트
│   ├── lib/ hooks/ types/      # 유틸/훅/타입
│   ├── public/ styles/         # 정적/스타일
│   └── package.json
├── scripts/                     # 개발 자동화 스크립트
│   ├── setup.sh start-dev.sh migrate.sh reset-db.sh
│   ├── check-servers.sh dev.sh
│   ├── portforward-config.sh start-dev-portforward.sh
│   └── help.sh
├── docker-compose.yml
├── package.json                 # 루트 워크스페이스 관리
└── README.md
```

## 요구 사항

- macOS/Linux/WSL
- Python 3.11+
- Node.js 18+
- Git

설치는 다음 예시를 참고하세요.

```bash
# macOS (Homebrew)
brew install python@3.11 node git
```

## 빠른 시작

1) 초기 설정

```bash
# 저장소 클론 후 루트에서 실행
./scripts/setup.sh

# 사용 가능한 스크립트 목록
./scripts/help.sh
```

2) 개발 서버 실행

```bash
# 백엔드(Django) + 프론트엔드(Next.js) 동시 실행
./scripts/start-dev.sh

# 또는 npm 스크립트
npm run dev
```

3) 접속 경로

- 프론트엔드: `http://localhost:3000`
- 백엔드 API: `http://localhost:8000/api/`
- Swagger: `http://localhost:8000/api/docs/`
- Django Admin: `http://localhost:8000/admin/`

## 스크립트 치트시트

- `./scripts/setup.sh`: 초기 설정 일괄 처리
- `./scripts/start-dev.sh`: 백엔드/프론트엔드 동시 실행 (중복 실행 방지 포함)
- `./scripts/check-servers.sh`: 포트 `3000/8000` 점유 상태 확인
- `./scripts/migrate.sh`: DB 마이그레이션 (모델 변경 후)
- `./scripts/reset-db.sh`: DB 초기화(주의: 모든 데이터 삭제)
- `./scripts/dev.sh`: 간단 개발 서버 실행
- `./scripts/portforward-config.sh`: 포트포워딩 설정/해제/상태 확인(인터랙티브)
- `./scripts/start-dev-portforward.sh`: 외부 접속용 개발 서버 실행

## 환경 변수

백엔드(`backend/.env`) 예시:

```env
# Django
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
FRONTEND_URL=http://localhost:3000

# DB
DATABASE_URL=sqlite:///db.sqlite3
# PostgreSQL 예시
# DATABASE_URL=postgresql://user:password@localhost:5432/prompthub

# Redis (옵션)
REDIS_URL=redis://localhost:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (옵션)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=ap-northeast-2

# Social Login (옵션)
GOOGLE_OAUTH2_CLIENT_ID=
GOOGLE_OAUTH2_CLIENT_SECRET=
```

프론트엔드(`frontend/.env.local`) 예시:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# NextAuth (사용 시)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me

# OAuth (옵션)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (옵션)
NEXT_PUBLIC_GA_ID=
```

## 개발 워크플로우

1) 서버 실행 및 코딩

```bash
./scripts/start-dev.sh
```

2) 모델 변경 후 마이그레이션

```bash
./scripts/migrate.sh
```

3) 문제 발생 시

```bash
./scripts/reset-db.sh   # DB 초기화
./scripts/check-servers.sh
```

## 테스트

백엔드:

```bash
cd backend
python manage.py test
# 또는 커버리지
coverage run --source='.' manage.py test && coverage report
```

프론트엔드:

```bash
cd frontend
npm run test
npm run test:e2e
npm run test:coverage
```

## 코드 품질

백엔드:

```bash
cd backend
black . && isort . && flake8 .
```

프론트엔드:

```bash
cd frontend
npm run lint && npm run format
```

## API 문서

개발 서버 실행 후 다음에서 확인 가능합니다.

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI JSON: `http://localhost:8000/api/schema/`

## Docker 사용

```bash
# 로컬 통합 실행
docker-compose up --build

# 프로덕션 모드 예시
docker-compose -f docker-compose.prod.yml up --build
```

## 트러블슈팅

- **서버가 뜨지 않음**: `backend/venv` 존재 여부, `frontend/node_modules` 설치 여부 확인 후 `./scripts/setup.sh` 재실행
- **포트 충돌**: `lsof -ti:3000`, `lsof -ti:8000`로 점유 프로세스 확인 후 종료
- **DB 에러**: `./scripts/reset-db.sh`로 초기화 후 재시도

## 커밋 규칙(Conventional Commits)

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷팅/세미콜론 등 비기능 변경
- `refactor`: 리팩토링
- `test`: 테스트 추가/변경
- `chore`: 빌드/도구/패키지 변경

## 기여 가이드

1) 브랜치 생성: `git checkout -b feature/your-feature`
2) 테스트/린트 통과 확인
3) 커밋 후 PR 생성

## 연락처

문의: `hu2chaso`


