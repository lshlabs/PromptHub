# 🚀 M1 Mac 로컬 환경 설정 가이드

M1 Mac에서 Django + Next.js 프로젝트를 처음부터 실행하는 완벽한 가이드입니다.

## 📋 사전 준비사항

### 1. 필수 도구 설치

#### Homebrew 설치 (패키지 매니저)
\`\`\`bash
# Homebrew 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 설치 확인
brew --version
\`\`\`

#### Python 설치 (M1 Mac 최적화)
\`\`\`bash
# Python 3.11 설치 (Django 4.2와 호환성 좋음)
brew install python@3.11

# 설치 확인
python3.11 --version
# 또는
python3 --version

# pip 업그레이드
python3 -m pip install --upgrade pip
\`\`\`

#### Node.js 설치 (M1 Mac 네이티브)
\`\`\`bash
# Node.js LTS 버전 설치
brew install node

# 설치 확인
node --version
npm --version

# 또는 nvm 사용 (권장)
brew install nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/share/nvm/nvm.sh" ] && \. "/opt/homebrew/share/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

nvm install --lts
nvm use --lts
\`\`\`

#### Git 설치 및 설정
\`\`\`bash
# Git 설치 (보통 이미 설치되어 있음)
brew install git

# Git 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
\`\`\`

#### 코드 에디터 설치
\`\`\`bash
# VS Code 설치
brew install --cask visual-studio-code

# 또는 직접 다운로드: https://code.visualstudio.com/
\`\`\`

## 🏗️ 프로젝트 설정

### 1. 프로젝트 클론 및 디렉토리 이동

\`\`\`bash
# 프로젝트 클론 (GitHub에서)
git clone <your-repository-url>
cd prompthub

# 또는 로컬에서 새로 시작하는 경우
mkdir prompthub
cd prompthub
\`\`\`

### 2. 프로젝트 구조 생성

\`\`\`bash
# 기본 디렉토리 구조 생성
mkdir -p backend/{config,apps,static,media,logs,scripts,requirements}
mkdir -p backend/config/settings
mkdir -p backend/apps/{accounts,posts,comments,core}
mkdir -p frontend/{app,components,lib,types,hooks,styles,public}

# 기본 파일 생성
touch backend/manage.py
touch backend/config/__init__.py
touch backend/config/settings/{__init__.py,base.py,development.py,production.py}
touch backend/config/{urls.py,wsgi.py,asgi.py}
\`\`\`

## 🐍 백엔드 (Django) 설정

### 1. 가상환경 생성 및 활성화

\`\`\`bash
cd backend

# 가상환경 생성 (M1 Mac에서 권장 방법)
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 활성화 확인 (프롬프트 앞에 (venv)가 표시됨)
which python
# 결과: /path/to/your/project/backend/venv/bin/python
\`\`\`

### 2. Django 의존성 설치

\`\`\`bash
# requirements 파일 생성
cat > requirements/base.txt << EOF
Django>=4.2.0,<5.0.0
djangorestframework>=3.14.0
django-cors-headers>=4.3.0
django-filter>=23.3
drf-spectacular>=0.26.0
Pillow>=10.0.0
python-decouple>=3.8
EOF

cat > requirements/development.txt << EOF
-r base.txt
django-debug-toolbar>=4.2.0
pytest-django>=4.5.0
pytest-cov>=4.1.0
black>=23.0.0
isort>=5.12.0
flake8>=6.0.0
factory-boy>=3.3.0
EOF

# 의존성 설치
pip install -r requirements/development.txt

# 설치 확인
pip list
\`\`\`

### 3. Django 프로젝트 기본 설정

#### config/settings/base.py 생성
\`\`\`bash
cat > config/settings/base.py << 'EOF'
import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.posts',
    'apps.comments',
    'apps.core',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'PromptHub API',
    'DESCRIPTION': 'Django REST API for PromptHub',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
EOF
\`\`\`

#### config/settings/development.py 생성
\`\`\`bash
cat > config/settings/development.py << 'EOF'
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Development-specific apps
INSTALLED_APPS += [
    'django_extensions',
]

# Development-specific middleware
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar settings
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
EOF
\`\`\`

#### 기본 Django 파일들 생성
\`\`\`bash
# manage.py
cat > manage.py << 'EOF'
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
EOF

chmod +x manage.py

# config/urls.py
cat > config/urls.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/auth/', include('apps.accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# config/wsgi.py
cat > config/wsgi.py << 'EOF'
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
application = get_wsgi_application()
EOF
\`\`\`

### 4. Django 앱 생성

\`\`\`bash
# accounts 앱 생성
python manage.py startapp accounts apps/accounts

# 기본 앱 파일들 생성
for app in accounts posts comments core; do
    mkdir -p apps/$app
    touch apps/$app/__init__.py
    touch apps/$app/admin.py
    touch apps/$app/apps.py
    touch apps/$app/models.py
    touch apps/$app/views.py
    touch apps/$app/urls.py
    touch apps/$app/serializers.py
    mkdir -p apps/$app/migrations
    touch apps/$app/migrations/__init__.py
done
\`\`\`

### 5. 환경 변수 설정

\`\`\`bash
# .env 파일 생성
cat > .env << 'EOF'
# Django 설정
SECRET_KEY=django-insecure-your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 데이터베이스
DATABASE_URL=sqlite:///db.sqlite3

# CORS 설정
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
\`\`\`

### 6. 데이터베이스 마이그레이션

\`\`\`bash
# 마이그레이션 파일 생성
python manage.py makemigrations

# 마이그레이션 실행
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser
# 사용자명, 이메일, 비밀번호 입력
\`\`\`

### 7. Django 서버 실행 테스트

\`\`\`bash
# 개발 서버 실행
python manage.py runserver

# 브라우저에서 확인
# http://127.0.0.1:8000/admin/ - 관리자 페이지
# http://127.0.0.1:8000/api/docs/ - API 문서
\`\`\`

## ⚛️ 프론트엔드 (Next.js) 설정

### 1. 새 터미널 열기 및 프론트엔드 디렉토리 이동

\`\`\`bash
# 새 터미널 창/탭 열기
cd /path/to/your/project/prompthub/frontend
\`\`\`

### 2. Next.js 프로젝트 초기화

\`\`\`bash
# Next.js 프로젝트 생성 (TypeScript, Tailwind CSS 포함)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 또는 수동으로 package.json 생성
cat > package.json << 'EOF'
{
  "name": "prompthub-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "axios": "^1.6.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  },
  "devDependencies": {
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.0.0"
  }
}
EOF
\`\`\`

### 3. 의존성 설치

\`\`\`bash
# npm 사용
npm install

# 또는 yarn 사용 (선택사항)
# yarn install
\`\`\`

### 4. 환경 변수 설정

\`\`\`bash
# .env.local 파일 생성
cat > .env.local << 'EOF'
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 앱 설정
NEXT_PUBLIC_APP_NAME=PromptHub
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
\`\`\`

### 5. 기본 TypeScript 설정

\`\`\`bash
# tsconfig.json 생성 (Next.js가 자동 생성하지만 커스터마이징)
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
\`\`\`

### 6. Next.js 서버 실행 테스트

\`\`\`bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000
\`\`\`

## 🔗 백엔드-프론트엔드 연동 테스트

### 1. 간단한 API 테스트

#### 백엔드에서 테스트 API 생성
\`\`\`bash
# backend/apps/core/views.py
cat > apps/core/views.py << 'EOF'
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'ok',
        'message': 'Backend is running!',
        'version': '1.0.0'
    })
EOF

# backend/apps/core/urls.py
cat > apps/core/urls.py << 'EOF'
from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
]
EOF

# backend/config/urls.py에 추가
# path('api/', include('apps.core.urls')), 추가
\`\`\`

#### 프론트엔드에서 API 호출 테스트
\`\`\`bash
# frontend/lib/api.ts
mkdir -p lib
cat > lib/api.ts << 'EOF'
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health/');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default apiClient;
EOF

# frontend/app/page.tsx 수정
cat > app/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import { healthCheck } from '@/lib/api';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await healthCheck();
        setHealthStatus(status);
      } catch (error) {
        console.error('Failed to check health:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">PromptHub</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Backend Connection Status</h2>
        {loading ? (
          <p>Checking backend connection...</p>
        ) : healthStatus ? (
          <div className="text-green-600">
            <p>✅ Backend is connected!</p>
            <p>Status: {healthStatus.status}</p>
            <p>Message: {healthStatus.message}</p>
            <p>Version: {healthStatus.version}</p>
          </div>
        ) : (
          <p className="text-red-600">❌ Backend connection failed</p>
        )}
      </div>
    </main>
  );
}
EOF
\`\`\`

## 🚀 최종 실행 및 테스트

### 1. 두 개의 터미널에서 동시 실행

#### 터미널 1 - 백엔드
\`\`\`bash
cd backend
source venv/bin/activate
python manage.py runserver
\`\`\`

#### 터미널 2 - 프론트엔드
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### 2. 브라우저에서 확인

1. **프론트엔드**: http://localhost:3000
   - 백엔드 연결 상태가 표시되어야 함

2. **백엔드 관리자**: http://localhost:8000/admin/
   - 생성한 슈퍼유저로 로그인

3. **API 문서**: http://localhost:8000/api/docs/
   - Swagger UI로 API 문서 확인

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. Python 가상환경 문제
\`\`\`bash
# 가상환경이 활성화되지 않은 경우
cd backend
source venv/bin/activate

# 가상환경 재생성이 필요한 경우
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements/development.txt
\`\`\`

#### 2. Node.js 버전 문제
\`\`\`bash
# Node.js 버전 확인
node --version

# 최신 LTS 버전으로 업데이트
nvm install --lts
nvm use --lts
\`\`\`

#### 3. 포트 충돌 문제
\`\`\`bash
# 포트 8000이 사용 중인 경우
lsof -ti:8000 | xargs kill -9

# 다른 포트로 Django 실행
python manage.py runserver 8001

# 포트 3000이 사용 중인 경우
lsof -ti:3000 | xargs kill -9

# 다른 포트로 Next.js 실행
npm run dev -- -p 3001
\`\`\`

#### 4. CORS 에러
\`\`\`bash
# backend/config/settings/base.py에서 CORS 설정 확인
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
\`\`\`

#### 5. M1 Mac 특정 문제
\`\`\`bash
# Pillow 설치 문제 (이미지 처리 라이브러리)
brew install libjpeg libpng
pip install --upgrade Pillow

# psycopg2 설치 문제 (PostgreSQL 사용시)
brew install postgresql
pip install psycopg2-binary
\`\`\`

## 🎉 성공 확인

모든 것이 정상적으로 작동한다면:

1. ✅ Django 서버가 http://localhost:8000에서 실행
2. ✅ Next.js 서버가 http://localhost:3000에서 실행  
3. ✅ 프론트엔드에서 백엔드 API 호출 성공
4. ✅ 관리자 페이지 접속 가능
5. ✅ API 문서 확인 가능

축하합니다! 🎉 이제 Django + Next.js 개발 환경이 완벽하게 구축되었습니다!

## 📚 다음 단계

1. **인증 시스템 구현**: 회원가입, 로그인 기능 추가
2. **데이터베이스 모델 설계**: 필요한 모델들 생성
3. **API 엔드포인트 개발**: CRUD 기능 구현
4. **프론트엔드 컴포넌트 개발**: UI/UX 구현
5. **테스트 코드 작성**: 안정성 확보

Happy Coding! 🚀
