# 프론트엔드 구조 개선 문서

## 🎯 개선 목표

기존 프론트엔드 구조의 문제점을 해결하고 보편적인 Next.js 프로젝트 구조로 개선했습니다.

## 📋 기존 문제점

1. **중복된 컴포넌트**: `components/sections/`와 `components/` 루트에 같은 기능의 컴포넌트들이 중복
2. **거대한 파일들**: `header.tsx`(28KB), `hero-section.tsx`(17KB) 등 너무 큰 파일들
3. **API 파일 분산**: `lib/api.ts`와 `lib/api/` 디렉토리로 분산
4. **일관성 부족**: 컴포넌트 배치가 일관되지 않음

## 🚀 개선된 구조

### 새로운 디렉토리 구조

```
frontend/
├── src/                          # 새로운 소스 구조
│   ├── components/
│   │   ├── common/              # 공통 컴포넌트
│   │   ├── features/            # 기능별 컴포넌트
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx       # 분리된 헤더 (7KB)
│   │   │   ├── Navigation.tsx   # 네비게이션 로직
│   │   │   ├── UserMenu.tsx     # 사용자 메뉴
│   │   │   ├── AuthButton.tsx   # 인증 버튼
│   │   │   └── MobileMenu.tsx   # 모바일 메뉴
│   │   └── ui-custom/           # 커스텀 UI 컴포넌트
│   ├── lib/
│   │   ├── constants/           # 상수 정의
│   │   │   └── navigation.ts    # 네비게이션 상수
│   │   ├── services/            # API 서비스
│   │   │   └── api.ts           # 통합 API 클라이언트
│   │   ├── validations/         # 폼 검증 로직
│   │   └── utils/               # 유틸리티 함수
│   ├── hooks/
│   │   ├── auth/                # 인증 관련 훅
│   │   └── ui/                  # UI 관련 훅
│   ├── types/
│   │   ├── api/                 # API 타입
│   │   ├── ui/                  # UI 타입
│   │   └── common.ts            # 공통 타입
│   ├── store/                   # 상태 관리 (추후 확장)
│   └── styles/
│       └── components/          # 컴포넌트별 스타일
├── app/                         # Next.js App Router
├── components/                  # 기존 컴포넌트 (호환성)
├── lib/                         # 기존 라이브러리 (호환성)
└── ... (기타 설정 파일들)
```

## 🔧 주요 개선사항

### 1. 컴포넌트 분리

**기존**: `header.tsx` (28KB, 647줄)
**개선**: 5개의 작은 컴포넌트로 분리
- `Header.tsx` (7KB) - 메인 헤더
- `Navigation.tsx` - 네비게이션 로직
- `UserMenu.tsx` - 사용자 드롭다운 메뉴
- `AuthButton.tsx` - 로그인 버튼
- `MobileMenu.tsx` - 모바일 사이드바

### 2. 상수 분리

네비게이션 아이템, 테마 옵션 등을 `constants/` 디렉토리로 분리하여 재사용성 향상

### 3. API 서비스 통합

- 모든 API 요청을 중앙에서 관리하는 `ApiClient` 클래스
- 인증, 커뮤니티, 프롬프트 등 도메인별 API 서비스 분리
- 타입 안전성과 에러 처리 개선

### 4. 타입 정의 체계화

공통 타입들을 `types/common.ts`에 정의하여 일관성 확보

### 5. 중복 파일 제거

`components/sections/`와 `components/` 루트의 중복 파일들 정리

## 📖 사용법

### 새로운 컴포넌트 추가

```typescript
// 기능별 컴포넌트
src/components/features/user-profile/UserProfileCard.tsx

// 공통 컴포넌트
src/components/common/Button.tsx

// 레이아웃 컴포넌트
src/components/layout/Sidebar.tsx
```

### API 서비스 사용

```typescript
import { authApi } from '@/src/lib/services/api'

// 로그인
const response = await authApi.login({ username, password })

// 사용자 정보 조회
const profile = await authApi.getProfile()
```

### 상수 사용

```typescript
import { NAVIGATION_ITEMS } from '@/src/lib/constants/navigation'

const navigationItems = NAVIGATION_ITEMS.filter(item => !item.requiresAuth)
```

## 🔄 마이그레이션 가이드

1. **기존 코드 호환성**: 기존 `components/`, `lib/` 디렉토리는 유지하여 점진적 마이그레이션 가능
2. **새로운 기능**: `src/` 구조를 사용하여 개발
3. **경로 매핑**: `@/src/*` 경로 매핑으로 깔끔한 import

## 🎨 장점

1. **유지보수성**: 작은 단위의 컴포넌트로 분리하여 유지보수 용이
2. **재사용성**: 공통 컴포넌트와 상수 분리로 재사용성 향상
3. **확장성**: 기능별 디렉토리 구조로 확장 용이
4. **타입 안전성**: 체계적인 타입 정의로 개발 생산성 향상
5. **표준 준수**: Next.js와 React 생태계의 모범 사례 적용

## 🚨 주의사항

1. 기존 코드에서 새로운 컴포넌트를 사용할 때는 상대 경로 주의
2. 점진적 마이그레이션을 통해 안정성 확보 권장
3. 새로운 기능 개발 시 `src/` 구조 사용 필수

## 🔮 향후 계획

1. **상태 관리**: Redux Toolkit 또는 Zustand 도입
2. **테스트**: Jest, React Testing Library 설정
3. **문서화**: Storybook 도입 검토
4. **성능 최적화**: Code splitting, Lazy loading 적용 