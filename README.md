# PromptHub - Django REST API + Next.js Frontend

Django REST Framework와 Next.js를 사용한 현대적인 풀스택 웹 애플리케이션입니다.

## 📁 현재 프로젝트 구조

```
prompthub/
├── frontend/                         # Next.js 프론트엔드
│   ├── app/                         # Next.js 13+ App Router
│   │   ├── (auth)/                 # 라우트 그룹 - 인증 페이지
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx          # 인증 페이지 공통 레이아웃
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── community/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── trending/
│   │   │   └── page.tsx
│   │   ├── my-reviews/
│   │   │   └── page.tsx
│   │   ├── extension/
│   │   │   └── page.tsx
│   │   ├── globals.css             # 전역 스타일
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 홈페이지
│   │   ├── loading.tsx             # 로딩 UI
│   │   ├── error.tsx               # 에러 UI
│   │   └── not-found.tsx           # 404 페이지
│   ├── components/                 # React 컴포넌트
│   │   ├── ui/                    # 기본 UI 컴포넌트 (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── forms/                 # 폼 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── register-form.tsx
│   │   │   └── common/
│   │   ├── layout/                # 레이아웃 컴포넌트
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   ├── sections/              # 섹션별 컴포넌트
│   │   │   ├── hero-section.tsx
│   │   │   ├── charts-section.tsx
│   │   │   ├── prompt-comparison.tsx
│   │   │   ├── prompt-optimizer.tsx
│   │   │   └── prompt-community.tsx
│   │   ├── charts/                # 차트 컴포넌트
│   │   │   ├── accuracy-hallucination-chart.tsx
│   │   │   ├── price-satisfaction-chart.tsx
│   │   │   └── user-growth-chart.tsx
│   │   ├── community/             # 커뮤니티 컴포넌트
│   │   │   ├── community-filters.tsx
│   │   │   ├── community-header.tsx
│   │   │   ├── create-post-dialog.tsx
│   │   │   └── post-list.tsx
│   │   └── providers/             # Context Provider들
│   │       ├── auth-provider.tsx
│   │       └── theme-provider.tsx
│   ├── lib/                       # 유틸리티 라이브러리
│   │   ├── api/                  # API 관련
│   │   │   ├── client.ts         # Axios 클라이언트 설정
│   │   │   └── auth.ts           # 인증 API
│   │   ├── utils/                # 헬퍼 함수
│   │   │   └── auth.ts           # 인증 관련 유틸
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── hooks/                    # 커스텀 React 훅
│   │   ├── use-auth.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── types/                    # TypeScript 타입 정의
│   │   └── auth.ts
│   ├── styles/                   # 스타일 파일
│   │   └── globals.css
│   ├── public/                   # 정적 자산
│   │   ├── placeholder-logo.png
│   │   ├── placeholder-logo.svg
│   │   └── ...
│   ├── package.json             # 프론트엔드 의존성
│   ├── next.config.mjs          # Next.js 설정
│   ├── tailwind.config.ts       # Tailwind CSS 설정
│   ├── tsconfig.json            # TypeScript 설정
│   ├── postcss.config.mjs       # PostCSS 설정
│   ├── components.json          # shadcn/ui 설정
│   └── next-env.d.ts            # Next.js 타입 정의
├── backend/                      # Django 백엔드
│   ├── config/                  # Django 프로젝트 설정
│   │   ├── __init__.py
│   │   ├── settings/            # 환경별 설정 분리
│   │   │   ├── __init__.py
│   │   │   ├── base.py         # 공통 설정
│   │   │   ├── development.py  # 개발 환경
│   │   │   └── production.py   # 프로덕션 환경
│   │   ├── urls.py             # 메인 URL 라우팅
│   │   ├── wsgi.py             # WSGI 설정
│   │   └── asgi.py             # ASGI 설정
│   ├── apps/                   # Django 앱들
│   │   ├── __init__.py
│   │   ├── accounts/           # 사용자 인증 및 관리
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py       # User, UserProfile 모델
│   │   │   ├── serializers.py  # DRF 시리얼라이저
│   │   │   ├── views.py        # API 뷰
│   │   │   ├── urls.py         # URL 패턴
│   │   │   ├── signals.py      # Django 시그널
│   │   │   └── migrations/
│   │   └── core/               # 공통 유틸리티
│   │       ├── __init__.py
│   │       └── pagination.py   # 커스텀 페이지네이션
│   ├── requirements/           # 의존성 관리
│   │   ├── base.txt           # 기본 패키지
│   │   ├── development.txt    # 개발용 패키지
│   │   └── production.txt     # 프로덕션용 패키지
│   ├── static/                # 정적 파일
│   ├── media/                 # 사용자 업로드 파일
│   ├── logs/                  # 로그 파일
│   ├── venv/                  # Python 가상환경
│   └── manage.py              # Django 관리 명령어
├── scripts/                    # 개발용 스크립트 모음
│   ├── setup.sh              # 프로젝트 초기 설정
│   ├── start-dev.sh          # 개발 서버 시작
│   ├── migrate.sh            # 데이터베이스 마이그레이션
│   ├── reset-db.sh           # 데이터베이스 초기화
│   ├── docker-setup.sh       # Docker 환경 설정 (선택)
│   └── help.sh               # 스크립트 도움말

├── package.json              # 루트 워크스페이스 관리
├── .gitignore               # Git 무시 파일
└── README.md               # 📖 프로젝트 전체 가이드 (이 파일)
```

## 🚀 빠른 시작

### 📋 사전 준비사항 (처음 설치하는 경우)
```bash
# macOS에서 Homebrew로 필수 도구 설치
brew install python@3.11 node git

# Python 및 Node.js 버전 확인
python3 --version  # Python 3.11+
node --version      # Node.js 18+
```

### 1. 프로젝트 초기 설정
```bash
# 프로젝트 클론 후
git clone <your-repo-url>
cd prompthub

# 🔧 초기 설정 스크립트 실행 (추천)
./scripts/setup.sh

# 📖 도움말 보기
./scripts/help.sh
```

> 💡 **초보자 팁**: 위 스크립트가 모든 설정을 자동으로 해주므로, 복잡한 수동 설정은 필요 없습니다!

### 2. 개발 서버 시작
```bash
# 🌐 개발 서버 시작 (백엔드 + 프론트엔드)
./scripts/start-dev.sh

# 또는 npm 명령어로
npm run dev
```

### 3. 개발 도구 (원클릭 스크립트)
```bash
# 🔄 데이터베이스 마이그레이션 (모델 변경 후)
./scripts/migrate.sh

# 🗑️ 데이터베이스 완전 초기화 (주의: 모든 데이터 삭제!)
./scripts/reset-db.sh

# 📖 사용 가능한 모든 스크립트 보기
./scripts/help.sh
```

### 4. 포트포워딩 관리 (외부 접속용)
```bash
# 🎯 인터랙티브 메뉴 실행 (권장)
./scripts/portforward-config.sh

# 또는 직접 명령어 실행
./scripts/portforward-config.sh status   # 현재 설정 상태 확인
./scripts/portforward-config.sh apply    # 포트포워딩 설정 적용
./scripts/portforward-config.sh remove   # 포트포워딩 설정 해제
```

**🎮 인터랙티브 메뉴 옵션:**
- **1️⃣** 현재 설정 상태 확인
- **2️⃣** 포트포워딩 설정 적용 (공인 IP 입력)
- **3️⃣** 포트포워딩 설정 해제
- **4️⃣** 도움말 보기
- **0️⃣** 종료

**포트포워딩 설정 후 서버 시작:**
```bash
# 외부 접속 가능한 개발 서버 시작
./scripts/start-dev-portforward.sh
```

### 5. 접속 정보
```bash
# 🌐 웹사이트
프론트엔드: http://localhost:3000
백엔드 API: http://localhost:8000/api/

# 👨‍💼 Django 관리자 페이지
URL: http://localhost:8000/admin/
이메일: admin@prompthub.com
비밀번호: admin123!

# 📚 API 문서
Swagger: http://localhost:8000/api/docs/
```

## ❓ 자주 묻는 질문 (FAQ)

### Q: 처음 개발을 시작하는데 뭘 설치해야 하나요?
```bash
# macOS 기준 - 다음 명령어만 실행하세요
brew install python@3.11 node git
```

### Q: 에러가 났는데 어떻게 해결하나요?
```bash
# 1. 데이터베이스 초기화
./scripts/reset-db.sh

# 2. 서버 재시작
./scripts/start-dev.sh

# 3. 도움말 확인
./scripts/help.sh
```

### Q: 새로운 기능을 추가하려면?
1. 백엔드 모델 변경 후: `./scripts/migrate.sh`
2. 프론트엔드 컴포넌트는 `frontend/components/` 에 추가
3. 페이지는 `frontend/app/` 에 추가

### Q: 배포는 어떻게 하나요?
나중에 개발이 완료된 후 Docker를 도입하여 배포할 예정입니다.
현재는 개발에 집중하세요!

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
- **shadcn/ui**: 모던 UI 컴포넌트
- **Tailwind CSS**: 유틸리티 CSS 프레임워크
- **React Hook Form + Zod**: 폼 관리 및 검증
- **next-themes**: 다크 모드 지원

## 🎯 개발 워크플로우

### 일반적인 개발 과정
```bash
# 1. 개발 시작
./scripts/start-dev.sh

# 2. 코드 수정 작업
# - 백엔드: backend/apps/ 폴더에서 작업
# - 프론트엔드: frontend/app/, frontend/components/ 에서 작업

# 3. 데이터베이스 변경 시
./scripts/migrate.sh

# 4. 문제 발생 시
./scripts/reset-db.sh  # 데이터베이스 초기화
```

### 폴더별 역할
- `backend/apps/accounts/`: 사용자 관리
- `backend/apps/core/`: 공통 유틸리티
- `frontend/app/`: 페이지들
- `frontend/components/`: 재사용 컴포넌트
- `scripts/`: 개발 도구 스크립트

## 🚨 문제 해결

### 서버가 시작되지 않는 경우
```bash
# 1. 가상환경 확인
ls backend/venv  # 존재하는지 확인

# 2. Node 모듈 확인  
ls frontend/node_modules  # 존재하는지 확인

# 3. 초기 설정 다시 실행
./scripts/setup.sh
```

### 데이터베이스 오류 발생 시
```bash
# 완전 초기화 (모든 데이터 삭제됨!)
./scripts/reset-db.sh
```

### 포트 충돌 오류
```bash
# 실행 중인 서버 확인
lsof -ti:3000  # 프론트엔드 포트
lsof -ti:8000  # 백엔드 포트

# 강제 종료
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:8000)
```

## 📚 API 문서

개발 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🎯 테스트

### 백엔드 테스트

```bash
cd backend

# 전체 테스트 실행
python manage.py test

# 특정 앱 테스트
python manage.py test apps.accounts

# 커버리지 포함 테스트
coverage run --source='.' manage.py test
coverage report
coverage html
```

### 프론트엔드 테스트

```bash
cd frontend

# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage
```

## 🔐 환경 변수

### 백엔드 (.env)

```env
# Django 설정
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 프론트엔드 URL (CORS 설정용)
FRONTEND_URL=http://localhost:3000

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
```

### 프론트엔드 (.env.local)

```env
# API 설정 (하드코딩 방지를 위해 반드시 설정)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 인증
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# 소셜 로그인
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 분석
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 📦 배포

### Docker를 사용한 배포

```bash
# 전체 스택 빌드 및 실행
docker-compose up --build

# 프로덕션 모드
docker-compose -f docker-compose.prod.yml up --build
```

### 개별 배포

#### 백엔드 (Django)

```bash
cd backend

# 의존성 설치
pip install -r requirements/production.txt

# 정적 파일 수집
python manage.py collectstatic --noinput

# 데이터베이스 마이그레이션
python manage.py migrate

# Gunicorn으로 서버 실행
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

#### 프론트엔드 (Next.js)

```bash
cd frontend

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 🔄 개발 워크플로우

### 1. 새로운 기능 개발

```bash
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
```

### 2. 코드 품질 관리

```bash
# 백엔드 코드 포맷팅
cd backend
black .
isort .
flake8 .

# 프론트엔드 코드 포맷팅
cd frontend
npm run lint
npm run format
```

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

## 📖 더 자세한 학습 자료

### Django 관련
- [Django 공식 문서](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)

### Next.js 관련  
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev/)

### UI/UX 관련
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎉 마지막으로...

이 프로젝트는 **초보개발자도 쉽게 시작할 수 있도록** 설계되었습니다!

- 🔧 **복잡한 설정 NO**: 스크립트로 원클릭 해결
- 📖 **자세한 가이드**: README 하나로 모든 설명
- 🚀 **빠른 시작**: 몇 분 안에 개발 환경 구축
- 💡 **초보자 친화적**: 에러 해결 방법까지 모두 포함

**개발을 즐기세요!** 🚀

---
**PromptHub Team** | 📧 Contact: hu2chaso
