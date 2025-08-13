# 리팩토링 규칙 추가
  You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.
  
  Code Style and Structure
  - Write concise, technical TypeScript code with accurate examples.
  - Use functional and declarative programming patterns; avoid classes.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
  - Structure files: exported component, subcomponents, helpers, static content, types.
  
  Naming Conventions
  - Use lowercase with dashes for directories (e.g., components/auth-wizard).
  - Favor named exports for components.
  
  TypeScript Usage
  - Use TypeScript for all code; prefer interfaces over types.
  - Avoid enums; use maps instead.
  - Use functional components with TypeScript interfaces.
  
  Syntax and Formatting
  - Use the "function" keyword for pure functions.
  - Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
  - Use declarative JSX.
  
  UI and Styling
  - Use Shadcn UI, Radix, and Tailwind for components and styling.
  - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
  Performance Optimization
  - Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
  - Wrap client components in Suspense with fallback.
  - Use dynamic loading for non-critical components.
  - Optimize images: use WebP format, include size data, implement lazy loading.
  
  Key Conventions
  - Use 'nuqs' for URL search parameter state management.
  - Optimize Web Vitals (LCP, CLS, FID).
  - Limit 'use client':
    - Favor server components and Next.js SSR.
    - Use only for Web API access in small components.
    - Avoid for data fetching or state management.
  
  Follow Next.js docs for Data Fetching, Rendering, and Routing.
  

# 프로젝트 진행상황

본 파일은 리팩토링 진행상황을 기록합니다. 항목마다 완료 시각과 변경 요약을 남깁니다.

## 2025-08-13

- [x] 아키텍처 점검 및 결정: `@/components`를 페이지 기반 구조로 정리하고, 도메인별 컴포넌트는 해당 페이지 하위로 배치. 공통 컴포넌트는 `@/components/common`, UI 원자 컴포넌트는 `@/components/ui` 유지. `features`는 호환성 유지를 위해 배럴(index)만 남기고 점진적으로 페이즈아웃.
- [x] 1차 리팩토링(프로필 도메인): `features/profile/components/*`를 `components/profile/*`로 이동. 배럴(`features/profile/index.ts`)은 신규 경로를 재노출하도록 수정. 중복 파일 제거 완료.
- [x] 품질개선: `ProfileStatsSection`의 `contained` 동작이 반영되지 않던 문제를 수정(Wrapper 적용).
- [x] 2차 리팩토링(트렌딩/커뮤니티/포스트 도메인): `features/*/components/*`를 `components/*/*`로 이관하고 배럴 갱신. 앱 페이지 import를 `@/components/*`로 교체. 빌드·타입체크·린트 통과.
  - [x] 레거시 `features/*/components/*` 파일 제거 완료
- [x] 3차 리팩토링(인증/레이아웃): `features/auth` 의 배럴을 `@/components` 경로로 재노출하고, 전역 `AuthProvider/useAuthContext` 사용 경로를 `@/components/layout/auth-provider`로 통일. `Header`에서 `AuthForm` import를 `@/components/auth/auth-form`로 교체. 빌드·타입체크·린트 통과.
- [x] 정리: `@/features/*` import 전부 제거 확인. 빈 폴더(`features/*/components`) 정리.
- [x] 타입/유틸 참조 정리: `app/profile/page.tsx`의 `PostCard` 타입을 `@/types/api`로, `bookmarks/page.tsx`의 인증 유틸을 `@/lib/api/client`로, 샘플 데이터의 `PostWrite` 타입을 `@/types/api`의 `PostCreateRequest`로 업데이트. 전체 빌드 통과.

검증
- [x] eslint, typecheck, build 모두 통과

다음 작업 예정
- [x] ESLint 규칙 재점검: Next.js 권장 규칙 및 React 권장 규칙 통합, 경고 최소화 설정 반영
- [x] API 계층(`lib/api/*`) 타입 주석 보강: posts/auth/core/stats/metadata/trending API에 JSDoc 추가
- [ ] dead code 제거 자동화 스크립트 추가(선택)

## 2025-08-13 (추가)

- [x] 빈 디렉토리 정리: `frontend/features/*/components` 빈 폴더 삭제
- [x] 샘플데이터 정리: `frontend/sampledata/mock-api.ts`, `mock-posts-api.ts` 등 import로 참조되던 샘플 파일 제거 및 `types/datatype_sample.d.ts` 삭제
- [x] 빌드 검증: ESLint 비활성화 상태에서 `next build` 정상 완료 (설정 이슈 분리 확인). 기능 리팩토링에 따른 런타임 이상 없음

### 백엔드 라우팅/테스트
- [x] posts URL REST alias 추가: `liked-posts/`, `bookmarked-posts/`, `my-posts/` (기존 `liked/`, `bookmarked/`, `my/` 병행 유지)
- [x] 백엔드 테스트 전체 실행: 6 tests OK, 실패 없음

### 백엔드 문서화/정리
- [x] users 엔드포인트 요청/응답 스키마 주석 보강 (로그인/로그아웃/프로필/설정/세션/비밀번호/계정삭제)
- [x] core/filters 문서화 및 경량화 (중복 조건 제거, 모듈 docstring 추가)

## 백엔드 리팩토링 계획 (초안)

- 목표: Django/DRF 앱 구조를 도메인 중심으로 정리하고, API 일관성, 필터/정렬/페이지네이션 공통화, 서비스 계층 명확화
- 범위: `backend/core`, `backend/posts`, `backend/users`, `backend/stats`, 전역 `config`

1) 공통 모듈 정리 (core)
- [ ] 공통 `filters.py/sorting.py/pagination.py/search.py`를 유틸 모듈로 통합 (`core/filters`, `core/sorting`, `core/pagination`, `core/search` 유지)
- [ ] 서비스 계층 표준화: `core/services/*`에 도메인 무관 서비스(검색/정렬 조합)를 위치
- [x] 검색 유틸 점검: `core/search.py`의 SearchManager가 제목/내용/태그/가중치/다중단어/퍼지 검색 지원 확인
- [ ] 트렌딩 관련 관리 커맨드 정리: 입력/출력 스키마 주석 보강, 에러 로깅 통일
- [x] 인증 유틸 공통화: `core/utils/auth.py`에 `token_required` 데코레이터 도입, posts에서 사용
- [x] 페이지네이션 기본 통일: `core/pagination.py`의 CustomPagination 기반으로 DRF 설정과 일치화
- [x] 페이지네이션 기본 통일: 기본 20/최대 100, 응답에 `total_count` 키 추가(프론트 호환)
- [x] DRF 전역 페이지네이션 클래스 교체: `core.pagination.CustomPagination` 적용
- [x] 정렬 유틸 점검: `core/sorting.py`의 SortManager가 프런트 SortSelector와 일치 확인

2) posts 앱
- [x] `views.py` 일부 비즈니스 로직 서비스 분리: `posts/services/post_service.py` 도입 (토큰 유저 부착, 목록 페이징 빌더, 조회수 증가 포함)
- [x] `serializers.py` 공통 Mixin 보강: 공통 validate 상향, 하위 중복 제거
- [x] 상호작용/사용자별 목록 서비스화: 공통 페이지네이션/정렬 빌더 도입으로 뷰 슬림화
- [x] `urls.py` 라우트 명세 정리(1차): REST alias(`liked-posts/`, `bookmarked-posts/`, `my-posts/`) 추가, 기존 경로 병행 유지
- [x] 인덱스/쿼리 최적화(초안): 사용자 인증시 interactions prefetch 적용으로 N+1 감소

3) users 앱
- [x] User/Settings/Session 엔드포인트 스키마 문서화(초안, 주석 보강 시작). 응답 필드 명 일관화 점검 예정
- [x] URL 네임스페이스 도입: `backend/users/urls.py`에 `app_name = 'users'` 추가
- [ ] 인증/권한 데코레이터 공통화 (권한 검사 헬퍼)

4) stats 앱
- [ ] 대시보드/사용자 통계 쿼리 정리, 캐싱 전략 검토(selective cache)
- [x] 공통 인증 데코레이터 적용: `core/utils/auth.token_required` 재사용
 - [x] 선택적 캐싱: `core/utils/cache.cache_value_or_set`로 대시보드 60초 캐시

5) config
- [x] settings 분리: `config/settings_base.py`, `config/settings_dev.py`, `config/settings_prod.py` 도입 및 `config/settings.py`에서 dev 기본 로드
- [x] CORS/보안 헤더/로깅 설정 점검 및 `.env` 키 주입: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DJANGO_LOG_LEVEL`

6) 테스트/문서화
- [ ] pytest 기준 스모크 테스트 추가 (핵심 API 200 응답, 스키마 필드 확인)
- [ ] README: 백엔드 로컬 실행/마이그레이션/샘플 데이터 로드 간단 가이드 (변경점만)
- [x] DRF APITest 스모크: posts 엔드투엔드 흐름(생성/수정/상세/좋아요/북마크/목록 검색) 테스트 케이스 확인

진행 순서 제안
- [ ] posts → users → core → stats → config 순으로 점진 적용, 각 단계마다 API 스냅샷 테스트