# PromptHub - Django REST API + Next.js Frontend

Django REST Framework와 Next.js를 사용한 현대적인 풀스택 웹 애플리케이션입니다.

## 📁 권장 프로젝트 구조

\`\`\`
prompthub/
├── backend/                           # Django 백엔드
│   ├── config/                       # Django 프로젝트 설정
│   │   ├── __init__.py
│   │   ├── settings/                 # 환경별 설정 분리
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # 공통 설정
│   │   │   ├── development.py       # 개발 환경
│   │   │   ├── production.py        # 프로덕션 환경
│   │   │   └── testing.py           # 테스트 환경
│   │   ├── urls.py                  # 메인 URL 라우팅
│   │   ├── wsgi.py                  # WSGI 설정
│   │   └── asgi.py                  # ASGI 설정 (WebSocket 지원)
│   ├── apps/                        # Django 앱들
│   │   ├── __init__.py
│   │   ├── accounts/                # 사용자 인증 및 관리
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # User, UserProfile 모델
│   │   │   ├── serializers.py       # DRF 시리얼라이저
│   │   │   ├── views.py             # API 뷰
│   │   │   ├── urls.py              # URL 패턴
│   │   │   ├── permissions.py       # 커스텀 권한
│   │   │   ├── signals.py           # Django 시그널
│   │   │   ├── managers.py          # 커스텀 매니저
│   │   │   ├── migrations/
│   │   │   └── tests/
│   │   │       ├── __init__.py
│   │   │       ├── test_models.py
│   │   │       ├── test_views.py
│   │   │       └── test_serializers.py
│   │   ├── posts/                   # 게시물 관리
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # Post, Category 모델
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   ├── filters.py           # django-filter 설정
│   │   │   ├── migrations/
│   │   │   └── tests/
│   │   ├── comments/                # 댓글 시스템
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py            # Comment 모델
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   ├── migrations/
│   │   │   └── tests/
│   │   └── core/                    # 공통 유틸리티
│   │       ├── __init__.py
│   │       ├── models.py            # 추상 베이스 모델
│   │       ├── permissions.py       # 공통 권한 클래스
│   │       ├── pagination.py        # 커스텀 페이지네이션
│   │       ├── exceptions.py        # 커스텀 예외
│   │       ├── validators.py        # 커스텀 검증자
│   │       ├── utils.py             # 헬퍼 함수
│   │       └── middleware.py        # 커스텀 미들웨어
│   ├── requirements/                # 의존성 관리
│   │   ├── base.txt                # 기본 패키지
│   │   ├── development.txt         # 개발용 패키지
│   │   ├── production.txt          # 프로덕션용 패키지
│   │   └── testing.txt             # 테스트용 패키지
│   ├── static/                     # 정적 파일 (CSS, JS, 이미지)
│   │   ├── admin/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   ├── media/                      # 사용자 업로드 파일
│   │   ├── uploads/
│   │   └── avatars/
│   ├── templates/                  # Django 템플릿 (필요시)
│   │   ├── base.html
│   │   └── emails/
│   ├── locale/                     # 국제화 파일
│   │   ├── ko/
│   │   └── en/
│   ├── logs/                       # 로그 파일
│   ├── scripts/                    # 유틸리티 스크립트
│   │   ├── setup_database.py
│   │   ├── create_superuser.py
│   │   └── backup_database.py
│   ├── manage.py                   # Django 관리 명령어
│   ├── .env.example               # 환경 변수 템플릿
│   ├── .gitignore
│   └── pytest.ini                 # pytest 설정
├── frontend/                       # Next.js 프론트엔드
│   ├── app/                       # Next.js 13+ App Router
│   │   ├── (auth)/               # 라우트 그룹 - 인증 페이지
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # 인증 페이지 공통 레이아웃
│   │   ├── (dashboard)/          # 라우트 그룹 - 대시보드
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # 대시보드 공통 레이아웃
│   │   ├── posts/                # 게시물 관련 페이지
│   │   │   ├── page.tsx          # 게시물 목록
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # 게시물 상세
│   │   │   └── create/
│   │   │       └── page.tsx      # 게시물 작성
│   │   ├── api/                  # API 라우트 (필요시)
│   │   │   └── auth/
│   │   │       └── route.ts
│   │   ├── globals.css           # 전역 스타일
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── page.tsx              # 홈페이지
│   │   ├── loading.tsx           # 로딩 UI
│   │   ├── error.tsx             # 에러 UI
│   │   └── not-found.tsx         # 404 페이지
│   ├── components/               # React 컴포넌트
│   │   ├── ui/                  # 기본 UI 컴포넌트 (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── forms/               # 폼 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   └── forgot-password-form.tsx
│   │   │   ├── posts/
│   │   │   │   ├── post-form.tsx
│   │   │   │   └── comment-form.tsx
│   │   │   └── common/
│   │   │       ├── search-form.tsx
│   │   │       └── contact-form.tsx
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── navigation.tsx
│   │   ├── features/            # 기능별 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── auth-guard.tsx
│   │   │   │   └── user-menu.tsx
│   │   │   ├── posts/
│   │   │   │   ├── post-list.tsx
│   │   │   │   ├── post-card.tsx
│   │   │   │   └── post-detail.tsx
│   │   │   └── comments/
│   │   │       ├── comment-list.tsx
│   │   │       └── comment-item.tsx
│   │   ├── providers/           # Context Provider들
│   │   │   ├── auth-provider.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── query-provider.tsx
│   │   └── common/              # 공통 컴포넌트
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── pagination.tsx
│   │       └── modal.tsx
│   ├── lib/                     # 유틸리티 라이브러리
│   │   ├── api/                # API 관련
│   │   │   ├── client.ts       # Axios 클라이언트 설정
│   │   │   ├── auth.ts         # 인증 API
│   │   │   ├── posts.ts        # 게시물 API
│   │   │   ├── comments.ts     # 댓글 API
│   │   │   └── types.ts        # API 응답 타입
│   │   ├── utils/              # 헬퍼 함수
│   │   │   ├── auth.ts         # 인증 관련 유틸
│   │   │   ├── format.ts       # 포맷팅 함수
│   │   │   ├── validation.ts   # 검증 함수
│   │   │   └── constants.ts    # 상수 정의
│   │   ├── hooks/              # 커스텀 훅 (여기서는 별도 디렉토리)
│   │   └── stores/             # 상태 관리 (Zustand 등)
│   │       ├── auth-store.ts
│   │       └── ui-store.ts
│   ├── hooks/                  # 커스텀 React 훅
│   │   ├── use-auth.ts
│   │   ├── use-api.ts
│   │   ├── use-local-storage.ts
│   │   └── use-debounce.ts
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   ├── comments.ts
│   │   ├── api.ts
│   │   └── global.ts
│   ├── styles/                 # 스타일 파일
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── utilities.css
│   ├── public/                 # 정적 자산
│   │   ├── images/
│   │   ├── icons/
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── __tests__/              # 테스트 파일
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   ├── .env.example           # 환경 변수 템플릿
│   ├── .env.local             # 로컬 환경 변수
│   ├── next.config.js         # Next.js 설정
│   ├── tailwind.config.js     # Tailwind CSS 설정
│   ├── tsconfig.json          # TypeScript 설정
│   ├── package.json           # 의존성 및 스크립트
│   ├── .gitignore
│   └── jest.config.js         # Jest 테스트 설정
├── docs/                       # 프로젝트 문서
│   ├── api/                   # API 문서
│   │   ├── authentication.md
│   │   ├── posts.md
│   │   └── comments.md
│   ├── deployment/            # 배포 가이드
│   │   ├── docker.md
│   │   ├── vercel.md
│   │   └── aws.md
│   ├── development/           # 개발 가이드
│   │   ├── setup.md
│   │   ├── contributing.md
│   │   └── coding-standards.md
│   └── architecture.md       # 시스템 아키텍처
├── scripts/                   # 프로젝트 전체 스크립트
│   ├── setup.sh              # 초기 설정 스크립트
│   ├── deploy.sh             # 배포 스크립트
│   └── backup.sh             # 백업 스크립트
├── docker/                    # Docker 설정
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── .github/                   # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .gitignore                 # Git 무시 파일
├── package.json               # 루트 패키지 설정 (Monorepo 관리)
└── README.md                  # 프로젝트 설명
\`\`\`

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 초기 설정

\`\`\`bash
git clone <repository-url>
cd prompthub

# 초기 설정 스크립트 실행
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

### 2. 백엔드 설정

\`\`\`bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements/development.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정

# 데이터베이스 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver
\`\`\`

### 3. 프론트엔드 설정

\`\`\`bash
cd frontend

# 의존성 설치
npm install
# 또는
yarn install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값들을 설정

# 개발 서버 실행
npm run dev
# 또는
yarn dev
\`\`\`

### 4. 동시 실행 (Monorepo 스크립트)

\`\`\`bash
# 루트 디렉토리에서
npm install
npm run dev  # 백엔드와 프론트엔드 동시 실행
\`\`\`

## 🔧 주요 기술 스택

### 백엔드 (Django)
- **Django 4.2+**: 웹 프레임워크
- **Django REST Framework**: API 개발
- **drf-spectacular**: API 문서 자동 생성
- **django-cors-headers**: CORS 처리
- **django-filter**: 필터링 기능
- **Pillow**: 이미지 처리
- **python-decouple**: 환경 변수 관리
- **PostgreSQL**: 데이터베이스 (프로덕션)
- **SQLite**: 데이터베이스 (개발)
- **Redis**: 캐싱 및 세션 스토어
- **Celery**: 비동기 작업 처리

### 프론트엔드 (Next.js)
- **Next.js 14+**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 CSS 프레임워크
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **React Hook Form**: 폼 관리
- **Zod**: 스키마 검증
- **Axios**: HTTP 클라이언트
- **React Query**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리
- **next-themes**: 다크 모드 지원

## 📚 API 문서

개발 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🧪 테스트

### 백엔드 테스트

\`\`\`bash
cd backend

# 전체 테스트 실행
python manage.py test

# 특정 앱 테스트
python manage.py test apps.accounts

# 커버리지 포함 테스트
coverage run --source='.' manage.py test
coverage report
coverage html
\`\`\`

### 프론트엔드 테스트

\`\`\`bash
cd frontend

# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage
\`\`\`

## 🔐 환경 변수

### 백엔드 (.env)

\`\`\`env
# Django 설정
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 데이터베이스
DATABASE_URL=sqlite:///db.sqlite3
# 또는 PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/prompthub

# Redis (캐싱/세션)
REDIS_URL=redis://localhost:6379/0

# 이메일 설정
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (미디어 파일)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=ap-northeast-2

# 소셜 로그인
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
\`\`\`

### 프론트엔드 (.env.local)

\`\`\`env
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 인증
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# 소셜 로그인
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 분석
NEXT_PUBLIC_GA_ID=your-google-analytics-id
\`\`\`

## 📦 배포

### Docker를 사용한 배포

\`\`\`bash
# 전체 스택 빌드 및 실행
docker-compose up --build

# 프로덕션 모드
docker-compose -f docker-compose.prod.yml up --build
\`\`\`

### 개별 배포

#### 백엔드 (Django)

\`\`\`bash
cd backend

# 의존성 설치
pip install -r requirements/production.txt

# 정적 파일 수집
python manage.py collectstatic --noinput

# 데이터베이스 마이그레이션
python manage.py migrate

# Gunicorn으로 서버 실행
gunicorn config.wsgi:application --bind 0.0.0.0:8000
\`\`\`

#### 프론트엔드 (Next.js)

\`\`\`bash
cd frontend

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
\`\`\`

## 🔄 개발 워크플로우

### 1. 새로운 기능 개발

\`\`\`bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 백엔드 앱 생성 (필요시)
cd backend
python manage.py startapp new_app apps/new_app

# 개발 진행...

# 테스트 실행
npm run test

# 커밋 및 푸시
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
\`\`\`

### 2. 코드 품질 관리

\`\`\`bash
# 백엔드 코드 포맷팅
cd backend
black .
isort .
flake8 .

# 프론트엔드 코드 포맷팅
cd frontend
npm run lint
npm run format
\`\`\`

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 커밋 메시지 규칙

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가
- `chore`: 빌드 업무 수정, 패키지 매니저 수정

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 다음을 통해 연락해 주세요:

- GitHub Issues: [프로젝트 이슈 페이지]
- 이메일: your-email@example.com
- 문서: [프로젝트 위키]

---

**Happy Coding! 🚀**
